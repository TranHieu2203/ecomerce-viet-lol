import "server-only"

import { cookies } from "next/headers"

import { sdk } from "@lib/config"
import type { StorefrontMessages } from "@lib/i18n/storefront-messages"
import { absolutizeMedusaFileUrl } from "@lib/util/cms-assets"
import { FetchError } from "@medusajs/js-sdk"
import { cache } from "react"

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

/** Payload Store API GET `/store/custom/cms-pages/:slug` (published hoặc preview). */
export type CmsPagePublic = {
  slug: string
  title: string
  body: string
  meta_title: string
  meta_description: string
  status?: string
}

export type CmsAnnouncementPublic = {
  enabled: boolean
  text: { vi: string; en: string }
  link_url: string | null
  starts_at: string | null
  ends_at: string | null
} | null

export type CmsNotFoundPublic = {
  title: { vi: string; en: string }
  body: { vi: string; en: string }
} | null

export type CmsSettingsPublic = {
  default_locale: string
  enabled_locales: unknown
  logo_url: string | null
  /** Tên cửa hàng legacy (CMS); đã gộp env trong `getCmsSettingsPublic` khi API null. */
  site_title: string | null
  site_title_i18n: CmsLocaleStrings
  tagline_i18n: CmsLocaleStrings
  /** ADR-13 — đã validate phía backend; SF chỉ đọc an toàn. */
  announcement: CmsAnnouncementPublic
  not_found: CmsNotFoundPublic
  seo_defaults: Record<string, unknown> | null
  og_image_url: string | null
  footer_contact: Record<string, unknown> | null
}

export type CmsSocialLinkResolved = {
  href: string
  label: string
  hostname: string
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
  for (const key of ["vi", "en", "ja"] as const) {
    const v = o[key]
    if (typeof v === "string" && v.trim()) {
      out[key] = v.trim()
    }
  }
  return Object.keys(out).length ? out : null
}

function safeHostnameFromUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl)
    return u.hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

function safeHttpUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl)
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return null
    }
    return u.toString()
  } catch {
    return null
  }
}

function pickSocialLabel(
  rawLabel: unknown,
  locale: string,
  fallback: string
): string {
  if (rawLabel && typeof rawLabel === "object" && !Array.isArray(rawLabel)) {
    const o = rawLabel as Record<string, unknown>
    const primary = typeof o[locale] === "string" ? String(o[locale]).trim() : ""
    if (primary) {
      return primary
    }
    const vi = typeof o.vi === "string" ? o.vi.trim() : ""
    if (vi) {
      return vi
    }
    const en = typeof o.en === "string" ? o.en.trim() : ""
    if (en) {
      return en
    }
  }
  return fallback
}

/**
 * Parse `footer_contact.social` (ADR-13) thành list link an toàn để render UI.
 */
export function resolveCmsSocialLinks(
  cms: CmsSettingsPublic,
  locale: string,
  fallbackLabel: string
): CmsSocialLinkResolved[] {
  const fc = cms.footer_contact
  const rawSocial =
    fc && typeof fc === "object" && !Array.isArray(fc)
      ? (fc as Record<string, unknown>).social
      : null

  if (!Array.isArray(rawSocial)) {
    return []
  }

  const out: CmsSocialLinkResolved[] = []
  for (const item of rawSocial) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue
    }
    const o = item as Record<string, unknown>
    const urlRaw = typeof o.url === "string" ? o.url.trim() : ""
    if (!urlRaw) {
      continue
    }
    const href = safeHttpUrl(urlRaw)
    if (!href) {
      continue
    }
    const hostname = safeHostnameFromUrl(href)
    const label = pickSocialLabel(o.label, locale, hostname || fallbackLabel)
    out.push({ href, label, hostname: hostname || "" })
  }
  return out
}

/** Hotline & email từ `footer_contact` (ADR-13), để hiển thị chân trang. */
export function resolveCmsFooterContactPlain(cms: CmsSettingsPublic): {
  hotline: string
  email: string
} {
  const fc = cms.footer_contact
  if (!fc || typeof fc !== "object" || Array.isArray(fc)) {
    return { hotline: "", email: "" }
  }
  const o = fc as Record<string, unknown>
  const hotline = typeof o.hotline === "string" ? o.hotline.trim() : ""
  const email = typeof o.email === "string" ? o.email.trim() : ""
  return { hotline, email }
}

