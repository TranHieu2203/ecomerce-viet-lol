import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { ArrowLeft, Copy, FileX2, Rocket, Save, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CmsCollapsibleSection } from "../../../components/cms-collapsible-section"
import { adminFetch } from "../../storefront-cms/admin-fetch"
import { CmsRevisionDrawer } from "../../storefront-cms/revision-drawer"

type CmsPage = {
  id: string
  slug: string
  title: Record<string, string>
  body: string | null
  status: string
  seo?: {
    meta_title?: { vi?: string; en?: string }
    meta_description?: { vi?: string; en?: string }
  } | null
}

const emptyForm = () => ({
  slug: "",
  title_vi: "",
  title_en: "",
  body: "",
  meta_title_vi: "",
  meta_title_en: "",
  meta_desc_vi: "",
  meta_desc_en: "",
})

const CmsPageEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === "new"

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState<CmsPage | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    if (!id || isNew) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = (await adminFetch(`/admin/custom/cms-pages/${id}`)) as {
        cms_page: CmsPage
      }
      const p = res.cms_page
      setPage(p)
      const seo = p.seo ?? undefined
      setForm({
        slug: p.slug,
        title_vi: p.title?.vi ?? "",
        title_en: p.title?.en ?? "",
        body: p.body ?? "",
        meta_title_vi: seo?.meta_title?.vi ?? "",
        meta_title_en: seo?.meta_title?.en ?? "",
        meta_desc_vi: seo?.meta_description?.vi ?? "",
        meta_desc_en: seo?.meta_description?.en ?? "",
      })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không tải được trang")
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  useEffect(() => {
    void load()
  }, [load])

  const buildSeoPayload = () => {
    const meta_title = {
      vi: form.meta_title_vi.trim(),
      en: form.meta_title_en.trim(),
    }
    const meta_description = {
      vi: form.meta_desc_vi.trim(),
      en: form.meta_desc_en.trim(),
    }
    const hasTitle = meta_title.vi || meta_title.en
    const hasDesc = meta_description.vi || meta_description.en
    if (!hasTitle && !hasDesc) {
      return null
    }
    return {
      meta_title: hasTitle ? meta_title : undefined,
      meta_description: hasDesc ? meta_description : undefined,
    }
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      const title = { vi: form.title_vi, en: form.title_en }
      const allMetaEmpty =
        !form.meta_title_vi.trim() &&
        !form.meta_title_en.trim() &&
        !form.meta_desc_vi.trim() &&
        !form.meta_desc_en.trim()
      const seoPayload = allMetaEmpty ? null : buildSeoPayload()

      if (isNew) {
        const slug = form.slug.trim()
        if (!slug) {
          toast.error("Slug là bắt buộc")
          setSaving(false)
          return
        }
        const res = (await adminFetch("/admin/custom/cms-pages", {
          method: "POST",
          body: JSON.stringify({
            slug,
            title,
            body: form.body.trim() || null,
            ...(seoPayload ? { seo: seoPayload } : {}),
          }),
        })) as { cms_page: CmsPage }
        toast.success("Đã tạo trang nháp")
        navigate(`../${res.cms_page.id}`, { replace: true })
        return
      }

      const seoForPatch = seoPayload

      await adminFetch(`/admin/custom/cms-pages/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          body: form.body.trim() || null,
          seo: seoForPatch,
        }),
      })
      toast.success("Đã lưu nháp")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại")
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    if (isNew) {
      toast.error("Hãy lưu nháp trước khi xuất bản")
      return
    }
    try {
      await adminFetch(`/admin/custom/cms-pages/${id}/publish`, {
        method: "POST",
      })
      toast.success("Đã xuất bản")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Publish thất bại")
    }
  }

  const unpublish = async () => {
    if (isNew) {
      return
    }
    try {
      await adminFetch(`/admin/custom/cms-pages/${id}/unpublish`, {
        method: "POST",
      })
      toast.success("Đã gỡ xuất bản")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Unpublish thất bại")
    }
  }

  const remove = async () => {
    if (isNew || !page) {
      return
    }
    if (!confirm("Xóa vĩnh viễn trang này?")) {
      return
    }
    try {
      await adminFetch(`/admin/custom/cms-pages/${id}`, {
        method: "DELETE",
      })
      toast.success("Đã xóa")
      navigate("..")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại")
    }
  }

  const copyPreviewToken = async () => {
    if (isNew || !page) {
      return
    }
    try {
      const res = (await adminFetch("/admin/custom/cms-preview-token", {
        method: "POST",
        body: JSON.stringify({ page_id: page.id }),
      })) as { token?: string; expires_at?: string }
      const token = res.token ?? ""
      await navigator.clipboard.writeText(token)
      toast.success(
        `Đã copy token (hết hạn ~ ${res.expires_at ?? "?"}). Dán vào storefront: ?cms_preview=... hoặc header x-cms-preview`
      )
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không tạo được token")
    }
  }

  if (loading) {
    return (
      <Container className="p-8">
        <Text>Đang tải…</Text>
      </Container>
    )
  }

  return (
    <Container className="p-8 flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading className="mb-1">
            {isNew ? "Trang CMS mới" : `Sửa trang /${form.slug}`}
          </Heading>
          {!isNew && page ? (
            <Badge color={page.status === "published" ? "green" : "grey"}>
              {page.status}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && id ? (
            <CmsRevisionDrawer
              entityType="page"
              entityId={id}
              triggerLabel="Lịch sử trang"
              onAfterRestore={() => load()}
            />
          ) : null}
          <Button
            size="small"
            variant="secondary"
            className="h-9 w-9 shrink-0 p-0"
            asChild
            title="Danh sách trang"
          >
            <Link to=".." aria-label="Danh sách trang">
              <ArrowLeft className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </div>

      <CmsCollapsibleSection
        defaultOpen={false}
        summary={
          <Text weight="plus" className="text-sm text-ui-fg-muted">
            Ghi chú soạn thảo
          </Text>
        }
      >
        <Text size="small" className="max-w-2xl text-ui-fg-muted">
          Nội dung HTML cơ bản (p, strong, a, ul…) được chấp nhận; script và
          iframe bị loại khi lưu. Tiêu đề bắt buộc có cả tiếng Việt và English
          (có thể để trống tạm một bên).
        </Text>
      </CmsCollapsibleSection>

      <CmsCollapsibleSection
        defaultOpen
        summary={
          <Heading level="h2" className="text-base">
            Thông tin chung
          </Heading>
        }
      >
        <div>
          <Label>Slug (URL)</Label>
          <Input
            className="font-mono"
            disabled={!isNew}
            value={form.slug}
            onChange={(e) =>
              setForm((f) => ({ ...f, slug: e.target.value }))
            }
            placeholder="vi-du-ve-chung-toi"
          />
          {!isNew ? (
            <Text size="small" className="text-ui-fg-muted mt-1">
              Slug không đổi sau khi tạo (theo API).
            </Text>
          ) : null}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Tiêu đề (vi)</Label>
            <Input
              value={form.title_vi}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_vi: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Tiêu đề (en)</Label>
            <Input
              value={form.title_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_en: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <Label>Nội dung (HTML / rich tối thiểu)</Label>
          <Textarea
            rows={14}
            className="font-mono text-sm"
            value={form.body}
            onChange={(e) =>
              setForm((f) => ({ ...f, body: e.target.value }))
            }
            placeholder="<p>Nội dung…</p>"
          />
        </div>
      </CmsCollapsibleSection>

      <CmsCollapsibleSection
        defaultOpen={false}
        summary={
          <Heading level="h2" className="text-base">
            SEO trang (tùy chọn)
          </Heading>
        }
      >
        <Text size="small" className="mb-3 text-ui-fg-muted">
          Ghi đè meta so với cấu hình mặc định toàn site (Storefront CMS → SEO
          site).
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Meta title (vi)</Label>
            <Input
              value={form.meta_title_vi}
              onChange={(e) =>
                setForm((f) => ({ ...f, meta_title_vi: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Meta title (en)</Label>
            <Input
              value={form.meta_title_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, meta_title_en: e.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label>Meta description (vi)</Label>
            <Textarea
              rows={3}
              value={form.meta_desc_vi}
              onChange={(e) =>
                setForm((f) => ({ ...f, meta_desc_vi: e.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Label>Meta description (en)</Label>
            <Textarea
              rows={3}
              value={form.meta_desc_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, meta_desc_en: e.target.value }))
              }
            />
          </div>
        </div>
      </CmsCollapsibleSection>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={saving}
          type="button"
          className="h-9 w-9 p-0"
          title="Lưu nháp"
          aria-label="Lưu nháp"
          onClick={() => void saveDraft()}
        >
          <Save className="size-4" strokeWidth={2} />
        </Button>
        {!isNew ? (
          <>
            <Button
              variant="secondary"
              type="button"
              className="h-9 w-9 p-0"
              title="Xuất bản"
              aria-label="Xuất bản"
              onClick={() => void publish()}
            >
              <Rocket className="size-4" strokeWidth={2} />
            </Button>
            <Button
              variant="secondary"
              type="button"
              className="h-9 w-9 p-0"
              title="Gỡ xuất bản"
              aria-label="Gỡ xuất bản"
              onClick={() => void unpublish()}
            >
              <FileX2 className="size-4" strokeWidth={2} />
            </Button>
            <Button
              variant="secondary"
              type="button"
              className="h-9 w-9 p-0"
              title="Copy token xem trước"
              aria-label="Copy token xem trước"
              onClick={() => void copyPreviewToken()}
            >
              <Copy className="size-4" strokeWidth={2} />
            </Button>
            <Button
              variant="danger"
              type="button"
              className="h-9 w-9 p-0"
              title="Xóa trang"
              aria-label="Xóa trang"
              onClick={() => void remove()}
            >
              <Trash2 className="size-4" strokeWidth={2} />
            </Button>
          </>
        ) : null}
      </div>
    </Container>
  )
}

export default CmsPageEditor
