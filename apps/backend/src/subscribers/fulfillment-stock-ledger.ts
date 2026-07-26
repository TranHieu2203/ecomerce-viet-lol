import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { STOCK_LEDGER_MODULE } from "../modules/stock-ledger"
import type StockLedgerModuleService from "../modules/stock-ledger/service"

/**
 * Ghi sổ kho phần xuất do giao hàng.
 *
 * Medusa tự trừ `stocked_quantity` khi tạo phiếu giao hàng, nhưng không để lại
 * dòng nào trong sổ kho — khiến cột "còn lại" của sổ bị nhảy cóc và báo cáo
 * xuất nhập tồn không bao giờ cân. Subscriber này bù đúng chỗ đó.
 *
 * Ghi sổ hỏng thì chỉ log cảnh báo, tuyệt đối không ném lỗi ngược lại luồng
 * giao hàng — thà sổ lệch (báo cáo có cột phát hiện lệch) còn hơn chặn shop
 * giao hàng cho khách.
 */
export default async function fulfillmentStockLedgerHandler({
  event,
  container,
}: SubscriberArgs<{ order_id?: string; fulfillment_id?: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const inventoryService = container.resolve(Modules.INVENTORY)
    const ledger = container.resolve(
      STOCK_LEDGER_MODULE
    ) as StockLedgerModuleService

    const orderId = event.data?.order_id
    const fulfillmentId = event.data?.fulfillment_id
    if (!orderId) {
      return
    }

    const isCancel = event.name === "order.fulfillment_canceled"

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "items.*", "fulfillments.*"],
      filters: { id: orderId },
    })
    const order = orders?.[0] as
      | {
          display_id?: string | number
          items?: {
            variant_id?: string | null
            product_id?: string | null
            product_title?: string | null
            variant_title?: string | null
            quantity?: number
          }[]
          fulfillments?: { id: string; items?: { line_item_id?: string; quantity?: number }[] }[]
        }
      | undefined
    if (!order) {
      return
    }

    // Bản đồ variant -> mặt hàng kho, đi từ phía variant vì entity
    // inventory_item không có đường dẫn ngược.
    const { data: variants } = await query.graph({
      entity: "variant",
      fields: ["id", "sku", "inventory_items.inventory_item_id"],
    })
    const itemByVariant = new Map<string, string>()
    const skuByVariant = new Map<string, string>()
    for (const v of variants as Record<string, unknown>[]) {
      const links =
        (v.inventory_items as { inventory_item_id?: string }[] | undefined) ?? []
      if (links[0]?.inventory_item_id) {
        itemByVariant.set(String(v.id), links[0].inventory_item_id)
      }
      if (v.sku) {
        skuByVariant.set(String(v.id), String(v.sku))
      }
    }

    const rows: Record<string, unknown>[] = []

    for (const line of order.items ?? []) {
      if (!line.variant_id) {
        continue
      }
      const invItemId = itemByVariant.get(line.variant_id)
      if (!invItemId) {
        continue // không quản lý tồn thì không có gì để ghi
      }

      const levels = await inventoryService.listInventoryLevels({
        inventory_item_id: invItemId,
      })
      if (!levels.length) {
        continue
      }
      const level = levels[0]
      const qty = Number(line.quantity ?? 0)
      if (!qty) {
        continue
      }

      rows.push({
        inventory_item_id: invItemId,
        variant_id: line.variant_id,
        product_id: line.product_id ?? null,
        product_title: line.product_title ?? null,
        variant_title: line.variant_title ?? null,
        sku: skuByVariant.get(line.variant_id) ?? null,
        location_id: level.location_id,
        location_name: null,
        type: isCancel ? "nhap" : "xuat",
        quantity: isCancel ? qty : -qty,
        balance_after: Number(level.stocked_quantity ?? 0),
        unit_cost: null,
        note: isCancel
          ? `Hoàn kho do huỷ giao hàng — đơn #${order.display_id ?? orderId}`
          : `Xuất bán theo phiếu giao hàng — đơn #${order.display_id ?? orderId}`,
        actor_id: null,
      })
    }

    if (rows.length) {
      await ledger.createStockMovements(rows as never)
      logger.info(
        `Đã ghi ${rows.length} dòng sổ kho cho phiếu giao hàng ${fulfillmentId ?? ""} của đơn ${orderId}`
      )
    }
  } catch (e) {
    logger.warn(
      `Không ghi được sổ kho cho sự kiện ${event.name}: ${(e as Error).message}`
    )
  }
}

export const config: SubscriberConfig = {
  event: ["order.fulfillment_created", "order.fulfillment_canceled"],
}
