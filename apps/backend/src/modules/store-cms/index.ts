import { Module } from "@medusajs/framework/utils"
import StoreCmsModuleService, { CMS_SETTINGS_ID } from "./service"

export const STORE_CMS_MODULE = "store_cms"
export { CMS_SETTINGS_ID }

export default Module(STORE_CMS_MODULE, {
  service: StoreCmsModuleService,
})
