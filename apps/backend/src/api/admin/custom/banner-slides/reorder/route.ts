import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { revalidateStorefrontCms } from "../../../../../utils/revalidate-storefront"

export async function PATCH(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const body = (req.body ?? {}) as { ordered_ids?: string[] }
  const ids = body.ordered_ids
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ message: "ordered_ids required" })
  }
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const updates = ids.map((id, index) => ({
    id,
    sort_order: index,
  }))
  await cms.updateStoreBannerSlides(updates)
  await revalidateStorefrontCms()
  res.json({ ok: true })
}
