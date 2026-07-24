import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { ArrowLeft, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CmsCollapsibleSection } from "../../components/cms-collapsible-section"
import { adminFetch } from "../storefront-cms/admin-fetch"

type Cat = {
  id: string
  slug: string
  title_i18n: Record<string, string>
  parent_id: string | null
}

type Tag = {
  id: string
  slug: string
  title_i18n: Record<string, string>
}

export default function CmsNewsTaxonomyPage() {
  const [categories, setCategories] = useState<Cat[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [catSlug, setCatSlug] = useState("")
  const [catVi, setCatVi] = useState("")
  const [catEn, setCatEn] = useState("")
  const [catParent, setCatParent] = useState("")
  const [tagSlug, setTagSlug] = useState("")
  const [tagVi, setTagVi] = useState("")
  const [tagEn, setTagEn] = useState("")

  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatSlug, setEditCatSlug] = useState("")
  const [editCatVi, setEditCatVi] = useState("")
  const [editCatEn, setEditCatEn] = useState("")
  const [editCatParent, setEditCatParent] = useState("")

  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editTagSlug, setEditTagSlug] = useState("")
  const [editTagVi, setEditTagVi] = useState("")
  const [editTagEn, setEditTagEn] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, t] = await Promise.all([
        adminFetch("/admin/custom/cms-news-categories") as Promise<{
          categories?: Cat[]
        }>,
        adminFetch("/admin/custom/cms-news-tags") as Promise<{ tags?: Tag[] }>,
      ])
      setCategories(c.categories ?? [])
      setTags(t.tags ?? [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không tải được")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const addCategory = async () => {
    const slug = catSlug.trim()
    if (!slug || !catVi.trim()) {
      toast.error("Slug và tiêu đề (vi) là bắt buộc")
      return
    }
    try {
      await adminFetch("/admin/custom/cms-news-categories", {
        method: "POST",
        body: JSON.stringify({
          slug,
          title: { vi: catVi.trim(), en: catEn.trim() || catVi.trim() },
          ...(catParent.trim() ? { parent_id: catParent.trim() } : {}),
        }),
      })
      toast.success("Đã tạo chủ đề")
      setCatSlug("")
      setCatVi("")
      setCatEn("")
      setCatParent("")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo chủ đề")
    }
  }

  const addTag = async () => {
    const slug = tagSlug.trim()
    if (!slug || !tagVi.trim()) {
      toast.error("Slug và tiêu đề (vi) là bắt buộc")
      return
    }
    try {
      await adminFetch("/admin/custom/cms-news-tags", {
        method: "POST",
        body: JSON.stringify({
          slug,
          title: { vi: tagVi.trim(), en: tagEn.trim() || tagVi.trim() },
        }),
      })
      toast.success("Đã tạo nhãn")
      setTagSlug("")
      setTagVi("")
      setTagEn("")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo nhãn")
    }
  }

  const startEditCategory = (c: Cat) => {
    setEditingCatId(c.id)
    setEditCatSlug(c.slug)
    setEditCatVi(c.title_i18n?.vi ?? "")
    setEditCatEn(c.title_i18n?.en ?? "")
    setEditCatParent(c.parent_id ?? "")
  }

  const cancelEditCategory = () => {
    setEditingCatId(null)
  }

  const saveEditCategory = async () => {
    if (!editingCatId) {
      return
    }
    const slug = editCatSlug.trim()
    if (!slug || !editCatVi.trim()) {
      toast.error("Slug và tiêu đề (vi) là bắt buộc")
      return
    }
    try {
      await adminFetch(`/admin/custom/cms-news-categories/${editingCatId}`, {
        method: "PATCH",
        body: JSON.stringify({
          slug,
          title: { vi: editCatVi.trim(), en: editCatEn.trim() || editCatVi.trim() },
          parent_id: editCatParent.trim() || null,
        }),
      })
      toast.success("Đã lưu")
      setEditingCatId(null)
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại")
    }
  }

  const startEditTag = (t: Tag) => {
    setEditingTagId(t.id)
    setEditTagSlug(t.slug)
    setEditTagVi(t.title_i18n?.vi ?? "")
    setEditTagEn(t.title_i18n?.en ?? "")
  }

  const cancelEditTag = () => {
    setEditingTagId(null)
  }

  const saveEditTag = async () => {
    if (!editingTagId) {
      return
    }
    const slug = editTagSlug.trim()
    if (!slug || !editTagVi.trim()) {
      toast.error("Slug và tiêu đề (vi) là bắt buộc")
      return
    }
    try {
      await adminFetch(`/admin/custom/cms-news-tags/${editingTagId}`, {
        method: "PATCH",
        body: JSON.stringify({
          slug,
          title: { vi: editTagVi.trim(), en: editTagEn.trim() || editTagVi.trim() },
        }),
      })
      toast.success("Đã lưu")
      setEditingTagId(null)
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại")
    }
  }

  const removeCategory = async (id: string) => {
    if (!confirm("Xóa chủ đề này? (Không được có chủ đề con)")) {
      return
    }
    try {
      await adminFetch(`/admin/custom/cms-news-categories/${id}`, {
        method: "DELETE",
      })
      toast.success("Đã xóa")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không xóa được")
    }
  }

  const removeTag = async (id: string) => {
    if (!confirm("Xóa nhãn này?")) {
      return
    }
    try {
      await adminFetch(`/admin/custom/cms-news-tags/${id}`, {
        method: "DELETE",
      })
      toast.success("Đã xóa")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không xóa được")
    }
  }

  const parentLabel = (pid: string | null) => {
    if (!pid) {
      return "—"
    }
    const p = categories.find((c) => c.id === pid)
    return p?.slug ?? pid.slice(0, 8)
  }

  return (
    <Container className="p-8 flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading className="mb-1">Tin tức — Chủ đề &amp; nhãn</Heading>
          
        </div>
        <Button
          size="small"
          variant="secondary"
          className="h-9 w-9 shrink-0 p-0"
          asChild
          title="Danh sách tin"
        >
          <Link to="../cms-news" aria-label="Danh sách tin">
            <ArrowLeft className="size-4" strokeWidth={2} />
          </Link>
        </Button>
      </div>

      {loading ? <Text>Đang tải…</Text> : null}

      <CmsCollapsibleSection
        defaultOpen
        summary={
          <Heading level="h2" className="text-base">
            Chủ đề (category)
          </Heading>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Slug</Label>
            <Input
              className="font-mono"
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
              placeholder="san-pham"
            />
          </div>
          <div>
            <Label>Chủ đề cha (tùy chọn)</Label>
            <select
              className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-2 text-sm"
              value={catParent}
              onChange={(e) => setCatParent(e.target.value)}
            >
              <option value="">— Gốc —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.slug} ({c.title_i18n?.vi ?? ""})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tiêu đề (vi)</Label>
            <Input value={catVi} onChange={(e) => setCatVi(e.target.value)} />
          </div>
          <div>
            <Label>Tiêu đề (en)</Label>
            <Input value={catEn} onChange={(e) => setCatEn(e.target.value)} />
          </div>
        </div>
        <Button
          type="button"
          className="h-9 w-9 p-0"
          title="Thêm chủ đề"
          aria-label="Thêm chủ đề"
          onClick={() => void addCategory()}
        >
          <Plus className="size-4" strokeWidth={2} />
        </Button>
        <ul className="flex flex-col gap-2 border-t border-ui-border-base pt-3">
          {categories.map((c) =>
            editingCatId === c.id ? (
              <li
                key={c.id}
                className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-ui-border-base rounded-md p-3"
              >
                <div>
                  <Label>Slug</Label>
                  <Input
                    className="font-mono"
                    value={editCatSlug}
                    onChange={(e) => setEditCatSlug(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Chủ đề cha (tùy chọn)</Label>
                  <select
                    className="w-full rounded-md border border-ui-border-base bg-ui-bg-field px-2 py-2 text-sm"
                    value={editCatParent}
                    onChange={(e) => setEditCatParent(e.target.value)}
                  >
                    <option value="">— Gốc —</option>
                    {categories
                      .filter((opt) => opt.id !== c.id)
                      .map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.slug} ({opt.title_i18n?.vi ?? ""})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label>Tiêu đề (vi)</Label>
                  <Input
                    value={editCatVi}
                    onChange={(e) => setEditCatVi(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tiêu đề (en)</Label>
                  <Input
                    value={editCatEn}
                    onChange={(e) => setEditCatEn(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <Button
                    type="button"
                    className="h-9 w-9 p-0"
                    title="Lưu"
                    aria-label="Lưu"
                    onClick={() => void saveEditCategory()}
                  >
                    <Save className="size-4" strokeWidth={2} />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 w-9 p-0"
                    title="Hủy"
                    aria-label="Hủy"
                    onClick={cancelEditCategory}
                  >
                    <X className="size-4" strokeWidth={2} />
                  </Button>
                </div>
              </li>
            ) : (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 text-small"
              >
                <span>
                  <span className="font-mono text-ui-fg-muted">{c.slug}</span>
                  {" · "}
                  {c.title_i18n?.vi ?? c.title_i18n?.en}
                  {" · "}
                  <span className="text-ui-fg-muted">cha: {parentLabel(c.parent_id)}</span>
                </span>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="small"
                    variant="secondary"
                    type="button"
                    className="h-8 w-8 p-0"
                    title="Sửa chủ đề"
                    aria-label="Sửa chủ đề"
                    onClick={() => startEditCategory(c)}
                  >
                    <Pencil className="size-4" strokeWidth={2} />
                  </Button>
                  <Button
                    size="small"
                    variant="danger"
                    type="button"
                    className="h-8 w-8 p-0"
                    title="Xóa chủ đề"
                    aria-label="Xóa chủ đề"
                    onClick={() => void removeCategory(c.id)}
                  >
                    <Trash2 className="size-4" strokeWidth={2} />
                  </Button>
                </div>
              </li>
            )
          )}
        </ul>
      </CmsCollapsibleSection>

      <CmsCollapsibleSection
        defaultOpen={false}
        summary={
          <Heading level="h2" className="text-base">
            Nhãn (tags)
          </Heading>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Slug</Label>
            <Input
              className="font-mono"
              value={tagSlug}
              onChange={(e) => setTagSlug(e.target.value)}
            />
          </div>
          <div>
            <Label>Tiêu đề (vi)</Label>
            <Input value={tagVi} onChange={(e) => setTagVi(e.target.value)} />
          </div>
          <div>
            <Label>Tiêu đề (en)</Label>
            <Input value={tagEn} onChange={(e) => setTagEn(e.target.value)} />
          </div>
        </div>
        <Button
          type="button"
          className="h-9 w-9 p-0"
          title="Thêm nhãn"
          aria-label="Thêm nhãn"
          onClick={() => void addTag()}
        >
          <Plus className="size-4" strokeWidth={2} />
        </Button>
        <ul className="flex flex-wrap gap-2 border-t border-ui-border-base pt-3">
          {tags.map((t) =>
            editingTagId === t.id ? (
              <li
                key={t.id}
                className="grid grid-cols-1 md:grid-cols-3 gap-2 border border-ui-border-base rounded-md p-3 w-full"
              >
                <Input
                  className="font-mono"
                  placeholder="Slug"
                  value={editTagSlug}
                  onChange={(e) => setEditTagSlug(e.target.value)}
                />
                <Input
                  placeholder="Tiêu đề (vi)"
                  value={editTagVi}
                  onChange={(e) => setEditTagVi(e.target.value)}
                />
                <Input
                  placeholder="Tiêu đề (en)"
                  value={editTagEn}
                  onChange={(e) => setEditTagEn(e.target.value)}
                />
                <div className="flex gap-2 md:col-span-3">
                  <Button
                    type="button"
                    className="h-9 w-9 p-0"
                    title="Lưu"
                    aria-label="Lưu"
                    onClick={() => void saveEditTag()}
                  >
                    <Save className="size-4" strokeWidth={2} />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 w-9 p-0"
                    title="Hủy"
                    aria-label="Hủy"
                    onClick={cancelEditTag}
                  >
                    <X className="size-4" strokeWidth={2} />
                  </Button>
                </div>
              </li>
            ) : (
              <li
                key={t.id}
                className="flex items-center gap-2 rounded-md border border-ui-border-base px-2 py-1 text-small"
              >
                <span className="font-mono text-ui-fg-muted">{t.slug}</span>
                <span>{t.title_i18n?.vi ?? t.title_i18n?.en}</span>
                <Button
                  size="small"
                  variant="transparent"
                  type="button"
                  className="h-7 w-7 shrink-0 p-0"
                  title="Sửa nhãn"
                  aria-label="Sửa nhãn"
                  onClick={() => startEditTag(t)}
                >
                  <Pencil className="size-3.5" strokeWidth={2} />
                </Button>
                <Button
                  size="small"
                  variant="transparent"
                  type="button"
                  className="h-7 w-7 shrink-0 p-0 text-ui-fg-error"
                  title="Xóa nhãn"
                  aria-label="Xóa nhãn"
                  onClick={() => void removeTag(t.id)}
                >
                  <Trash2 className="size-3.5" strokeWidth={2} />
                </Button>
              </li>
            )
          )}
        </ul>
      </CmsCollapsibleSection>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Chủ đề & nhãn tin",
  rank: 43,
})
