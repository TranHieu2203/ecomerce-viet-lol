import {
  Button,
  Drawer,
  Heading,
  Input,
  Label,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useRef, useState } from "react"
import { adminFetch } from "./admin-fetch"
import {
  adminUploadFiles,
  pushRecentCmsMediaId,
  readRecentCmsMediaIds,
} from "./admin-upload"

type LibraryFile = { id: string; url: string }

export function MediaPickerField({
  htmlId,
  label,
  value,
  onValueChange,
}: {
  htmlId: string
  label: string
  value: string
  onValueChange: (v: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryFiles, setLibraryFiles] = useState<LibraryFile[]>([])

  const onPick = () => fileRef.current?.click()

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (!files?.length) {
      return
    }
    setBusy(true)
    try {
      const uploaded = await adminUploadFiles(files)
      const first = uploaded[0]
      if (!first?.id) {
        throw new Error("Không nhận được file id từ server")
      }
      pushRecentCmsMediaId(first.id)
      onValueChange(first.id)
      toast.success("Đã upload ảnh — đã điền file id")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload thất bại")
    } finally {
      e.target.value = ""
      setBusy(false)
    }
  }

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true)
    try {
      const session = readRecentCmsMediaIds()
      const q =
        session.length > 0
          ? `?session_ids=${encodeURIComponent(session.join(","))}`
          : ""
      const res = (await adminFetch(
        `/admin/custom/cms-media-library${q}`
      )) as { files?: LibraryFile[] }
      setLibraryFiles(Array.isArray(res.files) ? res.files : [])
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không tải được thư viện ảnh. Thử lại sau."
      )
      setLibraryFiles([])
    } finally {
      setLibraryLoading(false)
    }
  }, [])

  const openLibrary = () => {
    setDrawerOpen(true)
    void loadLibrary()
  }

  const selectFromLibrary = (id: string) => {
    onValueChange(id)
    setDrawerOpen(false)
    toast.success("Đã chọn ảnh từ thư viện")
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlId}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(ev) => void onFileChange(ev)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={onPick}
        >
          {busy ? "Đang upload…" : "Chọn & upload ảnh"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={openLibrary}
        >
          Chọn từ thư viện
        </Button>
        <Input
          id={htmlId}
          className="flex-1 min-w-[14rem]"
          placeholder="file_… (tự điền sau upload, có thể sửa tay)"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </div>
      <Text size="small" className="text-ui-fg-muted">
        Thư viện gồm ảnh đã từng gắn vào CMS (logo, banner, OG) hoặc vừa upload
        trong phiên Admin này.
      </Text>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title asChild>
              <Heading level="h2">Chọn ảnh đã có</Heading>
            </Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4">
            {libraryLoading ? (
              <Text>Đang tải…</Text>
            ) : libraryFiles.length === 0 ? (
              <Text className="text-ui-fg-muted">
                Chưa có ảnh trong thư viện. Hãy upload ít nhất một ảnh hoặc lưu
                logo/banner/OG trước.
              </Text>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {libraryFiles.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="w-full text-left border border-ui-border-base rounded-md overflow-hidden hover:bg-ui-bg-subtle-hover transition-colors"
                      onClick={() => selectFromLibrary(f.id)}
                    >
                      <div className="aspect-video bg-ui-bg-subtle flex items-center justify-center overflow-hidden">
                        <img
                          src={f.url}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <Text
                        size="xsmall"
                        className="font-mono p-2 truncate block"
                        title={f.id}
                      >
                        {f.id}
                      </Text>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}
