import { model } from "@medusajs/framework/utils"

export const CMS_NEWS_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const

export type CmsNewsStatus = (typeof CMS_NEWS_STATUS)[keyof typeof CMS_NEWS_STATUS]

/** ADR-20 — `body_html_i18n` JSON: `{ vi, en, … }` chuỗi HTML đã sanitize. */
const StoreCmsNewsArticle = model.define("store_cms_news_article", {
  id: model.id().primaryKey(),
  slug: model.text(),
  title_i18n: model.json(),
  excerpt_i18n: model.json().nullable(),
  body_html_i18n: model.json(),
  featured_image_file_id: model.text().nullable(),
  seo: model.json().nullable(),
  status: model.text().default(CMS_NEWS_STATUS.DRAFT),
  published_at: model.dateTime().nullable(),
})

export default StoreCmsNewsArticle
