import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { CMS_NEWS_STATUS } from "../../../../../modules/store-cms/models/store-cms-news-article"
import { resolveCmsPageI18nField } from "../../../../../utils/cms-page"
import { verifyCmsPreviewToken } from "../../../../../utils/cms-preview-token"
import {
  getArticleCategoryIds,
  getArticleTagIds,
} from "../../../../../utils/cms-news-taxonomy"

export const AUTHENTICATE = false

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

async function filePublicUrl(
  req: MedusaRequest,
  fileId: string | null | undefined
): Promise<string | null> {
  if (!fileId || typeof fileId !== "string") {
    return null
  }
  try {
    const fileModule = req.scope.resolve(Modules.FILE) as IFileModuleService
    const f = await fileModule.retrieveFile(fileId.trim())
    return typeof f.url === "string" ? f.url : null
  } catch {
    return null
  }
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

  const slugParam = req.params.slug?.trim()
  if (!slugParam) {
    return res.status(404).json({ message: "Not found" })
  }

  const rows = await cms.listStoreCmsNewsArticles({ slug: slugParam })
  const article = rows[0]
  if (!article) {
    return res.status(404).json({ message: "Not found" })
  }

  const previewToken = resolveCmsPreviewToken(req)
  const secret = process.env.CMS_PREVIEW_SECRET?.trim()
  let previewOk = false
  if (previewToken && secret) {
    const v = verifyCmsPreviewToken(previewToken, secret)
    previewOk =
      !!v &&
      v.kind === "news_article" &&
      v.articleId === article.id &&
      v.slug === article.slug
  }

  if (!previewOk && article.status !== CMS_NEWS_STATUS.PUBLISHED) {
    return res.status(404).json({ message: "Not found" })
  }

  const title = resolveCmsPageI18nField(
    article.title_i18n,
    locale,
    enabled,
    defaultLocale
  )
  const excerpt = resolveCmsPageI18nField(
    article.excerpt_i18n,
    locale,
    enabled,
    defaultLocale
  )
  const bodyObj = article.body_html_i18n as Record<string, unknown> | null
  const bodyHtml =
    bodyObj && typeof bodyObj === "object"
      ? resolveCmsPageI18nField(bodyObj, locale, enabled, defaultLocale)
      : ""

  if (previewOk) {
    res.setHeader("Cache-Control", "private, no-store")
  }

  const seoObj =
    article.seo && typeof article.seo === "object" && !Array.isArray(article.seo)
      ? (article.seo as Record<string, unknown>)
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

  const featured_image_url = await filePublicUrl(req, article.featured_image_file_id)
  const pub = article.published_at
  const published_at =
    pub instanceof Date ? pub.toISOString() : pub ? String(pub) : null

  const [catIds, tagIds] = await Promise.all([
    getArticleCategoryIds(cms, article.id),
    getArticleTagIds(cms, article.id),
  ])
  const [allCats, allTags] = await Promise.all([
    cms.listStoreCmsNewsCategories({}),
    cms.listStoreCmsNewsTags({}),
  ])
  const catById = new Map(allCats.map((c) => [c.id, c]))
  const tagById = new Map(allTags.map((t) => [t.id, t]))

  const categories = catIds
    .map((id) => {
      const c = catById.get(id)
      if (!c) {
        return null
      }
      return {
        slug: c.slug,
        title: resolveCmsPageI18nField(
          c.title_i18n,
          locale,
          enabled,
          defaultLocale
        ),
      }
    })
    .filter((x): x is { slug: string; title: string } => x != null)

  const tags = tagIds
    .map((id) => {
      const t = tagById.get(id)
      if (!t) {
        return null
      }
      return {
        slug: t.slug,
        title: resolveCmsPageI18nField(
          t.title_i18n,
          locale,
          enabled,
          defaultLocale
        ),
      }
    })
    .filter((x): x is { slug: string; title: string } => x != null)

  const payload: Record<string, unknown> = {
    slug: article.slug,
    title,
    excerpt,
    body: bodyHtml,
    meta_title,
    meta_description,
    published_at,
    featured_image_url,
    categories,
    tags,
  }
  if (previewOk) {
    payload.status = article.status
  }
  res.json(payload)
}
