import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useRef, useState } from "react"

type Slide = {
  id: string
  image_file_id: string | null
  image_urls: { mobile?: string; desktop?: string } | null
  title: Record<string, string>
  subtitle?: Record<string, string> | null
  cta_label?: Record<string, string> | null
  target_url: string | null
  sort_order: number
  is_active: boolean
}

type Settings = {
  id: string
  default_locale: string
  enabled_locales: unknown
  logo_file_id: string | null
  site_title: string | null
}

const adminFetch = async (path: string, init?: RequestInit) => {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json &&
      "message" in json &&
      typeof (json as { message: string }).message === "string"
        ? (json as { message: string }).message
        : res.statusText
    throw new Error(msg)
  }
  return json
}

type AdminUploadedFile = { id: string; url?: string }

declare const __BACKEND_URL__: string | undefined

type WindowWithMedusaSdk = Window & {
  __sdk?: {
    admin: {
      upload: {
        create: (
          body: FileList | { files: File[] }
        ) => Promise<{ files?: unknown }>
      }
    }
  }
}

function parseUploadResponsePayload(json: unknown): AdminUploadedFile[] {
  if (!json || typeof json !== "object") {
    return []
  }
  let o = json as Record<string, unknown>
  if (
    "data" in o &&
    o.data &&
    typeof o.data === "object" &&
    !Array.isArray(o.data)
  ) {
    o = o.data as Record<string, unknown>
  }
  const raw = o.files ?? o.file
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : []
  return list
    .map((item): AdminUploadedFile | null => {
      if (!item || typeof item !== "object") {
        return null
      }
      const f = item as Record<string, unknown>
      const id = f.id != null ? String(f.id) : ""
      if (!id) {
        return null
      }
      return {
        id,
        url: typeof f.url === "string" ? f.url : undefined,
      }
    })
    .filter((x): x is AdminUploadedFile => x !== null)
}

/**
 * Upload qua Medusa Admin API. Ưu tiên `window.__sdk` (kèm JWT / base URL đúng như Dashboard);
 * fallback fetch khi chỉ dùng session cookie + cùng origin.
 */
const adminUploadFiles = async (
  fileList: FileList | File[]
): Promise<AdminUploadedFile[]> => {
  const asArray = Array.from(fileList)

  if (typeof window !== "undefined") {
    const sdk = (window as WindowWithMedusaSdk).__sdk
    if (sdk?.admin?.upload?.create) {
      const body =
        fileList instanceof FileList
          ? fileList
          : { files: asArray }
      const res = await sdk.admin.upload.create(body)
      const parsed = parseUploadResponsePayload(res)
      if (parsed.length) {
        return parsed
      }
      throw new Error(
        "Upload có phản hồi nhưng không đọc được file id (kiểm tra console / refresh trang Admin)."
      )
    }
  }

  const fd = new FormData()
  for (const f of asArray) {
    fd.append("files", f)
  }

  const base =
    typeof __BACKEND_URL__ !== "undefined" && __BACKEND_URL__
      ? String(__BACKEND_URL__).replace(/\/$/, "")
      : ""
  const uploadUrl = `${base}/admin/uploads`

  const res = await fetch(uploadUrl, {
    method: "POST",
    credentials: "include",
    body: fd,
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    const msg =
      typeof json === "object" &&
      json &&
      "message" in json &&
      typeof (json as { message: string }).message === "string"
        ? (json as { message: string }).message
        : res.statusText
    throw new Error(msg)
  }
  const parsed = parseUploadResponsePayload(json)
  if (!parsed.length) {
    throw new Error("Upload response không có file hợp lệ (thiếu id)")
  }
  return parsed
}

function ImageUploadField({
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
      onValueChange(first.id)
      toast.success("Đã upload ảnh — đã điền file id")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload thất bại")
    } finally {
      e.target.value = ""
      setBusy(false)
    }
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
        <Input
          id={htmlId}
          className="flex-1 min-w-[14rem]"
          placeholder="file_… (tự điền sau upload, có thể sửa tay)"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        />
      </div>
    </div>
  )
}

