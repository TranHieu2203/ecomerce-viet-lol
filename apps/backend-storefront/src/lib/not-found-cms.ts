import "server-only"

import { getCmsSettingsPublic } from "@lib/data/cms"
import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@lib/util/locales"
import { cookies } from "next/headers"

export async function resolveNotFoundLocale(): Promise<AppLocale> {
  try {
    const c = await cookies()
    const v = c.get("_medusa_locale")?.value
    if (v && isAppLocale(v)) {
      return v
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

export async function getNotFoundCopy(locale: AppLocale): Promise<{
  title: string
  bodyHtml: string
  metaTitle: string
  metaDescription: string
}> {
  const cms = await getCmsSettingsPublic()
  const nf = cms.not_found

  const fallbackTitle =
    locale === "en" ? "Page not found" : "Không tìm thấy trang"
  const fallbackBody =
    locale === "en"
      ? "<p>The page you tried to access does not exist.</p>"
      : "<p>Trang bạn truy cập không tồn tại.</p>"

  if (!nf) {
    return {
      title: fallbackTitle,
      bodyHtml: fallbackBody,
      metaTitle: "404",
      metaDescription:
        locale === "en"
          ? "Something went wrong"
          : "Không tìm thấy nội dung",
    }
  }

  const title =
    locale === "en"
      ? nf.title.en?.trim() || nf.title.vi?.trim() || fallbackTitle
      : nf.title.vi?.trim() || nf.title.en?.trim() || fallbackTitle

  const bodyRaw =
    locale === "en"
      ? nf.body.en?.trim() || nf.body.vi?.trim() || fallbackBody
      : nf.body.vi?.trim() || nf.body.en?.trim() || fallbackBody

  const bodyHtml = bodyRaw.startsWith("<") ? bodyRaw : `<p>${bodyRaw}</p>`

  const plain = bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

  return {
    title,
    bodyHtml,
    metaTitle: title.slice(0, 60),
    metaDescription: plain.slice(0, 160) || (locale === "en" ? "Not found" : "Không tìm thấy"),
  }
}
