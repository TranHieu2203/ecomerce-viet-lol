import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { CmsPageValidationError } from "../../../../../utils/cms-page"
import {
  appendNewsRevisionWithTaxonomy,
  newsRowFromUpdate,
} from "../../../../../utils/cms-news-revision"
import {
  assertValidCmsPageSlug,
  CmsNewsValidationError,
  parseAndValidateBodyHtmlI18nJson,
  parseAndValidateExcerptI18nJson,
  parseNewsSeoJson,
  parseNewsTitleJson,
} from "../../../../../utils/cms-news"
import {
  assertCategoryAndTagIdsExist,
  getArticleCategoryIds,
  getArticleTagIds,
  parseUuidIdArray,
  replaceNewsArticleCategories,
  replaceNewsArticleTags,
} from "../../../../../utils/cms-news-taxonomy"
import { revalidateStorefrontCms } from "../../../../../utils/revalidate-storefront"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

function validationResponse(
  res: MedusaResponse,
  e: CmsNewsValidationError | CmsPageValidationError
) {
  return res.status(e.status).json({ message: e.message })
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
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsNewsArticles({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy bài tin" })
  }
  const [category_ids, tag_ids] = await Promise.all([
    getArticleCategoryIds(cms, existing.id),
    getArticleTagIds(cms, existing.id),
  ])
  res.json({
    cms_news_article: { ...existing, category_ids, tag_ids },
  })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsNewsArticles({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy bài tin" })
  }

  const body = (req.body ?? {}) as Record<string, unknown>

  if (body.slug !== undefined) {
    try {
      const nextSlug = assertValidCmsPageSlug(body.slug)
      if (nextSlug !== existing.slug) {
        return res.status(400).json({
          message: "Không thể đổi slug sau khi tạo bài",
        })
      }
    } catch (e: unknown) {
      if (e instanceof CmsPageValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  const row: {
    id: string
    title_i18n?: Record<string, unknown>
    excerpt_i18n?: Record<string, unknown> | null
    body_html_i18n?: Record<string, unknown>
    featured_image_file_id?: string | null
    seo?: Record<string, unknown> | null
  } = { id: req.params.id }

  if (body.title !== undefined) {
    try {
      row.title_i18n = parseNewsTitleJson(body.title) as Record<string, unknown>
    } catch (e: unknown) {
      if (e instanceof CmsNewsValidationError || e instanceof CmsPageValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  if (body.excerpt !== undefined) {
    try {
      row.excerpt_i18n = parseAndValidateExcerptI18nJson(body.excerpt) as
        | Record<string, unknown>
        | null
    } catch (e: unknown) {
      if (e instanceof CmsNewsValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  if (body.body_html !== undefined) {
    try {
      row.body_html_i18n = parseAndValidateBodyHtmlI18nJson(
        body.body_html
      ) as Record<string, unknown>
    } catch (e: unknown) {
      if (e instanceof CmsNewsValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  if (body.featured_image_file_id !== undefined) {
    try {
      row.featured_image_file_id = await resolveFeaturedImageFileId(
        req,
        body.featured_image_file_id
      )
    } catch (e: unknown) {
      if (e instanceof CmsNewsValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  if (body.seo !== undefined) {
    try {
      row.seo = parseNewsSeoJson(body.seo)
    } catch (e: unknown) {
      if (e instanceof CmsNewsValidationError || e instanceof CmsPageValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  const payloadKeys = Object.keys(row).filter((k) => k !== "id")
  const taxonomyTouched =
    body.category_ids !== undefined || body.tag_ids !== undefined

  if (payloadKeys.length === 0 && !taxonomyTouched) {
    const [category_ids, tag_ids] = await Promise.all([
      getArticleCategoryIds(cms, existing.id),
      getArticleTagIds(cms, existing.id),
    ])
    return res.json({
      cms_news_article: { ...existing, category_ids, tag_ids },
    })
  }

  let updated = existing
  if (payloadKeys.length > 0) {
    const updateResult = await cms.updateStoreCmsNewsArticles([row])
    updated = Array.isArray(updateResult) ? updateResult[0] : updateResult
  }

  if (body.category_ids !== undefined) {
    try {
      const ids =
        body.category_ids === null
          ? []
          : parseUuidIdArray(body.category_ids, "category_ids") ?? []
      await assertCategoryAndTagIdsExist(cms, ids, [])
      await replaceNewsArticleCategories(cms, req.params.id, ids)
    } catch (e: unknown) {
      if (e instanceof CmsNewsValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  if (body.tag_ids !== undefined) {
    try {
      const ids =
        body.tag_ids === null
          ? []
          : parseUuidIdArray(body.tag_ids, "tag_ids") ?? []
      await assertCategoryAndTagIdsExist(cms, [], ids)
      await replaceNewsArticleTags(cms, req.params.id, ids)
    } catch (e: unknown) {
      if (e instanceof CmsNewsValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  const contentTouched =
    body.title !== undefined ||
    body.excerpt !== undefined ||
    body.body_html !== undefined ||
    body.featured_image_file_id !== undefined ||
    body.seo !== undefined

  if (contentTouched || taxonomyTouched) {
    await appendNewsRevisionWithTaxonomy(
      cms,
      newsRowFromUpdate(
        updated.id,
        updated.slug,
        updated.title_i18n,
        updated.excerpt_i18n,
        updated.body_html_i18n,
        updated.featured_image_file_id ?? null,
        updated.seo,
        updated.status,
        updated.published_at
      ),
      actorUserId(req)
    )
  }

  if ((contentTouched || taxonomyTouched) && updated.status === "published") {
    await revalidateStorefrontCms("cms-news")
  }

  const [category_ids, tag_ids] = await Promise.all([
    getArticleCategoryIds(cms, updated.id),
    getArticleTagIds(cms, updated.id),
  ])
  res.json({
    cms_news_article: { ...updated, category_ids, tag_ids },
  })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsNewsArticles({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy bài tin" })
  }
  const wasPublished = existing.status === "published"
  await cms.deleteStoreCmsNewsArticles([req.params.id])
  if (wasPublished) {
    await revalidateStorefrontCms("cms-news")
  }
  res.status(204).send()
}
