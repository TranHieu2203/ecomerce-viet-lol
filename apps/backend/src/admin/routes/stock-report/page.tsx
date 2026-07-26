import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Select, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { adminFetch } from "../storefront-cms/admin-fetch"

type Row = {
  inventory_item_id: string
  title: string
  sku: string | null
  opening: number | null
  in_qty: number
  out_qty: number
  adjust_qty: number
  sold_qty: number
  closing: number
}

const n = (v: number) => v.toLocaleString("vi-VN")

const StockReportPage = () => {
  const [days, setDays] = useState("30")
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await adminFetch(
        `/admin/custom/inventory/stock-report?days=${days}`
      )) as { rows?: Row[] }
      setRows(res.rows ?? [])
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

  const total = rows.reduce(
    (a, r) => ({
      in_qty: a.in_qty + r.in_qty,
      out_qty: a.out_qty + r.out_qty,
      sold_qty: a.sold_qty + r.sold_qty,
      closing: a.closing + r.closing,
    }),
    { in_qty: 0, out_qty: 0, sold_qty: 0, closing: 0 }
  )

  return (
    <Container className="flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading className="mb-1">Báo cáo xuất nhập tồn</Heading>
          <Text className="text-sm text-ui-fg-subtle">
            Tồn đầu kỳ lấy từ số đã ghi trong sổ tại thời điểm đó nên chính xác
            tuyệt đối. Mặt hàng chưa từng có biến động trước kỳ thì để trống,
            không suy đoán.
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
      ) : rows.length === 0 ? (
        <Text className="text-ui-fg-muted">
          Chưa có biến động kho nào được ghi sổ. Vào trang sản phẩm, mục “Kho
          hàng” để nhập kho hoặc kiểm kê.
        </Text>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ui-border-base text-left">
                <th className="py-2 pr-3 font-medium text-ui-fg-muted">Mặt hàng</th>
                <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">Tồn đầu</th>
                <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">Nhập</th>
                <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">Xuất</th>
                <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">Kiểm kê</th>
                <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">Đã bán</th>
                <th className="py-2 text-right font-medium text-ui-fg-muted">Tồn hiện tại</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.inventory_item_id}
                  className="border-b border-ui-border-base last:border-0"
                >
                  <td className="py-2 pr-3">
                    {r.title}
                    {r.sku ? (
                      <span className="ml-2 text-xs text-ui-fg-muted">{r.sku}</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ui-fg-muted">
                    {r.opening === null ? "—" : n(r.opening)}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.in_qty ? `+${n(r.in_qty)}` : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.out_qty ? `−${n(r.out_qty)}` : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.adjust_qty ? n(r.adjust_qty) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {r.sold_qty ? n(r.sold_qty) : "—"}
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums">
                    {n(r.closing)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-ui-border-base font-medium">
                <td className="py-2 pr-3">Tổng</td>
                <td className="py-2 pr-3" />
                <td className="py-2 pr-3 text-right tabular-nums">+{n(total.in_qty)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">−{n(total.out_qty)}</td>
                <td className="py-2 pr-3" />
                <td className="py-2 pr-3 text-right tabular-nums">{n(total.sold_qty)}</td>
                <td className="py-2 text-right tabular-nums">{n(total.closing)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <Text size="small" className="text-ui-fg-muted">
        Cột “Đã bán” đếm từ đơn hàng. Medusa chỉ trừ kho khi giao hàng, nên nếu
        còn đơn chưa giao thì số đã bán sẽ lớn hơn phần kho thực bị trừ.
      </Text>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Xuất nhập tồn",
  rank: 41,
})

export default StockReportPage
