/**
 * In ra stdout một dòng: token publishable key (pk_...).
 * Dùng sau seed trên server để cập nhật deploy/.env.production.
 * Chạy: npx medusa exec ./src/scripts/print-publishable-key.ts
 *
 * Lưu ý: Remote Query (`query.graph`) thường không expose field `token` trên api_key;
 * phải đọc qua API Key module service.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function printPublishableKey({ container }: ExecArgs) {
  const apiKeyModuleService = container.resolve(Modules.API_KEY)
  const keys = await apiKeyModuleService.listApiKeys({ type: "publishable" })
  const active =
    keys.find((k) => k.revoked_at == null && typeof k.token === "string") ??
    keys.find((k) => typeof k.token === "string")
  const tok = active?.token
  if (typeof tok !== "string" || !tok.startsWith("pk_")) {
    console.error(
      "[print-publishable-key] Không có publishable key hợp lệ (chạy npm run seed trước)."
    )
    process.exit(1)
  }
  process.stdout.write(`${tok}\n`)
}
