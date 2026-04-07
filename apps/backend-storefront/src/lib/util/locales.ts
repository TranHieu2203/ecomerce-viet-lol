/**
 * Mã locale storefront tối đa (FR-17). URL prefix phải khớp một trong các mã này;
 * bật/tắt theo `enabled_locales` từ CMS.
 */
export const ALL_APP_LOCALE_CODES = ["vi", "en", "ja"] as const
export type AppLocale = (typeof ALL_APP_LOCALE_CODES)[number]

/** @deprecated Dùng ALL_APP_LOCALE_CODES; giữ alias cho import cũ. */
export const SUPPORTED_LOCALES = ALL_APP_LOCALE_CODES

export const DEFAULT_LOCALE: AppLocale = "vi"

export function isAppLocale(s: string): s is AppLocale {
  return (ALL_APP_LOCALE_CODES as readonly string[]).includes(s)
}
