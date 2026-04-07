import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import {
  BANNER_PUBLICATION,
} from "../../../../modules/store-cms/models/store-banner-slide"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { parseBannerLang } from "../../../../utils/banner-i18n"
import { generateBannerDerivatives } from "../../../../utils/banner-derivatives"
import { assertCanPublishBanner } from "../../../../utils/cms-publisher-guard"
import { recordPublicationAudit } from "../../../../utils/cms-publication-audit"
import { revalidateStorefrontCms } from "../../../../utils/revalidate-storefront"
import { validateTargetUrl } from "../../../../utils/validate-target-url"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
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

  const title = parseBannerLang(body.title)
  const subtitle = parseBannerLang(body.subtitle)
  const cta_label = parseBannerLang(body.cta_label)

  const publication_status =
    body.publication_status === BANNER_PUBLICATION.PUBLISHED
      ? BANNER_PUBLICATION.PUBLISHED
      : BANNER_PUBLICATION.DRAFT

  if (publication_status === BANNER_PUBLICATION.PUBLISHED) {
    assertCanPublishBanner(req)
  }

  const campaign_id =
    typeof body.campaign_id === "string" && body.campaign_id.trim()
      ? body.campaign_id.trim()
      : null
  const vraw = String(body.variant_label ?? "").trim().toUpperCase()
  const variant_label = vraw === "A" || vraw === "B" ? vraw : null

  const display_start_at =
    body.display_start_at === null || body.display_start_at === ""
      ? null
      : new Date(String(body.display_start_at))
  const display_end_at =
    body.display_end_at === null || body.display_end_at === ""
      ? null
      : new Date(String(body.display_end_at))

  const [created] = await cms.createStoreBannerSlides([
    {
      image_file_id,
      image_urls,
      title,
      subtitle,
      cta_label,
      target_url,
      sort_order: (body.sort_order as number) ?? maxOrder + 1,
      is_active: body.is_active !== false,
      publication_status,
      campaign_id,
      variant_label,
      display_start_at:
        display_start_at && !Number.isNaN(display_start_at.getTime())
          ? display_start_at
          : null,
      display_end_at:
        display_end_at && !Number.isNaN(display_end_at.getTime())
          ? display_end_at
          : null,
    },
  ])

  if (publication_status === BANNER_PUBLICATION.PUBLISHED) {
    await recordPublicationAudit(cms, {
      entity_type: "banner_slide",
      entity_id: created.id,
      action: "publish",
      actor_user_id: actorUserId(req),
      metadata: { create: true },
    })
  }

  await revalidateStorefrontCms()
  res.json({ banner_slide: created })
}
