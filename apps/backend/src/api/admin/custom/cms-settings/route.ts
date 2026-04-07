import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import {
  CMS_SETTINGS_ID,
  STORE_CMS_MODULE,
} from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import {
  appendSettingsRevision,
  type CmsSettingsRevisionRow,
} from "../../../../utils/cms-revision"
import {
  CmsSettingsValidationError,
  parseAnnouncement,
  parseFooterContact,
  parseNotFound,
  parseSeoDefaults,
} from "../../../../utils/cms-settings-adr13"
import { LOCALE_KEY_CATALOG } from "../../../../utils/banner-i18n"
import { revalidateStorefrontCms } from "../../../../utils/revalidate-storefront"

const LOGO_MAX_BYTES = 10 * 1024 * 1024
const LOGO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
])

const SETTINGS_REVISION_BODY_KEYS = [
  "logo_file_id",
  "default_locale",
  "enabled_locales",
  "site_title",
  "seo_defaults",
  "og_image_file_id",
  "footer_contact",
  "announcement",
  "not_found",
] as const

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const settings = await cms.getOrCreateSettings()
  res.json({ cms_settings: settings })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const current = await cms.getOrCreateSettings()
  const body = (req.body ?? {}) as Record<string, unknown>

  let logo_file_id = current.logo_file_id
  if (body.logo_file_id !== undefined) {
    if (body.logo_file_id === null || body.logo_file_id === "") {
      logo_file_id = null
    } else {
      const fileModule = req.scope.resolve(Modules.FILE) as IFileModuleService
      const meta = await fileModule.retrieveFile(body.logo_file_id as string)
      const ext = meta as { size?: number; mime_type?: string }
      if (typeof ext.size === "number" && ext.size > LOGO_MAX_BYTES) {
        return res.status(400).json({ message: "Logo vượt quá 10MB" })
      }
      const mime = ext.mime_type ?? ""
      if (mime && !LOGO_MIME.has(mime)) {
        return res.status(400).json({
          message: `Định dạng logo không được phép: ${mime}`,
        })
      }
      logo_file_id = body.logo_file_id as string
    }
  }

  let default_locale = current.default_locale
  let enabled_locales = current.enabled_locales as unknown as string[]
  if (body.default_locale !== undefined) {
    default_locale = String(body.default_locale)
  }
  if (body.enabled_locales !== undefined) {
    enabled_locales = body.enabled_locales as string[]
  }
  if (!Array.isArray(enabled_locales) || enabled_locales.length < 1) {
    return res.status(400).json({
      message: "enabled_locales phải là mảng không rỗng",
    })
  }
  if (!enabled_locales.includes(default_locale)) {
    return res.status(400).json({
      message: "default_locale phải nằm trong enabled_locales",
    })
  }
  const catalog = new Set<string>(LOCALE_KEY_CATALOG as unknown as string[])
  if (!enabled_locales.every((l) => typeof l === "string" && catalog.has(l))) {
    return res.status(400).json({
      message: `enabled_locales chỉ được chứa: ${LOCALE_KEY_CATALOG.join(", ")}`,
    })
  }
  if (!enabled_locales.includes("vi")) {
    return res.status(400).json({
      message: "vi phải luôn được bật (quy tắc sản phẩm)",
    })
  }

  let site_title = (current as { site_title?: string | null }).site_title ?? null
  if (body.site_title !== undefined) {
    if (body.site_title === null || body.site_title === "") {
      site_title = null
    } else {
      site_title = String(body.site_title).trim().slice(0, 200) || null
    }
  }

  const cur = current as {
    nav_tree?: unknown
    site_title_i18n?: unknown
    tagline_i18n?: unknown
    seo_defaults?: unknown
    og_image_file_id?: string | null
    footer_contact?: unknown
    announcement?: unknown
    not_found?: unknown
  }

  let og_image_file_id = cur.og_image_file_id ?? null
  if (body.og_image_file_id !== undefined) {
    if (body.og_image_file_id === null || body.og_image_file_id === "") {
      og_image_file_id = null
    } else {
      const fileModule = req.scope.resolve(Modules.FILE) as IFileModuleService
      const meta = await fileModule.retrieveFile(body.og_image_file_id as string)
      const ext = meta as { size?: number; mime_type?: string }
      if (typeof ext.size === "number" && ext.size > LOGO_MAX_BYTES) {
        return res.status(400).json({ message: "Ảnh OG vượt quá 10MB" })
      }
      const mime = ext.mime_type ?? ""
      if (mime && !LOGO_MIME.has(mime)) {
        return res.status(400).json({
          message: `Định dạng ảnh OG không được phép: ${mime}`,
        })
      }
      og_image_file_id = body.og_image_file_id as string
    }
  }

  let seo_defaults: unknown = cur.seo_defaults ?? null
  let footer_contact: unknown = cur.footer_contact ?? null
  let announcement: unknown = cur.announcement ?? null
  let not_found: unknown = cur.not_found ?? null

  try {
    if (body.seo_defaults !== undefined) {
      const p = parseSeoDefaults(body.seo_defaults)
      seo_defaults =
        p && typeof p === "object" && Object.keys(p).length > 0 ? p : null
    }
    if (body.footer_contact !== undefined) {
      const p = parseFooterContact(body.footer_contact)
      footer_contact =
        p && typeof p === "object" && Object.keys(p).length > 0 ? p : null
    }
    if (body.announcement !== undefined) {
      announcement =
        body.announcement === null
          ? null
          : parseAnnouncement(body.announcement)
    }
    if (body.not_found !== undefined) {
      not_found =
        body.not_found === null ? null : parseNotFound(body.not_found)
    }
  } catch (e: unknown) {
    if (e instanceof CmsSettingsValidationError) {
      return res.status(400).json({ message: e.message })
    }
    throw e
  }

  const updatePayload = {
    id: CMS_SETTINGS_ID,
    default_locale,
    enabled_locales: enabled_locales as unknown as Record<string, unknown>,
    logo_file_id,
    site_title,
    nav_tree: cur.nav_tree ?? null,
    site_title_i18n: cur.site_title_i18n ?? null,
    tagline_i18n: cur.tagline_i18n ?? null,
    seo_defaults: seo_defaults as Record<string, unknown> | null,
    og_image_file_id,
    footer_contact: footer_contact as Record<string, unknown> | null,
    announcement: announcement as Record<string, unknown> | null,
    not_found: not_found as Record<string, unknown> | null,
  }

  const willMutateSettings = SETTINGS_REVISION_BODY_KEYS.some((k) =>
    Object.prototype.hasOwnProperty.call(body, k)
  )
  if (willMutateSettings) {
    await appendSettingsRevision(
      cms,
      current as CmsSettingsRevisionRow,
      actorUserId(req)
    )
  }

  const updated = await cms.updateCmsSettings(
    updatePayload as unknown as Parameters<
      StoreCmsModuleService["updateCmsSettings"]
    >[0]
  )
  await revalidateStorefrontCms()
  res.json({ cms_settings: updated })
}
