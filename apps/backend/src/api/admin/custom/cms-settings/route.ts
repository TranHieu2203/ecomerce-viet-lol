import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IFileModuleService } from "@medusajs/types"
import {
  CMS_SETTINGS_ID,
  STORE_CMS_MODULE,
} from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { revalidateStorefrontCms } from "../../../../utils/revalidate-storefront"

const LOGO_MAX_BYTES = 10 * 1024 * 1024
const LOGO_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
])

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const settings = await cms.getOrCreateSettings()
  res.json({ cms_settings: settings })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const current = await cms.getOrCreateSettings()
  const body = (req.body ?? {}) as Record<string, unknown>

  let logo_file_id = current.logo_file_id
  if (body.logo_file_id !== undefined) {
    if (body.logo_file_id === null || body.logo_file_id === "") {
      logo_file_id = null
    } else {
      const fileModule = req.scope.resolve(Modules.FILE) as IFileModuleService
      const meta = await fileModule.retrieveFile(body.logo_file_id as string)
      const ext = meta as { size?: number; mime_type?: string }
      if (typeof ext.size === "number" && ext.size > LOGO_MAX_BYTES) {
        return res.status(400).json({ message: "Logo exceeds 10MB" })
      }
      const mime = ext.mime_type ?? ""
      if (mime && !LOGO_MIME.has(mime)) {
        return res.status(400).json({ message: `Logo MIME not allowed: ${mime}` })
      }
      logo_file_id = body.logo_file_id as string
    }
  }

  let default_locale = current.default_locale
  let enabled_locales = current.enabled_locales as unknown as string[]
  if (body.default_locale !== undefined) {
    default_locale = String(body.default_locale)
  }
  if (body.enabled_locales !== undefined) {
    enabled_locales = body.enabled_locales as string[]
  }
  if (!Array.isArray(enabled_locales) || enabled_locales.length < 1) {
    return res.status(400).json({ message: "enabled_locales must be non-empty" })
  }
  if (!enabled_locales.includes(default_locale)) {
    return res
      .status(400)
      .json({ message: "default_locale must be in enabled_locales" })
  }

  let site_title = (current as { site_title?: string | null }).site_title ?? null
  if (body.site_title !== undefined) {
    if (body.site_title === null || body.site_title === "") {
      site_title = null
    } else {
      site_title = String(body.site_title).trim().slice(0, 200) || null
    }
  }

  const cur = current as {
    nav_tree?: unknown
    site_title_i18n?: unknown
    tagline_i18n?: unknown
  }

  const updatePayload = {
    id: CMS_SETTINGS_ID,
    default_locale,
    enabled_locales: enabled_locales as unknown as Record<string, unknown>,
    logo_file_id,
    site_title,
    nav_tree: cur.nav_tree ?? null,
    site_title_i18n: cur.site_title_i18n ?? null,
    tagline_i18n: cur.tagline_i18n ?? null,
  }
  const updated = await cms.updateCmsSettings(
    updatePayload as unknown as Parameters<
      StoreCmsModuleService["updateCmsSettings"]
    >[0]
  )
  await revalidateStorefrontCms()
  res.json({ cms_settings: updated })
}
