import { model } from "@medusajs/framework/utils"

/** Chiến dịch A/B banner (FR-21). Chỉ một campaign `is_active` tại một thời điểm (enforce API). */
const StoreBannerCampaign = model.define("store_banner_campaign", {
  id: model.id().primaryKey(),
  name: model.text(),
  /** 0–100: tỷ lệ nhóm A; B = 100 − A. */
  split_a_percent: model.number().default(50),
  is_active: model.boolean().default(false),
})

export default StoreBannerCampaign
