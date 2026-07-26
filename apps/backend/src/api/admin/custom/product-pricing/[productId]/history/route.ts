import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { PRICING_AUDIT_MODULE } from "../../../../../../modules/pricing-audit"
import type PricingAuditModuleService from "../../../../../../modules/pricing-audit/service"

/** Nhật ký đổi giá của một sản phẩm, mới nhất trước. */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { productId } = req.params
  const audit = req.scope.resolve(
    PRICING_AUDIT_MODULE
  ) as PricingAuditModuleService

  const limitRaw = Number(req.query?.limit ?? 30)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(200, Math.floor(limitRaw)) : 30

  const rows = await audit.listPriceChanges(
    { product_id: productId },
    { take: limit, order: { created_at: "DESC" } }
  )

  res.json({ changes: rows })
}
