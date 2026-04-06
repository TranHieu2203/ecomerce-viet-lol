import { model } from "@medusajs/framework/utils"

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
})

export default StoreBannerSlide
