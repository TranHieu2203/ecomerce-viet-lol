import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../../modules/store-cms/service"
import { CMS_PAGE_STATUS } from "../../../../../../modules/store-cms/models/store-cms-page"
import {
  appendPageRevision,
  pageRowFromUpdate,
} from "../../../../../../utils/cms-page-revision"
import { revalidateStorefrontCms } from "../../../../../../utils/revalidate-storefront"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

export async function POST(
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

  const updateResult = await cms.updateStoreCmsPages([
    {
      id: req.params.id,
      status: CMS_PAGE_STATUS.DRAFT,
      published_at: null,
    },
  ])
  const updated = Array.isArray(updateResult) ? updateResult[0] : updateResult

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

  await revalidateStorefrontCms("cms-pages")
  res.json({ cms_page: updated })
}
