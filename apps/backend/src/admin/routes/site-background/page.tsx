import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { Trash } from "@medusajs/icons"
import { useCallback, useEffect, useState } from "react"
import { adminFetch } from "../storefront-cms/admin-fetch"
import { MediaPickerField } from "../storefront-cms/media-picker-field"

type BackgroundRow = {
  id: string
  name: string
  image_url: string | null
  image_file_id: string | null
  resolved_image_url: string | null
  opacity: number
  saturate: number
  base_color: string
  is_active: boolean
  is_preset: boolean
  sort_order: number
}

/** Ô xem trước: nền thật + một thẻ sản phẩm giả để soi độ tương phản. */
function Preview({ row }: { row: BackgroundRow }) {
  return (
    <div
      className="relative h-40 w-full overflow-hidden rounded-lg border border-ui-border-base"
      style={{ backgroundColor: row.base_color }}
    >
      {row.resolved_image_url ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${row.resolved_image_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: row.opacity / 100,
            filter: `saturate(${row.saturate}%)`,
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Text className="text-xs text-ui-fg-muted">Chưa có ảnh</Text>
        </div>
      )}
      <div className="absolute inset-x-3 bottom-3 flex gap-2">
        <div className="flex-1 rounded-md bg-white p-2 shadow-sm">
          <div className="mb-1 h-1.5 w-3/4 rounded bg-neutral-300" />
          <div className="h-1.5 w-1/2 rounded bg-red-700/70" />
        </div>
        <div className="flex-1 rounded-md bg-white p-2 shadow-sm">
          <div className="mb-1 h-1.5 w-2/3 rounded bg-neutral-300" />
          <div className="h-1.5 w-1/2 rounded bg-red-700/70" />
        </div>
      </div>
    </div>
  )
}

