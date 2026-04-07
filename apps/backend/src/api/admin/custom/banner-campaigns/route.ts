import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { randomUUID } from "crypto"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { revalidateStorefrontCms } from "../../../../utils/revalidate-storefront"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const rows = await cms.listStoreBannerCampaigns(
    {},
    { order: { created_at: "DESC" } }
  )
  res.json({ banner_campaigns: rows })
}

export async function POST(
  req: AuthenticatedMedusaRequest<Record<string, unknown>>,
  res: MedusaResponse
) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const name = String(body.name ?? "").trim()
  if (!name) {
    return res.status(400).json({ message: "name bắt buộc" })
  }
  let split = 50
  if (body.split_a_percent !== undefined) {
    split = Number(body.split_a_percent)
    if (!Number.isFinite(split) || split < 0 || split > 100) {
      return res.status(400).json({ message: "split_a_percent 0..100" })
    }
  }
  const is_active = Boolean(body.is_active)
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService

  if (is_active) {
    const active = await cms.listStoreBannerCampaigns({ is_active: true }, {})
    for (const c of active) {
      await cms.updateStoreBannerCampaigns([{ id: c.id, is_active: false }])
    }
  }

  const [created] = await cms.createStoreBannerCampaigns([
    {
      id: randomUUID(),
      name,
      split_a_percent: split,
      is_active,
    },
  ])

  await revalidateStorefrontCms()
  res.json({ banner_campaign: created })
}
