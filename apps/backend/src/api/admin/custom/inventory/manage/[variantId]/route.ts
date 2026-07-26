import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Bật / tắt quản lý tồn cho một phiên bản sản phẩm.
 *
 * Bật lên mà phiên bản chưa có mặt hàng trong kho thì tạo luôn, kèm dòng tồn
 * bằng 0 ở mọi kho — nếu không, web sẽ coi như hết hàng mà không có chỗ nào
 * để nhập vào.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { variantId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  const body = (req.body ?? {}) as { manage_inventory?: unknown }
  if (typeof body.manage_inventory !== "boolean") {
    return res.status(400).json({ message: "Thiếu giá trị bật/tắt" })
  }
  const enable = body.manage_inventory

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "sku",
      "manage_inventory",
      "product.title",
      "inventory_items.inventory_item_id",
    ],
    filters: { id: variantId },
  })
  const variant = variants[0] as Record<string, unknown> | undefined
  if (!variant) {
    return res.status(404).json({ message: "Không tìm thấy phiên bản" })
  }

  const existingLinks =
    (variant.inventory_items as { inventory_item_id: string }[] | undefined) ?? []

  if (enable && existingLinks.length === 0) {
    const sku =
      (variant.sku as string | null) ||
      `SKU-${String(variantId).slice(-8).toUpperCase()}`

    const [item] = await inventoryService.createInventoryItems([
      {
        sku,
        title:
          `${(variant.product as { title?: string })?.title ?? ""} ${
            (variant.title as string) ?? ""
          }`.trim() || sku,
      },
    ])

    await link.create({
      [Modules.PRODUCT]: { variant_id: variantId },
      [Modules.INVENTORY]: { inventory_item_id: item.id },
    })

    // Tạo dòng tồn 0 ở mọi kho để có chỗ nhập hàng vào.
    const locations = await stockLocationService.listStockLocations({})
    if (locations.length) {
      await inventoryService.createInventoryLevels(
        locations.map((l) => ({
          inventory_item_id: item.id,
          location_id: l.id,
          stocked_quantity: 0,
        }))
      )
    }
  }

  await updateProductVariantsWorkflow(req.scope).run({
    input: {
      product_variants: [{ id: variantId, manage_inventory: enable } as never],
    },
  })

  res.json({ variant_id: variantId, manage_inventory: enable })
}
