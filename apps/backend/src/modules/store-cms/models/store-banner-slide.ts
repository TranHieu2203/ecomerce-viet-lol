import { model } from "@medusajs/framework/utils"

export const BANNER_PUBLICATION = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const

export type BannerPublicationStatus =
  (typeof BANNER_PUBLICATION)[keyof typeof BANNER_PUBLICATION]

const StoreBannerSlide = model.define("store_banner_slide", {
  id: model.id().primaryKey(),
  image_file_id: model.text().nullable(),
  image_urls: model.json().nullable(),
  title: model.json(),
  subtitle: model.json().nullable(),
  cta_label: model.json().nullable(),
  target_url: model.text().nullable(),
  sort_order: model.number(),
  is_active: model.boolean(),
  /** FR-18 — chỉ `published` ra Store API công khai. */
  publication_status: model.text().default(BANNER_PUBLICATION.PUBLISHED),
  /** FR-20 — UTC; Admin ghi nhận timezone VN trong UX. */
  display_start_at: model.dateTime().nullable(),
  display_end_at: model.dateTime().nullable(),
  /** FR-21 — liên kết chiến dịch A/B. */
  campaign_id: model.text().nullable(),
  /** `A` | `B` khi tham gia campaign. */
  variant_label: model.text().nullable(),
})

export default StoreBannerSlide
