/**
 * GET /admin/custom/inventory/shortage/orders
 *
 * Trả danh sách orders chưa fulfilled có line items không đủ hàng.
 * Logic:
 *  1. Lấy tất cả reservation_items (linked to line_item_id)
 *  2. Với mỗi inventory_item, tính available = stocked - reserved
 *  3. Nếu available < 0 → tìm các reservation thuộc orders đang pending
 *  4. Group by order_id → trả danh sách đơn bị ảnh hưởng
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
  const orderModule = req.scope.resolve(Modules.ORDER)

  // Lấy inventory items với reservation items
  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: [
      "id",
      "sku",
      "title",
      "stocked_quantity",
      "reserved_quantity",
      "location_levels.stocked_quantity",
      "location_levels.reserved_quantity",
      "reservation_items.id",
      "reservation_items.line_item_id",
      "reservation_items.quantity",
      "reservation_items.location_id",
    ],
  })

  type ReservationItem = {
    id: string
    line_item_id?: string | null
    quantity: number
    location_id: string
  }

  type InvItemWithReservations = {
    id: string
    sku?: string | null
    title?: string | null
    location_levels?: Array<{
      stocked_quantity: number
      reserved_quantity: number
    }>
    reservation_items?: ReservationItem[]
  }

  const inventoryItems = (items ?? []) as InvItemWithReservations[]

  // Tìm các inventory items đang thiếu
  const shortageItems: Array<{
    inventoryItemId: string
    sku: string | null
    title: string | null
    available: number
    shortage: number
    reservations: ReservationItem[]
  }> = []

  for (const item of inventoryItems) {
    let stocked = 0
    let reserved = 0
    for (const level of item.location_levels ?? []) {
      stocked += level.stocked_quantity ?? 0
      reserved += level.reserved_quantity ?? 0
    }
    const available = stocked - reserved

    if (available < 0) {
      shortageItems.push({
        inventoryItemId: item.id,
        sku: item.sku ?? null,
        title: item.title ?? null,
        available,
        shortage: Math.abs(available),
        reservations: item.reservation_items ?? [],
      })
    }
  }

  if (!shortageItems.length) {
    return res.json({ shortage_orders: [], count: 0 })
  }

  // Collect tất cả line_item_ids từ các reservation của items đang thiếu
  const lineItemIds = new Set<string>()
  for (const si of shortageItems) {
    for (const res of si.reservations) {
      if (res.line_item_id) lineItemIds.add(res.line_item_id)
    }
  }

  if (!lineItemIds.size) {
    return res.json({ shortage_orders: [], count: 0 })
  }

  // Lấy orders chưa fulfilled chứa các line items này
  const { data: lineItemsData } = await query.graph({
    entity: "order_line_item",
    fields: [
      "id",
      "title",
      "variant_title",
      "quantity",
      "variant_id",
      "order_id",
    ],
    filters: {
      id: Array.from(lineItemIds),
    },
  })

  type LineItemData = {
    id: string
    title?: string | null
    variant_title?: string | null
    quantity: number
    variant_id?: string | null
    order_id?: string | null
  }

  const lineItems = (lineItemsData ?? []) as LineItemData[]
  const orderIds = [...new Set(lineItems.map((li) => li.order_id).filter(Boolean))] as string[]

  if (!orderIds.length) {
    return res.json({ shortage_orders: [], count: 0 })
  }

  // Lấy thông tin orders theo ID (chỉ pending/processing, không lấy fulfilled/canceled)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = await orderModule.listOrders(
    { id: orderIds } as any,
    {
      select: ["id", "display_id", "status", "created_at", "email", "customer_id"],
    }
  )

  // Build map: lineItemId → shortage info
  const lineItemToShortage = new Map<string, { sku: string | null; title: string | null; shortage: number }>()
  for (const si of shortageItems) {
    for (const res of si.reservations) {
      if (res.line_item_id) {
        lineItemToShortage.set(res.line_item_id, {
          sku: si.sku,
          title: si.title,
          shortage: si.shortage,
        })
      }
    }
  }

  // Group line items by order
  const orderIdSet = new Set(orders.map((o) => o.id))
  const orderLineMap = new Map<string, LineItemData[]>()
  for (const li of lineItems) {
    if (!li.order_id || !orderIdSet.has(li.order_id)) continue
    const arr = orderLineMap.get(li.order_id) ?? []
    arr.push(li)
    orderLineMap.set(li.order_id, arr)
  }

  // Assemble response
  const shortageOrders = orders.map((order) => {
    const affectedItems = (orderLineMap.get(order.id) ?? []).map((li) => {
      const si = lineItemToShortage.get(li.id)
      return {
        line_item_id: li.id,
        product_title: li.title,
        variant_title: li.variant_title,
        quantity_ordered: li.quantity,
        sku: si?.sku ?? null,
        inventory_title: si?.title ?? null,
        shortage_quantity: si?.shortage ?? 0,
      }
    })

    return {
      order_id: order.id,
      display_id: (order as unknown as { display_id?: number }).display_id,
      status: order.status,
      created_at: order.created_at,
      customer_email: (order as unknown as { email?: string }).email,
      affected_items: affectedItems,
      total_shortage_lines: affectedItems.length,
    }
  })

  shortageOrders.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  res.json({
    shortage_orders: shortageOrders,
    count: shortageOrders.length,
  })
}
