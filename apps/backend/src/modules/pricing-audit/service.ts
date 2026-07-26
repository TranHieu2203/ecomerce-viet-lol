import { MedusaService } from "@medusajs/framework/utils"
import PriceChange from "./models/price-change"

class PricingAuditModuleService extends MedusaService({
  PriceChange,
}) {}

export default PricingAuditModuleService
