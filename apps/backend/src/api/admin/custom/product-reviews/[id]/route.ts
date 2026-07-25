import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PRODUCT_REVIEWS_MODULE } from "../../../../../modules/product-reviews"
import type ProductReviewsModuleService from "../../../../../modules/product-reviews/service"
import { PRODUCT_REVIEW_STATUS } from "../../../../../modules/product-reviews/models/product-review"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const svc = req.scope.resolve(
    PRODUCT_REVIEWS_MODULE
  ) as ProductReviewsModuleService
  const id = req.params.id
  const body = (req.body ?? {}) as Record<string, unknown>

  const update: Record<string, unknown> = {}

  if (body.rating !== undefined) {
    const rating = Number(body.rating)
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating phải từ 1 đến 5" })
    }
    update.rating = Math.round(rating)
  }
  if (body.title !== undefined) {
    update.title = body.title ? String(body.title).trim() : null
  }
  if (body.comment !== undefined) {
    const comment = String(body.comment).trim()
    if (!comment) {
      return res.status(400).json({ message: "comment không được để trống" })
    }
    update.comment = comment
  }
  if (body.customer_name !== undefined) {
    const customer_name = String(body.customer_name).trim()
    if (!customer_name) {
      return res
        .status(400)
        .json({ message: "customer_name không được để trống" })
    }
    update.customer_name = customer_name
  }
  if (body.customer_email !== undefined) {
    update.customer_email = body.customer_email
      ? String(body.customer_email).trim()
      : null
  }
  if (body.status !== undefined) {
    if (
      !Object.values(PRODUCT_REVIEW_STATUS).includes(body.status as never)
    ) {
      return res.status(400).json({ message: "status không hợp lệ" })
    }
    update.status = body.status
  }

  const [updated] = await svc.updateProductReviews([{ id, ...update }])
  res.json({ product_review: updated })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const svc = req.scope.resolve(
    PRODUCT_REVIEWS_MODULE
  ) as ProductReviewsModuleService
  await svc.deleteProductReviews([req.params.id])
  res.json({ id: req.params.id, deleted: true })
}
