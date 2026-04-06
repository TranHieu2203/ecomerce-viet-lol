/** Chỉ hai ngôn ngữ được hỗ trợ (đồng bộ README / architecture). */
export const SUPPORTED_LOCALES = ["vi", "en"] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = "vi"

export function isAppLocale(s: string): s is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(s)
}
