import { model } from "@medusajs/framework/utils"

/** NFR-6 — audit publish (và tùy chọn reject) cho nội dung Growth. */
const StoreCmsPublicationAudit = model.define("store_cms_publication_audit", {
  id: model.id().primaryKey(),
  entity_type: model.text(),
  entity_id: model.text(),
  action: model.text(),
  actor_user_id: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default StoreCmsPublicationAudit
