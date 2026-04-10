/**
 * Idempotent: sửa các lỗi thường gặp khiến storefront không áp dụng được shipping
 * (thiếu liên kết sales_channel ↔ stock_location, thiếu tồn kho tại kho mặc định,
 * thiếu shipping options trên service zone VN).
 *
 * Chạy: npm run seed:ensure-shipping (từ apps/backend)
 */
import type {
  CreateInventoryLevelInput,
  ExecArgs,
  UpdateInventoryLevelInput,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import { seedVietnamProvinceGeoZones } from "./seed-vietnam-province-geozones"

const FULFILLMENT_SET_NAME = "Vietnam Warehouse delivery"
const STOCK_LOCATION_NAME = "Vietnam Warehouse"
const DEFAULT_SC_NAME = "Default Sales Channel"

export default async function ensureShippingReadiness({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const storeModuleService = container.resolve(Modules.STORE)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  logger.info("[ensure-shipping] Kiểm tra store, kho, sales channel...")

  const [store] = await storeModuleService.listStores()
  if (!store?.id) {
    throw new Error("Không tìm thấy store — chạy npm run seed trước.")
  }

  let stockLocationId = store.default_location_id ?? ""
  if (!stockLocationId) {
    const { data: locs } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
      filters: { name: STOCK_LOCATION_NAME },
    })
    const hit = locs?.[0] as { id?: string } | undefined
    if (hit?.id) {
      stockLocationId = hit.id
      await storeModuleService.updateStores(store.id, {
        default_location_id: stockLocationId,
      })
      logger.info(`[ensure-shipping] Đã gán default_location_id = ${stockLocationId}`)
    }
  }

  if (!stockLocationId) {
    throw new Error(
      "Store chưa có default_location_id và không tìm thấy kho Vietnam — chạy npm run seed."
    )
  }

  const defaultChannels = await salesChannelModuleService.listSalesChannels({
    name: DEFAULT_SC_NAME,
  })
  if (!defaultChannels.length) {
    throw new Error(`Không có "${DEFAULT_SC_NAME}" — chạy npm run seed.`)
  }
  const salesChannelId = defaultChannels[0].id

  const { data: scGraph } = await query.graph({
    entity: "sales_channels",
    fields: ["id", "stock_locations.id"],
    filters: { id: salesChannelId },
  })
  const scRow = scGraph?.[0] as
    | { stock_locations?: { id: string }[] }
    | undefined
  const linkedIds = new Set(
    (scRow?.stock_locations ?? []).map((l) => l.id).filter(Boolean)
  )
  if (!linkedIds.has(stockLocationId)) {
    logger.info(
      "[ensure-shipping] Liên kết Default Sales Channel ↔ kho mặc định..."
    )
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocationId, add: [salesChannelId] },
    })
  } else {
    logger.info("[ensure-shipping] Sales channel đã liên kết kho mặc định.")
  }

  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
    logger.info("[ensure-shipping] Đã liên kết kho ↔ fulfillment provider manual.")
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!/multiple links|already exists/i.test(msg)) {
      throw e
    }
  }

  const { data: fsRows } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "service_zones.id"],
    filters: { name: FULFILLMENT_SET_NAME },
  })
  if (!fsRows?.length) {
    throw new Error(
      `Không có fulfillment set "${FULFILLMENT_SET_NAME}" — chạy npm run seed đầy đủ.`
    )
  }
  const fulfillmentSet = fsRows[0] as {
    id: string
    service_zones?: { id: string }[]
  }
  const serviceZoneId = fulfillmentSet.service_zones?.[0]?.id
  if (!serviceZoneId) {
    throw new Error("Fulfillment set VN không có service zone.")
  }

  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
    logger.info("[ensure-shipping] Đã liên kết kho ↔ fulfillment set VN.")
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!/multiple links|already exists/i.test(msg)) {
      throw e
    }
  }

  await seedVietnamProvinceGeoZones(container, serviceZoneId, logger)

  let shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })
  let shippingProfile = shippingProfiles[0]
  if (!shippingProfile) {
    const { result: created } = await createShippingProfilesWorkflow(
      container
    ).run({
      input: {
        data: [{ name: "Default Shipping Profile", type: "default" }],
      },
    })
    shippingProfile = created[0]
    logger.info("[ensure-shipping] Đã tạo Default Shipping Profile.")
  }

  const existingStandard =
    await fulfillmentModuleService.listShippingOptions({
      name: "Standard Shipping",
      service_zone: { id: serviceZoneId },
    })

  if (!existingStandard.length) {
    const { data: vndRegions } = await query.graph({
      entity: "region",
      fields: ["id", "currency_code"],
      filters: { currency_code: "vnd" },
    })
    const regionId = (vndRegions?.[0] as { id?: string } | undefined)?.id
    if (!regionId) {
      throw new Error("Không có region VND — chạy npm run seed.")
    }

    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard",
            description: "Ship in 2-3 days.",
            code: "standard",
          },
          prices: [
            { currency_code: "vnd", amount: 25000 },
            { region_id: regionId, amount: 25000 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
        {
          name: "Express Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Express",
            description: "Ship in 24 hours.",
            code: "express",
          },
          prices: [
            { currency_code: "vnd", amount: 50000 },
            { region_id: regionId, amount: 50000 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
    logger.info("[ensure-shipping] Đã tạo Standard + Express shipping options.")
  } else {
    logger.info("[ensure-shipping] Shipping options (Standard) đã tồn tại.")
  }

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })
  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["id", "inventory_item_id", "location_id"],
    filters: { location_id: stockLocationId },
  })
  const levelIdByItem = new Map<string, string>()
  for (const row of existingLevels ?? []) {
    const r = row as {
      id: string
      inventory_item_id: string
      location_id: string
    }
    if (r.location_id === stockLocationId && r.inventory_item_id) {
      levelIdByItem.set(r.inventory_item_id, r.id)
    }
  }

  const toCreate: CreateInventoryLevelInput[] = []
  const toUpdate: UpdateInventoryLevelInput[] = []
  for (const row of inventoryItems ?? []) {
    const itemId = (row as { id: string }).id
    if (!itemId) continue
    const existingLevelId = levelIdByItem.get(itemId)
    if (existingLevelId) {
      toUpdate.push({
        id: existingLevelId,
        inventory_item_id: itemId,
        location_id: stockLocationId,
        stocked_quantity: 1_000_000,
      })
    } else {
      toCreate.push({
        location_id: stockLocationId,
        stocked_quantity: 1_000_000,
        inventory_item_id: itemId,
      })
    }
  }

  if (toCreate.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: toCreate },
    })
  }
  if (toUpdate.length) {
    await updateInventoryLevelsWorkflow(container).run({
      input: { updates: toUpdate },
    })
  }
  logger.info(
    `[ensure-shipping] Tồn kho tại kho mặc định: tạo ${toCreate.length}, cập nhật ${toUpdate.length}.`
  )

  logger.info("[ensure-shipping] Hoàn tất.")
}
