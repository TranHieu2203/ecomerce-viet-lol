import type { Logger, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { VIETNAM_ISO3166_SUBDIVISIONS } from "./data/vietnam-provinces-iso3166"

/**
 * Gắn các geo_zone kiểu province (ISO 3166-2:VN) vào service zone giao hàng Việt Nam.
 * Idempotent: chỉ tạo mã còn thiếu trên cùng service_zone_id.
 */
export async function seedVietnamProvinceGeoZones(
  container: MedusaContainer,
  serviceZoneId: string,
  logger: Logger
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

  const { data: existingRows } = await query.graph({
    entity: "geo_zone",
    fields: ["province_code", "type", "service_zone_id"],
    filters: {
      type: "province",
      service_zone_id: serviceZoneId,
    } as Record<string, unknown>,
  })

  const existingCodes = new Set(
    (existingRows ?? [])
      .map((r) => (r as { province_code?: string | null }).province_code)
      .filter((c): c is string => Boolean(c))
  )

  const toCreate = VIETNAM_ISO3166_SUBDIVISIONS.filter(
    (p) => !existingCodes.has(p.province_code)
  ).map((p) => ({
    type: "province" as const,
    country_code: "vn",
    province_code: p.province_code,
    service_zone_id: serviceZoneId,
    metadata: { name_vi: p.name_vi },
  }))

  if (!toCreate.length) {
    logger.info(
      "Geo zones tỉnh/thành Việt Nam đã đủ trên service zone, bỏ qua."
    )
    return
  }

  await fulfillmentModuleService.createGeoZones(toCreate)
  logger.info(
    `Đã tạo ${toCreate.length} geo_zone province (VN); ${existingCodes.size} mã đã có sẵn trên service zone.`
  )
}
