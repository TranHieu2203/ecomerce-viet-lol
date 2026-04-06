import type { AppLocale } from "./locales"

export type I18nBlock = Record<
  string,
  { title?: string; subtitle?: string; description?: string }
>

const FALLBACK: AppLocale = "vi"

export function resolveI18nField(
  i18n: I18nBlock | null | undefined,
  locale: string,
  field: "title" | "subtitle" | "description"
): string {
  if (!i18n || typeof i18n !== "object") {
    return ""
  }
  const primary = i18n[locale]?.[field]
  if (typeof primary === "string" && primary.length) {
    return primary
  }
  const fb = i18n[FALLBACK]?.[field]
  return typeof fb === "string" ? fb : ""
}

export function displayCollection(
  locale: string,
  title: string,
  metadata?: Record<string, unknown> | null
) {
  const i18n = metadata?.i18n as I18nBlock | undefined
  const t = resolveI18nField(i18n, locale, "title")
  const d = resolveI18nField(i18n, locale, "description")
  return {
    title: t || title,
    description: d,
  }
}

export function displayProduct(
  locale: string,
  title: string,
  description: string | null | undefined,
  metadata?: Record<string, unknown> | null
) {
  const i18n = metadata?.i18n as I18nBlock | undefined
  const t = resolveI18nField(i18n, locale, "title")
  const d = resolveI18nField(i18n, locale, "description")
  return {
    title: t || title,
    description: d || description || "",
  }
}
