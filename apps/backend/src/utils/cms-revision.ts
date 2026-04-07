import {
  CMS_SETTINGS_ID,
} from "../modules/store-cms"
import type { CmsRevisionEntityType } from "../modules/store-cms/models/store-cms-revision"
import type StoreCmsModuleService from "../modules/store-cms/service"

/** ADR-16 — giữ tối đa N bản / (entity_type, entity_id). */
export const CMS_REVISION_MAX_COUNT = 20

/** Giữ `limit` bản mới nhất; danh sách đã sort `created_at` giảm dần. */
export function revisionIdsToSoftDelete(
  sortedDesc: readonly { id: string }[],
  limit: number
): string[] {
  if (sortedDesc.length <= limit) {
    return []
  }
  return sortedDesc.slice(limit).map((r) => r.id)
}

export type CmsSettingsRevisionRow = {
  id: string
  default_locale: string
  enabled_locales: unknown
  logo_file_id: string | null
  site_title?: string | null
  nav_tree?: unknown
  site_title_i18n?: unknown
  tagline_i18n?: unknown
  seo_defaults?: unknown
  og_image_file_id?: string | null
  footer_contact?: unknown
  announcement?: unknown
  not_found?: unknown
}

export function buildSettingsRevisionSnapshot(
  row: CmsSettingsRevisionRow
): Record<string, unknown> {
  return {
    default_locale: row.default_locale,
    enabled_locales: row.enabled_locales,
    logo_file_id: row.logo_file_id,
    site_title: row.site_title ?? null,
    nav_tree: row.nav_tree ?? null,
    site_title_i18n: row.site_title_i18n ?? null,
    tagline_i18n: row.tagline_i18n ?? null,
    seo_defaults: row.seo_defaults ?? null,
    og_image_file_id: row.og_image_file_id ?? null,
    footer_contact: row.footer_contact ?? null,
    announcement: row.announcement ?? null,
    not_found: row.not_found ?? null,
  }
}

export async function pruneStoreCmsRevisionsAfterAppend(
  cms: StoreCmsModuleService,
  entityType: CmsRevisionEntityType,
  entityId: string | null
): Promise<void> {
  const filter: { entity_type: string; entity_id?: string | null } = {
    entity_type: entityType,
  }
  if (entityId !== null && entityId !== undefined) {
    filter.entity_id = entityId
  }
  const rows = await cms.listStoreCmsRevisions(filter, {
    order: { created_at: "DESC" },
  })
  const toDelete = revisionIdsToSoftDelete(rows, CMS_REVISION_MAX_COUNT)
  if (toDelete.length === 0) {
    return
  }
  await cms.softDeleteStoreCmsRevisions(toDelete)
}

export async function appendSettingsRevision(
  cms: StoreCmsModuleService,
  row: CmsSettingsRevisionRow,
  actorUserId: string | null
): Promise<void> {
  await cms.createStoreCmsRevisions([
    {
      entity_type: "settings",
      entity_id: CMS_SETTINGS_ID,
      payload_snapshot: buildSettingsRevisionSnapshot(row),
      actor_user_id: actorUserId,
    },
  ])
  await pruneStoreCmsRevisionsAfterAppend(cms, "settings", CMS_SETTINGS_ID)
}

export async function appendNavRevision(
  cms: StoreCmsModuleService,
  navTree: Record<string, unknown>,
  actorUserId: string | null
): Promise<void> {
  await cms.createStoreCmsRevisions([
    {
      entity_type: "nav",
      entity_id: CMS_SETTINGS_ID,
      payload_snapshot: { nav_tree: navTree },
      actor_user_id: actorUserId,
    },
  ])
  await pruneStoreCmsRevisionsAfterAppend(cms, "nav", CMS_SETTINGS_ID)
}
