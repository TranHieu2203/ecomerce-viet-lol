import { model } from "@medusajs/framework/utils"

/**
 * Snapshot phục vụ FR-37 / ADR-16.
 * `entity_id`: với `page` = id `store_cms_page`; với `settings` = `cms` hoặc null (chốt khi implement API).
 */
export const CMS_REVISION_ENTITY_TYPES = [
  "settings",
  "nav",
  "page",
  "banner",
  "news_article",
] as const

export type CmsRevisionEntityType = (typeof CMS_REVISION_ENTITY_TYPES)[number]

const StoreCmsRevision = model.define("store_cms_revision", {
  id: model.id().primaryKey(),
  entity_type: model.text(),
  entity_id: model.text().nullable(),
  payload_snapshot: model.json(),
  actor_user_id: model.text().nullable(),
})

export default StoreCmsRevision
