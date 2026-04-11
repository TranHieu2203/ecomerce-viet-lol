/**
 * seed-inventory-setup.ts
 *
 * Epic 14 — Story 14.1: Setup kho & bật inventory hàng loạt
 *
 * Thực hiện:
 *  1. Tạo 2 StockLocations: "Hà Nội 1", "Hà Nội 2" (idempotent)
 *  2. Link các kho mới với default sales channel
 *  3. Bật manage_inventory=true, allow_backorder=true trên tất cả variants
 *  4. Tạo InventoryLevel tại cả 2 kho cho tất cả InventoryItems (stocked_quantity=0)
 *  5. Set metadata.min_stock_threshold=19 trên tất cả InventoryItems chưa có
 *
 * Chạy: npm run seed:inventory-setup  (từ apps/backend)
 */

import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

// ─── Kho cần tạo ──────────────────────────────────────────────────────────────
const STOCK_LOCATIONS = [
  {
    name: "Hà Nội 1",
    address: {
      address_1: "Kho Hà Nội 1",
      city: "Hà Nội",
      country_code: "VN",
    },
  },
  {
    name: "Hà Nội 2",
    address: {
      address_1: "Kho Hà Nội 2",
      city: "Hà Nội",
      country_code: "VN",
    },
  },
]

const DEFAULT_MIN_THRESHOLD = 19

