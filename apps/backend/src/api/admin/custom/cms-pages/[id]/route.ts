import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import type { CmsPageTitleJson } from "../../../../../utils/cms-page"
import {
  appendPageRevision,
  pageRowFromUpdate,
} from "../../../../../utils/cms-page-revision"
import {
  assertValidCmsPageSlug,
  CmsPageValidationError,
  parseAndValidatePageSeoJson,
  parseAndValidateTitleJson,
  sanitizeCmsPageBody,
} from "../../../../../utils/cms-page"
import { revalidateStorefrontCms } from "../../../../../utils/revalidate-storefront"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

export async function GET(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsPages({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy trang" })
  }
  res.json({ cms_page: existing })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsPages({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy trang" })
  }

  const body = (req.body ?? {}) as Record<string, unknown>

  if (body.slug !== undefined) {
    let nextSlug: string
    try {
      nextSlug = assertValidCmsPageSlug(body.slug)
    } catch (e: unknown) {
      if (e instanceof CmsPageValidationError) {
        return res.status(e.status).json({ message: e.message })
      }
      throw e
    }
    if (nextSlug !== existing.slug) {
      return res.status(400).json({
        message: "Không thể đổi slug sau khi tạo trang",
      })
    }
  }

  const row: {
    id: string
    title?: Record<string, unknown>
    body?: string | null
    seo?: Record<string, unknown> | null
  } = { id: req.params.id }

  if (body.title !== undefined) {
    try {
      const t: CmsPageTitleJson = parseAndValidateTitleJson(body.title)
      row.title = t as Record<string, unknown>
    } catch (e: unknown) {
      if (e instanceof CmsPageValidationError) {
        return res.status(e.status).json({ message: e.message })
      }
      throw e
    }
  }

  if (body.body !== undefined) {
    row.body =
      body.body === null
        ? null
        : sanitizeCmsPageBody(String(body.body))
  }

  if (body.seo !== undefined) {
    try {
      const p = parseAndValidatePageSeoJson(body.seo)
      row.seo =
        p && Object.keys(p as object).length > 0
          ? (p as Record<string, unknown>)
          : null
    } catch (e: unknown) {
      if (e instanceof CmsPageValidationError) {
        return res.status(e.status).json({ message: e.message })
      }
      throw e
    }
  }

  const payloadKeys = Object.keys(row).filter((k) => k !== "id")
  if (payloadKeys.length === 0) {
    return res.json({ cms_page: existing })
  }

  const updateResult = await cms.updateStoreCmsPages([row])
  const updated = Array.isArray(updateResult) ? updateResult[0] : updateResult

  const contentTouched =
    body.title !== undefined ||
    body.body !== undefined ||
    body.seo !== undefined

  if (contentTouched) {
    await appendPageRevision(
      cms,
      pageRowFromUpdate(
        updated.id,
        updated.slug,
        updated.title,
        updated.body,
        (updated as { seo?: unknown }).seo ?? null,
        updated.status,
        updated.published_at
      ),
      actorUserId(req)
    )
  }

  if (contentTouched && updated.status === "published") {
    await revalidateStorefrontCms("cms-pages")
  }

  res.json({ cms_page: updated })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreCmsPages({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Không tìm thấy trang" })
  }
  const wasPublished = existing.status === "published"
  await cms.deleteStoreCmsPages([req.params.id])
  if (wasPublished) {
    await revalidateStorefrontCms("cms-pages")
  }
  res.status(204).send()
}
