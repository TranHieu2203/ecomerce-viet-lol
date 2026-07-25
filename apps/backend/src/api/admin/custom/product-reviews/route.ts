import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PRODUCT_REVIEWS_MODULE } from "../../../../modules/product-reviews"
import type ProductReviewsModuleService from "../../../../modules/product-reviews/service"
import { PRODUCT_REVIEW_STATUS } from "../../../../modules/product-reviews/models/product-review"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const svc = req.scope.resolve(
    PRODUCT_REVIEWS_MODULE
  ) as ProductReviewsModuleService

  const limitRaw = Number(req.query?.limit ?? 50)
  const offsetRaw = Number(req.query?.offset ?? 0)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(200, Math.floor(limitRaw)) : 50
  const offset =
    Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.floor(offsetRaw) : 0

  const status = (req.query?.status as string | undefined)?.trim()
  const productId = (req.query?.product_id as string | undefined)?.trim()

  const filters: Record<string, unknown> = {}
  if (status) {
    filters.status = status
  }
  if (productId) {
    filters.product_id = productId
  }

  const [rows, count] = await svc.listAndCountProductReviews(filters, {
    take: limit,
    skip: offset,
    order: { created_at: "DESC" },
  })

  res.json({ product_reviews: rows, count, limit, offset })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
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
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "rating phải từ 1 đến 5" })
  }

  const [created] = await svc.createProductReviews([
    {
      product_id,
      rating: Math.round(rating),
      title: body.title ? String(body.title).trim() : null,
      comment,
      customer_name,
      customer_email: body.customer_email
        ? String(body.customer_email).trim()
        : null,
      status:
        typeof body.status === "string" &&
        Object.values(PRODUCT_REVIEW_STATUS).includes(body.status as never)
          ? body.status
          : PRODUCT_REVIEW_STATUS.APPROVED,
      is_seed: false,
    },
  ])

  res.status(201).json({ product_review: created })
}
