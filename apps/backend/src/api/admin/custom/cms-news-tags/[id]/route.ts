import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { CmsPageValidationError } from "../../../../../utils/cms-page"
import {
  assertValidCmsPageSlug,
  CmsNewsValidationError,
  parseNewsTitleJson,
} from "../../../../../utils/cms-news"

function validationResponse(
  res: MedusaResponse,
  e: CmsNewsValidationError | CmsPageValidationError
) {
  return res.status(e.status).json({ message: e.message })
}

export async function GET(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const row = await cms
    .listStoreCmsNewsTags({ id: req.params.id })
    .then((r) => r[0])
  if (!row) {
    return res.status(404).json({ message: "Không tìm thấy nhãn" })
  }
  res.json({ tag: row })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsNewsTags({ id: req.params.id })
    .then((r) => r[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy nhãn" })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const row: {
    id: string
    slug?: string
    title_i18n?: Record<string, unknown>
  } = { id: req.params.id }

  if (body.slug !== undefined) {
    try {
      row.slug = assertValidCmsPageSlug(body.slug)
    } catch (e: unknown) {
      if (e instanceof CmsPageValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }
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

  const all = await cms.listStoreCmsNewsTags({})
  if (row.slug !== undefined && row.slug !== existing.slug) {
    if (all.some((t) => t.id !== existing.id && t.slug === row.slug)) {
      return res.status(409).json({ message: "Slug nhãn đã tồn tại" })
    }
  }

  const keys = Object.keys(row).filter((k) => k !== "id")
  if (keys.length === 0) {
    return res.json({ tag: existing })
  }

  const updateResult = await cms.updateStoreCmsNewsTags([row])
  const updated = Array.isArray(updateResult) ? updateResult[0] : updateResult
  res.json({ tag: updated })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsNewsTags({ id: req.params.id })
    .then((r) => r[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy nhãn" })
  }
  await cms.deleteStoreCmsNewsTags([req.params.id])
  res.status(204).send()
}
