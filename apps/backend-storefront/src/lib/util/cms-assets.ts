/**
 * Base URL để trình duyệt load ảnh/file Medusa.
 * Luôn ưu tiên NEXT_PUBLIC_* (SSR/HTML gửi về client không được dùng hostname Docker nội bộ).
 */
export function getMedusaAssetBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
    "http://localhost:9000"
  )
}

const INTERNAL_FILE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "medusa-backend-1",
])

function shouldRewriteMedusaFileOrigin(hostname: string, pathname: string): boolean {
  if (!pathname.startsWith("/static")) {
    return false
  }
  return INTERNAL_FILE_HOSTS.has(hostname)
}

/**
 * Chuẩn hoá URL ảnh Medusa cho trình duyệt:
 * - Path tương đối `/static/...` → nối với origin public.
 * - URL tuyệt đối nhưng host nội bộ / localhost (file-local seed cũ) → thay origin bằng public.
 */
export function normalizeMedusaAssetUrl(
  url: string | null | undefined
): string | null {
  if (url == null) {
    return null
  }
  const u = String(url).trim()
  if (!u) {
    return null
  }

  const publicBase = getMedusaAssetBaseUrl()

  if (/^https?:\/\//i.test(u)) {
    try {
      const parsed = new URL(u)
      const portOk = !parsed.port || parsed.port === "9000"
      if (
        portOk &&
        shouldRewriteMedusaFileOrigin(parsed.hostname, parsed.pathname)
      ) {
        return `${publicBase}${parsed.pathname}${parsed.search}${parsed.hash}`
      }
    } catch {
      /* ignore */
    }
    return u
  }

  return `${publicBase}${u.startsWith("/") ? u : `/${u}`}`
}

/** @deprecated dùng getMedusaAssetBaseUrl */
export function getMedusaBackendUrl(): string {
  return getMedusaAssetBaseUrl()
}

/**
 * File module có thể trả URL tuyệt đối (localhost) hoặc tương đối — luôn đưa về URL trình duyệt load được.
 */
export function absolutizeMedusaFileUrl(url: string | null | undefined): string | null {
  return normalizeMedusaAssetUrl(url)
}

/** True if URL points to an SVG (ignores query/hash). Next/Image does not optimize remote SVG. */
export function isSvgAssetUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false
  }
  try {
    const pathname = new URL(url, "https://placeholder.local").pathname
    return /\.svg$/i.test(pathname)
  } catch {
    return /\.svg(\?|#|$)/i.test(url)
  }
}
