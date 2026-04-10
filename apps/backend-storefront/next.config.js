const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/** Cho next/image: ảnh Medusa qua MEDUSA_BACKEND_URL (production Docker / domain thật). */
function remotePatternsFromMedusaBackend() {
  const raw = process.env.MEDUSA_BACKEND_URL
  if (!raw) return []
  try {
    const u = new URL(raw)
    const protocol = u.protocol.replace(":", "")
    if (protocol !== "http" && protocol !== "https") return []
    const entry = {
      protocol,
      hostname: u.hostname,
      pathname: "/**",
    }
    if (u.port) entry.port = u.port
    return [entry]
  } catch {
    return []
  }
}

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
      ...remotePatternsFromMedusaBackend(),
    ],
  },
}

module.exports = nextConfig
