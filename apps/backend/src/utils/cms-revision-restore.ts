import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_SETTINGS_ID } from "../modules/store-cms"
import { CMS_PAGE_STATUS } from "../modules/store-cms/models/store-cms-page"
import type StoreCmsModuleService from "../modules/store-cms/service"
import { findMissingCollectionHandles } from "./build-resolved-nav-menu"
import {
  appendPageRevision,
  pageRowFromUpdate,
} from "./cms-page-revision"
import {
  CmsPageValidationError,
  parseAndValidatePageSeoJson,
  parseAndValidateTitleJson,
  sanitizeCmsPageBody,
} from "./cms-page"
import {
  appendNavRevision,
  appendSettingsRevision,
  type CmsSettingsRevisionRow,
} from "./cms-revision"
import {
  CmsSettingsValidationError,
  parseAnnouncement,
  parseFooterContact,
  parseNotFound,
  parseSeoDefaults,
} from "./cms-settings-adr13"
import { EMPTY_NAV_TREE, validateAndNormalizeNavTree } from "./nav-tree"
import { revalidateStorefrontCms } from "./revalidate-storefront"

export type CmsRevisionRestoreResult =
  | { ok: true }
  | { ok: false; status: number; message: string }

function parsePublishedAt(raw: unknown): Date | null {
  if (raw === null || raw === undefined || raw === "") {
    return null
  }
  if (raw instanceof Date) {
    return raw
  }
  const s = String(raw)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) {
    return null
  }
  return d
}

function parsePageStatus(raw: unknown): string {
  const s = String(raw ?? "")
  if (s === CMS_PAGE_STATUS.PUBLISHED || s === CMS_PAGE_STATUS.DRAFT) {
    return s
  }
  throw new CmsPageValidationError("status snapshot không hợp lệ (draft | published)")
}

