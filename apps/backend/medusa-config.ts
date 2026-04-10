import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Origin public của Medusa (HTTPS, không có path /static).
 * File local provider mặc định ghép URL ảnh = `http://localhost:9000/static/...` → Admin/ browser ngoài mạng không load được.
 * Prod: set MEDUSA_BACKEND_PUBLIC_URL=https://admin.example.com (giống domain NPM trỏ vào backend).
 */
function medusaBackendPublicOrigin(): string {
  const raw =
    process.env.MEDUSA_BACKEND_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim() ||
    ""
  if (raw) {
    return raw.replace(/\/$/, "")
  }
  return "http://localhost:9000"
}

const fileLocalBackendUrl = `${medusaBackendPublicOrigin()}/static`

module.exports = defineConfig({
  modules: [
    {
      resolve: "./src/modules/store-cms",
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "static",
              backend_url: fileLocalBackendUrl,
            },
          },
        ],
      },
    },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  }
})
