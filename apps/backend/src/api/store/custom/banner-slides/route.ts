import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { selectBannerSlidesForStore } from "../../../../utils/banner-store-public"

export const AUTHENTICATE = false

type LangJson = Record<string, string>

function pickText(json: LangJson | null | undefined, locale: string): string {
  if (!json || typeof json !== "object") {
    return ""
  }
  const v =
    json[locale] ||
    json.vi ||
    json.en ||
    json.ja ||
    Object.values(json).find(Boolean)
  return typeof v === "string" ? v : ""
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const localeRaw =
    ((req.query?.locale as string | undefined) ?? (() => {
      try {
        const u = new URL(req.url ?? "", "http://localhost")
        const v = u.searchParams.get("locale")
        return v ?? undefined
      } catch {
        return undefined
      }
    })()) ?? "vi"
  const locale = localeRaw.toLowerCase().split(",")[0] || "vi"
  const visitorId =
    (req.headers["x-medusa-cache-id"] as string)?.trim() ||
    (req.query?.visitor_id as string)?.trim() ||
    "anonymous"

  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const [slides, campaigns] = await Promise.all([
    cms.listStoreBannerSlides({}, { order: { sort_order: "ASC" } }),
    cms.listStoreBannerCampaigns({}, {}),
  ])

  const now = new Date()
  const selected = selectBannerSlidesForStore(
    slides.map((s) => ({
      id: s.id,
      sort_order: s.sort_order,
      is_active: s.is_active,
      publication_status: s.publication_status as string,
      display_start_at: s.display_start_at,
      display_end_at: s.display_end_at,
      campaign_id: s.campaign_id,
      variant_label: s.variant_label,
    })),
    campaigns.map((c) => ({
      id: c.id,
      split_a_percent: c.split_a_percent,
      is_active: c.is_active,
    })),
    now,
    visitorId
  )

  const byId = new Map(slides.map((s) => [s.id, s]))

  const resolved = selected
    .map((sel) => byId.get(sel.id))
    .filter(Boolean)
    .map((s) => {
      const title = s!.title as LangJson
      const subtitle = s!.subtitle as LangJson
      const cta = s!.cta_label as LangJson
      return {
        id: s!.id,
        title: pickText(title, locale),
        subtitle: pickText(subtitle, locale),
        cta_label: pickText(cta, locale),
        target_url: s!.target_url,
        image: s!.image_urls as { mobile?: string; desktop?: string } | null,
        alt: pickText(title, locale),
      }
    })

  res.json({ banner_slides: resolved })
}
