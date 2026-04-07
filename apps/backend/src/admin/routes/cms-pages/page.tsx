import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
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
          <Text size="small" className="text-ui-fg-muted max-w-xl">
            Tạo và chỉnh trang tĩnh (song ngữ), SEO từng trang, lưu nháp / xuất
            bản. Trợ giúp: slug chỉ gồm chữ thường, số và dấu gạch ngang; nội
            dung HTML cơ bản được lọc an toàn phía server.
          </Text>
        </div>
        <Button asChild>
          <Link to="new">+ Trang mới</Link>
        </Button>
      </div>

      {loading ? (
        <Text>Đang tải…</Text>
      ) : rows.length === 0 ? (
        <Text className="text-ui-fg-muted">Chưa có trang nào.</Text>
      ) : (
        <ul className="flex flex-col gap-2 border border-ui-border-base rounded-md p-2">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 border-b border-ui-border-base last:border-0 pb-2 last:pb-0"
            >
              <Text weight="plus" className="font-mono text-sm min-w-[8rem]">
                {p.slug}
              </Text>
              <Text className="flex-1 text-ui-fg-muted text-sm">
                {(p.title?.vi || p.title?.en || "—").slice(0, 56)}
              </Text>
              <Badge color={p.status === "published" ? "green" : "grey"}>
                {p.status}
              </Badge>
              <Button size="small" variant="secondary" asChild>
                <Link to={p.id}>Sửa</Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Text size="small" className="text-ui-fg-muted">
        <Link to="../storefront-cms" className="text-ui-fg-interactive">
          ← Storefront CMS
        </Link>{" "}
        (banner, menu, SEO site &amp; thông báo)
      </Text>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Trang CMS",
  rank: 43,
})

export default CmsPagesList
