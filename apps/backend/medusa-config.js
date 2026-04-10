const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  modules: [
    {
      // Production image chạy `medusa start` từ output build trong `.medusa/server`.
      // Nếu trỏ vào `src/modules/*` (TypeScript) thì runtime `require()` sẽ fail.
      resolve:
        process.env.NODE_ENV === "production"
          ? "./.medusa/server/src/modules/store-cms"
          : "./src/modules/store-cms",
    },
  ],
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS,
      adminCors: process.env.ADMIN_CORS,
      authCors: process.env.AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
})

