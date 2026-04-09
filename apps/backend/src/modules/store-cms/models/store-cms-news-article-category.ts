import { model } from "@medusajs/framework/utils"

const StoreCmsNewsArticleCategory = model.define(
  "store_cms_news_article_category",
  {
    id: model.id().primaryKey(),
    article_id: model.text(),
    category_id: model.text(),
  }
)

export default StoreCmsNewsArticleCategory
