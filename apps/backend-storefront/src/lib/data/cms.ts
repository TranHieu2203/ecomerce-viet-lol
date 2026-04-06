import { sdk } from "@lib/config"
import type { StorefrontMessages } from "@lib/i18n/storefront-messages"
import { absolutizeMedusaFileUrl } from "@lib/util/cms-assets"

export type BannerSlideResolved = {
  id: string
  title: string
  subtitle: string
  cta_label: string
  target_url: string | null
  image: { mobile?: string; desktop?: string } | null
  alt: string
}

/** JSON CMS `{ vi?, en? }` — chỉ chuỗi, storefront resolve theo locale. */
export type CmsLocaleStrings = Record<string, string> | null

export type CmsSettingsPublic = {
  default_locale: string
  enabled_locales: unknown
  logo_url: string | null
  /** Tên cửa hàng legacy (CMS); đã gộp env trong `getCmsSettingsPublic` khi API null. */
  site_title: string | null
  site_title_i18n: CmsLocaleStrings
  tagline_i18n: CmsLocaleStrings
}

/** Sau locale hiện tại, fallback `vi` trước khi để caller dùng legacy/env/messages (chốt sản phẩm 2026-04). */
function pickLocaleString(
  block: CmsLocaleStrings | undefined,
  locale: string
): string {
  if (!block || typeof block !== "object") {
    return ""
  }
  const primary = block[locale]
  if (typeof primary === "string" && primary.trim()) {
    return primary.trim()
  }
  const vi = block["vi"]
  if (typeof vi === "string" && vi.trim()) {
    return vi.trim()
  }
  return ""
}

function parseLocaleStrings(raw: unknown): CmsLocaleStrings {
  if (raw === null || raw === undefined) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }
  const o = raw as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const key of ["vi", "en"] as const) {
    const v = o[key]
    if (typeof v === "string" && v.trim()) {
      out[key] = v.trim()
    }
  }
  return Object.keys(out).length ? out : null
}

/**
 * Tên shop hiển thị: i18n CMS → legacy site_title (đã merge env) → env → lastResort (mặc định storeFallback).
 */
export function resolveCmsSiteTitle(
  locale: string,
  cms: CmsSettingsPublic,
  messages: StorefrontMessages,
  lastResortTitle?: string
): string {
  const fromI18n = pickLocaleString(cms.site_title_i18n ?? null, locale)
  if (fromI18n) {
    return fromI18n
  }
  const legacy = cms.site_title?.trim()
  if (legacy) {
    return legacy
  }
  const env = process.env.NEXT_PUBLIC_STORE_DISPLAY_NAME?.trim()
  if (env) {
    return env
  }
  return lastResortTitle ?? messages.checkout.storeFallback
}

/** Tagline: i18n CMS → copy tĩnh theo locale trong messages. */
export function resolveCmsTagline(
  locale: string,
  cms: CmsSettingsPublic,
  messages: StorefrontMessages
): string {
  const fromI18n = pickLocaleString(cms.tagline_i18n ?? null, locale)
  if (fromI18n) {
    return fromI18n
  }
  return messages.footer.tagline
}

const CMS_FALLBACK: CmsSettingsPublic = {
  default_locale: "vi",
  enabled_locales: ["vi", "en"],
  logo_url: null,
  site_title: null,
  site_title_i18n: null,
  tagline_i18n: null,
}

export async function listBannerSlides(locale: string) {
  return sdk.client
    .fetch<{ banner_slides: BannerSlideResolved[] }>(
      `/store/custom/banner-slides`,
      {
        method: "GET",
        query: { locale },
        next: { tags: ["cms"], revalidate: 180 },
        cache: "force-cache",
      }
    )
    .then((r) => r.banner_slides ?? [])
    .catch(() => [] as BannerSlideResolved[])
}

/**
 * Một response cache ISR cho mọi locale: `site_title_i18n` / `tagline_i18n` gồm cả vi+en;
 * resolve theo `countryCode` tại server component (không cần `?locale=` trên Store API).
 */
export async function getCmsSettingsPublic(): Promise<CmsSettingsPublic> {
  const data = await sdk.client
    .fetch<
      CmsSettingsPublic & {
        site_title_i18n?: unknown
        tagline_i18n?: unknown
      }
    >(`/store/custom/cms-settings`, {
      method: "GET",
      next: { tags: ["cms"], revalidate: 180 },
      cache: "force-cache",
    })
    .catch(() => ({ ...CMS_FALLBACK }))

  const envTitle = process.env.NEXT_PUBLIC_STORE_DISPLAY_NAME?.trim() || null
  const site_title =
    (typeof data.site_title === "string" && data.site_title.trim()) ||
    envTitle ||
    null

  return {
    ...data,
    logo_url: absolutizeMedusaFileUrl(data.logo_url),
    site_title,
    site_title_i18n: parseLocaleStrings(data.site_title_i18n),
    tagline_i18n: parseLocaleStrings(data.tagline_i18n),
  }
}
