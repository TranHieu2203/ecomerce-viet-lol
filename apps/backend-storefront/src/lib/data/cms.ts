"use server"

import { sdk } from "@lib/config"
import { absolutizeMedusaFileUrl } from "@lib/util/cms-assets"

export type BannerSlideResolved = {
  id: string
  title: string
  subtitle: string
  cta_label: string
  target_url: string | null
  image: { mobile?: string; desktop?: string } | null
  alt: string
}

export type CmsSettingsPublic = {
  default_locale: string
  enabled_locales: unknown
  logo_url: string | null
  /** Tên cửa hàng trên header (CMS). */
  site_title: string | null
}

export async function listBannerSlides(locale: string) {
  return sdk.client
    .fetch<{ banner_slides: BannerSlideResolved[] }>(
      `/store/custom/banner-slides`,
      {
        method: "GET",
        query: { locale },
        next: { tags: ["cms"], revalidate: 180 },
        cache: "force-cache",
      }
    )
    .then((r) => r.banner_slides ?? [])
    .catch(() => [] as BannerSlideResolved[])
}

const CMS_FALLBACK: CmsSettingsPublic = {
  default_locale: "vi",
  enabled_locales: ["vi", "en"],
  logo_url: null,
  site_title: null,
}

export async function getCmsSettingsPublic(): Promise<CmsSettingsPublic> {
  const data = await sdk.client
    .fetch<CmsSettingsPublic>(`/store/custom/cms-settings`, {
      method: "GET",
      next: { tags: ["cms"], revalidate: 180 },
      cache: "force-cache",
    })
    .catch(() => ({ ...CMS_FALLBACK }))

  const envTitle = process.env.NEXT_PUBLIC_STORE_DISPLAY_NAME?.trim() || null
  const site_title =
    (typeof data.site_title === "string" && data.site_title.trim()) ||
    envTitle ||
    null

  return {
    ...data,
    logo_url: absolutizeMedusaFileUrl(data.logo_url),
    site_title,
  }
}
