export type I18nBlock = Record<
  string,
  { title?: string; subtitle?: string; description?: string }
>

const FALLBACK = "vi"

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
  const fallback = i18n[FALLBACK]?.[field]
  return typeof fallback === "string" ? fallback : ""
}

export function resolveI18nTitleDescription(
  i18n: I18nBlock | null | undefined,
  locale: string,
  baseTitle: string,
  baseDescription?: string | null
) {
  const t = resolveI18nField(i18n, locale, "title")
  const d = resolveI18nField(i18n, locale, "description")
  return {
    title: t || baseTitle,
    description:
      d || (typeof baseDescription === "string" ? baseDescription : ""),
  }
}
