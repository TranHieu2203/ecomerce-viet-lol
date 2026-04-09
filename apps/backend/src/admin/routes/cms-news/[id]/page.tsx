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
import {
  ArrowLeft,
  Copy,
  FileX2,
  LayoutGrid,
  Rocket,
  Save,
  Trash2,
  Wand2,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CmsCollapsibleSection } from "../../../components/cms-collapsible-section"
import { adminFetch } from "../../storefront-cms/admin-fetch"
import { MediaPickerField } from "../../storefront-cms/media-picker-field"
import { CmsNewsBodyEditor } from "../cms-news-body-editor"

type CmsNewsArticle = {
  id: string
  slug: string
  title_i18n: Record<string, string>
  excerpt_i18n: Record<string, string> | null
  body_html_i18n: Record<string, string>
  featured_image_file_id: string | null
  status: string
  category_ids?: string[]
  tag_ids?: string[]
  seo?: {
    meta_title?: { vi?: string; en?: string }
    meta_description?: { vi?: string; en?: string }
  } | null
}

type NewsCategoryRow = {
  id: string
  slug: string
  title_i18n: Record<string, string>
  parent_id: string | null
}

type NewsTagRow = {
  id: string
  slug: string
  title_i18n: Record<string, string>
}

function slugifyFromViTitle(raw: string): string {
  return String(raw)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0110/g, "D")
    .replace(/\u0111/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200)
}

function categoryIndentPx(id: string, rows: NewsCategoryRow[]): number {
  let depth = 0
  let cur: NewsCategoryRow | undefined = rows.find((r) => r.id === id)
  const seen = new Set<string>()
  while (cur) {
    const parentId = cur.parent_id
    if (!parentId || seen.has(cur.id)) break
    seen.add(cur.id)
    depth++
    cur = rows.find((r) => r.id === parentId)
  }
  return Math.min(depth, 5) * 14
}

function sortedCategoriesForUi(rows: NewsCategoryRow[]): NewsCategoryRow[] {
  const out: NewsCategoryRow[] = []
  const walk = (parentId: string | null) => {
    const kids = rows
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => a.slug.localeCompare(b.slug))
    for (const k of kids) {
      out.push(k)
      walk(k.id)
    }
  }
  walk(null)
  for (const r of rows) {
    if (!out.some((x) => x.id === r.id)) {
      out.push(r)
    }
  }
  return out
}

const emptyForm = () => ({
  slug: "",
  title_vi: "",
  title_en: "",
  excerpt_vi: "",
  excerpt_en: "",
  body_vi: "",
  body_en: "",
  featured_file_id: "",
  meta_title_vi: "",
  meta_title_en: "",
  meta_desc_vi: "",
  meta_desc_en: "",
  category_ids: [] as string[],
  tag_ids: [] as string[],
})

