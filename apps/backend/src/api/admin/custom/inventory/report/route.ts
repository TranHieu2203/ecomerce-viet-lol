/**
 * GET /admin/custom/inventory/report
 *
 * Báo cáo đầy đủ tồn kho tất cả SKU × kho.
 *
 * Query params:
 *  - format: "json" (mặc định) | "xlsx"  → tải xuống file Excel
 */

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import * as XLSX from "xlsx"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)

  const format = (req.query.format as string) ?? "json"

  const allLocations = await stockLocationService.listStockLocations({}, {
    select: ["id", "name"],
  })
  const locationMap = new Map(
    allLocations.map((l) => [l.id, (l as unknown as { name: string }).name])
  )

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
      "variant_inventory_items.variant.title",
      "variant_inventory_items.variant.product.title",
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
    }>
    variant_inventory_items?: Array<{
      variant?: {
        title?: string | null
        product?: { title?: string | null } | null
      } | null
    }>
  }

  const inventoryItems = (items ?? []) as InvItem[]

  // Build report rows
  const rows = inventoryItems.map((item) => {
    const threshold = item.metadata?.min_stock_threshold ?? 19
    let totalStocked = 0
    let totalReserved = 0
    let totalIncoming = 0

    const byLocation: Record<string, { stocked: number; reserved: number; incoming: number; available: number }> = {}

    for (const level of item.location_levels ?? []) {
      const locName = locationMap.get(level.location_id) ?? level.location_id
      const stocked = level.stocked_quantity ?? 0
      const reserved = level.reserved_quantity ?? 0
      const incoming = level.incoming_quantity ?? 0
      byLocation[locName] = { stocked, reserved, incoming, available: stocked - reserved }
      totalStocked += stocked
      totalReserved += reserved
      totalIncoming += incoming
    }

    const available = totalStocked - totalReserved
    const variant = item.variant_inventory_items?.[0]?.variant
    const productTitle = variant?.product?.title ?? null
    const variantTitle = variant?.title ?? null

    let status: string
    if (available < 0) status = "Thiếu hàng"
    else if (available === 0) status = "Hết hàng"
    else if (available <= threshold) status = "Sắp hết"
    else status = "Đủ hàng"

    return {
      inventory_item_id: item.id,
      sku: item.sku ?? "",
      product_title: productTitle ?? item.title ?? "",
      variant_title: variantTitle ?? "",
      threshold,
      total_stocked: totalStocked,
      total_reserved: totalReserved,
      total_incoming: totalIncoming,
      total_available: available,
      shortage: available < 0 ? Math.abs(available) : 0,
      status,
      by_location: byLocation,
    }
  })

  // Sắp xếp: thiếu → hết → sắp hết → đủ
  const statusOrder: Record<string, number> = {
    "Thiếu hàng": 0,
    "Hết hàng": 1,
    "Sắp hết": 2,
    "Đủ hàng": 3,
  }
  rows.sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9))

  if (format === "xlsx") {
    return exportExcel(res, rows, allLocations as unknown as Array<{ id: string; name: string }>)
  }

  res.json({
    report: rows,
    count: rows.length,
    locations: allLocations.map((l) => ({
      id: l.id,
      name: (l as unknown as { name: string }).name,
    })),
  })
}

function exportExcel(
  res: MedusaResponse,
  rows: buildRows,
  locations: Array<{ id: string; name: string }>
) {
  // Sheet 1: Tổng hợp
  const summaryData = rows.map((row) => {
    const base: Record<string, unknown> = {
      "SKU": row.sku,
      "Sản phẩm": row.product_title,
      "Biến thể": row.variant_title,
      "Trạng thái": row.status,
      "Tổng tồn": row.total_stocked,
      "Đang giữ": row.total_reserved,
      "Đang về": row.total_incoming,
      "Sẵn có": row.total_available,
      "Thiếu": row.shortage,
      "Ngưỡng sắp hết": row.threshold,
    }
    // Cột per kho
    for (const loc of locations) {
      const level = row.by_location[loc.name]
      base[`${loc.name} - Tồn`] = level?.stocked ?? 0
      base[`${loc.name} - Giữ`] = level?.reserved ?? 0
      base[`${loc.name} - Sẵn`] = level?.available ?? 0
    }
    return base
  })

  const wb = XLSX.utils.book_new()

  // Sheet 1: Báo cáo tổng hợp
  const ws1 = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, ws1, "Tổng hợp tồn kho")

  // Sheet 2: Chỉ thiếu hàng
  const shortageData = summaryData.filter(
    (_, i) => rows[i].status === "Thiếu hàng" || rows[i].status === "Hết hàng"
  )
  if (shortageData.length) {
    const ws2 = XLSX.utils.json_to_sheet(shortageData)
    XLSX.utils.book_append_sheet(wb, ws2, "Thiếu & Hết hàng")
  }

  // Sheet 3: Sắp hết
  const lowStockData = summaryData.filter((_, i) => rows[i].status === "Sắp hết")
  if (lowStockData.length) {
    const ws3 = XLSX.utils.json_to_sheet(lowStockData)
    XLSX.utils.book_append_sheet(wb, ws3, "Sắp hết hàng")
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const filename = `inventory-report-${new Date().toISOString().slice(0, 10)}.xlsx`

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  res.send(buffer)
}

// Helper type cho rows
type buildRows = Array<{
  inventory_item_id: string
  sku: string
  product_title: string
  variant_title: string
  threshold: number
  total_stocked: number
  total_reserved: number
  total_incoming: number
  total_available: number
  shortage: number
  status: string
  by_location: Record<string, { stocked: number; reserved: number; incoming: number; available: number }>
}>
