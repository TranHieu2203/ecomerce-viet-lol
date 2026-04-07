import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { CMS_PAGE_STATUS } from "../../../../../modules/store-cms/models/store-cms-page"
import {
  resolveCmsPageI18nField,
} from "../../../../../utils/cms-page"
import { verifyCmsPreviewToken } from "../../../../../utils/cms-preview-token"

export const AUTHENTICATE = false

/** AC8: token qua query `cms_preview` hoặc header `x-cms-preview`. */
function resolveCmsPreviewToken(req: MedusaRequest): string | undefined {
  const q = req.query?.cms_preview
  if (typeof q === "string" && q.length > 0) {
    return q
  }
  const h = req.headers?.["x-cms-preview"]
  if (typeof h === "string" && h.trim().length > 0) {
    return h.trim()
  }
  if (Array.isArray(h) && typeof h[0] === "string" && h[0].trim().length > 0) {
    return h[0].trim()
  }
  return undefined
}

export async function GET(
  req: MedusaRequest<{ slug: string }>,
  res: MedusaResponse
) {
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
  const qLocale = (req.query?.locale as string | undefined)?.trim()
  const locale = (qLocale && qLocale.length ? qLocale : defaultLocale).toLowerCase()

  if (!enabled.includes(locale)) {
    return res.status(400).json({ message: "locale không được hỗ trợ" })
  }

  const slugParam = req.params.slug?.trim()
  if (!slugParam) {
    return res.status(404).json({ message: "Not found" })
  }

  const rows = await cms.listStoreCmsPages({ slug: slugParam })
  const page = rows[0]
  if (!page) {
    return res.status(404).json({ message: "Not found" })
  }

  const previewToken = resolveCmsPreviewToken(req)

  const secret = process.env.CMS_PREVIEW_SECRET?.trim()
  let previewOk = false
  if (previewToken && secret) {
    const v = verifyCmsPreviewToken(previewToken, secret)
    previewOk =
      !!v && v.pageId === page.id && v.slug === page.slug
  }

  if (!previewOk && page.status !== CMS_PAGE_STATUS.PUBLISHED) {
    return res.status(404).json({ message: "Not found" })
  }

  const title = resolveCmsPageI18nField(
    page.title,
    locale,
    enabled,
    defaultLocale
  )
  const bodyHtml =
    page.body == null ? "" : String(page.body)

  if (previewOk) {
    res.setHeader("Cache-Control", "private, no-store")
  }

  const pageSeo = (page as { seo?: unknown }).seo
  const seoObj =
    pageSeo && typeof pageSeo === "object" && !Array.isArray(pageSeo)
      ? (pageSeo as Record<string, unknown>)
      : null
  const meta_title = resolveCmsPageI18nField(
    seoObj?.meta_title ?? null,
    locale,
    enabled,
    defaultLocale
  )
  const meta_description = resolveCmsPageI18nField(
    seoObj?.meta_description ?? null,
    locale,
    enabled,
    defaultLocale
  )

  const payload: Record<string, string> = {
    slug: page.slug,
    title,
    body: bodyHtml,
    meta_title: meta_title,
    meta_description: meta_description,
  }
  if (previewOk) {
    payload.status = page.status
  }
  res.json(payload)
}
