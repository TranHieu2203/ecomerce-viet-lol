/**
 * Set thẳng 3 liên kết MXH (Facebook, Zalo, Messenger) vào CMS Settings,
 * giữ nguyên hotline/email/social khác đã có — không cần thao tác qua Admin UI.
 *
 * Chạy: npx medusa exec ./src/scripts/set-social-links.ts
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_SETTINGS_ID, STORE_CMS_MODULE } from "../modules/store-cms"
import type StoreCmsModuleService from "../modules/store-cms/service"
import { revalidateStorefrontCms } from "../utils/revalidate-storefront"

const SOCIAL_LINKS = [
  {
    url: "https://www.facebook.com/2FSaffron",
    label: { vi: "Facebook", en: "Facebook" },
  },
  {
    url: "https://zalo.me/0825564686",
    label: { vi: "Zalo", en: "Zalo" },
  },
  {
    url: "https://m.me/2FSaffron",
    label: { vi: "Messenger", en: "Messenger" },
  },
]

export default async function setSocialLinksScript({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const cms = container.resolve(STORE_CMS_MODULE) as StoreCmsModuleService

  const current = await cms.getOrCreateSettings()
  const cur = current as unknown as {
    default_locale: string
    enabled_locales: unknown
    logo_file_id: string | null
    site_title: string | null
    nav_tree: unknown
    site_title_i18n: unknown
    tagline_i18n: unknown
    seo_defaults: unknown
    og_image_file_id: string | null
    footer_contact: Record<string, unknown> | null
    announcement: unknown
    not_found: unknown
  }

  const prevFooterContact = (cur.footer_contact ?? {}) as Record<
    string,
    unknown
  >

  const footer_contact = {
    ...prevFooterContact,
    social: SOCIAL_LINKS,
  }

  await cms.updateCmsSettings([
    {
      id: CMS_SETTINGS_ID,
      default_locale: cur.default_locale,
      enabled_locales: cur.enabled_locales as Record<string, unknown>,
      logo_file_id: cur.logo_file_id,
      site_title: cur.site_title,
      nav_tree: cur.nav_tree as Record<string, unknown> | null,
      site_title_i18n: cur.site_title_i18n as Record<string, unknown> | null,
      tagline_i18n: cur.tagline_i18n as Record<string, unknown> | null,
      seo_defaults: cur.seo_defaults as Record<string, unknown> | null,
      og_image_file_id: cur.og_image_file_id,
      footer_contact,
      announcement: cur.announcement as Record<string, unknown> | null,
      not_found: cur.not_found as Record<string, unknown> | null,
    },
  ])

  await revalidateStorefrontCms("cms")

  logger.info(
    `[set-social-links] Đã cập nhật ${SOCIAL_LINKS.length} liên kết MXH: ${SOCIAL_LINKS.map((s) => s.url).join(", ")}`
  )
}