const SiteBackgroundPage = () => {
  const [rows, setRows] = useState<BackgroundRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newFileId, setNewFileId] = useState("")
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = (await adminFetch("/admin/custom/backgrounds")) as {
        backgrounds?: BackgroundRow[]
      }
      setRows(res.backgrounds ?? [])
    } catch (e: unknown) {
      toast.error("Không tải được danh sách nền", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const patch = (id: string, changes: Partial<BackgroundRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))
  }

  const save = async (row: BackgroundRow, changes: Record<string, unknown>) => {
    setBusyId(row.id)
    try {
      await adminFetch(`/admin/custom/backgrounds/${row.id}`, {
        method: "POST",
        body: JSON.stringify(changes),
      })
      await load()
    } catch (e: unknown) {
      toast.error("Lưu không được", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusyId(null)
    }
  }

  const activate = async (row: BackgroundRow) => {
    await save(row, { is_active: true })
    toast.success(`Đã dùng nền "${row.name}"`)
  }

  const turnOff = async () => {
    const active = rows.find((r) => r.is_active)
    if (!active) {
      return
    }
    await save(active, { is_active: false })
    toast.success("Đã tắt nền — web trở lại nền trắng")
  }

  const remove = async (row: BackgroundRow) => {
    if (!window.confirm(`Xoá nền "${row.name}"?`)) {
      return
    }
    setBusyId(row.id)
    try {
      await adminFetch(`/admin/custom/backgrounds/${row.id}`, {
        method: "DELETE",
      })
      toast.success("Đã xoá")
      await load()
    } catch (e: unknown) {
      toast.error("Xoá không được", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setBusyId(null)
    }
  }

  const create = async () => {
    if (!newName.trim() || !newFileId.trim()) {
      toast.error("Cần nhập tên và chọn ảnh")
      return
    }
    setCreating(true)
    try {
      await adminFetch("/admin/custom/backgrounds", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          image_file_id: newFileId.trim(),
        }),
      })
      toast.success("Đã thêm nền mới")
      setNewName("")
      setNewFileId("")
      await load()
    } catch (e: unknown) {
      toast.error("Thêm không được", {
        description: e instanceof Error ? e.message : String(e),
      })
    } finally {
      setCreating(false)
    }
  }

  const activeRow = rows.find((r) => r.is_active)

  return (
    <Container className="flex flex-col gap-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading className="mb-1">Nền website</Heading>
          <Text className="text-sm text-ui-fg-subtle">
            Chọn ảnh nền cho toàn bộ web. Đang dùng:{" "}
            <strong>{activeRow ? activeRow.name : "Nền trắng"}</strong>. Đổi
            xong chờ khoảng 30 giây rồi tải lại trang web là thấy. Trang thanh
            toán luôn giữ nền trắng để khách không bị phân tán.
          </Text>
        </div>
        {activeRow ? (
          <Button variant="secondary" onClick={() => void turnOff()}>
            Tắt nền, để trắng
          </Button>
        ) : null}
      </div>

      {loading ? (
        <Text>Đang tải…</Text>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`flex flex-col gap-3 rounded-lg border p-4 ${
                row.is_active
                  ? "border-ui-fg-interactive shadow-sm"
                  : "border-ui-border-base"
              }`}
            >
              <Preview row={row} />

              <div className="flex flex-wrap items-center gap-2">
                <Text weight="plus" className="text-sm">
                  {row.name}
                </Text>
                {row.is_active ? (
                  <Badge color="green">Đang dùng</Badge>
                ) : null}
                {row.is_preset ? <Badge color="grey">Dựng sẵn</Badge> : null}
              </div>

              <label className="flex flex-col gap-1">
                <Text className="text-xs text-ui-fg-muted">
                  Độ mờ: {row.opacity}%
                </Text>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={row.opacity}
                  onChange={(e) =>
                    patch(row.id, { opacity: Number(e.target.value) })
                  }
                  onMouseUp={() => void save(row, { opacity: row.opacity })}
                  onTouchEnd={() => void save(row, { opacity: row.opacity })}
                />
              </label>

              <label className="flex flex-col gap-1">
                <Text className="text-xs text-ui-fg-muted">
                  Độ rực màu: {row.saturate}%
                </Text>
                <input
                  type="range"
                  min={0}
                  max={150}
                  value={row.saturate}
                  onChange={(e) =>
                    patch(row.id, { saturate: Number(e.target.value) })
                  }
                  onMouseUp={() => void save(row, { saturate: row.saturate })}
                  onTouchEnd={() => void save(row, { saturate: row.saturate })}
                />
              </label>

              <div className="mt-auto flex items-center gap-2">
                <Button
                  size="small"
                  variant={row.is_active ? "secondary" : "primary"}
                  disabled={row.is_active || busyId === row.id}
                  isLoading={busyId === row.id}
                  onClick={() => void activate(row)}
                >
                  {row.is_active ? "Đang dùng" : "Dùng nền này"}
                </Button>
                {!row.is_preset ? (
                  <Button
                    size="small"
                    variant="transparent"
                    className="h-8 w-8 p-0"
                    title="Xoá"
                    onClick={() => void remove(row)}
                  >
                    <Trash />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-ui-border-base p-4">
        <Heading level="h2" className="text-base">
          Thêm nền riêng
        </Heading>
        <Text className="text-sm text-ui-fg-subtle">
          Tải ảnh của shop lên rồi đặt tên. Ảnh ngang, rộng tối thiểu 1600px sẽ
          đẹp nhất trên màn hình lớn.
        </Text>
        <div>
          <Text size="small" weight="plus" className="mb-1">
            Tên nền
          </Text>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ví dụ: Nền Tết 2027"
          />
        </div>
        <MediaPickerField
          htmlId="new-background-image"
          label="Ảnh nền"
          value={newFileId}
          onValueChange={setNewFileId}
        />
        <div>
          <Button onClick={() => void create()} isLoading={creating}>
            Thêm nền
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Nền website",
  rank: 46,
})

export default SiteBackgroundPage