function parseAnnouncementSafe(raw: unknown): CmsAnnouncementPublic {
  if (raw === null || raw === undefined) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }
  const o = raw as Record<string, unknown>
  const textRaw = o.text
  if (typeof textRaw !== "object" || textRaw === null || Array.isArray(textRaw)) {
    return null
  }
  const t = textRaw as Record<string, unknown>
  const vi = typeof t.vi === "string" ? t.vi : ""
  const en = typeof t.en === "string" ? t.en : ""
  return {
    enabled: Boolean(o.enabled),
    text: { vi, en },
    link_url:
      o.link_url === null || o.link_url === undefined || o.link_url === ""
        ? null
        : String(o.link_url).trim() || null,
    starts_at:
      o.starts_at === null || o.starts_at === undefined || o.starts_at === ""
        ? null
        : String(o.starts_at).trim(),
    ends_at:
      o.ends_at === null || o.ends_at === undefined || o.ends_at === ""
        ? null
        : String(o.ends_at).trim(),
  }
}

function parseNotFoundSafe(raw: unknown): CmsNotFoundPublic {
  if (raw === null || raw === undefined) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    return null
  }
  const o = raw as Record<string, unknown>
  const titleRaw = o.title
  const bodyRaw = o.body
  if (typeof titleRaw !== "object" || titleRaw === null) {
    return null
  }
  if (typeof bodyRaw !== "object" || bodyRaw === null) {
    return null
  }
  const title = titleRaw as Record<string, unknown>
  const body = bodyRaw as Record<string, unknown>
  return {
    title: {
      vi: typeof title.vi === "string" ? title.vi : "",
      en: typeof title.en === "string" ? title.en : "",
    },
    body: {
      vi: typeof body.vi === "string" ? body.vi : "",
      en: typeof body.en === "string" ? body.en : "",
    },
  }
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
  announcement: null,
  not_found: null,
  seo_defaults: null,
  og_image_url: null,
  footer_contact: null,
}

export async function listBannerSlides(locale: string) {
  const jar = await cookies()
  const visitorId = jar.get("_medusa_cache_id")?.value ?? "anon"
  return sdk.client
    .fetch<{ banner_slides: BannerSlideResolved[] }>(
      `/store/custom/banner-slides`,
      {
        method: "GET",
        query: { locale, visitor_id: visitorId },
        headers: { "x-medusa-cache-id": visitorId },
        next: { tags: ["cms"], revalidate: 180 },
        cache: "force-cache",
      }
    )
    .then((r) => r.banner_slides ?? [])
    .catch(() => [] as BannerSlideResolved[])
}

