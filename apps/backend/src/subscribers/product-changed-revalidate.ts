import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { revalidateStorefrontCms } from "../utils/revalidate-storefront"

/**
 * Sửa/xóa sản phẩm (ảnh, giá, mô tả...) qua Admin không tự báo cho storefront —
 * storefront cache dữ liệu sản phẩm khá lâu (ISR). Đẩy revalidate ngay khi có thay đổi
 * để tránh hiển thị dữ liệu cũ (VD: ảnh đã xóa vẫn còn hiện).
 */
export default async function productChangedRevalidate() {
  await revalidateStorefrontCms("products")
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
