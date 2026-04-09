import {
  assertValidCmsPageSlug,
  CmsPageValidationError,
  parseAndValidatePageSeoJson,
  parseAndValidateTitleJson,
  sanitizeCmsPageBody,
} from "./cms-page"

export class CmsNewsValidationError extends Error {
  readonly status = 400
  constructor(message: string) {
    super(message)
    this.name = "CmsNewsValidationError"
  }
}

export { assertValidCmsPageSlug, CmsPageValidationError }

/** Mô tả ngắn song ngữ; có thể null nếu cả hai rỗng. */
export function parseAndValidateExcerptI18nJson(
  raw: unknown
): Record<string, string> | null {
  if (raw === undefined || raw === null) {
    return null
  }
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsNewsValidationError("excerpt phải là object JSON hoặc null")
  }
  const o = raw as Record<string, unknown>
  const vi = o.vi == null ? "" : String(o.vi).trim()
  const en = o.en == null ? "" : String(o.en).trim()
  if (!vi && !en) {
    return null
  }
  return { vi, en }
}

function sanitizeBodyLocale(s: string): string {
  const out = sanitizeCmsPageBody(s)
  return out == null ? "" : out
}

/** Nội dung HTML theo locale; bắt buộc khóa vi và en (ADR-20). */
export function parseAndValidateBodyHtmlI18nJson(
  raw: unknown
): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new CmsNewsValidationError(
      "body_html phải là object JSON với khóa vi và en"
    )
  }
  const o = raw as Record<string, unknown>
  if (!("vi" in o) || !("en" in o)) {
    throw new CmsNewsValidationError("body_html bắt buộc có đủ khóa vi và en")
  }
  return {
    vi: sanitizeBodyLocale(o.vi == null ? "" : String(o.vi)),
    en: sanitizeBodyLocale(o.en == null ? "" : String(o.en)),
  }
}

export function parseNewsSeoJson(raw: unknown): Record<string, unknown> | null {
  if (raw === undefined) {
    throw new CmsNewsValidationError("seo không hợp lệ")
  }
  if (raw === null) {
    return null
  }
  try {
    const p = parseAndValidatePageSeoJson(raw)
    return p && Object.keys(p as object).length > 0
      ? (p as Record<string, unknown>)
      : null
  } catch (e: unknown) {
    if (e instanceof CmsPageValidationError) {
      throw new CmsNewsValidationError(e.message)
    }
    throw e
  }
}

export function parseNewsTitleJson(raw: unknown): Record<string, string> {
  try {
    return parseAndValidateTitleJson(raw) as Record<string, string>
  } catch (e: unknown) {
    if (e instanceof CmsPageValidationError) {
      throw new CmsNewsValidationError(e.message)
    }
    throw e
  }
}
