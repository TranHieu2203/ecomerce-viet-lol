import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_REVIEWS_MODULE } from "../../../../modules/product-reviews"
import type ProductReviewsModuleService from "../../../../modules/product-reviews/service"
import { PRODUCT_REVIEW_STATUS } from "../../../../modules/product-reviews/models/product-review"
import { applyRatingOverride, fetchRatingOverrides } from "../../../../lib/rating-override"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    PRODUCT_REVIEWS_MODULE
  ) as ProductReviewsModuleService

  const productId = (req.query?.product_id as string | undefined)?.trim()
  if (!productId) {
    return res.status(400).json({ message: "product_id là bắt buộc" })
  }

  const limitRaw = Number(req.query?.limit ?? 20)
  const offsetRaw = Number(req.query?.offset ?? 0)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(50, Math.floor(limitRaw)) : 20
  const offset =
    Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.floor(offsetRaw) : 0

  const [rows, count] = await svc.listAndCountProductReviews(
    { product_id: productId, status: PRODUCT_REVIEW_STATUS.APPROVED },
    { take: limit, skip: offset, order: { created_at: "DESC" } }
  )

  // Trung bình sao tính trên TẤT CẢ review đã duyệt (không chỉ trang hiện tại).
  const allApproved = await svc.listProductReviews({
    product_id: productId,
    status: PRODUCT_REVIEW_STATUS.APPROVED,
  })
  const average = allApproved.length
    ? allApproved.reduce((sum, r) => sum + r.rating, 0) / allApproved.length
    : 0

  const overrides = await fetchRatingOverrides(req.scope, [productId])
  const { average: finalAverage, count: finalCount } = applyRatingOverride(
    { average: Math.round(average * 10) / 10, count: allApproved.length },
    overrides.get(productId)
  )

  res.json({
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      customer_name: r.customer_name,
      created_at: r.created_at,
    })),
    count,
    limit,
    offset,
    average: finalAverage,
    total_reviews: finalCount,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const svc = req.scope.resolve(
    PRODUCT_REVIEWS_MODULE
  ) as ProductReviewsModuleService
  const body = (req.body ?? {}) as Record<string, unknown>

  const product_id = String(body.product_id ?? "").trim()
  const rating = Number(body.rating)
  const comment = String(body.comment ?? "").trim()
  const customer_name = String(body.customer_name ?? "").trim()

  if (!product_id || !comment || !customer_name) {
    return res.status(400).json({
      message: "product_id, comment, customer_name là bắt buộc",
    })
  }
  if (comment.length > 2000) {
    return res.status(400).json({ message: "comment quá dài" })
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "rating phải từ 1 đến 5" })
  }

  const [created] = await svc.createProductReviews([
    {
      product_id,
      rating: Math.round(rating),
      title: body.title ? String(body.title).trim().slice(0, 200) : null,
      comment,
      customer_name: customer_name.slice(0, 120),
      customer_email: body.customer_email
        ? String(body.customer_email).trim().slice(0, 200)
        : null,
      // Review từ khách luôn ở trạng thái chờ duyệt — Admin duyệt trước khi hiện công khai.
      status: PRODUCT_REVIEW_STATUS.PENDING,
      is_seed: false,
    },
  ])

  res.status(201).json({
    product_review: {
      id: created.id,
      status: created.status,
    },
  })
}
