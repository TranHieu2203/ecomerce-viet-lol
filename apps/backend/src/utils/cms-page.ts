/** Slug URL-safe: chữ thường, số, gạch ngang (Story 9.2 / FR-30). */
export const CMS_PAGE_SLUG_REGEX = /^[a-z0-9-]+$/

/** Giới hạn độ dài slug (index + URL hợp lý). */
export const CMS_PAGE_SLUG_MAX_LEN = 200

export type CmsPageTitleJson = { vi: string; en: string }

export function assertValidCmsPageSlug(slug: unknown): string {
  const s = typeof slug === "string" ? slug.trim() : ""
  if (!s || !CMS_PAGE_SLUG_REGEX.test(s)) {
    throw new CmsPageValidationError(
      "slug chỉ được gồm chữ thường, số và dấu gạch ngang (a-z, 0-9, -)"
    )
  }
  if (s.length > CMS_PAGE_SLUG_MAX_LEN) {
    throw new CmsPageValidationError(
      `slug không được dài quá ${CMS_PAGE_SLUG_MAX_LEN} ký tự`
    )
  }
  return s
}

export class CmsPageValidationError extends Error {
  readonly status = 400
  constructor(message: string) {
    super(message)
    this.name = "CmsPageValidationError"
  }
}

/** Title bắt buộc có key vi và en (chuỗi có thể rỗng). */
export function parseAndValidateTitleJson(raw: unknown): CmsPageTitleJson {
  if (!raw || typeof raw !== "object") {
    throw new CmsPageValidationError("title phải là object JSON với khóa vi và en")
  }
  const o = raw as Record<string, unknown>
  if (!("vi" in o) || !("en" in o)) {
    throw new CmsPageValidationError("title bắt buộc có đủ khóa vi và en")
  }
  return {
    vi: o.vi == null ? "" : String(o.vi),
    en: o.en == null ? "" : String(o.en),
  }
}

/**
 * Resolve trường i18n JSON `{ vi, en }` theo locale + enabled + default (giống nav-menu).
 */
export function resolveCmsPageI18nField(
  raw: unknown,
  locale: string,
  enabledLocales: string[],
  defaultLocale: string
): string {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const pick = (key: string): string =>
    obj[key] == null ? "" : String(obj[key])

  const order: string[] = []
  if (enabledLocales.includes(locale)) {
    order.push(locale)
  }
  if (locale !== "vi" && enabledLocales.includes("vi")) {
    order.push("vi")
  }
  if (locale !== "en" && enabledLocales.includes("en")) {
    order.push("en")
  }
  for (const loc of enabledLocales) {
    if (!order.includes(loc)) {
      order.push(loc)
    }
  }
  if (!order.includes(defaultLocale)) {
    order.push(defaultLocale)
  }

  for (const loc of order) {
    const v = pick(loc).trim()
    if (v.length) {
      return pick(loc)
    }
  }
  return pick("vi") || pick("en") || ""
}

/**
 * Sanitize nội dung HTML/text phía server: loại script, iframe, object/embed,
 * thuộc tính on*, URL nguy hiểm (MVP — vẫn không thay thế thư viện chuyên dụng).
 */
/** SEO từng trang / seo_defaults: meta theo locale, tất cả tùy chọn. */
export type CmsPageSeoJson = {
  meta_title?: { vi: string; en: string }
  meta_description?: { vi: string; en: string }
}

const SEO_META_MAX = 500

function normalizeSeoPair(
  raw: unknown,
  field: string
): { vi: string; en: string } | undefined {
  if (raw === undefined || raw === null) {
    return undefined
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsPageValidationError(
      `${field} phải là object với khóa vi và en (có thể rỗng)`
    )
  }
  const o = raw as Record<string, unknown>
  const vi = o.vi == null ? "" : String(o.vi).trim().slice(0, SEO_META_MAX)
  const en = o.en == null ? "" : String(o.en).trim().slice(0, SEO_META_MAX)
  if (!vi && !en) {
    return undefined
  }
  return { vi, en }
}

/** Chuẩn hoá JSON SEO trang; `null` = xoá SEO tùy chỉnh. */
export function parseAndValidatePageSeoJson(
  raw: unknown
): CmsPageSeoJson | null {
  if (raw === null) {
    return null
  }
  if (raw === undefined) {
    throw new CmsPageValidationError("seo không hợp lệ")
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsPageValidationError("seo phải là object JSON")
  }
  const o = raw as Record<string, unknown>
  const meta_title = normalizeSeoPair(o.meta_title, "seo.meta_title")
  const meta_description = normalizeSeoPair(
    o.meta_description,
    "seo.meta_description"
  )
  const out: CmsPageSeoJson = {}
  if (meta_title) {
    out.meta_title = meta_title
  }
  if (meta_description) {
    out.meta_description = meta_description
  }
  return Object.keys(out).length ? out : {}
}

export function sanitizeCmsPageBody(
  input: string | null | undefined
): string | null {
  if (input == null) {
    return null
  }
  let s = String(input)
  if (s === "") {
    return null
  }
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, "")
  s = s.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
  s = s.replace(/<object\b[\s\S]*?<\/object>/gi, "")
  s = s.replace(/<embed\b[^>]*\/?>/gi, "")
  // on* ngay sau tên thẻ (vd. <svg/onload=...>) hoặc sau khoảng trắng
  s = s.replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
  s = s.replace(/javascript:\s*/gi, "")
  s = s.replace(/vbscript:\s*/gi, "")
  s = s.replace(/data:\s*text\/html[^"'>\s]*/gi, "")
  return s
}
