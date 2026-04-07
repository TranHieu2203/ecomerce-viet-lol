import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  CMS_SETTINGS_ID,
  STORE_CMS_MODULE,
} from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"
import { findMissingCollectionHandles } from "../../../../utils/build-resolved-nav-menu"
import { appendNavRevision } from "../../../../utils/cms-revision"
import {
  EMPTY_NAV_TREE,
  validateAndNormalizeNavTree,
  type NavTree,
} from "../../../../utils/nav-tree"
import { revalidateStorefrontCms } from "../../../../utils/revalidate-storefront"

function actorUserId(
  req: AuthenticatedMedusaRequest
): string | null {
  return req.auth_context?.actor_id ?? null
}

/**
 * GET — Contract: luôn trả `nav_tree` dạng object `{ version, items[] }`.
 * Khi DB là `null`, trả `{ version: 1, items: [] }`.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const settings = await cms.getOrCreateSettings()
  const raw = (settings as { nav_tree?: unknown }).nav_tree
  let nav_tree: NavTree
  try {
    nav_tree =
      raw == null ? { ...EMPTY_NAV_TREE } : validateAndNormalizeNavTree(raw)
  } catch {
    nav_tree = { ...EMPTY_NAV_TREE }
  }
  res.json({ nav_tree })
}

export async function PATCH(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const body = (req.body ?? {}) as Record<string, unknown>
  if (!Object.prototype.hasOwnProperty.call(body, "nav_tree")) {
    return res.status(400).json({ message: "Thiếu nav_tree" })
  }

  let nav_tree: NavTree
  try {
    nav_tree = validateAndNormalizeNavTree(body.nav_tree)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "nav_tree không hợp lệ"
    return res.status(400).json({ message: msg })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const missing = await findMissingCollectionHandles(query, nav_tree)
  if (missing.length) {
    return res.status(400).json({
      message: `Collection không tồn tại: ${missing.join(", ")}`,
    })
  }

  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const current = await cms.getOrCreateSettings()
  const rawPrev = (current as { nav_tree?: unknown }).nav_tree
  let prevNavForRevision: NavTree
  try {
    prevNavForRevision =
      rawPrev == null
        ? { ...EMPTY_NAV_TREE }
        : validateAndNormalizeNavTree(rawPrev)
  } catch {
    prevNavForRevision = { ...EMPTY_NAV_TREE }
  }
  await appendNavRevision(
    cms,
    prevNavForRevision as unknown as Record<string, unknown>,
    actorUserId(req)
  )

  const cur = current as {
    site_title?: string | null
    site_title_i18n?: unknown
    tagline_i18n?: unknown
  }
  const updatePayload = {
    id: CMS_SETTINGS_ID,
    default_locale: current.default_locale,
    enabled_locales: current.enabled_locales,
    logo_file_id: current.logo_file_id,
    site_title: cur.site_title ?? null,
    nav_tree: nav_tree as unknown as Record<string, unknown>,
    site_title_i18n: cur.site_title_i18n ?? null,
    tagline_i18n: cur.tagline_i18n ?? null,
  }
  const updated = await cms.updateCmsSettings(
    updatePayload as unknown as Parameters<
      StoreCmsModuleService["updateCmsSettings"]
    >[0]
  )
  await revalidateStorefrontCms("cms-nav")
  res.json({
    nav_tree: (updated as { nav_tree?: unknown }).nav_tree ?? nav_tree,
  })
}