async function fetchCmsSettingsPublic(): Promise<CmsSettingsPublic> {
  const data = await sdk.client
    .fetch<
      CmsSettingsPublic & {
        site_title_i18n?: unknown
        tagline_i18n?: unknown
        announcement?: unknown
        not_found?: unknown
        seo_defaults?: unknown
        og_image_url?: unknown
        footer_contact?: unknown
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

  const seo_defaults =
    data.seo_defaults !== null &&
    data.seo_defaults !== undefined &&
    typeof data.seo_defaults === "object" &&
    !Array.isArray(data.seo_defaults)
      ? (data.seo_defaults as Record<string, unknown>)
      : null

  const footer_contact =
    data.footer_contact !== null &&
    data.footer_contact !== undefined &&
    typeof data.footer_contact === "object" &&
    !Array.isArray(data.footer_contact)
      ? (data.footer_contact as Record<string, unknown>)
      : null

  return {
    ...data,
    logo_url: absolutizeMedusaFileUrl(data.logo_url),
    site_title,
    site_title_i18n: parseLocaleStrings(data.site_title_i18n),
    tagline_i18n: parseLocaleStrings(data.tagline_i18n),
    announcement: parseAnnouncementSafe(data.announcement),
    not_found: parseNotFoundSafe(data.not_found),
    seo_defaults,
    og_image_url: absolutizeMedusaFileUrl(
      typeof data.og_image_url === "string" ? data.og_image_url : null
    ),
    footer_contact,
  }
}

/**
 * Một response cache ISR cho mọi locale: `site_title_i18n` / `tagline_i18n` gồm cả vi+en;
 * resolve theo `countryCode` tại server component (không cần `?locale=` trên Store API).
 */
export const getCmsSettingsPublic = cache(fetchCmsSettingsPublic)

export const CMS_PAGE_CACHE_REVALIDATE_SECONDS = 180

async function fetchCmsPagePublic(
  slug: string,
  locale: string,
  previewToken?: string
): Promise<CmsPagePublic | null> {
  const query: Record<string, string> = { locale }
  if (previewToken) {
    query.cms_preview = previewToken
  }
  const isPreview = Boolean(previewToken)

  try {
    const data = await sdk.client.fetch<CmsPagePublic>(
      `/store/custom/cms-pages/${encodeURIComponent(slug)}`,
      {
        method: "GET",
        query,
        next: isPreview
          ? undefined
          : {
              tags: ["cms-pages"],
              revalidate: CMS_PAGE_CACHE_REVALIDATE_SECONDS,
            },
        cache: isPreview ? "no-store" : "force-cache",
      }
    )
    return data
  } catch (e) {
    if (e instanceof FetchError && e.status === 404) {
      return null
    }
    throw e
  }
}

/** ISR tag `cms-pages`; preview: `cache: no-store`, không tag. */
export const getCmsPagePublic = cache(fetchCmsPagePublic)

export type CmsNewsListItem = {
  slug: string
  title: string
  excerpt: string
  published_at: string | null
  featured_image_url: string | null
}

export type CmsNewsTaxonomyItem = {
  slug: string
  title: string
}

export type CmsNewsArticlePublic = {
  slug: string
  title: string
  excerpt: string
  body: string
  meta_title: string
  meta_description: string
  published_at: string | null
  featured_image_url: string | null
  status?: string
  categories?: CmsNewsTaxonomyItem[]
  tags?: CmsNewsTaxonomyItem[]
}

export const CMS_NEWS_CACHE_REVALIDATE_SECONDS = 180

export type CmsNewsListResult = {
  articles: CmsNewsListItem[]
  count: number
}

export type CmsNewsListFilters = {
  category_slug?: string
  tag_slug?: string
}

async function fetchCmsNewsList(
  locale: string,
  limit: number,
  offset: number,
  filters?: CmsNewsListFilters
): Promise<CmsNewsListResult> {
  try {
    const query: Record<string, string> = {
      locale,
      limit: String(limit),
      offset: String(offset),
    }
    if (filters?.category_slug?.trim()) {
      query.category_slug = filters.category_slug.trim().toLowerCase()
    }
    if (filters?.tag_slug?.trim()) {
      query.tag_slug = filters.tag_slug.trim().toLowerCase()
    }
    const data = await sdk.client.fetch<{
      articles: CmsNewsListItem[]
      count?: number
    }>(`/store/custom/cms-news`, {
      method: "GET",
      query,
      next: {
        tags: ["cms-news"],
        revalidate: CMS_NEWS_CACHE_REVALIDATE_SECONDS,
      },
      cache: "force-cache",
    })
    const rows = data.articles ?? []
    const count =
      typeof data.count === "number" && Number.isFinite(data.count)
        ? data.count
        : rows.length
    return {
      articles: rows.map((a) => ({
        ...a,
        featured_image_url: absolutizeMedusaFileUrl(a.featured_image_url),
      })),
      count,
    }
  } catch {
    return { articles: [], count: 0 }
  }
}

export const getCmsNewsList = cache(fetchCmsNewsList)

export type CmsNewsCategoryNav = {
  slug: string
  title: string
  parent_slug: string | null
}

async function fetchCmsNewsCategories(
  locale: string
): Promise<CmsNewsCategoryNav[]> {
  try {
    const data = await sdk.client.fetch<{ categories: CmsNewsCategoryNav[] }>(
      `/store/custom/cms-news/categories`,
      {
        method: "GET",
        query: { locale },
        next: {
          tags: ["cms-news"],
          revalidate: CMS_NEWS_CACHE_REVALIDATE_SECONDS,
        },
        cache: "force-cache",
      }
    )
    return data.categories ?? []
  } catch {
    return []
  }
}

export const getCmsNewsCategories = cache(fetchCmsNewsCategories)

export type CmsNewsTagNav = {
  slug: string
  title: string
}

async function fetchCmsNewsTags(locale: string): Promise<CmsNewsTagNav[]> {
  try {
    const data = await sdk.client.fetch<{ tags: CmsNewsTagNav[] }>(
      `/store/custom/cms-news/tags`,
      {
        method: "GET",
        query: { locale },
        next: {
          tags: ["cms-news"],
          revalidate: CMS_NEWS_CACHE_REVALIDATE_SECONDS,
        },
        cache: "force-cache",
      }
    )
    return data.tags ?? []
  } catch {
    return []
  }
}

export const getCmsNewsTags = cache(fetchCmsNewsTags)

async function fetchCmsNewsArticle(
  slug: string,
  locale: string,
  previewToken?: string
): Promise<CmsNewsArticlePublic | null> {
  const query: Record<string, string> = { locale }
  if (previewToken) {
    query.cms_preview = previewToken
  }
  const isPreview = Boolean(previewToken)

  try {
    const data = await sdk.client.fetch<CmsNewsArticlePublic>(
      `/store/custom/cms-news/${encodeURIComponent(slug)}`,
      {
        method: "GET",
        query,
        next: isPreview
          ? undefined
          : {
              tags: ["cms-news"],
              revalidate: CMS_NEWS_CACHE_REVALIDATE_SECONDS,
            },
        cache: isPreview ? "no-store" : "force-cache",
      }
    )
    return {
      ...data,
      featured_image_url: absolutizeMedusaFileUrl(data.featured_image_url),
    }
  } catch (e) {
    if (e instanceof FetchError && e.status === 404) {
      return null
    }
    throw e
  }
}

/** ISR tag `cms-news`. */
export const getCmsNewsArticle = cache(fetchCmsNewsArticle)
