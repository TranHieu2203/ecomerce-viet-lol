import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../../modules/store-cms"
import {
  BANNER_PUBLICATION,
} from "../../../../../modules/store-cms/models/store-banner-slide"
import type StoreCmsModuleService from "../../../../../modules/store-cms/service"
import { parseBannerLang } from "../../../../../utils/banner-i18n"
import { generateBannerDerivatives } from "../../../../../utils/banner-derivatives"
import { assertCanPublishBanner } from "../../../../../utils/cms-publisher-guard"
import { recordPublicationAudit } from "../../../../../utils/cms-publication-audit"
import { revalidateStorefrontCms } from "../../../../../utils/revalidate-storefront"
import { validateTargetUrl } from "../../../../../utils/validate-target-url"

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

  let publication_status = existing.publication_status as string
  if (body.publication_status !== undefined) {
    const p = String(body.publication_status)
    if (p !== BANNER_PUBLICATION.DRAFT && p !== BANNER_PUBLICATION.PUBLISHED) {
      return res.status(400).json({ message: "publication_status không hợp lệ" })
    }
    const wasPublished =
      existing.publication_status === BANNER_PUBLICATION.PUBLISHED
    const nowPublished = p === BANNER_PUBLICATION.PUBLISHED
    if (nowPublished && !wasPublished) {
      assertCanPublishBanner(req)
    }
    publication_status = p
  }

  let campaign_id = existing.campaign_id as string | null
  if (body.campaign_id !== undefined) {
    campaign_id =
      body.campaign_id === null || body.campaign_id === ""
        ? null
        : String(body.campaign_id).trim() || null
  }

  let variant_label = existing.variant_label as string | null
  if (body.variant_label !== undefined) {
    const raw = String(body.variant_label ?? "").trim().toUpperCase()
    variant_label = raw === "A" || raw === "B" ? raw : null
  }

  let display_start_at = existing.display_start_at as Date | null
  let display_end_at = existing.display_end_at as Date | null
  if (body.display_start_at !== undefined) {
    if (body.display_start_at === null || body.display_start_at === "") {
      display_start_at = null
    } else {
      const d = new Date(String(body.display_start_at))
      display_start_at = Number.isNaN(d.getTime()) ? null : d
    }
  }
  if (body.display_end_at !== undefined) {
    if (body.display_end_at === null || body.display_end_at === "") {
      display_end_at = null
    } else {
      const d = new Date(String(body.display_end_at))
      display_end_at = Number.isNaN(d.getTime()) ? null : d
    }
  }

  const patch: Record<string, unknown> = {
    id: req.params.id,
  }
  if (image_file_id !== undefined) {
    patch.image_file_id = image_file_id
  }
  if (image_urls !== undefined) {
    patch.image_urls = image_urls
  }
  if (body.title !== undefined) {
    patch.title = parseBannerLang(body.title)
  }
  if (body.subtitle !== undefined) {
    patch.subtitle = parseBannerLang(body.subtitle)
  }
  if (body.cta_label !== undefined) {
    patch.cta_label = parseBannerLang(body.cta_label)
  }
  if (target_url !== undefined) {
    patch.target_url = target_url
  }
  if (body.sort_order !== undefined) {
    patch.sort_order = body.sort_order as number
  }
  if (body.is_active !== undefined) {
    patch.is_active = !!body.is_active
  }
  if (body.publication_status !== undefined) {
    patch.publication_status = publication_status
  }
  if (body.campaign_id !== undefined) {
    patch.campaign_id = campaign_id
  }
  if (body.variant_label !== undefined) {
    patch.variant_label = variant_label
  }
  if (body.display_start_at !== undefined) {
    patch.display_start_at = display_start_at
  }
  if (body.display_end_at !== undefined) {
    patch.display_end_at = display_end_at
  }

  const [updated] = await cms.updateStoreBannerSlides([patch as never])

  if (
    body.publication_status !== undefined &&
    existing.publication_status === BANNER_PUBLICATION.DRAFT &&
    publication_status === BANNER_PUBLICATION.PUBLISHED
  ) {
    await recordPublicationAudit(cms, {
      entity_type: "banner_slide",
      entity_id: req.params.id,
      action: "publish",
      actor_user_id: actorUserId(req),
      metadata: { title: existing.title },
    })
  }

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
