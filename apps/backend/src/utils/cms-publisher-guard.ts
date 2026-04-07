import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * FR-19 — khi `CMS_PUBLISHER_ADMIN_IDS` được set (danh sách user id, phân tách dấu phẩy),
 * chỉ các user đó được publish banner. Không set = mọi admin (tương thích ngược).
 */
export function assertCanPublishBanner(
  req: AuthenticatedMedusaRequest
): void {
  const raw = process.env.CMS_PUBLISHER_ADMIN_IDS?.trim()
  if (!raw) {
    return
  }
  const allowed = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  )
  const id = req.auth_context?.actor_id
  if (!id || !allowed.has(id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Bạn không có quyền xuất bản banner. Cần vai publisher (FR-19)."
    )
  }
}
