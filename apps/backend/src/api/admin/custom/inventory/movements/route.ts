import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STOCK_LEDGER_MODULE } from "../../../../../modules/stock-ledger"
import type StockLedgerModuleService from "../../../../../modules/stock-ledger/service"

/** Lịch sử biến động kho, mới nhất trước. Lọc được theo sản phẩm. */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const ledger = req.scope.resolve(
    STOCK_LEDGER_MODULE
  ) as StockLedgerModuleService

  const limitRaw = Number(req.query?.limit ?? 100)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(500, Math.floor(limitRaw)) : 100

  const filters: Record<string, unknown> = {}
  const productId = (req.query?.product_id as string | undefined)?.trim()
  const itemId = (req.query?.inventory_item_id as string | undefined)?.trim()
  if (productId) {
    filters.product_id = productId
  }
  if (itemId) {
    filters.inventory_item_id = itemId
  }

  const movements = await ledger.listStockMovements(filters, {
    take: limit,
    order: { created_at: "DESC" },
  })

  res.json({ movements })
}
