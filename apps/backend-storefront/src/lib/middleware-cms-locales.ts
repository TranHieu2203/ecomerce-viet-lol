import { ALL_APP_LOCALE_CODES, DEFAULT_LOCALE, isAppLocale } from "@lib/util/locales"

const CMS_CACHE_MS = 60_000
let cache: { at: number; enabled: string[]; defaultLocale: string } | null =
  null

/**
 * Lấy `enabled_locales` + `default_locale` cho middleware (FR-17).
 * Cache ngắn trong memory process để giảm tải Store API.
 */
export async function getCmsLocalesForMiddleware(): Promise<{
  enabled: string[]
  defaultLocale: string
}> {
  const now = Date.now()
  if (cache && now - cache.at < CMS_CACHE_MS) {
    return { enabled: cache.enabled, defaultLocale: cache.defaultLocale }
  }

  const base =
    process.env.MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
    "http://localhost:9000"
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  try {
    const res = await fetch(`${base}/store/custom/cms-settings`, {
      headers: key ? { "x-publishable-api-key": key } : {},
    })
    if (!res.ok) {
      throw new Error(String(res.status))
    }
    const data = (await res.json()) as {
      enabled_locales?: unknown
      default_locale?: unknown
    }
    const raw = data.enabled_locales
    const enabledRaw = Array.isArray(raw)
      ? (raw.filter((x) => typeof x === "string") as string[])
      : [DEFAULT_LOCALE]
    const catalog = new Set(ALL_APP_LOCALE_CODES as readonly string[])
    const enabled = enabledRaw.filter((c) => catalog.has(c) && isAppLocale(c))
    const safeEnabled =
      enabled.length > 0 && enabled.includes("vi") ? enabled : ["vi", "en"]
    const dl =
      typeof data.default_locale === "string" && data.default_locale
        ? data.default_locale
        : DEFAULT_LOCALE
    const defaultLocale =
      safeEnabled.includes(dl) && isAppLocale(dl) ? dl : safeEnabled[0]

    cache = { at: now, enabled: safeEnabled, defaultLocale }
    return { enabled: safeEnabled, defaultLocale }
  } catch {
    const fallback = {
      enabled: ["vi", "en"] as string[],
      defaultLocale: DEFAULT_LOCALE,
    }
    cache = { at: now, ...fallback }
    return fallback
  }
}
