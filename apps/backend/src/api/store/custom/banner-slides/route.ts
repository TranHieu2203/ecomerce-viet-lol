import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"

export const AUTHENTICATE = false

type LangJson = Record<string, string>

function pickText(json: LangJson | null | undefined, locale: string): string {
  if (!json || typeof json !== "object") {
    return ""
  }
  const v = json[locale] || json.vi || json.en || Object.values(json)[0]
  return typeof v === "string" ? v : ""
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const locale =
    (req.query?.locale as string)?.toLowerCase().split(",")[0] || "vi"
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const slides = await cms.listStoreBannerSlides(
    { is_active: true },
    { order: { sort_order: "ASC" } }
  )
  const resolved = slides.map((s) => {
    const title = s.title as LangJson
    const subtitle = s.subtitle as LangJson
    const cta = s.cta_label as LangJson
    return {
      id: s.id,
      title: pickText(title, locale),
      subtitle: pickText(subtitle, locale),
      cta_label: pickText(cta, locale),
      target_url: s.target_url,
      image: s.image_urls as { mobile?: string; desktop?: string } | null,
      alt: pickText(title, locale),
    }
  })
  res.json({ banner_slides: resolved })
}
