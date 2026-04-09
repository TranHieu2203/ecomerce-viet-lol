import { model } from "@medusajs/framework/utils"

const StoreCmsNewsTag = model.define("store_cms_news_tag", {
  id: model.id().primaryKey(),
  slug: model.text(),
  title_i18n: model.json(),
})

export default StoreCmsNewsTag
