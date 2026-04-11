/**
 * GET /admin/custom/inventory/shortage/variants
 *
 * Trả danh sách variants đang thiếu hàng (available_quantity < 0)
 * hoặc hết hàng (available = 0), kèm thông tin sản phẩm và từng kho.
 *
 * Query params:
 *  - include_zero: "true" → bao gồm cả available=0 (hết hàng)
 */

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)

  const includeZero = req.query.include_zero === "true"

  const allLocations = await stockLocationService.listStockLocations({}, {
    select: ["id", "name"],
  })
  const locationMap = new Map(
    allLocations.map((l) => [l.id, (l as unknown as { name: string }).name])
  )

  // Lấy inventory items với variant links
  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: [
      "id",
      "sku",
      "title",
      "metadata",
      "stocked_quantity",
      "reserved_quantity",
      "location_levels.location_id",
      "location_levels.stocked_quantity",
      "location_levels.reserved_quantity",
      "location_levels.incoming_quantity",
      "location_levels.available_quantity",
      // link → variant → product
      "variant_inventory_items.variant_id",
      "variant_inventory_items.variant.title",
      "variant_inventory_items.variant.product.id",
      "variant_inventory_items.variant.product.title",
      "variant_inventory_items.variant.product.thumbnail",
    ],
  })

  type InvItem = {
    id: string
    sku?: string | null
    title?: string | null
    metadata?: { min_stock_threshold?: number } | null
    stocked_quantity?: number | null
    reserved_quantity?: number | null
    location_levels?: Array<{
      location_id: string
      stocked_quantity: number
      reserved_quantity: number
      incoming_quantity: number
      available_quantity: number | null
    }>
    variant_inventory_items?: Array<{
      variant_id: string
      variant?: {
        title?: string | null
        product?: {
          id?: string | null
          title?: string | null
          thumbnail?: string | null
        } | null
      } | null
    }>
  }

  const inventoryItems = (items ?? []) as unknown as InvItem[]

  type ShortageRow = {
    inventory_item_id: string
    sku: string | null | undefined
    inventory_title: string | null | undefined
    variant_title: string | null
    product_id: string | null
    product_title: string | null
    product_thumbnail: string | null
    stocked_quantity: number
    reserved_quantity: number
    available_quantity: number
    incoming_quantity: number
    shortage: number
    status: string
    min_stock_threshold: number
    by_location: Array<{
      location_id: string
      location_name: string
      stocked: number
      reserved: number
      incoming: number
      available: number
    }>
  }

  const shortageRows: ShortageRow[] = []

  for (const item of inventoryItems) {
    const threshold = item.metadata?.min_stock_threshold ?? 19
    let totalStocked = 0
    let totalReserved = 0
    let totalIncoming = 0

    const byLocation: Array<{
      location_id: string
      location_name: string
      stocked: number
      reserved: number
      incoming: number
      available: number
    }> = []
    for (const level of item.location_levels ?? []) {
      totalStocked += level.stocked_quantity ?? 0
      totalReserved += level.reserved_quantity ?? 0
      totalIncoming += level.incoming_quantity ?? 0
      byLocation.push({
        location_id: level.location_id,
        location_name: locationMap.get(level.location_id) ?? level.location_id,
        stocked: level.stocked_quantity ?? 0,
        reserved: level.reserved_quantity ?? 0,
        incoming: level.incoming_quantity ?? 0,
        available: (level.stocked_quantity ?? 0) - (level.reserved_quantity ?? 0),
      })
    }

    const available = totalStocked - totalReserved

    // Chỉ trả kết quả khi thiếu hoặc hết
    if (available < 0 || (includeZero && available === 0)) {
      const variant = item.variant_inventory_items?.[0]?.variant
      const product = variant?.product

      shortageRows.push({
        inventory_item_id: item.id,
        sku: item.sku,
        inventory_title: item.title,
        variant_title: variant?.title ?? null,
        product_id: product?.id ?? null,
        product_title: product?.title ?? null,
        product_thumbnail: product?.thumbnail ?? null,
        stocked_quantity: totalStocked,
        reserved_quantity: totalReserved,
        available_quantity: available,
        incoming_quantity: totalIncoming,
        shortage: available < 0 ? Math.abs(available) : 0,
        status: available < 0 ? "shortage" : "out_of_stock",
        min_stock_threshold: threshold,
        by_location: byLocation,
      })
    }
  }

  // Sắp xếp: thiếu nhiều nhất lên đầu
  shortageRows.sort((a, b) => a.available_quantity - b.available_quantity)

  res.json({
    shortage_variants: shortageRows,
    count: shortageRows.length,
  })
}
