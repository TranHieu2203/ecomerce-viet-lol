import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { resolveCmsPageI18nField } from "../../../../../utils/cms-page"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const settings = await cms.getOrCreateSettings()
  const enabled = settings.enabled_locales as unknown as string[]
  if (!Array.isArray(enabled) || enabled.length < 1) {
    return res.status(500).json({ message: "CMS enabled_locales invalid" })
  }
  const defaultLocale =
    typeof settings.default_locale === "string"
      ? settings.default_locale
      : "vi"
  const qLocale =
    ((req.query?.locale as string | undefined) ?? (() => {
      try {
        const u = new URL(req.url ?? "", "http://localhost")
        const v = u.searchParams.get("locale")
        return v ?? undefined
      } catch {
        return undefined
      }
    })())?.trim()
  const locale = (qLocale && qLocale.length ? qLocale : defaultLocale).toLowerCase()
  if (!enabled.includes(locale)) {
    return res.status(400).json({ message: "locale không được hỗ trợ" })
  }

  const rows = await cms.listStoreCmsNewsTags({}, { order: { slug: "ASC" } })
  const items = rows.map((t) => ({
    slug: t.slug,
    title: resolveCmsPageI18nField(
      t.title_i18n,
      locale,
      enabled,
      defaultLocale
    ),
  }))
  res.json({ tags: items })
}