const StorefrontCmsPage = () => {
  const [slides, setSlides] = useState<Slide[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    image_file_id: "",
    title_vi: "",
    title_en: "",
    subtitle_vi: "",
    subtitle_en: "",
    cta_vi: "",
    cta_en: "",
    target_url: "",
  })
  const [setFormState, setSetForm] = useState({
    logo_file_id: "",
    site_title: "",
    default_locale: "vi",
    en_enabled: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, gRes] = await Promise.all([
        adminFetch("/admin/custom/banner-slides") as Promise<{
          banner_slides: Slide[]
        }>,
        adminFetch("/admin/custom/cms-settings") as Promise<{
          cms_settings: Settings
        }>,
      ])
      setSlides(sRes.banner_slides ?? [])
      const s = gRes.cms_settings
      setSettings(s)
      const enabled = (s.enabled_locales as string[]) ?? []
      setSetForm({
        logo_file_id: s.logo_file_id ?? "",
        site_title: s.site_title ?? "",
        default_locale: s.default_locale ?? "vi",
        en_enabled: enabled.includes("en"),
      })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const addSlide = async () => {
    try {
      await adminFetch("/admin/custom/banner-slides", {
        method: "POST",
        body: JSON.stringify({
          image_file_id: form.image_file_id,
          title: { vi: form.title_vi, en: form.title_en },
          subtitle: { vi: form.subtitle_vi, en: form.subtitle_en },
          cta_label: { vi: form.cta_vi, en: form.cta_en },
          target_url: form.target_url || "",
        }),
      })
      toast.success("Slide created")
      setForm({
        image_file_id: "",
        title_vi: "",
        title_en: "",
        subtitle_vi: "",
        subtitle_en: "",
        cta_vi: "",
        cta_en: "",
        target_url: "",
      })
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Create failed")
    }
  }

  const reorder = async (ordered: Slide[]) => {
    await adminFetch("/admin/custom/banner-slides/reorder", {
      method: "PATCH",
      body: JSON.stringify({ ordered_ids: ordered.map((s) => s.id) }),
    })
    await load()
  }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...slides]
    const j = index + dir
    if (j < 0 || j >= next.length) {
      return
    }
    ;[next[index], next[j]] = [next[j], next[index]]
    void reorder(next)
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this slide?")) {
      return
    }
    try {
      await adminFetch(`/admin/custom/banner-slides/${id}`, {
        method: "DELETE",
      })
      toast.success("Deleted")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const toggleEnabled = async (s: Slide) => {
    try {
      await adminFetch(`/admin/custom/banner-slides/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !s.is_active }),
      })
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  const saveSettings = async () => {
    try {
      const enabled_locales = ["vi", ...(setFormState.en_enabled ? ["en"] : [])]
      await adminFetch("/admin/custom/cms-settings", {
        method: "PATCH",
        body: JSON.stringify({
          default_locale: setFormState.default_locale,
          enabled_locales,
          logo_file_id: setFormState.logo_file_id || null,
          site_title: setFormState.site_title.trim() || null,
        }),
      })
      toast.success("Settings saved")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  if (loading && !settings) {
    return (
      <Container className="p-8">
        <Text>Loading…</Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-8 flex flex-col gap-8">
      <div>
        <Heading className="mb-2">Storefront &amp; nội dung</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Banner slider và logo / ngôn ngữ (API đã bảo vệ session Admin).
        </Text>
      </div>

      <section className="pt-8 flex flex-col gap-4">
        <Heading level="h2">Cấu hình chung</Heading>
        <div className="grid max-w-xl gap-4">
          <ImageUploadField
            htmlId="cms-logo-file-id"
            label="Logo (upload hoặc dán file id)"
            value={setFormState.logo_file_id}
            onValueChange={(v) =>
              setSetForm((s) => ({ ...s, logo_file_id: v }))
            }
          />
          <div>
            <Label>Tên hiển thị header (khi không có logo hoặc làm alt ảnh)</Label>
            <Input
              placeholder="VD: TayA Store"
              value={setFormState.site_title}
              onChange={(e) =>
                setSetForm((s) => ({ ...s, site_title: e.target.value }))
              }
            />
            <Text size="small" className="text-ui-fg-muted mt-1">
              Storefront lấy từ đây thay cho tiêu đề cố định &quot;Medusa Store&quot;.
            </Text>
          </div>
          <div>
            <Label>Default locale</Label>
            <Input
              value={setFormState.default_locale}
              onChange={(e) =>
                setSetForm((s) => ({
                  ...s,
                  default_locale: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={setFormState.en_enabled}
              onCheckedChange={(v) =>
                setSetForm((s) => ({ ...s, en_enabled: v }))
              }
            />
            <Label>Bật English</Label>
          </div>
          <Button onClick={() => void saveSettings()}>Lưu cấu hình</Button>
        </div>
      </section>

      <section className="pt-8 flex flex-col gap-4">
        <Heading level="h2">Banner slides</Heading>
        <div className="grid max-w-xl gap-3 border border-ui-border-base p-4 rounded-md">
          <Text size="small" weight="plus">
            Thêm slide — ảnh nền
          </Text>
          <ImageUploadField
            htmlId="cms-slide-image-file-id"
            label="Ảnh slide"
            value={form.image_file_id}
            onValueChange={(v) => setForm((f) => ({ ...f, image_file_id: v }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Title VI"
              value={form.title_vi}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_vi: e.target.value }))
              }
            />
            <Input
              placeholder="Title EN"
              value={form.title_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_en: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Subtitle VI"
              value={form.subtitle_vi}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtitle_vi: e.target.value }))
              }
            />
            <Input
              placeholder="Subtitle EN"
              value={form.subtitle_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtitle_en: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="CTA VI"
              value={form.cta_vi}
              onChange={(e) => setForm((f) => ({ ...f, cta_vi: e.target.value }))}
            />
            <Input
              placeholder="CTA EN"
              value={form.cta_en}
              onChange={(e) => setForm((f) => ({ ...f, cta_en: e.target.value }))}
            />
          </div>
          <Input
            placeholder="Target URL"
            value={form.target_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, target_url: e.target.value }))
            }
          />
          <Button onClick={() => void addSlide()}>Thêm slide</Button>
        </div>

        <ul className="flex flex-col gap-3">
          {slides.map((s, i) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-3 border border-ui-border-base p-3 rounded-md"
            >
              <Badge color={s.is_active ? "green" : "grey"}>
                {s.is_active ? "active" : "off"}
              </Badge>
              <Text>
                {(s.title?.vi || s.title?.en || "").slice(0, 40) || s.id}
              </Text>
              <div className="flex gap-1">
                <Button size="small" variant="secondary" onClick={() => move(i, -1)}>
                  ↑
                </Button>
                <Button size="small" variant="secondary" onClick={() => move(i, 1)}>
                  ↓
                </Button>
              </div>
              <Button
                size="small"
                variant="secondary"
                onClick={() => void toggleEnabled(s)}
              >
                Toggle
              </Button>
              <Button
                size="small"
                variant="danger"
                onClick={() => void remove(s.id)}
              >
                Xóa
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Storefront CMS",
  rank: 42,
})

export default StorefrontCmsPage
