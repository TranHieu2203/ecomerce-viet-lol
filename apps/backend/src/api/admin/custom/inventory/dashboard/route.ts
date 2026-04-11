/**
 * GET /admin/custom/inventory/dashboard
 *
 * Trả về KPI tổng hợp tồn kho:
 *  - total_skus: tổng số InventoryItems
 *  - out_of_stock: available_quantity = 0
 *  - in_shortage: available_quantity < 0
 *  - low_stock: 0 < available <= min_stock_threshold
 *  - total_stocked / total_reserved / total_available (cộng gộp mọi kho)
 *  - by_location: breakdown per StockLocation
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

  // Lấy tất cả stock locations
  const allLocations = await stockLocationService.listStockLocations({}, {
    select: ["id", "name"],
  })

  // Lấy tất cả inventory items + levels
  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: [
      "id",
      "sku",
      "title",
      "metadata",
      "stocked_quantity",
      "reserved_quantity",
      "location_levels.id",
      "location_levels.location_id",
      "location_levels.stocked_quantity",
      "location_levels.reserved_quantity",
      "location_levels.incoming_quantity",
      "location_levels.available_quantity",
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
      id: string
      location_id: string
      stocked_quantity: number
      reserved_quantity: number
      incoming_quantity: number
      available_quantity: number | null
    }>
  }

  const inventoryItems = (items ?? []) as InvItem[]

  // Tính KPI tổng hợp
  let totalStocked = 0
  let totalReserved = 0
  let outOfStock = 0
  let inShortage = 0
  let lowStock = 0

  for (const item of inventoryItems) {
    const threshold = item.metadata?.min_stock_threshold ?? 19
    let itemStocked = 0
    let itemReserved = 0

    for (const level of item.location_levels ?? []) {
      itemStocked += level.stocked_quantity ?? 0
      itemReserved += level.reserved_quantity ?? 0
    }

    const available = itemStocked - itemReserved
    totalStocked += itemStocked
    totalReserved += itemReserved

    if (available < 0) {
      inShortage++
    } else if (available === 0) {
      outOfStock++
    } else if (available <= threshold) {
      lowStock++
    }
  }

  // Breakdown per location
  const byLocation = allLocations.map((loc) => {
    let stocked = 0
    let reserved = 0
    let incoming = 0

    for (const item of inventoryItems) {
      const level = (item.location_levels ?? []).find(
        (l) => l.location_id === loc.id
      )
      if (level) {
        stocked += level.stocked_quantity ?? 0
        reserved += level.reserved_quantity ?? 0
        incoming += level.incoming_quantity ?? 0
      }
    }

    return {
      location_id: loc.id,
      name: (loc as unknown as { name: string }).name,
      stocked_quantity: stocked,
      reserved_quantity: reserved,
      incoming_quantity: incoming,
      available_quantity: stocked - reserved,
    }
  })

  res.json({
    dashboard: {
      total_skus: inventoryItems.length,
      out_of_stock: outOfStock,
      in_shortage: inShortage,
      low_stock: lowStock,
      in_stock: inventoryItems.length - outOfStock - inShortage - lowStock,
      total_stocked: totalStocked,
      total_reserved: totalReserved,
      total_available: totalStocked - totalReserved,
      by_location: byLocation,
    },
  })
}
