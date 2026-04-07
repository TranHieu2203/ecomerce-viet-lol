/** Khóa locale storefront tối đa (FR-17); catalog trong Admin. */
export const LOCALE_KEY_CATALOG = ["vi", "en", "ja"] as const

export type LocaleCatalogKey = (typeof LOCALE_KEY_CATALOG)[number]

export function parseBannerLang(
  obj: unknown,
  keys: readonly string[] = LOCALE_KEY_CATALOG
): Record<string, string> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    const empty: Record<string, string> = {}
    for (const k of keys) {
      empty[k] = ""
    }
    return empty
  }
  const o = obj as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const k of keys) {
    out[k] = String(o[k] ?? "")
  }
  return out
}
