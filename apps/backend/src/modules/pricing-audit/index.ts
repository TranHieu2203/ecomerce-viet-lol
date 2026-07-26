import { Module } from "@medusajs/framework/utils"
import PricingAuditModuleService from "./service"

export const PRICING_AUDIT_MODULE = "pricing_audit"

export default Module(PRICING_AUDIT_MODULE, {
  service: PricingAuditModuleService,
})
