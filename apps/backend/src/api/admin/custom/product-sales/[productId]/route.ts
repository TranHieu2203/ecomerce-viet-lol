import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type OrderItem = {
  product_id?: string | null
  variant_title?: string | null
  quantity?: number
  unit_price?: number
}

type OrderRow = {
  id: string
  display_id?: string | number
  created_at: string | Date
  status?: string
  email?: string | null
  items?: OrderItem[]
}

/**
 * Lịch sử bán của một sản phẩm: từng lần bán kèm giá tại thời điểm đó.
 *
 * Giá lấy từ `unit_price` lưu trong dòng đơn nên luôn là giá khách thực trả
 * hôm đó, không đổi theo giá hiện tại của sản phẩm.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { productId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limitRaw = Number(req.query?.limit ?? 50)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(200, Math.floor(limitRaw)) : 50

  const { data } = await query.graph({
    entity: "order",
    // Phải lấy "items.*"; chọn lẻ từng trường con thì query.graph trả undefined.
    fields: ["id", "display_id", "created_at", "status", "email", "items.*"],
  })

  const rows: {
    order_id: string
    display_id: string | number | null
    created_at: string
    status: string | null
    variant_title: string | null
    quantity: number
    unit_price: number
    line_total: number
  }[] = []

  let totalQuantity = 0
  let totalRevenue = 0

  for (const o of data as unknown as OrderRow[]) {
    if (String(o.status).toLowerCase() === "canceled") {
      continue
    }
    for (const it of o.items ?? []) {
      if (it.product_id !== productId) {
        continue
      }
      const qty = Number(it.quantity ?? 0)
      const price = Number(it.unit_price ?? 0)
      const line = qty * price
      totalQuantity += qty
      totalRevenue += line
      rows.push({
        order_id: o.id,
        display_id: o.display_id ?? null,
        // created_at về từ query.graph là đối tượng Date, không phải chuỗi.
        created_at: new Date(o.created_at).toISOString(),
        status: o.status ?? null,
        variant_title: it.variant_title ?? null,
        quantity: qty,
        unit_price: price,
        line_total: line,
      })
    }
  }

  rows.sort((a, b) => b.created_at.localeCompare(a.created_at))

  res.json({
    summary: {
      order_count: new Set(rows.map((r) => r.order_id)).size,
      quantity: totalQuantity,
      revenue: totalRevenue,
      avg_price: totalQuantity ? Math.round(totalRevenue / totalQuantity) : 0,
    },
    sales: rows.slice(0, limit),
  })
}
