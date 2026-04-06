import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { generateBannerDerivatives } from "../../../../../utils/banner-derivatives"
import { revalidateStorefrontCms } from "../../../../../utils/revalidate-storefront"
import { validateTargetUrl } from "../../../../../utils/validate-target-url"

type LangJson = Record<string, string>

function parseLang(obj: unknown): LangJson | undefined {
  if (obj === undefined) {
    return undefined
  }
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
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const slide = await cms
    .listStoreBannerSlides({ id: req.params.id })
    .then((rows) => rows[0])
  if (!slide) {
    return res.status(404).json({ message: "Not found" })
  }
  res.json({ banner_slide: slide })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreBannerSlides({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Not found" })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  let target_url: string | undefined
  if (body.target_url !== undefined) {
    try {
      target_url = validateTargetUrl(body.target_url as string).value
    } catch (e: unknown) {
      return res.status(400).json({
        message: e instanceof Error ? e.message : "Invalid target_url",
      })
    }
  }

  let image_urls = existing.image_urls as Record<string, string> | null
  let image_file_id = existing.image_file_id

  if (body.image_file_id && body.image_file_id !== existing.image_file_id) {
    image_file_id = body.image_file_id as string
    try {
      image_urls = await generateBannerDerivatives(
        req.scope,
        image_file_id,
        `banner-${req.params.id}`
      )
    } catch (e: unknown) {
      return res.status(400).json({
        message: e instanceof Error ? e.message : "Derivative generation failed",
      })
    }
  }

  const [updated] = await cms.updateStoreBannerSlides([
    {
      id: req.params.id,
      ...(image_file_id !== undefined ? { image_file_id } : {}),
      ...(image_urls !== undefined ? { image_urls } : {}),
      ...(parseLang(body.title) ? { title: parseLang(body.title) } : {}),
      ...(parseLang(body.subtitle) !== undefined
        ? { subtitle: parseLang(body.subtitle) }
        : {}),
      ...(parseLang(body.cta_label) !== undefined
        ? { cta_label: parseLang(body.cta_label) }
        : {}),
      ...(target_url !== undefined ? { target_url } : {}),
      ...(body.sort_order !== undefined
        ? { sort_order: body.sort_order as number }
        : {}),
      ...(body.is_active !== undefined
        ? { is_active: !!body.is_active }
        : {}),
    },
  ])

  await revalidateStorefrontCms()
  res.json({ banner_slide: updated })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest<{ id: string }>,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const existing = await cms
    .listStoreBannerSlides({ id: req.params.id })
    .then((rows) => rows[0])
  if (!existing) {
    return res.status(404).json({ message: "Not found" })
  }
  await cms.deleteStoreBannerSlides([req.params.id])
  await revalidateStorefrontCms()
  res.status(204).send()
}
