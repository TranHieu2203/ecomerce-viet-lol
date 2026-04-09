import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { CmsPageValidationError } from "../../../../../utils/cms-page"
import {
  assertValidCategoryParentAssignment,
} from "../../../../../utils/cms-news-category-tree"
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
    .listStoreCmsNewsCategories({ id: req.params.id })
    .then((r) => r[0])
  if (!row) {
    return res.status(404).json({ message: "Không tìm thấy chủ đề" })
  }
  res.json({ category: row })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsNewsCategories({ id: req.params.id })
    .then((r) => r[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy chủ đề" })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const row: {
    id: string
    slug?: string
    title_i18n?: Record<string, unknown>
    parent_id?: string | null
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

  let nextParent: string | null | undefined
  if (body.parent_id !== undefined) {
    if (body.parent_id === null || body.parent_id === "") {
      row.parent_id = null
      nextParent = null
    } else {
      const p = String(body.parent_id).trim()
      row.parent_id = p
      nextParent = p
    }
  }

  const all = await cms.listStoreCmsNewsCategories({})
  const flat = all.map((c) => ({
    id: c.id,
    parent_id: c.parent_id ?? null,
  }))

  if (nextParent !== undefined) {
    try {
      assertValidCategoryParentAssignment(flat, req.params.id, nextParent)
    } catch (e: unknown) {
      if (e instanceof CmsNewsValidationError) {
        return validationResponse(res, e)
      }
      throw e
    }
  }

  if (row.slug !== undefined && row.slug !== existing.slug) {
    const dup = all.some((c) => c.id !== existing.id && c.slug === row.slug)
    if (dup) {
      return res.status(409).json({ message: "Slug chủ đề đã tồn tại" })
    }
  }

  const keys = Object.keys(row).filter((k) => k !== "id")
  if (keys.length === 0) {
    return res.json({ category: existing })
  }

  const updateResult = await cms.updateStoreCmsNewsCategories([row])
  const updated = Array.isArray(updateResult) ? updateResult[0] : updateResult
  res.json({ category: updated })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsNewsCategories({ id: req.params.id })
    .then((r) => r[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy chủ đề" })
  }

  const all = await cms.listStoreCmsNewsCategories({})
  const hasChild = all.some((c) => c.parent_id === existing.id)
  if (hasChild) {
    return res.status(400).json({
      message:
        "Chủ đề còn mục con — hãy xóa hoặc chuyển các chủ đề con trước (giống WordPress).",
    })
  }

  await cms.deleteStoreCmsNewsCategories([req.params.id])
  res.status(204).send()
}
