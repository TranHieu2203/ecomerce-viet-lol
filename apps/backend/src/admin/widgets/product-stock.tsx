import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Button,
  Checkbox,
  Container,
  Heading,
  Input,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { adminFetch } from "../routes/storefront-cms/admin-fetch"

type Level = {
  location_id: string
  location_name: string
  stocked_quantity: number
  reserved_quantity: number
}
type VariantStock = {
  variant_id: string
  variant_title: string | null
  sku: string | null
  manage_inventory: boolean
  inventory_item_id: string | null
  levels: Level[]
}
type Movement = {
  id: string
  type: "nhap" | "xuat" | "dieu_chinh"
  quantity: number
  balance_after: number
  note: string | null
  location_name: string | null
  variant_title: string | null
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  nhap: "Nhập kho",
  xuat: "Xuất kho",
  dieu_chinh: "Điều chỉnh",
}

/**
 * Kho của riêng sản phẩm này: xem tồn, nhập/xuất/kiểm kê, và sổ biến động.
 *
 * Medusa mặc định chỉ cho sửa thẳng số tồn, không lưu vết. Ở đây mọi thay đổi
 * đều đi qua sổ kho nên luôn truy lại được ai làm, lúc nào, vì sao.
 */
const ProductStockWidget = () => {
  const { id } = useParams()
  const [variants, setVariants] = useState<VariantStock[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    variant_id: "",
    location_id: "",
    type: "nhap",
    quantity: "",
    note: "",
  })

  const load = useCallback(async () => {
    if (!id) {
      return
    }
    setLoading(true)
    try {
      const [stock, hist] = await Promise.all([
        adminFetch(`/admin/custom/inventory/product/${id}`) as Promise<{
          variants?: VariantStock[]
        }>,
        adminFetch(
          `/admin/custom/inventory/movements?product_id=${id}&limit=50`
        ).catch(() => ({ movements: [] })) as Promise<{ movements?: Movement[] }>,
      ])
      const vs = stock.variants ?? []
      setVariants(vs)
      setMovements(hist.movements ?? [])

      const first = vs.find((v) => v.levels.length > 0)
      setForm((f) => ({
        ...f,
        variant_id: f.variant_id || first?.variant_id || "",
        location_id: f.location_id || first?.levels[0]?.location_id || "",
      }))
    } catch (e: unknown) {
      toast.error("Không tải được tồn kho", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const toggleManage = async (v: VariantStock, next: boolean) => {
    setBusy(true)
    try {
      await adminFetch(`/admin/custom/inventory/manage/${v.variant_id}`, {
        method: "POST",
        body: JSON.stringify({ manage_inventory: next }),
      })
      toast.success(next ? "Đã bật quản lý tồn" : "Đã tắt quản lý tồn", {
        description: next
          ? "Bán sẽ trừ kho; hết hàng web sẽ báo hết."
          : "Web sẽ không bao giờ báo hết hàng cho phiên bản này.",
      })
      await load()
    } catch (e: unknown) {
      toast.error("Không đổi được", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    const v = variants.find((x) => x.variant_id === form.variant_id)
    if (!v?.inventory_item_id || !form.location_id) {
      toast.error("Chọn phiên bản và kho trước")
      return
    }
    if (!form.quantity.trim()) {
      toast.error("Nhập số lượng")
      return
    }
    setBusy(true)
    try {
      const res = (await adminFetch(`/admin/custom/inventory/movement`, {
        method: "POST",
        body: JSON.stringify({
          inventory_item_id: v.inventory_item_id,
          location_id: form.location_id,
          type: form.type,
          quantity: Number(form.quantity),
          note: form.note.trim() || null,
        }),
      })) as { stocked_quantity_before: number; stocked_quantity_after: number }
      toast.success("Đã ghi sổ kho", {
        description: `Tồn: ${res.stocked_quantity_before} → ${res.stocked_quantity_after}`,
      })
      setForm((f) => ({ ...f, quantity: "", note: "" }))
      await load()
    } catch (e: unknown) {
      toast.error("Không ghi được", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusy(false)
    }
  }

  if (!id || loading) {
    return null
  }

  const selected = variants.find((v) => v.variant_id === form.variant_id)

  return (
    <Container className="divide-y border-t mt-6 pt-6 flex flex-col gap-4">
      <Heading level="h2">Kho hàng</Heading>

      <div className="flex flex-col gap-2">
        {variants.map((v) => (
          <div
            key={v.variant_id}
            className="flex flex-col gap-2 rounded-lg border border-ui-border-base p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Text weight="plus" className="text-sm">
                  {v.variant_title || "Phiên bản mặc định"}
                </Text>
                {v.sku ? (
                  <Text className="text-xs text-ui-fg-muted">{v.sku}</Text>
                ) : null}
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={v.manage_inventory}
                  disabled={busy}
                  onCheckedChange={(c) => void toggleManage(v, c === true)}
                />
                <Text className="text-xs">Quản lý tồn kho</Text>
              </label>
            </div>

            {!v.manage_inventory ? (
              <Text className="text-xs text-ui-fg-muted">
                Chưa quản lý tồn — bán bao nhiêu cũng được, web không bao giờ
                báo hết hàng.
              </Text>
            ) : v.levels.length === 0 ? (
              <Text className="text-xs text-ui-fg-muted">
                Chưa có dòng tồn ở kho nào.
              </Text>
            ) : (
              <div className="flex flex-wrap gap-3">
                {v.levels.map((l) => (
                  <div
                    key={l.location_id}
                    className="rounded-md border border-ui-border-base px-3 py-1.5"
                  >
                    <Text className="text-xs text-ui-fg-muted">
                      {l.location_name}
                    </Text>
                    <Text className="text-base font-semibold tabular-nums">
                      {l.stocked_quantity.toLocaleString("vi-VN")}
                    </Text>
                    {l.reserved_quantity > 0 ? (
                      <Text className="text-xs text-ui-fg-muted">
                        giữ chỗ {l.reserved_quantity}
                      </Text>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-ui-border-base p-3">
        <Text weight="plus" className="text-sm">
          Nhập / xuất / kiểm kê
        </Text>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          <Select
            value={form.variant_id}
            onValueChange={(v) => setForm((f) => ({ ...f, variant_id: v }))}
          >
            <Select.Trigger>
              <Select.Value placeholder="Phiên bản" />
            </Select.Trigger>
            <Select.Content>
              {variants
                .filter((v) => v.inventory_item_id)
                .map((v) => (
                  <Select.Item key={v.variant_id} value={v.variant_id}>
                    {v.variant_title || "Mặc định"}
                  </Select.Item>
                ))}
            </Select.Content>
          </Select>

          <Select
            value={form.location_id}
            onValueChange={(v) => setForm((f) => ({ ...f, location_id: v }))}
          >
            <Select.Trigger>
              <Select.Value placeholder="Kho" />
            </Select.Trigger>
            <Select.Content>
              {(selected?.levels ?? []).map((l) => (
                <Select.Item key={l.location_id} value={l.location_id}>
                  {l.location_name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>

          <Select
            value={form.type}
            onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="nhap">Nhập kho</Select.Item>
              <Select.Item value="xuat">Xuất kho</Select.Item>
              <Select.Item value="dieu_chinh">Kiểm kê</Select.Item>
            </Select.Content>
          </Select>

          <Input
            type="number"
            min={0}
            placeholder={form.type === "dieu_chinh" ? "Số đếm được" : "Số lượng"}
            value={form.quantity}
            onChange={(e) =>
              setForm((f) => ({ ...f, quantity: e.target.value }))
            }
          />

          <Input
            placeholder="Ghi chú"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>
        <div>
          <Button size="small" onClick={() => void submit()} isLoading={busy}>
            Ghi sổ
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Text weight="plus" className="text-sm">
          Lịch sử xuất nhập ({movements.length})
        </Text>
        {movements.length === 0 ? (
          <Text size="small" className="text-ui-fg-muted">
            Chưa có biến động nào. Sổ chỉ ghi từ lúc bật tính năng này.
          </Text>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ui-border-base text-left">
                  <th className="py-2 pr-3 font-medium text-ui-fg-muted">Ngày</th>
                  <th className="py-2 pr-3 font-medium text-ui-fg-muted">Loại</th>
                  <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">
                    Thay đổi
                  </th>
                  <th className="py-2 pr-3 text-right font-medium text-ui-fg-muted">
                    Còn lại
                  </th>
                  <th className="py-2 font-medium text-ui-fg-muted">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-ui-border-base last:border-0"
                  >
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(m.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2 pr-3">{TYPE_LABEL[m.type] ?? m.type}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {m.balance_after.toLocaleString("vi-VN")}
                    </td>
                    <td className="py-2 text-ui-fg-muted">{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "product.details.after" })

export default ProductStockWidget
