import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { adminFetch } from "../routes/storefront-cms/admin-fetch"

type VariantPricing = {
  id: string
  title: string
  base_amount: number | null
  sale_amount: number | null
  price_list_title: string | null
}

type Draft = { base: string; sale: string }

const vnd = (n: number) => n.toLocaleString("vi-VN") + " ₫"

/**
 * Sửa giá ngay tại trang sản phẩm.
 *
 * Mặc định Medusa để giá gốc ở tab Variants còn giá khuyến mãi ở
 * Settings → Pricing → Price Lists, hai nơi rời nhau rất dễ sửa sót một bên.
 */
const ProductPricingWidget = () => {
  const { id } = useParams()
  const [rows, setRows] = useState<VariantPricing[]>([])
  const [draft, setDraft] = useState<Record<string, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const hydrate = useCallback((list: VariantPricing[]) => {
    setRows(list)
    const d: Record<string, Draft> = {}
    for (const v of list) {
      d[v.id] = {
        base: v.base_amount === null ? "" : String(v.base_amount),
        sale: v.sale_amount === null ? "" : String(v.sale_amount),
      }
    }
    setDraft(d)
  }, [])

  const load = useCallback(async () => {
    if (!id) {
      return
    }
    setLoading(true)
    try {
      const res = (await adminFetch(
        `/admin/custom/product-pricing/${id}`
      )) as { variants?: VariantPricing[] }
      hydrate(res.variants ?? [])
    } catch (e: unknown) {
      toast.error("Không tải được giá", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [id, hydrate])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (!id) {
      return
    }
    setSaving(true)
    try {
      const res = (await adminFetch(`/admin/custom/product-pricing/${id}`, {
        method: "POST",
        body: JSON.stringify({
          variants: rows.map((r) => ({
            id: r.id,
            base_amount: draft[r.id]?.base ?? "",
            sale_amount: draft[r.id]?.sale ?? "",
          })),
        }),
      })) as { variants?: VariantPricing[] }
      hydrate(res.variants ?? [])
      toast.success("Đã lưu giá", {
        description: "Web cập nhật sau khoảng 3 phút, hoặc tải lại trang sản phẩm.",
      })
    } catch (e: unknown) {
      toast.error("Lưu không được", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setSaving(false)
    }
  }

  if (!id || loading) {
    return null
  }

  const discountOf = (r: VariantPricing) => {
    const base = Number(draft[r.id]?.base)
    const sale = Number(draft[r.id]?.sale)
    if (!Number.isFinite(base) || !Number.isFinite(sale) || !base || !sale) {
      return null
    }
    if (sale >= base) {
      return "sai"
    }
    return `-${Math.round(((base - sale) / base) * 100)}%`
  }

  return (
    <Container className="divide-y border-t mt-6 pt-6 flex flex-col gap-4">
      <Heading level="h2">Giá bán & giá gốc</Heading>
      <Text size="small" className="text-ui-fg-muted">
        <strong>Giá gốc</strong> là số bị gạch ngang trên web,{" "}
        <strong>giá bán</strong> là số khách thực trả. Để trống ô giá bán nếu
        không muốn giảm giá — web sẽ chỉ hiện một giá duy nhất. Giá bán bắt buộc
        phải nhỏ hơn giá gốc.
      </Text>

      <div className="flex flex-col gap-4">
        {rows.map((r) => {
          const d = draft[r.id] ?? { base: "", sale: "" }
          const pct = discountOf(r)
          return (
            <div
              key={r.id}
              className="flex flex-col gap-2 rounded-lg border border-ui-border-base p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Text weight="plus" className="text-sm">
                  {r.title || "Phiên bản mặc định"}
                </Text>
                {pct === "sai" ? (
                  <Text className="text-xs text-ui-tag-red-text">
                    giá bán đang lớn hơn hoặc bằng giá gốc
                  </Text>
                ) : pct ? (
                  <Text className="text-xs text-ui-tag-green-text">
                    giảm {pct}
                  </Text>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Text size="small" className="mb-1 text-ui-fg-muted">
                    Giá gốc (gạch ngang)
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    value={d.base}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        [r.id]: { ...d, base: e.target.value },
                      }))
                    }
                  />
                  {d.base && Number.isFinite(Number(d.base)) ? (
                    <Text className="mt-1 text-xs text-ui-fg-muted">
                      {vnd(Number(d.base))}
                    </Text>
                  ) : null}
                </div>
                <div>
                  <Text size="small" className="mb-1 text-ui-fg-muted">
                    Giá bán (khách trả)
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    placeholder="để trống nếu không giảm giá"
                    value={d.sale}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        [r.id]: { ...d, sale: e.target.value },
                      }))
                    }
                  />
                  {d.sale && Number.isFinite(Number(d.sale)) ? (
                    <Text className="mt-1 text-xs text-ui-fg-muted">
                      {vnd(Number(d.sale))}
                      {r.price_list_title ? ` · ${r.price_list_title}` : ""}
                    </Text>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => void save()} isLoading={saving}>
          Lưu giá
        </Button>
        <Button variant="secondary" onClick={() => void load()} disabled={saving}>
          Huỷ thay đổi
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "product.details.after" })

export default ProductPricingWidget
