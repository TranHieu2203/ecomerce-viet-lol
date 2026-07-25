import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

export type RatingOverride = { average?: number; count?: number }

/**
 * Ghi đè điểm sao trung bình hiển thị — lưu trong product.metadata.review_override
 * (không cần bảng riêng, sửa qua widget Admin trên trang chi tiết sản phẩm).
 */
export async function fetchRatingOverrides(
  container: MedusaContainer,
  productIds: string[]
): Promise<Map<string, RatingOverride>> {
  const overrides = new Map<string, RatingOverride>()
  if (!productIds.length) {
    return overrides
  }
  const productModule = container.resolve(Modules.PRODUCT)
  const products = await productModule.listProducts(
    { id: productIds },
    { select: ["id", "metadata"] }
  )
  for (const p of products) {
    const raw = (p.metadata as Record<string, unknown> | null)?.review_override as
      | RatingOverride
      | undefined
    if (!raw || typeof raw !== "object") {
      continue
    }
    const average =
      typeof raw.average === "number" && raw.average >= 1 && raw.average <= 5
        ? raw.average
        : undefined
    const count =
      typeof raw.count === "number" && raw.count >= 0 ? raw.count : undefined
    if (average !== undefined || count !== undefined) {
      overrides.set(p.id, { average, count })
    }
  }
  return overrides
}

export function applyRatingOverride(
  computed: { average: number; count: number },
  override: RatingOverride | undefined
): { average: number; count: number } {
  if (!override) {
    return computed
  }
  return {
    average: override.average ?? computed.average,
    count: override.count ?? computed.count,
  }
}
