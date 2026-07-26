import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Select, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { adminFetch } from "../storefront-cms/admin-fetch"

/**
 * Màu cột biểu đồ. Vàng thương hiệu (#B8944F) quá nhạt màu để làm mark —
 * kiểm tra bằng validator cho kết quả "đọc như xám" và tương phản 2.77 < 3:1.
 * Hai tông dưới đây cùng họ vàng nhưng đạt toàn bộ kiểm tra: dải sáng OKLCH,
 * sàn độ rực, và tương phản >= 3:1 với nền của từng chế độ.
 */
const BAR_LIGHT = "#9A6B00"
const BAR_DARK = "#C08A1E"

type Summary = {
  revenue: number
  order_count: number
  units_sold: number
  avg_order_value: number
}
type DayRow = { date: string; revenue: number; orders: number }
type ProductRow = {
  product_id: string
  title: string
  quantity: number
  revenue: number
}

const vnd = (n: number) => n.toLocaleString("vi-VN") + " ₫"
const dayLabel = (d: string) => {
  const [, m, day] = d.split("-")
  return `${day}/${m}`
}

function useIsDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.classList.contains("dark"))
    check()
    const mo = new MutationObserver(check)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => mo.disconnect()
  }, [])
  return dark
}

/** Ô số liệu tổng quan — số là thông tin chính nên cho cỡ lớn, nhãn nhỏ phía trên. */
function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ui-border-base p-4">
      <Text className="text-xs uppercase tracking-wide text-ui-fg-muted">
        {label}
      </Text>
      <Text className="mt-1 text-2xl font-semibold tabular-nums">{value}</Text>
    </div>
  )
}

const SalesReportPage = () => {
  const isDark = useIsDark()
  const bar = isDark ? BAR_DARK : BAR_LIGHT

  const [days, setDays] = useState("30")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byDay, setByDay] = useState<DayRow[]>([])
  const [top, setTop] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [hover, setHover] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await adminFetch(
        `/admin/custom/sales/report?days=${days}`
      )) as {
        summary?: Summary
        by_day?: DayRow[]
        top_products?: ProductRow[]
      }
      setSummary(res.summary ?? null)
      setByDay(res.by_day ?? [])
      setTop(res.top_products ?? [])
    } catch (e: unknown) {
      toast.error("Không tải được báo cáo", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    void load()
  }, [load])

  const maxRevenue = Math.max(1, ...byDay.map((d) => d.revenue))
  const maxProduct = Math.max(1, ...top.map((p) => p.revenue))

  return (
    <Container className="flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading className="mb-1">Báo cáo doanh thu</Heading>
          <Text className="text-sm text-ui-fg-subtle">
            Tính theo giá khách thực trả tại thời điểm mua, nên đổi giá sản phẩm
            sau này không làm sai lệch số liệu cũ. Không tính đơn đã huỷ.
          </Text>
        </div>
        <Select value={days} onValueChange={setDays}>
          <Select.Trigger className="w-44">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="7">7 ngày qua</Select.Item>
            <Select.Item value="30">30 ngày qua</Select.Item>
            <Select.Item value="90">90 ngày qua</Select.Item>
            <Select.Item value="365">1 năm qua</Select.Item>
          </Select.Content>
        </Select>
      </div>

      {loading ? (
        <Text>Đang tải…</Text>
      ) : !summary || summary.order_count === 0 ? (
        <Text className="text-ui-fg-muted">
          Chưa có đơn hàng nào trong khoảng thời gian này.
        </Text>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Doanh thu" value={vnd(summary.revenue)} />
            <Kpi label="Số đơn" value={summary.order_count.toLocaleString("vi-VN")} />
            <Kpi label="Số món bán ra" value={summary.units_sold.toLocaleString("vi-VN")} />
            <Kpi label="Trung bình mỗi đơn" value={vnd(summary.avg_order_value)} />
          </div>

          <div className="flex flex-col gap-3">
            <Heading level="h2" className="text-base">
              Doanh thu theo ngày
            </Heading>
            <div className="flex items-end gap-[2px] overflow-x-auto pb-1" style={{ height: 180 }}>
              {byDay.map((d) => {
                const h = Math.max(2, Math.round((d.revenue / maxRevenue) * 150))
                const on = hover === d.date
                return (
                  <div
                    key={d.date}
                    className="flex min-w-[26px] flex-1 flex-col items-center justify-end gap-1"
                    onMouseEnter={() => setHover(d.date)}
                    onMouseLeave={() => setHover(null)}
                  >
                    {on ? (
                      <div className="whitespace-nowrap rounded-md border border-ui-border-base bg-ui-bg-base px-2 py-1 text-xs shadow-sm">
                        <div className="font-medium tabular-nums">{vnd(d.revenue)}</div>
                        <div className="text-ui-fg-muted">{d.orders} đơn</div>
                      </div>
                    ) : null}
                    <div
                      style={{
                        height: h,
                        background: bar,
                        opacity: on ? 1 : 0.85,
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }}
                      className="w-full"
                    />
                    <Text className="text-[10px] tabular-nums text-ui-fg-muted">
                      {dayLabel(d.date)}
                    </Text>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Heading level="h2" className="text-base">
              Sản phẩm bán chạy
            </Heading>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ui-border-base text-left">
                    <th className="py-2 pr-3 font-medium text-ui-fg-muted">Sản phẩm</th>
                    <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">Số lượng</th>
                    <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">Doanh thu</th>
                    <th className="py-2 w-1/3 font-medium text-ui-fg-muted">Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((p) => (
                    <tr key={p.product_id} className="border-b border-ui-border-base last:border-0">
                      <td className="py-2 pr-3">{p.title}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {p.quantity.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{vnd(p.revenue)}</td>
                      <td className="py-2">
                        <div
                          style={{
                            width: `${Math.max(2, (p.revenue / maxProduct) * 100)}%`,
                            background: bar,
                            height: 8,
                            borderRadius: 4,
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Báo cáo doanh thu",
  rank: 40,
})

export default SalesReportPage
