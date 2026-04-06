import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { seedAppendixA } from "./seed-appendix-a"

/**
 * Chạy khi DB đã có region/sales channel (tránh lỗi duplicate từ seed đầy đủ).
 * Usage: node ./node_modules/@medusajs/cli/cli.js exec ./src/scripts/seed-appendix-only.ts
 */
export default async function runAppendixOnly({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const salesChannelId = (channels?.[0] as { id: string })?.id
  if (!salesChannelId) {
    throw new Error("No sales channel found")
  }

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })
  const shippingProfileId = (profiles?.[0] as { id: string })?.id
  if (!shippingProfileId) {
    throw new Error("No default shipping profile found")
  }

  await seedAppendixA({ container, salesChannelId, shippingProfileId })
  logger.info("seed-appendix-only completed")
}