export default async function seedInventorySetup({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  const inventoryService = container.resolve(Modules.INVENTORY)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const productModule = container.resolve(Modules.PRODUCT)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)

  logger.info("=== Epic 14 — Seed Inventory Setup ===")

  // ── 1. Tạo StockLocations (idempotent) ────────────────────────────────────
  logger.info("Bước 1: Kiểm tra / tạo StockLocations...")
  const createdLocationIds: string[] = []

  for (const loc of STOCK_LOCATIONS) {
    const existing = await stockLocationService.listStockLocations({
      name: loc.name,
    })

    if (existing.length) {
      logger.info(`  ✓ Kho "${loc.name}" đã tồn tại (id: ${existing[0].id})`)
      createdLocationIds.push(existing[0].id)
    } else {
      const { result } = await createStockLocationsWorkflow(container).run({
        input: {
          locations: [
            {
              name: loc.name,
              address: loc.address,
            },
          ],
        },
      })
      const newLoc = result[0]
      createdLocationIds.push(newLoc.id)
      logger.info(`  + Tạo kho "${loc.name}" (id: ${newLoc.id})`)
    }
  }

  // ── 2. Link kho → default Sales Channel ───────────────────────────────────
  logger.info("Bước 2: Link StockLocations với Default Sales Channel...")

  const salesChannels = await salesChannelModule.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!salesChannels.length) {
    logger.warn("  ⚠ Không tìm thấy Default Sales Channel — bỏ qua link.")
  } else {
    const scId = salesChannels[0].id
    for (const locationId of createdLocationIds) {
      try {
        await linkSalesChannelsToStockLocationWorkflow(container).run({
          input: {
            id: locationId,
            add: [scId],
          },
        })
        logger.info(`  ✓ Link kho ${locationId} ↔ Sales Channel ${scId}`)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (/already exists|duplicate/i.test(msg)) {
          logger.info(`  ✓ Link kho ${locationId} đã tồn tại`)
        } else {
          logger.warn(`  ⚠ Link kho ${locationId}: ${msg}`)
        }
      }
    }
  }

  // ── 3. Bật manage_inventory + allow_backorder trên tất cả variants ─────────
  logger.info("Bước 3: Bật manage_inventory + allow_backorder trên tất cả variants...")

  const { data: allVariants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "manage_inventory", "allow_backorder", "title", "sku"],
  })

  const variantsToUpdate = (allVariants ?? []).filter(
    (v: Record<string, unknown>) => !v.manage_inventory || !v.allow_backorder
  )

  if (!variantsToUpdate.length) {
    logger.info("  ✓ Tất cả variants đã bật manage_inventory + allow_backorder")
  } else {
    const ids = variantsToUpdate.map((v: Record<string, unknown>) => v.id as string)
    logger.info(`  → Cập nhật ${ids.length} variants (batch 20)...`)
    // updateProductVariants(id, data) — gọi từng variant, batch 20 song song
    for (let i = 0; i < ids.length; i += 20) {
      const batch = ids.slice(i, i + 20)
      await Promise.all(
        batch.map((id) =>
          productModule.updateProductVariants(id, {
            manage_inventory: true,
            allow_backorder: true,
          })
        )
      )
    }
    logger.info(`  ✓ Cập nhật xong ${ids.length} variants`)
  }

  logger.info(`  Tổng variants: ${(allVariants ?? []).length}`)

  // ── 4. Tạo InventoryLevels tại cả 2 kho cho tất cả InventoryItems ──────────
  logger.info("Bước 4: Tạo InventoryLevels cho tất cả items × kho...")

  const { data: allInventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "title", "location_levels.id", "location_levels.location_id"],
  })

  const items = allInventoryItems ?? []
  logger.info(`  Tổng InventoryItems: ${items.length}`)

  const levelsToCreate: Array<{
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }> = []

  for (const item of items as Array<{
    id: string
    sku?: string
    location_levels?: Array<{ location_id: string }>
  }>) {
    const existingLocationIds = new Set(
      (item.location_levels ?? []).map((l) => l.location_id)
    )
    for (const locationId of createdLocationIds) {
      if (!existingLocationIds.has(locationId)) {
        levelsToCreate.push({
          inventory_item_id: item.id,
          location_id: locationId,
          stocked_quantity: 0,
        })
      }
    }
  }

  if (!levelsToCreate.length) {
    logger.info("  ✓ Tất cả InventoryLevels đã tồn tại")
  } else {
    logger.info(`  → Tạo ${levelsToCreate.length} InventoryLevels mới...`)
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: levelsToCreate,
      },
    })
    logger.info(`  ✓ Tạo xong ${levelsToCreate.length} InventoryLevels`)
  }

  // ── 5. Set min_stock_threshold = 19 trên các InventoryItems chưa có ─────────
  logger.info(`Bước 5: Set min_stock_threshold=${DEFAULT_MIN_THRESHOLD} trên InventoryItems chưa có...`)

  const itemsWithoutThreshold = (items as Array<{
    id: string
    metadata?: { min_stock_threshold?: number } | null
  }>).filter(
    (item) =>
      item.metadata == null ||
      item.metadata.min_stock_threshold == null
  )

  if (!itemsWithoutThreshold.length) {
    logger.info("  ✓ Tất cả InventoryItems đã có min_stock_threshold")
  } else {
    logger.info(`  → Cập nhật ${itemsWithoutThreshold.length} InventoryItems...`)
    await inventoryService.updateInventoryItems(
      itemsWithoutThreshold.map((item) => ({
        id: item.id,
        metadata: {
          ...(item.metadata ?? {}),
          min_stock_threshold: DEFAULT_MIN_THRESHOLD,
        },
      }))
    )
    logger.info(`  ✓ Cập nhật xong ${itemsWithoutThreshold.length} InventoryItems`)
  }

  // ── Tổng kết ──────────────────────────────────────────────────────────────
  logger.info("=== Hoàn tất seed-inventory-setup ===")
  logger.info(`  Kho đã có: ${createdLocationIds.length} (${STOCK_LOCATIONS.map((l) => l.name).join(", ")})`)
  logger.info(`  InventoryItems: ${items.length}`)
  logger.info(`  InventoryLevels mới: ${levelsToCreate.length}`)
  logger.info(`  Variants cập nhật: ${variantsToUpdate.length}`)
  logger.info("")
  logger.info("Bước tiếp theo: vào Admin → Inventory để nhập số lượng tồn kho ban đầu cho từng sản phẩm.")
}
