import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_CMS_MODULE } from "../../../../modules/store-cms"
import type StoreCmsModuleService from "../../../../modules/store-cms/service"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve(STORE_CMS_MODULE) as StoreCmsModuleService
  const s = await cms.getOrCreateSettings()
  const codes = (s.enabled_locales as unknown as string[]) || ["vi", "en"]
  const locales = codes.map((code) => ({
    code,
    name: code === "vi" ? "Tiếng Việt" : code === "en" ? "English" : code,
  }))
  res.json({ locales })
}
