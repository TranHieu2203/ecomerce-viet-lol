import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type OrderItem = {
  product_id?: string | null
  product_title?: string | null
  variant_title?: string | null
  title?: string | null
  quantity?: number
  unit_price?: number
}

type OrderRow = {
  id: string
  display_id?: string | number
  created_at: string | Date
  status?: string
  items?: OrderItem[]
}

/** Ngày dạng YYYY-MM-DD theo giờ Việt Nam (UTC+7). */
function vnDate(value: string | Date): string {
  const d = new Date(value)
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

/**
 * Báo cáo doanh thu, tính từ đơn hàng thật.
 *
 * Doanh thu lấy theo `unit_price` lưu trong từng dòng đơn — tức là giá tại
 * thời điểm khách mua. Đổi giá sản phẩm sau này không làm sai lệch báo cáo cũ.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const days = Math.min(
    366,
    Math.max(1, Number(req.query?.days ?? 30) || 30)
  )
  const since = new Date(Date.now() - days * 86400000)

  const { data } = await query.graph({
    entity: "order",
    // Phải lấy "items.*"; chọn lẻ từng trường con (items.quantity...) thì
    // query.graph trả về undefined.
    fields: ["id", "display_id", "created_at", "status", "items.*"],
  })

  const orders = (data as unknown as OrderRow[]).filter((o) => {
    if (!o.created_at) {
      return false
    }
    if (String(o.status).toLowerCase() === "canceled") {
      return false
    }
    return new Date(o.created_at) >= since
  })

  let revenue = 0
  let unitsSold = 0
  const byDay = new Map<string, { revenue: number; orders: number }>()
  const byProduct = new Map<
    string,
    { title: string; quantity: number; revenue: number }
  >()

  for (const o of orders) {
    let orderRevenue = 0

    for (const it of o.items ?? []) {
      const qty = Number(it.quantity ?? 0)
      const price = Number(it.unit_price ?? 0)
      if (!Number.isFinite(qty) || !Number.isFinite(price)) {
        continue
      }
      const line = qty * price
      orderRevenue += line
      unitsSold += qty

      const key = it.product_id || it.product_title || it.title || "khac"
      const cur = byProduct.get(key) ?? {
        title: it.product_title || it.title || "Không rõ",
        quantity: 0,
        revenue: 0,
      }
      cur.quantity += qty
      cur.revenue += line
      byProduct.set(key, cur)
    }

    revenue += orderRevenue
    const day = vnDate(o.created_at)
    const d = byDay.get(day) ?? { revenue: 0, orders: 0 }
    d.revenue += orderRevenue
    d.orders += 1
    byDay.set(day, d)
  }

  const orderCount = orders.length

  res.json({
    range_days: days,
    summary: {
      revenue,
      order_count: orderCount,
      units_sold: unitsSold,
      avg_order_value: orderCount ? Math.round(revenue / orderCount) : 0,
    },
    by_day: Array.from(byDay.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    top_products: Array.from(byProduct.entries())
      .map(([product_id, v]) => ({ product_id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20),
  })
}
