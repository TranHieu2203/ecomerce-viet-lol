import { model } from "@medusajs/framework/utils"

/** Chủ đề tin (phân cấp cha–con giống WordPress). */
const StoreCmsNewsCategory = model.define("store_cms_news_category", {
  id: model.id().primaryKey(),
  slug: model.text(),
  title_i18n: model.json(),
  parent_id: model.text().nullable(),
})

export default StoreCmsNewsCategory
