import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { CmsPageValidationError } from "../../../../utils/cms-page"
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
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const rows = await cms.listStoreCmsNewsTags({}, { order: { slug: "ASC" } })
  res.json({
    tags: rows.map((t) => ({
      id: t.id,
      slug: t.slug,
      title_i18n: t.title_i18n,
      updated_at: t.updated_at,
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
  try {
    slug = assertValidCmsPageSlug(body.slug)
    title_i18n = parseNewsTitleJson(body.title)
  } catch (e: unknown) {
    if (e instanceof CmsNewsValidationError || e instanceof CmsPageValidationError) {
      return validationResponse(res, e)
    }
    throw e
  }

  const all = await cms.listStoreCmsNewsTags({})
  if (all.some((t) => t.slug === slug)) {
    return res.status(409).json({ message: "Slug nhãn đã tồn tại" })
  }

  const [created] = await cms.createStoreCmsNewsTags([
    {
      slug,
      title_i18n,
    },
  ])
  res.status(201).json({ tag: created })
}
