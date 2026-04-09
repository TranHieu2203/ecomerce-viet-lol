import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { CMS_NEWS_STATUS } from "../../../../modules/store-cms/models/store-cms-news-article"
import {
  appendNewsRevisionWithTaxonomy,
  newsRowFromUpdate,
} from "../../../../utils/cms-news-revision"
import { CmsPageValidationError } from "../../../../utils/cms-page"
import {
  assertValidCmsPageSlug,
  CmsNewsValidationError,
  parseAndValidateBodyHtmlI18nJson,
  parseAndValidateExcerptI18nJson,
  parseNewsSeoJson,
  parseNewsTitleJson,
} from "../../../../utils/cms-news"
import {
  assertCategoryAndTagIdsExist,
  parseUuidIdArray,
  replaceNewsArticleCategories,
  replaceNewsArticleTags,
} from "../../../../utils/cms-news-taxonomy"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

async function resolveFeaturedImageFileId(
  req: AuthenticatedMedusaRequest,
  fileId: unknown
): Promise<string | null> {
  if (fileId === null || fileId === undefined || fileId === "") {
    return null
  }
  const id = String(fileId).trim()
  if (!id) {
    return null
  }
  const fileModule = req.scope.resolve(Modules.FILE) as IFileModuleService
  try {
    await fileModule.retrieveFile(id)
  } catch {
    throw new CmsNewsValidationError("featured_image_file_id không hợp lệ")
  }
  return id
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const limitRaw = Number(req.query?.limit ?? 100)
  const offsetRaw = Number(req.query?.offset ?? 0)
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 100
  const offset =
    Number.isFinite(offsetRaw) && offsetRaw >= 0 ? Math.floor(offsetRaw) : 0

  const [rows, count] = await cms.listAndCountStoreCmsNewsArticles(
    {},
    {
      take: limit,
      skip: offset,
      order: { updated_at: "DESC" },
    }
  )

  const cms_news = rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    status: a.status,
    updated_at: a.updated_at,
    title_i18n: a.title_i18n,
  }))

  res.json({ cms_news, count, limit, offset })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const body = (req.body ?? {}) as Record<string, unknown>

  let slug: string
  let title_i18n: Record<string, string>
  let body_html_i18n: Record<string, string>
  let excerpt_i18n: Record<string, string> | null
  let featured: string | null
  try {
    slug = assertValidCmsPageSlug(body.slug)
    title_i18n = parseNewsTitleJson(body.title)
    body_html_i18n = parseAndValidateBodyHtmlI18nJson(body.body_html)
    excerpt_i18n = parseAndValidateExcerptI18nJson(body.excerpt)
    featured = await resolveFeaturedImageFileId(
      req,
      body.featured_image_file_id
    )
  } catch (e: unknown) {
    if (
      e instanceof CmsNewsValidationError ||
      e instanceof CmsPageValidationError
    ) {
      return res.status(e.status).json({ message: e.message })
    }
    throw e
  }

  let seo: Record<string, unknown> | null = null
  if (body.seo !== undefined) {
    try {
      seo = parseNewsSeoJson(body.seo)
    } catch (e: unknown) {
      if (
        e instanceof CmsNewsValidationError ||
        e instanceof CmsPageValidationError
      ) {
        return res.status(e.status).json({ message: e.message })
      }
      throw e
    }
  }

  const existing = await cms.listStoreCmsNewsArticles({ slug })
  if (existing.length > 0) {
    return res.status(409).json({
      message: "Slug đã tồn tại; vui lòng chọn slug khác",
    })
  }

  let categoryIds: string[] = []
  let tagIds: string[] = []
  try {
    const cRaw = parseUuidIdArray(body.category_ids, "category_ids")
    const tRaw = parseUuidIdArray(body.tag_ids, "tag_ids")
    if (cRaw) {
      categoryIds = cRaw
    }
    if (tRaw) {
      tagIds = tRaw
    }
  } catch (e: unknown) {
    if (e instanceof CmsNewsValidationError) {
      return res.status(e.status).json({ message: e.message })
    }
    throw e
  }

  try {
    const [created] = await cms.createStoreCmsNewsArticles([
      {
        slug,
        title_i18n,
        excerpt_i18n,
        body_html_i18n,
        featured_image_file_id: featured,
        seo,
        status: CMS_NEWS_STATUS.DRAFT,
        published_at: null,
      },
    ])

    if (categoryIds.length > 0 || tagIds.length > 0) {
      await assertCategoryAndTagIdsExist(cms, categoryIds, tagIds)
      await replaceNewsArticleCategories(cms, created.id, categoryIds)
      await replaceNewsArticleTags(cms, created.id, tagIds)
    }

    await appendNewsRevisionWithTaxonomy(
      cms,
      newsRowFromUpdate(
        created.id,
        created.slug,
        created.title_i18n,
        created.excerpt_i18n,
        created.body_html_i18n,
        created.featured_image_file_id ?? null,
        created.seo,
        created.status,
        created.published_at
      ),
      actorUserId(req)
    )

    res.status(201).json({ cms_news_article: created })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("unique") || msg.includes("IDX_store_cms_news_article_slug")) {
      return res.status(409).json({
        message: "Slug đã tồn tại; vui lòng chọn slug khác",
      })
    }
    throw e
  }
}
