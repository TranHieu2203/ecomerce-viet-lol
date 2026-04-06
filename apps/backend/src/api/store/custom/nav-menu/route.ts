import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { buildResolvedNavMenu } from "../../../../utils/build-resolved-nav-menu"
import {
  EMPTY_NAV_TREE,
  validateAndNormalizeNavTree,
  type NavTree,
} from "../../../../utils/nav-tree"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const settings = await cms.getOrCreateSettings()
  const enabled = settings.enabled_locales as unknown as string[]
  if (!Array.isArray(enabled) || enabled.length < 1) {
    return res.status(500).json({ message: "CMS enabled_locales invalid" })
  }

  const qLocale = (req.query?.locale as string | undefined)?.trim()
  const defaultLocale =
    typeof settings.default_locale === "string"
      ? settings.default_locale
      : "vi"
  const locale = (qLocale && qLocale.length ? qLocale : defaultLocale).toLowerCase()

  if (!enabled.includes(locale)) {
    return res.status(400).json({ message: "locale không được hỗ trợ" })
  }

  const raw = (settings as { nav_tree?: unknown }).nav_tree
  let navTree: NavTree = { ...EMPTY_NAV_TREE }
  if (raw != null) {
    try {
      navTree = validateAndNormalizeNavTree(raw)
    } catch {
      navTree = { ...EMPTY_NAV_TREE }
    }
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const payload = await buildResolvedNavMenu(query, navTree, locale)
  res.json(payload)
}
