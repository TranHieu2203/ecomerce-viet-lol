/**
 * GET  /admin/custom/inventory/items?product_id=xxx
 *
 * Lấy inventory data (levels + threshold) cho tất cả variants của một product.
 *
 * PATCH /admin/custom/inventory/items
 * Body: { inventory_item_id, min_stock_threshold?, location_levels? }
 *  - Cập nhật min_stock_threshold trên InventoryItem metadata
 *  - Cập nhật incoming_quantity trên InventoryLevel theo location
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

  const productId = req.query.product_id as string | undefined

  if (!productId) {
    return res.status(400).json({ message: "Thiếu product_id" })
  }

  const allLocations = await stockLocationService.listStockLocations({}, {
    select: ["id", "name"],
  })
  const locationMap = new Map(
    allLocations.map((l) => [l.id, (l as unknown as { name: string }).name])
  )

  // Lấy variants của product → inventory items
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "title",
      "sku",
      "manage_inventory",
      "allow_backorder",
      "inventory_items.inventory_item_id",
      "inventory_items.inventory.id",
      "inventory_items.inventory.sku",
      "inventory_items.inventory.title",
      "inventory_items.inventory.metadata",
      "inventory_items.inventory.stocked_quantity",
      "inventory_items.inventory.reserved_quantity",
      "inventory_items.inventory.location_levels.id",
      "inventory_items.inventory.location_levels.location_id",
      "inventory_items.inventory.location_levels.stocked_quantity",
      "inventory_items.inventory.location_levels.reserved_quantity",
      "inventory_items.inventory.location_levels.incoming_quantity",
    ],
    filters: { product_id: productId },
  })

  type InventoryLevel = {
    id: string
    location_id: string
    stocked_quantity: number
    reserved_quantity: number
    incoming_quantity: number
  }

  type InventoryItemData = {
    id: string
    sku?: string | null
    title?: string | null
    metadata?: { min_stock_threshold?: number } | null
    stocked_quantity?: number | null
    reserved_quantity?: number | null
    location_levels?: InventoryLevel[]
  }

  type VariantData = {
    id: string
    title?: string | null
    sku?: string | null
    manage_inventory?: boolean
    allow_backorder?: boolean
    inventory_items?: Array<{
      inventory_item_id: string
      inventory?: InventoryItemData | null
    }>
  }

  const variantList = (variants ?? []) as VariantData[]

  const result = variantList.map((variant) => {
    const invLink = variant.inventory_items?.[0]
    const inv = invLink?.inventory

    if (!inv) {
      return {
        variant_id: variant.id,
        variant_title: variant.title,
        sku: variant.sku,
        manage_inventory: variant.manage_inventory,
        allow_backorder: variant.allow_backorder,
        inventory_item_id: null,
        min_stock_threshold: 19,
        stocked_quantity: 0,
        reserved_quantity: 0,
        available_quantity: 0,
        status: "untracked",
        by_location: [],
      }
    }

    const threshold = inv.metadata?.min_stock_threshold ?? 19
    let totalStocked = 0
    let totalReserved = 0
    let totalIncoming = 0

    const byLocation = (inv.location_levels ?? []).map((level) => {
      const stocked = level.stocked_quantity ?? 0
      const reserved = level.reserved_quantity ?? 0
      const incoming = level.incoming_quantity ?? 0
      totalStocked += stocked
      totalReserved += reserved
      totalIncoming += incoming
      return {
        inventory_level_id: level.id,
        location_id: level.location_id,
        location_name: locationMap.get(level.location_id) ?? level.location_id,
        stocked,
        reserved,
        incoming,
        available: stocked - reserved,
      }
    })

    const available = totalStocked - totalReserved
    let status: string
    if (available < 0) status = "shortage"
    else if (available === 0) status = "out_of_stock"
    else if (available <= threshold) status = "low_stock"
    else status = "in_stock"

    return {
      variant_id: variant.id,
      variant_title: variant.title,
      sku: variant.sku ?? inv.sku,
      manage_inventory: variant.manage_inventory,
      allow_backorder: variant.allow_backorder,
      inventory_item_id: inv.id,
      min_stock_threshold: threshold,
      stocked_quantity: totalStocked,
      reserved_quantity: totalReserved,
      incoming_quantity: totalIncoming,
      available_quantity: available,
      status,
      by_location: byLocation,
    }
  })

  res.json({
    inventory_items: result,
    locations: allLocations.map((l) => ({
      id: l.id,
      name: (l as unknown as { name: string }).name,
    })),
  })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<{
    inventory_item_id: string
    min_stock_threshold?: number
    location_levels?: Array<{
      inventory_level_id: string
      incoming_quantity: number
    }>
  }>,
  res: MedusaResponse
) {
  const inventoryService = req.scope.resolve(Modules.INVENTORY)
  const body = req.body ?? ({} as ReturnType<typeof req.body>)

  const { inventory_item_id, min_stock_threshold, location_levels } = body

  if (!inventory_item_id) {
    return res.status(400).json({ message: "Thiếu inventory_item_id" })
  }

  // Cập nhật threshold
  if (min_stock_threshold !== undefined) {
    if (typeof min_stock_threshold !== "number" || min_stock_threshold < 0) {
      return res.status(400).json({ message: "min_stock_threshold phải là số >= 0" })
    }

    const [existing] = await inventoryService.listInventoryItems({ id: [inventory_item_id] })
    if (!existing) {
      return res.status(404).json({ message: "Không tìm thấy inventory item" })
    }

    await inventoryService.updateInventoryItems([
      {
        id: inventory_item_id,
        metadata: {
          ...((existing.metadata as Record<string, unknown>) ?? {}),
          min_stock_threshold,
        },
      },
    ])
  }

  // Cập nhật incoming_quantity
  if (location_levels && location_levels.length > 0) {
    for (const level of location_levels) {
      if (typeof level.incoming_quantity !== "number" || level.incoming_quantity < 0) {
        return res.status(400).json({
          message: "incoming_quantity phải là số >= 0",
        })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await inventoryService.updateInventoryLevels(
      location_levels.map((l) => ({
        id: l.inventory_level_id,
        incoming_quantity: l.incoming_quantity,
      })) as any
    )
  }

  res.json({ success: true })
}
