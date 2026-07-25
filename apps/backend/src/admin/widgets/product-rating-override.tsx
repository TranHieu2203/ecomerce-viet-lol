import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

const ProductRatingOverrideWidget = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [meta, setMeta] = useState<Record<string, unknown>>({})
  const [realAverage, setRealAverage] = useState<number | null>(null)
  const [realCount, setRealCount] = useState(0)
  const [averageInput, setAverageInput] = useState("")
  const [countInput, setCountInput] = useState("")

  useEffect(() => {
    if (!id) {
      return
    }
    void (async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          fetch(`/admin/products/${id}`, { credentials: "include" }),
          fetch(
            `/admin/custom/product-reviews?product_id=${id}&status=approved&limit=200`,
            { credentials: "include" }
          ),
        ])
        const productJson = (await productRes.json()) as {
          product?: { metadata?: Record<string, unknown> }
        }
        const m = productJson.product?.metadata ?? {}
        setMeta(m)
        const override = m.review_override as
          | { average?: number; count?: number }
          | undefined
        if (override?.average !== undefined) {
          setAverageInput(String(override.average))
        }
        if (override?.count !== undefined) {
          setCountInput(String(override.count))
        }

        const reviewsJson = (await reviewsRes.json()) as {
          product_reviews?: { rating: number }[]
        }
        const rows = reviewsJson.product_reviews ?? []
        setRealCount(rows.length)
        setRealAverage(
          rows.length
            ? Math.round(
                (rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10
              ) / 10
            : null
        )
      } catch {
        toast.error("Không tải được dữ liệu đánh giá")
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const save = async () => {
    if (!id) {
      return
    }
    const average = averageInput.trim() ? Number(averageInput) : undefined
    const count = countInput.trim() ? Number(countInput) : undefined
    if (average !== undefined && (Number.isNaN(average) || average < 1 || average > 5)) {
      toast.error("Điểm hiển thị phải từ 1 đến 5")
      return
    }
    if (count !== undefined && (Number.isNaN(count) || count < 0)) {
      toast.error("Số lượng hiển thị không hợp lệ")
      return
    }
    if (average === undefined && count === undefined) {
      toast.error("Nhập ít nhất điểm hoặc số lượng muốn ghi đè")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/admin/products/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          metadata: { ...meta, review_override: { average, count } },
        }),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      toast.success("Đã lưu — site sẽ hiện điểm này thay vì tính tự động")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại")
    } finally {
      setSaving(false)
    }
  }

  const clearOverride = async () => {
    if (!id) {
      return
    }
    setSaving(true)
    try {
      const { review_override: _drop, ...rest } = meta
      const res = await fetch(`/admin/products/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ metadata: rest }),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      setMeta(rest)
      setAverageInput("")
      setCountInput("")
      toast.success("Đã xoá ghi đè — site quay lại tính điểm tự động")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xoá thất bại")
    } finally {
      setSaving(false)
    }
  }

  if (!id || loading) {
    return null
  }

  return (
    <Container className="divide-y border-t mt-6 pt-6 flex flex-col gap-4">
      <Heading level="h2">Ghi đè điểm đánh giá hiển thị</Heading>
      <Text size="small" className="text-ui-fg-muted">
        {realAverage !== null
          ? `Điểm thật tính từ review đã duyệt: ${realAverage}/5 (${realCount} đánh giá).`
          : "Chưa có review nào được duyệt cho sản phẩm này."}{" "}
        Để trống và bấm "Xoá ghi đè" để quay lại tính tự động.
      </Text>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label>Điểm hiển thị (1-5, vd 4.9)</Label>
          <Input
            type="number"
            step="0.1"
            min={1}
            max={5}
            placeholder={realAverage !== null ? String(realAverage) : "vd 4.9"}
            value={averageInput}
            onChange={(e) => setAverageInput(e.target.value)}
          />
        </div>
        <div>
          <Label>Số lượt đánh giá hiển thị (không bắt buộc)</Label>
          <Input
            type="number"
            min={0}
            placeholder={String(realCount)}
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => void save()} isLoading={saving}>
          Lưu ghi đè
        </Button>
        <Button variant="secondary" onClick={() => void clearOverride()} isLoading={saving}>
          Xoá ghi đè
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "product.details.after" })

export default ProductRatingOverrideWidget
