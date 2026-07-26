import { MedusaService } from "@medusajs/framework/utils"
import StockMovement from "./models/stock-movement"

class StockLedgerModuleService extends MedusaService({
  StockMovement,
}) {}

export default StockLedgerModuleService
