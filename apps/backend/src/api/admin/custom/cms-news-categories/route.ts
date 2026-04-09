import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { CmsPageValidationError } from "../../../../utils/cms-page"
import {
  assertValidCategoryParentAssignment,
} from "../../../../utils/cms-news-category-tree"
import {
  assertValidCmsPageSlug,
  CmsNewsValidationError,
  parseNewsTitleJson,
} from "../../../../utils/cms-news"

function validationResponse(
  res: MedusaResponse,
  e: CmsNewsValidationError | CmsPageValidationError
) {
  return res.status(e.status).json({ message: e.message })
}

export async function GET(
  _req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = _req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const rows = await cms.listStoreCmsNewsCategories(
    {},
    { order: { slug: "ASC" } }
  )
  res.json({
    categories: rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      title_i18n: c.title_i18n,
      parent_id: c.parent_id ?? null,
      updated_at: c.updated_at,
    })),
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const body = (req.body ?? {}) as Record<string, unknown>
  let slug: string
  let title_i18n: Record<string, string>
  let parent_id: string | null = null
  try {
    slug = assertValidCmsPageSlug(body.slug)
    title_i18n = parseNewsTitleJson(body.title)
    if (body.parent_id !== undefined && body.parent_id !== null && body.parent_id !== "") {
      parent_id = String(body.parent_id).trim()
    }
  } catch (e: unknown) {
    if (e instanceof CmsNewsValidationError || e instanceof CmsPageValidationError) {
      return validationResponse(res, e)
    }
    throw e
  }

  const all = await cms.listStoreCmsNewsCategories({})
  const flat = all.map((c) => ({
    id: c.id,
    parent_id: c.parent_id ?? null,
  }))
  try {
    assertValidCategoryParentAssignment(flat, null, parent_id)
  } catch (e: unknown) {
    if (e instanceof CmsNewsValidationError) {
      return validationResponse(res, e)
    }
    throw e
  }

  const dup = all.filter((c) => c.slug === slug)
  if (dup.length > 0) {
    return res.status(409).json({ message: "Slug chủ đề đã tồn tại" })
  }

  const [created] = await cms.createStoreCmsNewsCategories([
    {
      slug,
      title_i18n,
      parent_id,
    },
  ])
  res.status(201).json({ category: created })
}
