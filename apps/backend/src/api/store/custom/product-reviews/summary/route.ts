import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_REVIEWS_MODULE } from "../../../../../modules/product-reviews"
import type ProductReviewsModuleService from "../../../../../modules/product-reviews/service"
import { PRODUCT_REVIEW_STATUS } from "../../../../../modules/product-reviews/models/product-review"

export const AUTHENTICATE = false

/**
 * Tổng hợp sao trung bình + số lượt cho NHIỀU sản phẩm cùng lúc — dùng cho
 * lưới sản phẩm (card) để tránh gọi API riêng cho từng thẻ.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    PRODUCT_REVIEWS_MODULE
  ) as ProductReviewsModuleService

  const raw = (req.query?.product_ids as string | undefined)?.trim()
  if (!raw) {
    return res.json({ summaries: {} })
  }
  const productIds = Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, 100)

  if (!productIds.length) {
    return res.json({ summaries: {} })
  }

  const rows = await svc.listProductReviews({
    product_id: productIds,
    status: PRODUCT_REVIEW_STATUS.APPROVED,
  })

  const byProduct = new Map<string, { sum: number; count: number }>()
  for (const r of rows) {
    const cur = byProduct.get(r.product_id) ?? { sum: 0, count: 0 }
    cur.sum += r.rating
    cur.count += 1
    byProduct.set(r.product_id, cur)
  }

  const summaries: Record<string, { average: number; count: number }> = {}
  for (const [productId, { sum, count }] of byProduct.entries()) {
    summaries[productId] = {
      average: Math.round((sum / count) * 10) / 10,
      count,
    }
  }

  res.json({ summaries })
}
