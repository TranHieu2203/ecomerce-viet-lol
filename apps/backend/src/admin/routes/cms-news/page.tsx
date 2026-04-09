import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { AppWindow, ArrowLeft, FilePlus2, LayoutGrid, Pencil } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CmsCollapsibleSection } from "../../components/cms-collapsible-section"
import { adminFetch } from "../storefront-cms/admin-fetch"

type CmsNewsRow = {
  id: string
  slug: string
  status: string
  updated_at?: string
  title_i18n: Record<string, string>
}

const CmsNewsList = () => {
  const [rows, setRows] = useState<CmsNewsRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await adminFetch("/admin/custom/cms-news")) as {
        cms_news?: CmsNewsRow[]
      }
      setRows(res.cms_news ?? [])
    } catch (e: unknown) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Container className="p-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading className="mb-1">Tin tức (CMS)</Heading>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="small"
            className="h-9 w-9 shrink-0 p-0"
            asChild
            title="Chủ đề & nhãn"
          >
            <Link to="../cms-news-taxonomy" aria-label="Chủ đề & nhãn">
              <LayoutGrid className="size-4" strokeWidth={2} />
            </Link>
          </Button>
          <Button
            size="small"
            className="h-9 w-9 shrink-0 p-0"
            asChild
            title="Bài mới"
          >
            <Link to="new" aria-label="Bài mới">
              <FilePlus2 className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </div>

      <CmsCollapsibleSection
        defaultOpen={false}
        summary={
          <Text weight="plus" className="text-sm text-ui-fg-muted">
            Giới thiệu / hướng dẫn
          </Text>
        }
      >
        <Text size="small" className="max-w-xl text-ui-fg-muted">
          Quản lý bài tin (song ngữ), slug, SEO và trạng thái nháp / xuất bản.
          Gán chủ đề & nhãn từ biểu tượng lưới; nội dung soạn thảo qua trình
          biên tập rich text, HTML được lọc an toàn phía server.
        </Text>
      </CmsCollapsibleSection>

      {loading ? (
        <Text>Đang tải…</Text>
      ) : rows.length === 0 ? (
        <Text className="text-ui-fg-muted">Chưa có bài tin nào.</Text>
      ) : (
        <CmsCollapsibleSection
          defaultOpen
          summary={
            <Text weight="plus" className="text-sm">
              Danh sách ({rows.length})
            </Text>
          }
        >
          <ul className="flex flex-col gap-2">
            {rows.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 border-b border-ui-border-base pb-2 last:border-0 last:pb-0"
              >
                <Text weight="plus" className="min-w-[8rem] font-mono text-sm">
                  {p.slug}
                </Text>
                <Text className="flex-1 text-sm text-ui-fg-muted">
                  {(p.title_i18n?.vi || p.title_i18n?.en || "—").slice(0, 56)}
                </Text>
                <Badge color={p.status === "published" ? "green" : "grey"}>
                  {p.status}
                </Badge>
                <Button
                  size="small"
                  variant="secondary"
                  className="h-8 w-8 shrink-0 p-0"
                  asChild
                  title="Sửa bài"
                >
                  <Link to={p.id} aria-label={`Sửa ${p.slug}`}>
                    <Pencil className="size-4" strokeWidth={2} />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </CmsCollapsibleSection>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="small"
          variant="transparent"
          className="h-8 w-8 shrink-0 p-0 text-ui-fg-muted"
          asChild
          title="Trang CMS"
        >
          <Link to="../cms-pages" aria-label="Trang CMS">
            <ArrowLeft className="size-4" strokeWidth={2} />
          </Link>
        </Button>
        <Button
          size="small"
          variant="transparent"
          className="h-8 w-8 shrink-0 p-0 text-ui-fg-muted"
          asChild
          title="Storefront CMS"
        >
          <Link to="../storefront-cms" aria-label="Storefront CMS">
            <AppWindow className="size-4" strokeWidth={2} />
          </Link>
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Tin tức",
  rank: 44,
})

export default CmsNewsList
