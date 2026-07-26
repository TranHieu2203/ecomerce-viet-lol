import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

export type InventoryLabel = {
  variant_id: string
  variant_title: string | null
  product_id: string | null
  product_title: string | null
  sku: string | null
}

/**
 * Tên sản phẩm / phiên bản cho từng mặt hàng kho.
 *
 * KHÔNG truy vấn từ phía `inventory_item` sang variant. Đường dẫn
 * `variant_inventory_items.variant...` không tồn tại trong bản Medusa đang
 * dùng và làm query.graph ném lỗi "Cannot read properties of undefined
 * (reading 'strategy')" — đây chính là lỗi 500 của trang tồn kho.
 *
 * Chiều ngược lại (variant -> inventory_items) thì chạy đúng, nên lấy hết
 * variant rồi lập bản đồ. Catalog vài chục sản phẩm nên chi phí không đáng kể.
 */
export async function getInventoryLabels(
  container: MedusaContainer
): Promise<Map<string, InventoryLabel>> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const map = new Map<string, InventoryLabel>()

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "sku",
      "product.id",
      "product.title",
      "inventory_items.inventory_item_id",
    ],
  })

  for (const v of variants as Record<string, unknown>[]) {
    const links =
      (v.inventory_items as { inventory_item_id?: string }[] | undefined) ?? []
    const product = v.product as { id?: string; title?: string } | null
    for (const li of links) {
      if (!li.inventory_item_id) {
        continue
      }
      map.set(li.inventory_item_id, {
        variant_id: String(v.id),
        variant_title: (v.title as string) ?? null,
        product_id: product?.id ?? null,
        product_title: product?.title ?? null,
        sku: (v.sku as string) ?? null,
      })
    }
  }

  return map
}
