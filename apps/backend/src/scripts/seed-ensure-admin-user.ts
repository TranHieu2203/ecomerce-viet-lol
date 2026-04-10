/**
 * Tạo user Medusa Admin mặc định (email + password) nếu chưa tồn tại.
 * Logic tương đương `npx medusa user -e ... -p ...` (create user + emailpass + link identity).
 *
 * Env (tuỳ chọn):
 * - ADMIN_EMAIL (mặc định: admin@ecomerce-viet-lol.local)
 * - ADMIN_PASSWORD (mặc định: ChangeMe123!)
 *
 * Chạy riêng: npx medusa exec ./src/scripts/seed-ensure-admin-user.ts
 */
import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  FeatureFlag,
  Modules,
} from "@medusajs/framework/utils"

const DEFAULT_ADMIN_EMAIL = "admin@ecomerce-viet-lol.local"
const DEFAULT_ADMIN_PASSWORD = "ChangeMe123!"

export async function ensureDefaultAdminUser(
  container: ExecArgs["container"]
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const userModule = container.resolve(Modules.USER)
  const authService = container.resolve(Modules.AUTH)
  const workflowService = container.resolve(Modules.WORKFLOW_ENGINE)

  const email =
    process.env.ADMIN_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD

  const existing = await userModule.listUsers({ email })
  if (existing.length > 0) {
    logger.info(
      `[seed-admin] Đã có user với email "${email}" — bỏ qua tạo mới.`
    )
    return
  }

  let userRoles: string[] = []
  if (FeatureFlag.isFeatureEnabled("rbac")) {
    const rbacService = container.resolve(Modules.RBAC)
    const superAdminRoles = await rbacService.listRbacRoles({
      id: "role_super_admin",
    })
    if (superAdminRoles.length > 0) {
      userRoles = [superAdminRoles[0].id]
    }
  }

  const userPayload: { email: string; roles?: string[] } = { email }
  if (userRoles.length > 0) {
    userPayload.roles = userRoles
  }

  const { result: users } = await workflowService.run(
    "create-users-workflow",
    {
      input: {
        users: [userPayload],
      },
    }
  )

  const user = users[0]
  const { authIdentity, error } = await authService.register("emailpass", {
    body: {
      email,
      password,
    },
  })

  if (error) {
    logger.error(`[seed-admin] Đăng ký emailpass thất bại: ${String(error)}`)
    throw error
  }

  await authService.updateAuthIdentities({
    id: authIdentity!.id,
    app_metadata: {
      user_id: user.id,
    },
  })

  logger.info(
    `[seed-admin] Đã tạo admin: ${email} — đổi mật khẩu sau lần đăng nhập đầu (hoặc set ADMIN_EMAIL / ADMIN_PASSWORD trước seed).`
  )
}

export default async function seedEnsureAdminUserScript({
  container,
}: ExecArgs) {
  await ensureDefaultAdminUser(container)
}