const CmsNewsEditor = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === "new"

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [article, setArticle] = useState<CmsNewsArticle | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [categories, setCategories] = useState<NewsCategoryRow[]>([])
  const [tags, setTags] = useState<NewsTagRow[]>([])

  const loadTaxonomies = useCallback(async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        adminFetch("/admin/custom/cms-news-categories") as Promise<{
          categories?: NewsCategoryRow[]
        }>,
        adminFetch("/admin/custom/cms-news-tags") as Promise<{
          tags?: NewsTagRow[]
        }>,
      ])
      setCategories(cRes.categories ?? [])
      setTags(tRes.tags ?? [])
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Không tải chủ đề / nhãn"
      )
    }
  }, [])

  const load = useCallback(async () => {
    if (!id || isNew) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      await loadTaxonomies()
      const res = (await adminFetch(`/admin/custom/cms-news/${id}`)) as {
        cms_news_article: CmsNewsArticle
      }
      const a = res.cms_news_article
      setArticle(a)
      const ex = a.excerpt_i18n ?? undefined
      const body = a.body_html_i18n ?? {}
      const seo = a.seo ?? undefined
      setForm({
        slug: a.slug,
        title_vi: a.title_i18n?.vi ?? "",
        title_en: a.title_i18n?.en ?? "",
        excerpt_vi: ex?.vi ?? "",
        excerpt_en: ex?.en ?? "",
        body_vi: body.vi ?? "",
        body_en: body.en ?? "",
        featured_file_id: a.featured_image_file_id ?? "",
        meta_title_vi: seo?.meta_title?.vi ?? "",
        meta_title_en: seo?.meta_title?.en ?? "",
        meta_desc_vi: seo?.meta_description?.vi ?? "",
        meta_desc_en: seo?.meta_description?.en ?? "",
        category_ids: a.category_ids ?? [],
        tag_ids: a.tag_ids ?? [],
      })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không tải được bài tin")
    } finally {
      setLoading(false)
    }
  }, [id, isNew, loadTaxonomies])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (isNew) {
      void loadTaxonomies()
    }
  }, [isNew, loadTaxonomies])

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

  const excerptPayload = () => {
    const vi = form.excerpt_vi.trim()
    const en = form.excerpt_en.trim()
    if (!vi && !en) {
      return null
    }
    return { vi, en }
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      const title_i18n = { vi: form.title_vi, en: form.title_en }
      const body_html = { vi: form.body_vi, en: form.body_en }
      const excerpt = excerptPayload()
      const allMetaEmpty =
        !form.meta_title_vi.trim() &&
        !form.meta_title_en.trim() &&
        !form.meta_desc_vi.trim() &&
        !form.meta_desc_en.trim()
      const seoPayload = allMetaEmpty ? null : buildSeoPayload()
      const featured = form.featured_file_id.trim() || null

      if (isNew) {
        const slug = form.slug.trim()
        if (!slug) {
          toast.error("Slug là bắt buộc")
          setSaving(false)
          return
        }
        const res = (await adminFetch("/admin/custom/cms-news", {
          method: "POST",
          body: JSON.stringify({
            slug,
            title: title_i18n,
            body_html,
            category_ids: form.category_ids,
            tag_ids: form.tag_ids,
            ...(excerpt ? { excerpt } : {}),
            ...(featured ? { featured_image_file_id: featured } : {}),
            ...(seoPayload ? { seo: seoPayload } : {}),
          }),
        })) as { cms_news_article: CmsNewsArticle }
        toast.success("Đã tạo bản nháp")
        navigate(`../${res.cms_news_article.id}`, { replace: true })
        return
      }

      await adminFetch(`/admin/custom/cms-news/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title_i18n,
          body_html,
          excerpt,
          featured_image_file_id: featured,
          seo: seoPayload,
          category_ids: form.category_ids,
          tag_ids: form.tag_ids,
        }),
      })
      toast.success("Đã lưu nháp")
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
      await adminFetch(`/admin/custom/cms-news/${id}/publish`, {
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
      await adminFetch(`/admin/custom/cms-news/${id}/unpublish`, {
        method: "POST",
      })
      toast.success("Đã gỡ xuất bản")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Unpublish thất bại")
    }
  }

  const remove = async () => {
    if (isNew || !article) {
      return
    }
    if (!confirm("Xóa vĩnh viễn bài tin này?")) {
      return
    }
    try {
      await adminFetch(`/admin/custom/cms-news/${id}`, {
        method: "DELETE",
      })
      toast.success("Đã xóa")
      navigate("..")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại")
    }
  }

  const copyPreviewToken = async () => {
    if (isNew || !article) {
      return
    }
    try {
      const res = (await adminFetch("/admin/custom/cms-preview-token", {
        method: "POST",
        body: JSON.stringify({ article_id: article.id }),
      })) as { token?: string; expires_at?: string }
      const token = res.token ?? ""
      await navigator.clipboard.writeText(token)
      toast.success(
        `Đã copy token tin (hết hạn ~ ${res.expires_at ?? "?"}). Storefront: /news/${article.slug}?cms_preview=…`
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
            {isNew ? "Bài tin mới" : `Sửa tin /${form.slug}`}
          </Heading>
          {!isNew && article ? (
            <Badge color={article.status === "published" ? "green" : "grey"}>
              {article.status}
            </Badge>
          ) : null}
        </div>
        <Button
          size="small"
          variant="secondary"
          className="h-9 w-9 shrink-0 p-0"
          asChild
          title="Danh sách tin"
        >
          <Link to=".." aria-label="Danh sách tin">
            <ArrowLeft className="size-4" strokeWidth={2} />
          </Link>
        </Button>
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
          Tiêu đề bắt buộc có khóa vi và en. Nội dung: soạn thảo trực quan (kiểu
          Word) cho từng ngôn ngữ; khi lưu, HTML được lọc an toàn (không script /
          iframe). Ảnh trong bài: nút Ảnh, dán hoặc kéo thả — upload qua thư viện
          Medusa.
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
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="font-mono flex-1 min-w-[12rem]"
              disabled={!isNew}
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value }))
              }
              placeholder="bai-tin-moi"
            />
            {isNew ? (
              <Button
                size="small"
                variant="secondary"
                type="button"
                className="h-9 w-9 shrink-0 p-0"
                title="Tạo slug từ tiêu đề (vi)"
                aria-label="Tạo slug từ tiêu đề (vi)"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    slug: slugifyFromViTitle(f.title_vi) || f.slug,
                  }))
                }
              >
                <Wand2 className="size-4" strokeWidth={2} />
              </Button>
            ) : null}
          </div>
          {!isNew ? (
            <Text size="small" className="text-ui-fg-muted mt-1">
              Slug không đổi sau khi tạo.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Mô tả ngắn (vi)</Label>
            <Textarea
              rows={3}
              value={form.excerpt_vi}
              onChange={(e) =>
                setForm((f) => ({ ...f, excerpt_vi: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Mô tả ngắn (en)</Label>
            <Textarea
              rows={3}
              value={form.excerpt_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, excerpt_en: e.target.value }))
              }
            />
          </div>
        </div>
        <MediaPickerField
          htmlId="cms-news-featured"
          label="Ảnh đại diện (tùy chọn)"
          value={form.featured_file_id}
          onValueChange={(v) =>
            setForm((f) => ({ ...f, featured_file_id: v }))
          }
        />

        <div className="flex flex-col gap-3 border-t border-ui-border-base pt-4">
          <div>
            <Heading level="h2" className="text-base">
              Chủ đề (category)
            </Heading>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Text size="small" className="text-ui-fg-muted">
                Giống WordPress — có thể chọn nhiều chủ đề; cây cha–con quản lý tại
              </Text>
              <Button
                size="small"
                variant="transparent"
                className="h-8 w-8 shrink-0 p-0 text-ui-fg-interactive"
                asChild
                title="Mở trang Chủ đề & nhãn"
              >
                <Link
                  to="../../cms-news-taxonomy"
                  aria-label="Chủ đề & nhãn"
                >
                  <LayoutGrid className="size-4" strokeWidth={2} />
                </Link>
              </Button>
            </div>
            <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-md border border-ui-border-base p-3">
              {sortedCategoriesForUi(categories).map((c) => {
                const pad = categoryIndentPx(c.id, categories)
                const label = c.title_i18n?.vi || c.title_i18n?.en || c.slug
                return (
                  <li key={c.id} style={{ paddingLeft: pad }}>
                    <label className="flex cursor-pointer items-center gap-2 text-small">
                      <input
                        type="checkbox"
                        checked={form.category_ids.includes(c.id)}
                        onChange={(e) => {
                          const on = e.target.checked
                          setForm((f) => ({
                            ...f,
                            category_ids: on
                              ? [...f.category_ids, c.id]
                              : f.category_ids.filter((x) => x !== c.id),
                          }))
                        }}
                      />
                      <span className="font-mono text-ui-fg-muted">{c.slug}</span>
                      <span>{label}</span>
                    </label>
                  </li>
                )
              })}
              {categories.length === 0 ? (
                <li className="text-ui-fg-muted text-small">
                  Chưa có chủ đề — tạo tại trang Chủ đề &amp; nhãn.
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <Heading level="h2" className="text-base">
              Nhãn (tags)
            </Heading>
            <ul className="flex flex-wrap gap-3 rounded-md border border-ui-border-base p-3">
              {tags.map((t) => {
                const label = t.title_i18n?.vi || t.title_i18n?.en || t.slug
                return (
                  <li key={t.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-small">
                      <input
                        type="checkbox"
                        checked={form.tag_ids.includes(t.id)}
                        onChange={(e) => {
                          const on = e.target.checked
                          setForm((f) => ({
                            ...f,
                            tag_ids: on
                              ? [...f.tag_ids, t.id]
                              : f.tag_ids.filter((x) => x !== t.id),
                          }))
                        }}
                      />
                      <span className="font-mono text-ui-fg-muted">{t.slug}</span>
                      <span>{label}</span>
                    </label>
                  </li>
                )
              })}
              {tags.length === 0 ? (
                <li className="text-ui-fg-muted text-small">
                  Chưa có nhãn — tạo tại trang Chủ đề &amp; nhãn.
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div>
          <Label>Nội dung (tiếng Việt)</Label>
          <CmsNewsBodyEditor
            key={`${id ?? "new"}-body-vi`}
            initialHtml={form.body_vi}
            onHtmlChange={(html) =>
              setForm((f) => ({ ...f, body_vi: html }))
            }
            placeholder="Soạn bài bằng tiếng Việt — có thể dán từ Word…"
            disabled={saving}
          />
        </div>
        <div>
          <Label>Nội dung (English)</Label>
          <CmsNewsBodyEditor
            key={`${id ?? "new"}-body-en`}
            initialHtml={form.body_en}
            onHtmlChange={(html) =>
              setForm((f) => ({ ...f, body_en: html }))
            }
            placeholder="Write in English — paste from Word is OK…"
            disabled={saving}
          />
        </div>
      </CmsCollapsibleSection>

      <CmsCollapsibleSection
        defaultOpen={false}
        summary={
          <Heading level="h2" className="text-base">
            SEO (tùy chọn)
          </Heading>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
              title="Xóa bài"
              aria-label="Xóa bài"
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

export default CmsNewsEditor
