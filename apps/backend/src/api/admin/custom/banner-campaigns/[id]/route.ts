import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { revalidateStorefrontCms } from "../../../../../utils/revalidate-storefront"

export async function PATCH(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreBannerCampaigns({ id: req.params.id })
    .then((r) => r[0])
  if (!existing) {
    return res.status(404).json({ message: "Not found" })
  }
  const body = (req.body ?? {}) as Record<string, unknown>
  let name = existing.name
  if (body.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) {
      return res.status(400).json({ message: "name không được rỗng" })
    }
    name = n
  }
  let split_a_percent = existing.split_a_percent
  if (body.split_a_percent !== undefined) {
    const s = Number(body.split_a_percent)
    if (!Number.isFinite(s) || s < 0 || s > 100) {
      return res.status(400).json({ message: "split_a_percent 0..100" })
    }
    split_a_percent = s
  }
  let is_active = existing.is_active
  if (body.is_active !== undefined) {
    is_active = Boolean(body.is_active)
  }

  if (is_active) {
    const others = await cms.listStoreBannerCampaigns(
      { is_active: true },
      {}
    )
    for (const c of others) {
      if (c.id !== existing.id) {
        await cms.updateStoreBannerCampaigns([{ id: c.id, is_active: false }])
      }
    }
  }

  const [updated] = await cms.updateStoreBannerCampaigns([
    {
      id: existing.id,
      name,
      split_a_percent,
      is_active,
    },
  ])
  await revalidateStorefrontCms()
  res.json({ banner_campaign: updated })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreBannerCampaigns({ id: req.params.id })
    .then((r) => r[0])
  if (!existing) {
    return res.status(404).json({ message: "Not found" })
  }
  await cms.deleteStoreBannerCampaigns([req.params.id])
  await revalidateStorefrontCms()
  res.status(204).send()
}
