/** URL gốc Medusa (server); trùng với sdk baseUrl. */
export function getMedusaBackendUrl(): string {
  return (
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
    "http://localhost:9000"
  )
}

/**
 * File module thường trả URL tương đối (/static/...). Next/Image cần URL tuyệt đối trỏ về Medusa.
 */
export function absolutizeMedusaFileUrl(url: string | null | undefined): string | null {
  if (url == null) {
    return null
  }
  const u = String(url).trim()
  if (!u) {
    return null
  }
  if (/^https?:\/\//i.test(u)) {
    return u
  }
  const base = getMedusaBackendUrl()
  return `${base}${u.startsWith("/") ? u : `/${u}`}`
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