export async function executeCmsRevisionRestore(
  req: AuthenticatedMedusaRequest,
  cms: StoreCmsModuleService,
  revisionId: string,
  actorUserId: string | null
): Promise<CmsRevisionRestoreResult> {
  const rows = await cms.listStoreCmsRevisions({ id: revisionId })
  const rev = rows[0]
  if (!rev) {
    return { ok: false, status: 404, message: "Không tìm thấy bản revision" }
  }

  const entityType = rev.entity_type
  const snap = rev.payload_snapshot as Record<string, unknown> | null

  if (!snap || typeof snap !== "object") {
    return {
      ok: false,
      status: 400,
      message: "Snapshot revision không hợp lệ",
    }
  }

  if (entityType === "banner") {
    return {
      ok: false,
      status: 400,
      message: "Chưa hỗ trợ khôi phục banner",
    }
  }

  if (entityType === "page") {
    const pageId = rev.entity_id
    if (!pageId || typeof pageId !== "string") {
      return {
        ok: false,
        status: 400,
        message: "Revision trang thiếu entity_id",
      }
    }
    const existing = await cms
      .listStoreCmsPages({ id: pageId })
      .then((r) => r[0])
    if (!existing) {
      return { ok: false, status: 404, message: "Không tìm thấy trang" }
    }
    try {
      if (String(snap.slug ?? "") !== existing.slug) {
        return {
          ok: false,
          status: 400,
          message: "Snapshot không khớp slug trang hiện tại",
        }
      }
      const title = parseAndValidateTitleJson(snap.title)
      const bodyRaw = snap.body
      const bodyText =
        bodyRaw === undefined || bodyRaw === null
          ? null
          : sanitizeCmsPageBody(String(bodyRaw))
      let seo: Record<string, unknown> | null = null
      if (snap.seo !== undefined && snap.seo !== null) {
        const p = parseAndValidatePageSeoJson(snap.seo)
        seo =
          p && Object.keys(p as object).length > 0
            ? (p as Record<string, unknown>)
            : null
      }
      const status = parsePageStatus(snap.status)
      const published_at = parsePublishedAt(snap.published_at)

      const updateResult = await cms.updateStoreCmsPages([
        {
          id: pageId,
          title: title as unknown as Record<string, unknown>,
          body: bodyText,
          seo,
          status,
          published_at,
        },
      ])
      const updated = Array.isArray(updateResult) ? updateResult[0] : updateResult

      await appendPageRevision(
        cms,
        pageRowFromUpdate(
          updated.id,
          updated.slug,
          updated.title,
          updated.body,
          (updated as { seo?: unknown }).seo ?? null,
          updated.status,
          updated.published_at
        ),
        actorUserId
      )

      if (
        existing.status === CMS_PAGE_STATUS.PUBLISHED ||
        updated.status === CMS_PAGE_STATUS.PUBLISHED
      ) {
        await revalidateStorefrontCms("cms-pages")
      }
      return { ok: true }
    } catch (e: unknown) {
      if (e instanceof CmsPageValidationError) {
        return { ok: false, status: e.status, message: e.message }
      }
      throw e
    }
  }

  if (entityType === "settings") {
    const eid = rev.entity_id
    if (eid !== null && eid !== undefined && eid !== CMS_SETTINGS_ID) {
      return {
        ok: false,
        status: 400,
        message: "Revision settings không hợp lệ",
      }
    }
    try {
      const default_locale = String(snap.default_locale ?? "vi")
      const enabled_locales = snap.enabled_locales as unknown
      if (!Array.isArray(enabled_locales) || enabled_locales.length < 1) {
        return {
          ok: false,
          status: 400,
          message: "enabled_locales trong snapshot không hợp lệ",
        }
      }
      if (!enabled_locales.includes(default_locale)) {
        return {
          ok: false,
          status: 400,
          message: "default_locale phải nằm trong enabled_locales (snapshot)",
        }
      }

      let seo_defaults: unknown = snap.seo_defaults ?? null
      let footer_contact: unknown = snap.footer_contact ?? null
      let announcement: unknown = snap.announcement ?? null
      let not_found: unknown = snap.not_found ?? null

      if (snap.seo_defaults !== undefined && snap.seo_defaults !== null) {
        const p = parseSeoDefaults(snap.seo_defaults)
        seo_defaults =
          p && typeof p === "object" && Object.keys(p).length > 0 ? p : null
      }
      if (snap.footer_contact !== undefined && snap.footer_contact !== null) {
        const p = parseFooterContact(snap.footer_contact)
        footer_contact =
          p && typeof p === "object" && Object.keys(p).length > 0 ? p : null
      }
      if (snap.announcement !== undefined) {
        announcement =
          snap.announcement === null
            ? null
            : parseAnnouncement(snap.announcement)
      }
      if (snap.not_found !== undefined) {
        not_found =
          snap.not_found === null ? null : parseNotFound(snap.not_found)
      }

      const current = await cms.getOrCreateSettings()
      const cur = current as {
        site_title?: string | null
        nav_tree?: unknown
      }

      const updatePayload = {
        id: CMS_SETTINGS_ID,
        default_locale,
        enabled_locales: enabled_locales as unknown as Record<string, unknown>,
        logo_file_id:
          snap.logo_file_id === undefined
            ? current.logo_file_id
            : snap.logo_file_id === null || snap.logo_file_id === ""
              ? null
              : String(snap.logo_file_id),
        site_title:
          snap.site_title === undefined
            ? cur.site_title ?? null
            : snap.site_title === null || snap.site_title === ""
              ? null
              : String(snap.site_title).trim().slice(0, 200) || null,
        nav_tree:
          snap.nav_tree === undefined ? cur.nav_tree ?? null : snap.nav_tree,
        site_title_i18n:
          snap.site_title_i18n === undefined
            ? (current as { site_title_i18n?: unknown }).site_title_i18n ?? null
            : snap.site_title_i18n,
        tagline_i18n:
          snap.tagline_i18n === undefined
            ? (current as { tagline_i18n?: unknown }).tagline_i18n ?? null
            : snap.tagline_i18n,
        seo_defaults: seo_defaults as Record<string, unknown> | null,
        og_image_file_id:
          snap.og_image_file_id === undefined
            ? (current as { og_image_file_id?: string | null })
                .og_image_file_id ?? null
            : snap.og_image_file_id === null || snap.og_image_file_id === ""
              ? null
              : String(snap.og_image_file_id),
        footer_contact: footer_contact as Record<string, unknown> | null,
        announcement: announcement as Record<string, unknown> | null,
        not_found: not_found as Record<string, unknown> | null,
      }

      const updateResult = await cms.updateCmsSettings(
        updatePayload as unknown as Parameters<
          StoreCmsModuleService["updateCmsSettings"]
        >[0]
      )
      const updated = Array.isArray(updateResult)
        ? updateResult[0]
        : updateResult

      await appendSettingsRevision(
        cms,
        updated as unknown as CmsSettingsRevisionRow,
        actorUserId
      )
      await revalidateStorefrontCms()
      return { ok: true }
    } catch (e: unknown) {
      if (e instanceof CmsSettingsValidationError) {
        return { ok: false, status: 400, message: e.message }
      }
      throw e
    }
  }

  if (entityType === "nav") {
    const eid = rev.entity_id
    if (eid !== null && eid !== undefined && eid !== CMS_SETTINGS_ID) {
      return {
        ok: false,
        status: 400,
        message: "Revision menu không hợp lệ",
      }
    }
    const rawTree = snap.nav_tree
    let nav_tree: ReturnType<typeof validateAndNormalizeNavTree>
    try {
      nav_tree =
        rawTree == null
          ? { ...EMPTY_NAV_TREE }
          : validateAndNormalizeNavTree(rawTree)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "nav_tree snapshot không hợp lệ"
      return { ok: false, status: 400, message: msg }
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const missing = await findMissingCollectionHandles(query, nav_tree)
    if (missing.length) {
      return {
        ok: false,
        status: 400,
        message: `Collection không tồn tại: ${missing.join(", ")}`,
      }
    }

    const current = await cms.getOrCreateSettings()
    const cur = current as {
      site_title?: string | null
      site_title_i18n?: unknown
      tagline_i18n?: unknown
    }
    await cms.updateCmsSettings({
      id: CMS_SETTINGS_ID,
      default_locale: current.default_locale,
      enabled_locales: current.enabled_locales,
      logo_file_id: current.logo_file_id,
      site_title: cur.site_title ?? null,
      nav_tree: nav_tree as unknown as Record<string, unknown>,
      site_title_i18n: cur.site_title_i18n ?? null,
      tagline_i18n: cur.tagline_i18n ?? null,
      seo_defaults: (current as { seo_defaults?: unknown }).seo_defaults ?? null,
      og_image_file_id:
        (current as { og_image_file_id?: string | null }).og_image_file_id ??
        null,
      footer_contact:
        (current as { footer_contact?: unknown }).footer_contact ?? null,
      announcement:
        (current as { announcement?: unknown }).announcement ?? null,
      not_found: (current as { not_found?: unknown }).not_found ?? null,
    } as unknown as Parameters<
      StoreCmsModuleService["updateCmsSettings"]
    >[0])

    await appendNavRevision(
      cms,
      nav_tree as unknown as Record<string, unknown>,
      actorUserId
    )
    await revalidateStorefrontCms("cms-nav")
    return { ok: true }
  }

  return {
    ok: false,
    status: 400,
    message: "entity_type revision không được hỗ trợ",
  }
}
