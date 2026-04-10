/**
 * In ra stdout một dòng: token publishable key (pk_...).
 * Dùng sau seed trên server để cập nhật deploy/.env.production.
 * Chạy: npx medusa exec ./src/scripts/print-publishable-key.ts
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function printPublishableKey({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["token"],
    filters: { type: "publishable" },
  })
  const tok = data?.[0]?.token
  if (typeof tok !== "string" || !tok.startsWith("pk_")) {
    console.error(
      "[print-publishable-key] Không có publishable key (chạy npm run seed trước)."
    )
    process.exit(1)
  }
  process.stdout.write(`${tok}\n`)
}
