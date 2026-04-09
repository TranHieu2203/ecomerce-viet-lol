import { model } from "@medusajs/framework/utils"

const StoreCmsNewsArticleTag = model.define("store_cms_news_article_tag", {
  id: model.id().primaryKey(),
  article_id: model.text(),
  tag_id: model.text(),
})

export default StoreCmsNewsArticleTag
