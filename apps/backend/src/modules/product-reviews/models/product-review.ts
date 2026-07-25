import { model } from "@medusajs/framework/utils"

export const PRODUCT_REVIEW_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const

export type ProductReviewStatus =
  (typeof PRODUCT_REVIEW_STATUS)[keyof typeof PRODUCT_REVIEW_STATUS]

/**
 * Đánh giá sản phẩm — không FK sang product module (theo đúng quy ước module
 * isolation của Medusa v2 trong repo này, xem store-cms news article dùng
 * file_id dạng text tương tự). `product_id` là id sản phẩm thật từ Product module.
 */
const ProductReview = model.define("product_review", {
  id: model.id().primaryKey(),
  product_id: model.text().index(),
  rating: model.number(),
  title: model.text().nullable(),
  comment: model.text(),
  customer_name: model.text(),
  customer_email: model.text().nullable(),
  status: model.text().default(PRODUCT_REVIEW_STATUS.PENDING),
  /** Đánh dấu review giả lập (seed) để phân biệt với review thật của khách. */
  is_seed: model.boolean().default(false),
})

export default ProductReview
