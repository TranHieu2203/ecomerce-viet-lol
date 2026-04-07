import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const settings = await cms.getOrCreateSettings()
  let logo_url: string | null = null
  if (settings.logo_file_id) {
    try {
      const fileModule = req.scope.resolve(
        Modules.FILE
      ) as IFileModuleService
      const f = await fileModule.retrieveFile(settings.logo_file_id)
      logo_url = f.url
    } catch {
      logo_url = null
    }
  }
  const rawTitle = (settings as { site_title?: string | null }).site_title
  const site_title =
    typeof rawTitle === "string" ? rawTitle.trim() || null : rawTitle ?? null

  const site_title_i18n =
    (settings as { site_title_i18n?: unknown }).site_title_i18n ?? null
  const tagline_i18n =
    (settings as { tagline_i18n?: unknown }).tagline_i18n ?? null

  let og_image_url: string | null = null
  const ogId = (settings as { og_image_file_id?: string | null })
    .og_image_file_id
  if (ogId) {
    try {
      const fileModule = req.scope.resolve(
        Modules.FILE
      ) as IFileModuleService
      const f = await fileModule.retrieveFile(ogId)
      og_image_url = f.url
    } catch {
      og_image_url = null
    }
  }

  const seo_defaults =
    (settings as { seo_defaults?: unknown }).seo_defaults ?? null
  const footer_contact =
    (settings as { footer_contact?: unknown }).footer_contact ?? null
  const announcement =
    (settings as { announcement?: unknown }).announcement ?? null
  const not_found = (settings as { not_found?: unknown }).not_found ?? null

  res.json({
    default_locale: settings.default_locale,
    enabled_locales: settings.enabled_locales,
    logo_url,
    site_title,
    site_title_i18n,
    tagline_i18n,
    seo_defaults,
    og_image_url,
    footer_contact,
    announcement,
    not_found,
  })
}
