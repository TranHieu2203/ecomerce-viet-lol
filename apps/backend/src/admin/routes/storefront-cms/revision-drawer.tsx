import { Button, Drawer, Heading, Text, toast } from "@medusajs/ui"
import { History, RotateCcw } from "lucide-react"
import { useCallback, useState } from "react"
import { adminFetch } from "./admin-fetch"

type RevisionRow = {
  id: string
  created_at: string
  entity_type: string
  entity_id: string | null
  payload_snapshot: Record<string, unknown>
}

export function CmsRevisionDrawer({
  entityType,
  entityId,
  triggerLabel,
  onAfterRestore,
}: {
  entityType: "page" | "settings" | "nav"
  entityId: string
  triggerLabel?: string
  onAfterRestore?: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<RevisionRow[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({
        entity_type: entityType,
        entity_id: entityId,
      })
      const res = (await adminFetch(
        `/admin/custom/cms-revisions?${q.toString()}`
      )) as { revisions: RevisionRow[] }
      setRows(res.revisions ?? [])
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không tải được lịch sử")
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  const onOpenChange = (v: boolean) => {
    setOpen(v)
    if (v) {
      void load()
    }
  }

  const restore = async (revisionId: string) => {
    if (
      !confirm(
        "Khôi phục bản này sẽ ghi đè nội dung hiện tại. Bạn có chắc muốn tiếp tục?"
      )
    ) {
      return
    }
    try {
      await adminFetch("/admin/custom/cms-revisions/restore", {
        method: "POST",
        body: JSON.stringify({ revision_id: revisionId }),
      })
      toast.success("Đã khôi phục")
      setOpen(false)
      await onAfterRestore?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Khôi phục thất bại")
    }
  }

  const previewLine = (r: RevisionRow) => {
    const s = r.payload_snapshot
    if (entityType === "page") {
      const slug = typeof s.slug === "string" ? s.slug : ""
      const st = typeof s.status === "string" ? s.status : ""
      return `${slug} · ${st}`
    }
    if (entityType === "settings") {
      return "Cấu hình site (logo, locale, SEO site, …)"
    }
    return "Cấu trúc menu header"
  }

  const triggerTitle = triggerLabel ?? "Lịch sử phiên bản"

  return (
    <>
      <Button
        size="small"
        variant="secondary"
        type="button"
        className="h-8 w-8 shrink-0 p-0"
        onClick={() => onOpenChange(true)}
        title={triggerTitle}
        aria-label={triggerTitle}
      >
        <History className="size-4" strokeWidth={2} />
      </Button>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title asChild>
              <Heading level="h2">Lịch sử phiên bản</Heading>
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-3">
            {loading ? <Text>Đang tải…</Text> : null}
            {!loading && rows.length === 0 ? (
              <Text size="small" className="text-ui-fg-muted">
                Chưa có bản lưu.
              </Text>
            ) : null}
            <ul className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 border border-ui-border-base rounded p-2"
                >
                  <div>
                    <Text size="small" weight="plus">
                      {new Date(r.created_at).toLocaleString("vi-VN")}
                    </Text>
                    <Text size="small" className="text-ui-fg-muted">
                      {previewLine(r)}
                    </Text>
                  </div>
                  <Button
                    size="small"
                    variant="secondary"
                    type="button"
                    className="h-8 w-8 shrink-0 p-0"
                    title="Khôi phục bản này"
                    aria-label="Khôi phục bản này"
                    onClick={() => void restore(r.id)}
                  >
                    <RotateCcw className="size-4" strokeWidth={2} />
                  </Button>
                </li>
              ))}
            </ul>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </>
  )
}
