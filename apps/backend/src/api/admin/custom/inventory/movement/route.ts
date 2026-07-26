import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { STOCK_LEDGER_MODULE } from "../../../../../modules/stock-ledger"
import type StockLedgerModuleService from "../../../../../modules/stock-ledger/service"
import { MOVEMENT_TYPE } from "../../../../../modules/stock-ledger/models/stock-movement"

type Body = {
  inventory_item_id?: string
  location_id?: string
  type?: string
  /** Với nhập/xuất là số lượng thay đổi; với điều chỉnh là số tồn đếm được. */
  quantity?: unknown
  unit_cost?: unknown
  note?: unknown
}

const int = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

/**
 * Ghi một biến động kho: cập nhật tồn và ghi sổ trong cùng một thao tác.
 *
 * - nhap / xuat: `quantity` là số lượng thay đổi (luôn nhập số dương).
 * - dieu_chinh: `quantity` là số tồn thực đếm được, hệ thống tự tính chênh lệch.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)
  const ledger = req.scope.resolve(
    STOCK_LEDGER_MODULE
  ) as StockLedgerModuleService

  const body = (req.body ?? {}) as Body
  const itemId = String(body.inventory_item_id ?? "").trim()
  const locationId = String(body.location_id ?? "").trim()
  const type = String(body.type ?? "").trim()
  const qty = int(body.quantity)

  if (!itemId || !locationId) {
    return res.status(400).json({ message: "Thiếu mặt hàng hoặc kho" })
  }
  if (!Object.values(MOVEMENT_TYPE).includes(type as never)) {
    return res.status(400).json({ message: "Loại phiếu không hợp lệ" })
  }
  if (qty === null || qty < 0) {
    return res.status(400).json({ message: "Số lượng phải là số không âm" })
  }

  const [level] = await inventoryService.listInventoryLevels({
    inventory_item_id: itemId,
    location_id: locationId,
  })
  if (!level) {
    return res
      .status(404)
      .json({ message: "Mặt hàng này chưa có trong kho đã chọn" })
  }

  const before = Number(level.stocked_quantity ?? 0)
  let after: number
  let delta: number

  if (type === MOVEMENT_TYPE.IN) {
    delta = qty
    after = before + qty
  } else if (type === MOVEMENT_TYPE.OUT) {
    if (qty > before) {
      return res.status(400).json({
        message: `Không xuất được ${qty} vì kho chỉ còn ${before}`,
      })
    }
    delta = -qty
    after = before - qty
  } else {
    after = qty
    delta = qty - before
    if (delta === 0) {
      return res
        .status(400)
        .json({ message: "Số kiểm kê trùng với tồn hiện tại, không có gì để ghi" })
    }
  }

  // Tồn không bao giờ được âm — chặn ở đây thay vì để database nhận số âm.
  if (after < 0) {
    return res.status(400).json({ message: "Tồn sau thao tác sẽ bị âm" })
  }

  await inventoryService.updateInventoryLevels([
    {
      inventory_item_id: itemId,
      location_id: locationId,
      stocked_quantity: after,
    },
  ])

  // Chụp thông tin mô tả để sổ kho vẫn đọc hiểu được nếu sau này đổi tên/xoá.
  let productId: string | null = null
  let productTitle: string | null = null
  let variantId: string | null = null
  let variantTitle: string | null = null
  let sku: string | null = null

  try {
    const { data } = await query.graph({
      entity: "inventory_item",
      fields: [
        "id",
        "sku",
        "variant_inventory_items.variant.id",
        "variant_inventory_items.variant.title",
        "variant_inventory_items.variant.product.id",
        "variant_inventory_items.variant.product.title",
      ],
      filters: { id: itemId },
    })
    const it = data[0] as Record<string, unknown> | undefined
    sku = (it?.sku as string) ?? null
    const link = (
      it?.variant_inventory_items as
        | { variant?: { id?: string; title?: string; product?: { id?: string; title?: string } } }[]
        | undefined
    )?.[0]
    variantId = link?.variant?.id ?? null
    variantTitle = link?.variant?.title ?? null
    productId = link?.variant?.product?.id ?? null
    productTitle = link?.variant?.product?.title ?? null
  } catch {
    /* thiếu mô tả không được chặn việc ghi sổ */
  }

  let locationName: string | null = null
  try {
    const [loc] = await stockLocationService.listStockLocations({
      id: locationId,
    })
    locationName = (loc as unknown as { name?: string })?.name ?? null
  } catch {
    /* bỏ qua */
  }

  const movement = await ledger.createStockMovements([
    {
      inventory_item_id: itemId,
      variant_id: variantId,
      product_id: productId,
      product_title: productTitle,
      variant_title: variantTitle,
      sku,
      location_id: locationId,
      location_name: locationName,
      type,
      quantity: delta,
      balance_after: after,
      unit_cost: int(body.unit_cost),
      note: body.note ? String(body.note).trim().slice(0, 500) : null,
      actor_id: (req.auth_context?.actor_id as string | undefined) ?? null,
    },
  ] as never)

  res.json({
    movement,
    stocked_quantity_before: before,
    stocked_quantity_after: after,
  })
}
