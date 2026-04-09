import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { CMS_NEWS_STATUS } from "../../../../modules/store-cms/models/store-cms-news-article"
import { resolveCmsPageI18nField } from "../../../../utils/cms-page"
import {
  collectCategoryDescendantIds,
  listArticleIdsForCategorySubtree,
  listArticleIdsForTag,
} from "../../../../utils/cms-news-taxonomy"

export const AUTHENTICATE = false

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

  const limitRaw = Number(req.query?.limit ?? 20)
  const offsetRaw = Number(req.query?.offset ?? 0)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(50, Math.floor(limitRaw)) : 20
  const offset =
    Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.floor(offsetRaw) : 0

  const categorySlug = (req.query?.category_slug as string | undefined)
    ?.trim()
    .toLowerCase()
  const tagSlug = (req.query?.tag_slug as string | undefined)?.trim().toLowerCase()

  let allowedIds: Set<string> | null = null

  if (categorySlug) {
    const catRows = await cms.listStoreCmsNewsCategories({ slug: categorySlug })
    const root = catRows[0]
    if (!root) {
      return res.json({
        articles: [],
        limit,
        offset,
        count: 0,
      })
    }
    const allCats = await cms.listStoreCmsNewsCategories({})
    const flat = allCats.map((c) => ({
      id: c.id,
      parent_id: c.parent_id ?? null,
    }))
    const subtree = collectCategoryDescendantIds(flat, root.id)
    allowedIds = await listArticleIdsForCategorySubtree(cms, subtree)
    if (allowedIds.size === 0) {
      return res.json({
        articles: [],
        limit,
        offset,
        count: 0,
      })
    }
  }

  if (tagSlug) {
    const tagRows = await cms.listStoreCmsNewsTags({ slug: tagSlug })
    const t = tagRows[0]
    if (!t) {
      return res.json({
        articles: [],
        limit,
        offset,
        count: 0,
      })
    }
    const tagArticles = await listArticleIdsForTag(cms, t.id)
    if (allowedIds === null) {
      allowedIds = tagArticles
    } else {
      allowedIds = new Set(
        [...allowedIds].filter((id) => tagArticles.has(id))
      )
    }
    if (allowedIds.size === 0) {
      return res.json({
        articles: [],
        limit,
        offset,
        count: 0,
      })
    }
  }

  const [rows] = await cms.listAndCountStoreCmsNewsArticles(
    { status: CMS_NEWS_STATUS.PUBLISHED },
    {
      take: 500,
      skip: 0,
      order: { published_at: "DESC" },
    }
  )

  const filtered = allowedIds
    ? rows.filter((a) => allowedIds!.has(a.id))
    : rows
  const count = filtered.length
  const page = filtered.slice(offset, offset + limit)

  const items = await Promise.all(
    page.map(async (a) => {
      const title = resolveCmsPageI18nField(
        a.title_i18n,
        locale,
        enabled,
        defaultLocale
      )
      const excerpt = resolveCmsPageI18nField(
        a.excerpt_i18n,
        locale,
        enabled,
        defaultLocale
      )
      const featured_image_url = await filePublicUrl(req, a.featured_image_file_id)
      const pub = a.published_at
      const published_at =
        pub instanceof Date
          ? pub.toISOString()
          : pub
            ? String(pub)
            : null
      return {
        slug: a.slug,
        title,
        excerpt,
        published_at,
        featured_image_url,
      }
    })
  )

  res.json({
    articles: items,
    limit,
    offset,
    count,
  })
}
