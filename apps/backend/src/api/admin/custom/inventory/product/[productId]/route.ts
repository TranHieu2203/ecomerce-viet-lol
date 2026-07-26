import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/** Tình trạng kho của một sản phẩm: từng phiên bản × từng kho. */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { productId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)

  const locations = await stockLocationService.listStockLocations({})
  const locName = new Map(
    locations.map((l) => [l.id, (l as unknown as { name: string }).name])
  )

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "title",
      "sku",
      "manage_inventory",
      "inventory_items.inventory_item_id",
      "inventory_items.inventory.id",
      "inventory_items.inventory.sku",
      "inventory_items.inventory.location_levels.location_id",
      "inventory_items.inventory.location_levels.stocked_quantity",
      "inventory_items.inventory.location_levels.reserved_quantity",
    ],
    filters: { product_id: productId },
  })

  const rows = (variants as Record<string, unknown>[]).map((v) => {
    const links =
      (v.inventory_items as
        | {
            inventory?: {
              id?: string
              sku?: string
              location_levels?: {
                location_id: string
                stocked_quantity: number
                reserved_quantity: number
              }[]
            }
          }[]
        | undefined) ?? []
    const inv = links[0]?.inventory

    return {
      variant_id: String(v.id),
      variant_title: (v.title as string) ?? null,
      sku: (v.sku as string) ?? inv?.sku ?? null,
      manage_inventory: Boolean(v.manage_inventory),
      inventory_item_id: inv?.id ?? null,
      levels: (inv?.location_levels ?? []).map((l) => ({
        location_id: l.location_id,
        location_name: locName.get(l.location_id) ?? l.location_id,
        stocked_quantity: Number(l.stocked_quantity ?? 0),
        reserved_quantity: Number(l.reserved_quantity ?? 0),
      })),
    }
  })

  res.json({
    locations: locations.map((l) => ({
      id: l.id,
      name: (l as unknown as { name: string }).name,
    })),
    variants: rows,
  })
}
