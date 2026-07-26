import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { adminFetch } from "../routes/storefront-cms/admin-fetch"

type Sale = {
  order_id: string
  display_id: string | number | null
  created_at: string
  quantity: number
  unit_price: number
  line_total: number
  variant_title: string | null
}

type Summary = {
  order_count: number
  quantity: number
  revenue: number
  avg_price: number
}

const vnd = (n: number) => n.toLocaleString("vi-VN") + " ₫"

/**
 * Lịch sử bán của riêng sản phẩm này.
 *
 * Giá lấy từ dòng đơn hàng nên là giá khách thực trả hôm đó — sửa giá hôm nay
 * không làm thay đổi số của những lần bán trước.
 */
const ProductSalesWidget = () => {
  const { id } = useParams()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) {
      return
    }
    setLoading(true)
    try {
      const res = (await adminFetch(
        `/admin/custom/product-sales/${id}?limit=50`
      )) as { summary?: Summary; sales?: Sale[] }
      setSummary(res.summary ?? null)
      setSales(res.sales ?? [])
    } catch (e: unknown) {
      toast.error("Không tải được lịch sử bán", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (!id || loading) {
    return null
  }

  return (
    <Container className="divide-y border-t mt-6 pt-6 flex flex-col gap-4">
      <Heading level="h2">Lịch sử bán</Heading>

      {!summary || summary.quantity === 0 ? (
        <Text size="small" className="text-ui-fg-muted">
          Sản phẩm này chưa bán được đơn nào.
        </Text>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">Số đơn</Text>
              <Text className="text-lg font-semibold tabular-nums">{summary.order_count}</Text>
            </div>
            <div>
              <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">Đã bán</Text>
              <Text className="text-lg font-semibold tabular-nums">{summary.quantity}</Text>
            </div>
            <div>
              <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">Doanh thu</Text>
              <Text className="text-lg font-semibold tabular-nums">{vnd(summary.revenue)}</Text>
            </div>
            <div>
              <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">Giá bán TB</Text>
              <Text className="text-lg font-semibold tabular-nums">{vnd(summary.avg_price)}</Text>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ui-border-base text-left">
                  <th className="py-2 pr-3 font-medium text-ui-fg-muted">Ngày</th>
                  <th className="py-2 pr-3 font-medium text-ui-fg-muted">Đơn</th>
                  <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">SL</th>
                  <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">Giá lúc bán</th>
                  <th className="py-2 text-right font-medium text-ui-fg-muted">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s, i) => (
                  <tr
                    key={`${s.order_id}-${i}`}
                    className="border-b border-ui-border-base last:border-0"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-2 pr-3 text-ui-fg-muted">
                      {s.display_id ? `#${s.display_id}` : "—"}
                      {s.variant_title ? ` · ${s.variant_title}` : ""}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.quantity}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{vnd(s.unit_price)}</td>
                    <td className="py-2 text-right tabular-nums">{vnd(s.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "product.details.after" })

export default ProductSalesWidget
