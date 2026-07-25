import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { Star, Trash, PencilSquare, CheckCircleSolid, XCircleSolid, Plus } from "@medusajs/icons"
import { useCallback, useEffect, useState } from "react"
import { adminFetch } from "../storefront-cms/admin-fetch"

type ReviewRow = {
  id: string
  product_id: string
  rating: number
  title: string | null
  comment: string
  customer_name: string
  customer_email: string | null
  status: "pending" | "approved" | "rejected"
  is_seed: boolean
  created_at: string
}

type ProductTitleMap = Record<string, string>

/** Bỏ dấu tiếng Việt để tìm không phân biệt có/không gõ dấu (vd "banh" vẫn khớp "Bánh"). */
function normalizeVi(s: string): string {
  return s
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
}

const STATUS_COLOR: Record<string, "orange" | "green" | "red"> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-ui-tag-orange-icon">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={i < rating ? "" : "opacity-20"} />
      ))}
    </div>
  )
}

const ProductReviewsList = () => {
  const [rows, setRows] = useState<ReviewRow[]>([])
  const [productTitles, setProductTitles] = useState<ProductTitleMap>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [editing, setEditing] = useState<ReviewRow | null>(null)
  const [saving, setSaving] = useState(false)

  const [creating, setCreating] = useState(false)
  const [creatingSaving, setCreatingSaving] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    comment: "",
    customer_name: "",
    customer_email: "",
    status: "approved" as ReviewRow["status"],
  })
  const [productQuery, setProductQuery] = useState("")
  const [allProducts, setAllProducts] = useState<
    { id: string; title: string }[]
  >([])
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    title: string
  } | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = statusFilter === "all" ? "" : `?status=${statusFilter}`
      const res = (await adminFetch(`/admin/custom/product-reviews${qs}`)) as {
        product_reviews?: ReviewRow[]
      }
      const list = res.product_reviews ?? []
      setRows(list)

      const ids = Array.from(new Set(list.map((r) => r.product_id)))
      if (ids.length) {
        const q = ids.map((id) => `id[]=${encodeURIComponent(id)}`).join("&")
        const pRes = (await adminFetch(
          `/admin/products?${q}&fields=id,title&limit=${ids.length}`
        )) as { products?: { id: string; title: string }[] }
        const map: ProductTitleMap = {}
        for (const p of pRes.products ?? []) {
          map[p.id] = p.title
        }
        setProductTitles(map)
      }
    } catch (e: unknown) {
      toast.error("Không tải được", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  // Tải toàn bộ sản phẩm 1 lần rồi lọc ở client — tránh phụ thuộc tìm kiếm
  // có dấu chính xác của backend (gõ không dấu vẫn tìm được, vd "banh" -> "Bánh").
  useEffect(() => {
    if (!creating || allProducts.length > 0) {
      return
    }
    setLoadingProducts(true)
    adminFetch(`/admin/products?limit=1000&fields=id,title`)
      .then((res) => {
        const list =
          (res as { products?: { id: string; title: string }[] }).products ??
          []
        setAllProducts(list)
      })
      .catch(() => setAllProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [creating, allProducts.length])

  const productResults = (() => {
    const q = normalizeVi(productQuery)
    if (!q) {
      return []
    }
    return allProducts
      .filter((p) => normalizeVi(p.title).includes(q))
      .slice(0, 15)
  })()

  const openCreate = () => {
    setSelectedProduct(null)
    setProductQuery("")
    setNewReview({
      rating: 5,
      title: "",
      comment: "",
      customer_name: "",
      customer_email: "",
      status: "approved",
    })
    setCreating(true)
  }

  const saveNew = async () => {
    if (!selectedProduct) {
      toast.error("Chưa chọn sản phẩm")
      return
    }
    if (!newReview.comment.trim() || !newReview.customer_name.trim()) {
      toast.error("Thiếu thông tin", {
        description: "Cần nhập nội dung và tên khách hàng",
      })
      return
    }
    setCreatingSaving(true)
    try {
      await adminFetch(`/admin/custom/product-reviews`, {
        method: "POST",
        body: JSON.stringify({
          product_id: selectedProduct.id,
          rating: newReview.rating,
          title: newReview.title.trim() || null,
          comment: newReview.comment.trim(),
          customer_name: newReview.customer_name.trim(),
          customer_email: newReview.customer_email.trim() || undefined,
          status: newReview.status,
        }),
      })
      toast.success("Đã tạo đánh giá")
      setCreating(false)
      void load()
    } catch (e: unknown) {
      toast.error("Lỗi", { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setCreatingSaving(false)
    }
  }

  const updateStatus = async (row: ReviewRow, status: string) => {
    try {
      await adminFetch(`/admin/custom/product-reviews/${row.id}`, {
        method: "POST",
        body: JSON.stringify({ status }),
      })
      toast.success(
        status === "approved" ? "Đã duyệt" : status === "rejected" ? "Đã từ chối" : "Đã cập nhật"
      )
      void load()
    } catch (e: unknown) {
      toast.error("Lỗi", { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const remove = async (row: ReviewRow) => {
    if (!window.confirm(`Xoá đánh giá của "${row.customer_name}"?`)) {
      return
    }
    try {
      await adminFetch(`/admin/custom/product-reviews/${row.id}`, {
        method: "DELETE",
      })
      toast.success("Đã xoá")
      void load()
    } catch (e: unknown) {
      toast.error("Lỗi", { description: e instanceof Error ? e.message : String(e) })
    }
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await adminFetch(`/admin/custom/product-reviews/${editing.id}`, {
        method: "POST",
        body: JSON.stringify({
          rating: editing.rating,
          title: editing.title,
          comment: editing.comment,
          customer_name: editing.customer_name,
          status: editing.status,
        }),
      })
      toast.success("Đã lưu")
      setEditing(null)
      void load()
    } catch (e: unknown) {
      toast.error("Lỗi", { description: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="p-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading className="mb-1">Đánh giá sản phẩm</Heading>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <Select.Trigger className="w-48">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="pending">Chờ duyệt</Select.Item>
              <Select.Item value="approved">Đã duyệt</Select.Item>
              <Select.Item value="rejected">Từ chối</Select.Item>
              <Select.Item value="all">Tất cả</Select.Item>
            </Select.Content>
          </Select>
          <Button size="small" onClick={openCreate}>
            <Plus /> Thêm đánh giá mới
          </Button>
        </div>
      </div>

      {loading ? (
        <Text>Đang tải…</Text>
      ) : rows.length === 0 ? (
        <Text className="text-ui-fg-muted">Không có đánh giá nào.</Text>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 border border-ui-border-base rounded-lg p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Text weight="plus" className="text-sm">
                    {productTitles[r.product_id] ?? r.product_id}
                  </Text>
                  <Badge color={STATUS_COLOR[r.status]}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                  {r.is_seed ? <Badge color="grey">Giả lập</Badge> : null}
                </div>
                <div className="flex items-center gap-1">
                  {r.status !== "approved" ? (
                    <Button
                      size="small"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      title="Duyệt"
                      onClick={() => updateStatus(r, "approved")}
                    >
                      <CheckCircleSolid className="text-ui-tag-green-icon" />
                    </Button>
                  ) : null}
                  {r.status !== "rejected" ? (
                    <Button
                      size="small"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      title="Từ chối"
                      onClick={() => updateStatus(r, "rejected")}
                    >
                      <XCircleSolid className="text-ui-tag-red-icon" />
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    title="Sửa"
                    onClick={() => setEditing(r)}
                  >
                    <PencilSquare />
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    title="Xoá"
                    onClick={() => remove(r)}
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
              <Stars rating={r.rating} />
              {r.title ? (
                <Text weight="plus" className="text-sm">
                  {r.title}
                </Text>
              ) : null}
              <Text className="text-sm text-ui-fg-subtle">{r.comment}</Text>
              <Text className="text-xs text-ui-fg-muted">
                {r.customer_name}
                {r.customer_email ? ` · ${r.customer_email}` : ""} ·{" "}
                {new Date(r.created_at).toLocaleDateString("vi-VN")}
              </Text>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Sửa đánh giá</Drawer.Title>
          </Drawer.Header>
          {editing ? (
            <Drawer.Body className="flex flex-col gap-4">
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Số sao (1-5)
                </Text>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={editing.rating}
                  onChange={(e) =>
                    setEditing({ ...editing, rating: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Tiêu đề
                </Text>
                <Input
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Nội dung
                </Text>
                <Textarea
                  rows={5}
                  value={editing.comment}
                  onChange={(e) =>
                    setEditing({ ...editing, comment: e.target.value })
                  }
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Tên khách hàng
                </Text>
                <Input
                  value={editing.customer_name}
                  onChange={(e) =>
                    setEditing({ ...editing, customer_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Text size="small" weight="plus" className="mb-1">
                  Trạng thái
                </Text>
                <Select
                  value={editing.status}
                  onValueChange={(v) =>
                    setEditing({ ...editing, status: v as ReviewRow["status"] })
                  }
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="pending">Chờ duyệt</Select.Item>
                    <Select.Item value="approved">Đã duyệt</Select.Item>
                    <Select.Item value="rejected">Từ chối</Select.Item>
                  </Select.Content>
                </Select>
              </div>
            </Drawer.Body>
          ) : null}
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">Huỷ</Button>
            </Drawer.Close>
            <Button onClick={saveEdit} isLoading={saving}>
              Lưu
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      <Drawer open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Thêm đánh giá mới</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Sản phẩm
              </Text>
              {selectedProduct ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-ui-border-base p-2">
                  <Text className="text-sm">{selectedProduct.title}</Text>
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() => {
                      setSelectedProduct(null)
                      setProductQuery("")
                    }}
                  >
                    Đổi
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Input
                    placeholder="Gõ tên sản phẩm để tìm..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                  />
                  {loadingProducts ? (
                    <Text className="text-xs text-ui-fg-muted">Đang tải danh sách sản phẩm…</Text>
                  ) : productResults.length > 0 ? (
                    <ul className="flex flex-col border border-ui-border-base rounded-md overflow-hidden">
                      {productResults.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-ui-bg-subtle"
                            onClick={() => {
                              setSelectedProduct(p)
                            }}
                          >
                            {p.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Số sao (1-5)
              </Text>
              <Input
                type="number"
                min={1}
                max={5}
                value={newReview.rating}
                onChange={(e) =>
                  setNewReview({ ...newReview, rating: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Tiêu đề
              </Text>
              <Input
                value={newReview.title}
                onChange={(e) =>
                  setNewReview({ ...newReview, title: e.target.value })
                }
              />
            </div>
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Nội dung
              </Text>
              <Textarea
                rows={5}
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview({ ...newReview, comment: e.target.value })
                }
              />
            </div>
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Tên khách hàng
              </Text>
              <Input
                value={newReview.customer_name}
                onChange={(e) =>
                  setNewReview({ ...newReview, customer_name: e.target.value })
                }
              />
            </div>
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Email khách hàng (không bắt buộc)
              </Text>
              <Input
                value={newReview.customer_email}
                onChange={(e) =>
                  setNewReview({ ...newReview, customer_email: e.target.value })
                }
              />
            </div>
            <div>
              <Text size="small" weight="plus" className="mb-1">
                Trạng thái
              </Text>
              <Select
                value={newReview.status}
                onValueChange={(v) =>
                  setNewReview({ ...newReview, status: v as ReviewRow["status"] })
                }
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="pending">Chờ duyệt</Select.Item>
                  <Select.Item value="approved">Đã duyệt</Select.Item>
                  <Select.Item value="rejected">Từ chối</Select.Item>
                </Select.Content>
              </Select>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">Huỷ</Button>
            </Drawer.Close>
            <Button onClick={saveNew} isLoading={creatingSaving}>
              Tạo đánh giá
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Đánh giá sản phẩm",
  rank: 45,
})

export default ProductReviewsList
