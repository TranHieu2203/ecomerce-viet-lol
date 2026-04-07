import { parseAndValidateTitleJson, sanitizeCmsPageBody } from "./cms-page"

const SEO_TEXT_MAX = 500
const SOCIAL_MAX = 20

export class CmsSettingsValidationError extends Error {
  readonly status = 400
  constructor(message: string) {
    super(message)
    this.name = "CmsSettingsValidationError"
  }
}

function trimStr(v: unknown, max: number): string {
  const s = v == null ? "" : String(v).trim()
  return s.length > max ? s.slice(0, max) : s
}

/** Một trường i18n tùy chọn (meta title/description). */
function parseOptionalI18nField(
  raw: unknown,
  fieldLabel: string
): { vi: string; en: string } | null {
  if (raw === undefined || raw === null) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsSettingsValidationError(
      `${fieldLabel} phải là object với khóa vi và en (có thể rỗng)`
    )
  }
  const o = raw as Record<string, unknown>
  return {
    vi: trimStr(o.vi, SEO_TEXT_MAX),
    en: trimStr(o.en, SEO_TEXT_MAX),
  }
}

/**
 * `seo_defaults`: meta_title / meta_description theo locale (cả hai tùy chọn).
 */
export function parseSeoDefaults(raw: unknown): Record<string, unknown> | null {
  if (raw === null) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsSettingsValidationError("seo_defaults phải là object JSON")
  }
  const o = raw as Record<string, unknown>
  const meta_title = parseOptionalI18nField(o.meta_title, "seo_defaults.meta_title")
  const meta_description = parseOptionalI18nField(
    o.meta_description,
    "seo_defaults.meta_description"
  )
  const out: Record<string, unknown> = {}
  if (meta_title) {
    out.meta_title = meta_title
  }
  if (meta_description) {
    out.meta_description = meta_description
  }
  return out
}

export type FooterSocialLink = {
  url: string
  label?: { vi: string; en: string }
}

export function parseFooterContact(raw: unknown): Record<string, unknown> | null {
  if (raw === null) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsSettingsValidationError("footer_contact phải là object JSON")
  }
  const o = raw as Record<string, unknown>
  const hotline = trimStr(o.hotline, 80)
  const email = trimStr(o.email, 200)
  let social: FooterSocialLink[] = []
  if (o.social !== undefined && o.social !== null) {
    if (!Array.isArray(o.social)) {
      throw new CmsSettingsValidationError("footer_contact.social phải là mảng")
    }
    if (o.social.length > SOCIAL_MAX) {
      throw new CmsSettingsValidationError(
        `footer_contact.social tối đa ${SOCIAL_MAX} mục`
      )
    }
    social = o.social.map((item, i) => {
      if (!item || typeof item !== "object") {
        throw new CmsSettingsValidationError(`footer_contact.social[${i}] không hợp lệ`)
      }
      const s = item as Record<string, unknown>
      const url = trimStr(s.url, 2000)
      if (!url) {
        throw new CmsSettingsValidationError(
          `footer_contact.social[${i}]: url là bắt buộc`
        )
      }
      let label: { vi: string; en: string } | undefined
      if (s.label !== undefined && s.label !== null) {
        try {
          label = parseAndValidateTitleJson(s.label)
        } catch {
          throw new CmsSettingsValidationError(
            `footer_contact.social[${i}].label phải có vi và en`
          )
        }
      }
      return label ? { url, label } : { url }
    })
  }
  const out: Record<string, unknown> = {}
  if (hotline) {
    out.hotline = hotline
  }
  if (email) {
    out.email = email
  }
  if (social.length) {
    out.social = social
  }
  return Object.keys(out).length ? out : {}
}

export function parseAnnouncement(raw: unknown): Record<string, unknown> | null {
  if (raw === null) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsSettingsValidationError("announcement phải là object JSON")
  }
  const o = raw as Record<string, unknown>
  const enabled = Boolean(o.enabled)
  let text: { vi: string; en: string }
  try {
    text = parseAndValidateTitleJson(o.text)
  } catch {
    throw new CmsSettingsValidationError("announcement.text bắt buộc có vi và en")
  }
  const link_url =
    o.link_url === null || o.link_url === undefined || o.link_url === ""
      ? null
      : trimStr(o.link_url, 2000)
  const starts_at =
    o.starts_at === null || o.starts_at === undefined || o.starts_at === ""
      ? null
      : trimStr(o.starts_at, 40)
  const ends_at =
    o.ends_at === null || o.ends_at === undefined || o.ends_at === ""
      ? null
      : trimStr(o.ends_at, 40)
  return {
    enabled,
    text,
    link_url,
    starts_at,
    ends_at,
  }
}

export function parseNotFound(raw: unknown): Record<string, unknown> | null {
  if (raw === null) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsSettingsValidationError("not_found phải là object JSON")
  }
  const o = raw as Record<string, unknown>
  let title: { vi: string; en: string }
  try {
    title = parseAndValidateTitleJson(o.title)
  } catch {
    throw new CmsSettingsValidationError("not_found.title bắt buộc có vi và en")
  }
  let bodyTitle: { vi: string; en: string }
  try {
    bodyTitle = parseAndValidateTitleJson(o.body)
  } catch {
    throw new CmsSettingsValidationError("not_found.body bắt buộc có vi và en")
  }
  const bodyVi = sanitizeCmsPageBody(bodyTitle.vi) ?? ""
  const bodyEn = sanitizeCmsPageBody(bodyTitle.en) ?? ""
  return {
    title,
    body: { vi: bodyVi, en: bodyEn },
  }
}
