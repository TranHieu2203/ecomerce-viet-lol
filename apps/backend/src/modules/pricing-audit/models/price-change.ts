import { model } from "@medusajs/framework/utils"

export const PRICE_FIELD = {
  /** Giá gốc — số bị gạch ngang trên web. */
  BASE: "base",
  /** Giá khuyến mãi — số khách thực trả. */
  SALE: "sale",
} as const

export type PriceField = (typeof PRICE_FIELD)[keyof typeof PRICE_FIELD]

/**
 * Nhật ký đổi giá — Medusa ghi đè giá cũ nên không có cách nào truy lại
 * "trước đây bán bao nhiêu". Bảng này ghi lại từng lần đổi.
 *
 * Chỉ ghi khi giá thực sự đổi; lưu cả tên sản phẩm tại thời điểm đó để sau
 * này đổi tên hay xoá sản phẩm thì nhật ký vẫn đọc hiểu được.
 */
const PriceChange = model.define("price_change", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  variant_id: model.text().index(),
  product_title: model.text(),
  variant_title: model.text().nullable(),
  /** "base" hoặc "sale". */
  field: model.text(),
  /** null nghĩa là trước đó chưa đặt giá này. */
  old_amount: model.number().nullable(),
  /** null nghĩa là vừa bị gỡ bỏ (vd tắt khuyến mãi). */
  new_amount: model.number().nullable(),
  currency_code: model.text().default("vnd"),
  actor_id: model.text().nullable(),
  actor_email: model.text().nullable(),
})

export default PriceChange
