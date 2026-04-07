declare const __BACKEND_URL__: string | undefined

export type AdminUploadedFile = { id: string; url?: string }

export const CMS_MEDIA_SESSION_STORAGE_KEY = "cms_media_recent_upload_ids"
export const CMS_MEDIA_SESSION_MAX = 30

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

export function parseUploadResponsePayload(json: unknown): AdminUploadedFile[] {
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
export async function adminUploadFiles(
  fileList: FileList | File[]
): Promise<AdminUploadedFile[]> {
  const asArray = Array.from(fileList)

  if (typeof window !== "undefined") {
    const sdk = (window as WindowWithMedusaSdk).__sdk
    if (sdk?.admin?.upload?.create) {
      const body =
        fileList instanceof FileList ? fileList : { files: asArray }
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

export function readRecentCmsMediaIds(): string[] {
  if (typeof sessionStorage === "undefined") {
    return []
  }
  try {
    const raw = sessionStorage.getItem(CMS_MEDIA_SESSION_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    )
  } catch {
    return []
  }
}

export function pushRecentCmsMediaId(id: string): void {
  if (typeof sessionStorage === "undefined") {
    return
  }
  const t = id.trim()
  if (!t) {
    return
  }
  const cur = readRecentCmsMediaIds()
  const next = [t, ...cur.filter((x) => x !== t)].slice(0, CMS_MEDIA_SESSION_MAX)
  sessionStorage.setItem(CMS_MEDIA_SESSION_STORAGE_KEY, JSON.stringify(next))
}
