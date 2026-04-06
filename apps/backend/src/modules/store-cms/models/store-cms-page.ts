import { model } from "@medusajs/framework/utils"

/** Trạng thái trang CMS (ADR-12). Validate thêm ở API story 9.2. */
export const CMS_PAGE_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const

export type CmsPageStatus = (typeof CMS_PAGE_STATUS)[keyof typeof CMS_PAGE_STATUS]

/** Bảng `store_cms_page` — ADR-12; `body` kiểu text (HTML/Markdown, sanitize ở API). */
const StoreCmsPage = model.define("store_cms_page", {
  id: model.id().primaryKey(),
  slug: model.text(),
  /** `{ vi, en }` — JSONB */
  title: model.json(),
  body: model.text().nullable(),
  status: model.text().default(CMS_PAGE_STATUS.DRAFT),
  published_at: model.dateTime().nullable(),
})

export default StoreCmsPage
