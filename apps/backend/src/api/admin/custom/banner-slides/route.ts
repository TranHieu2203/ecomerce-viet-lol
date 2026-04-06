import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { generateBannerDerivatives } from "../../../../utils/banner-derivatives"
import { revalidateStorefrontCms } from "../../../../utils/revalidate-storefront"
import { validateTargetUrl } from "../../../../utils/validate-target-url"

type LangJson = Record<string, string>

function parseLang(obj: unknown): LangJson {
  if (!obj || typeof obj !== "object") {
    return { vi: "", en: "" }
  }
  const o = obj as Record<string, unknown>
  return {
    vi: String(o.vi ?? ""),
    en: String(o.en ?? ""),
  }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const slides = await cms.listStoreBannerSlides(
    {},
    { order: { sort_order: "ASC" } }
  )
  res.json({ banner_slides: slides })
}

export async function POST(
  req: AuthenticatedMedusaRequest<Record<string, unknown>>,
  res: MedusaResponse
) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const image_file_id = body.image_file_id as string | undefined
  if (!image_file_id) {
    return res.status(400).json({ message: "image_file_id required" })
  }
  let target_url = ""
  try {
    target_url = validateTargetUrl(body.target_url as string).value
  } catch (e: unknown) {
    return res.status(400).json({
      message: e instanceof Error ? e.message : "Invalid target_url",
    })
  }

  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms.listStoreBannerSlides({}, {})
  const maxOrder = existing.reduce(
    (m, s) => Math.max(m, s.sort_order ?? 0),
    -1
  )

  let image_urls: Record<string, string> | null = null
  try {
    image_urls = await generateBannerDerivatives(
      req.scope,
      image_file_id,
      `banner-${Date.now()}`
    )
  } catch (e: unknown) {
    return res.status(400).json({
      message: e instanceof Error ? e.message : "Derivative generation failed",
    })
  }

  const [created] = await cms.createStoreBannerSlides([
    {
      image_file_id,
      image_urls,
      title: parseLang(body.title),
      subtitle: parseLang(body.subtitle),
      cta_label: parseLang(body.cta_label),
      target_url,
      sort_order: (body.sort_order as number) ?? maxOrder + 1,
      is_active: body.is_active !== false,
    },
  ])

  await revalidateStorefrontCms()
  res.json({ banner_slide: created })
}
