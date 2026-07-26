import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { STOCK_LEDGER_MODULE } from "../../../../../modules/stock-ledger"
import type StockLedgerModuleService from "../../../../../modules/stock-ledger/service"
import { MOVEMENT_TYPE } from "../../../../../modules/stock-ledger/models/stock-movement"

type Movement = {
  inventory_item_id: string
  product_id: string | null
  product_title: string | null
  variant_title: string | null
  sku: string | null
  type: string
  quantity: number
  balance_after: number
  created_at: string | Date
}

/**
 * Báo cáo xuất nhập tồn theo kỳ.
 *
 * Tồn đầu kỳ lấy từ `balance_after` của biến động cuối cùng TRƯỚC kỳ — con số
 * này được ghi lại tại thời điểm đó nên chính xác tuyệt đối. Mặt hàng chưa
 * từng có biến động nào trước kỳ thì để trống, không suy đoán.
 *
 * "Đã bán" đếm từ đơn hàng. Lưu ý Medusa chỉ trừ kho khi giao hàng, nên nếu
 * còn đơn chưa giao thì số đã bán sẽ lớn hơn phần kho thực bị trừ.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)
  const ledger = req.scope.resolve(
    STOCK_LEDGER_MODULE
  ) as StockLedgerModuleService

  const days = Math.min(366, Math.max(1, Number(req.query?.days ?? 30) || 30))
  const since = new Date(Date.now() - days * 86400000)

  const allMovements = (await ledger.listStockMovements(
    {},
    { order: { created_at: "ASC" }, take: 5000 }
  )) as unknown as Movement[]

  // Tồn hiện tại, cộng gộp mọi kho cho từng mặt hàng.
  const levels = await inventoryService.listInventoryLevels({})
  const stockNow = new Map<string, number>()
  for (const l of levels) {
    const k = l.inventory_item_id
    stockNow.set(k, (stockNow.get(k) ?? 0) + Number(l.stocked_quantity ?? 0))
  }

  type Row = {
    inventory_item_id: string
    product_id: string | null
    title: string
    sku: string | null
    opening: number | null
    in_qty: number
    out_qty: number
    adjust_qty: number
    sold_qty: number
    closing: number
  }
  const rows = new Map<string, Row>()

  const rowFor = (m: Movement): Row => {
    const k = m.inventory_item_id
    if (!rows.has(k)) {
      rows.set(k, {
        inventory_item_id: k,
        product_id: null,
        title: k,
        sku: null,
        opening: null,
        in_qty: 0,
        out_qty: 0,
        adjust_qty: 0,
        sold_qty: 0,
        closing: stockNow.get(k) ?? 0,
      })
    }
    const r = rows.get(k)!
    // Bản ghi cũ có thể thiếu mô tả — lấy từ bất kỳ bản ghi nào có, không chỉ
    // bản đầu tiên.
    if (!r.product_id && m.product_id) {
      r.product_id = m.product_id
    }
    if (!r.sku && m.sku) {
      r.sku = m.sku
    }
    const named = [m.product_title, m.variant_title].filter(Boolean).join(" · ")
    if (r.title === k && named) {
      r.title = named
    }
    return r
  }

  // Biến động trước kỳ chỉ dùng để chốt tồn đầu kỳ; trong kỳ mới cộng dồn.
  const lastBefore = new Map<string, number>()
  for (const m of allMovements) {
    const when = new Date(m.created_at)
    const r = rowFor(m)
    if (when < since) {
      lastBefore.set(m.inventory_item_id, Number(m.balance_after ?? 0))
      continue
    }
    const q = Number(m.quantity ?? 0)
    if (m.type === MOVEMENT_TYPE.IN) {
      r.in_qty += q
    } else if (m.type === MOVEMENT_TYPE.OUT) {
      r.out_qty += Math.abs(q)
    } else {
      r.adjust_qty += q
    }
  }
  for (const [k, v] of lastBefore.entries()) {
    const r = rows.get(k)
    if (r) {
      r.opening = v
    }
  }

  // Đã bán trong kỳ, đếm theo sản phẩm từ đơn hàng.
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "created_at", "status", "items.*"],
  })
  const soldByProduct = new Map<string, number>()
  for (const o of orders as unknown as {
    created_at: string | Date
    status?: string
    items?: { product_id?: string | null; quantity?: number }[]
  }[]) {
    if (String(o.status).toLowerCase() === "canceled") {
      continue
    }
    if (new Date(o.created_at) < since) {
      continue
    }
    for (const it of o.items ?? []) {
      if (!it.product_id) {
        continue
      }
      soldByProduct.set(
        it.product_id,
        (soldByProduct.get(it.product_id) ?? 0) + Number(it.quantity ?? 0)
      )
    }
  }
  for (const r of rows.values()) {
    if (r.product_id) {
      r.sold_qty = soldByProduct.get(r.product_id) ?? 0
    }
  }

  // Sổ đã ghi cả phần xuất do giao hàng, nên tồn suy ra từ sổ phải trùng tồn
  // thực tế. Lệch nghĩa là có thay đổi không qua sổ (sửa tay ở trang Kho hàng
  // mặc định của Medusa, hoặc lúc ghi sổ gặp lỗi) — hiện ra để còn kiểm kê lại.
  const out = Array.from(rows.values()).map((r) => {
    const net = r.in_qty - r.out_qty + r.adjust_qty
    const derived = r.opening === null ? null : r.opening + net
    return {
      ...r,
      derived_closing: derived,
      discrepancy: derived === null ? null : r.closing - derived,
    }
  })

  res.json({
    range_days: days,
    rows: out.sort((a, b) => a.title.localeCompare(b.title, "vi")),
  })
}
