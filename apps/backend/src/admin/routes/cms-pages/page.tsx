import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { ArrowLeft, FilePlus2, Pencil } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CmsCollapsibleSection } from "../../components/cms-collapsible-section"
import { adminFetch } from "../storefront-cms/admin-fetch"

type CmsPageRow = {
  id: string
  slug: string
  status: string
  updated_at?: string
  title: Record<string, string>
}

const CmsPagesList = () => {
  const [rows, setRows] = useState<CmsPageRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await adminFetch("/admin/custom/cms-pages")) as {
        cms_pages?: CmsPageRow[]
      }
      setRows(res.cms_pages ?? [])
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
          <Heading className="mb-1">Trang nội dung CMS</Heading>
        </div>
        <Button
          size="small"
          className="h-9 w-9 shrink-0 p-0"
          asChild
          title="Trang mới"
        >
          <Link to="new" aria-label="Trang mới">
            <FilePlus2 className="size-4" strokeWidth={2} />
          </Link>
        </Button>
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
          Tạo và chỉnh trang tĩnh (song ngữ), SEO từng trang, lưu nháp / xuất
          bản. Trợ giúp: slug chỉ gồm chữ thường, số và dấu gạch ngang; nội
          dung HTML cơ bản được lọc an toàn phía server.
        </Text>
      </CmsCollapsibleSection>

      {loading ? (
        <Text>Đang tải…</Text>
      ) : rows.length === 0 ? (
        <Text className="text-ui-fg-muted">Chưa có trang nào.</Text>
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
                  {(p.title?.vi || p.title?.en || "—").slice(0, 56)}
                </Text>
                <Badge color={p.status === "published" ? "green" : "grey"}>
                  {p.status}
                </Badge>
                <Button
                  size="small"
                  variant="secondary"
                  className="h-8 w-8 shrink-0 p-0"
                  asChild
                  title="Sửa trang"
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

      <Button
        size="small"
        variant="transparent"
        className="h-8 w-8 shrink-0 p-0 text-ui-fg-muted"
        asChild
        title="Về Storefront CMS"
      >
        <Link to="../storefront-cms" aria-label="Về Storefront CMS">
          <ArrowLeft className="size-4" strokeWidth={2} />
        </Link>
      </Button>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Trang CMS",
  rank: 43,
})

export default CmsPagesList
