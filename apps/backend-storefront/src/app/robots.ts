import { getBaseURL } from "@lib/util/env"
import type { MetadataRoute } from "next"

const DISALLOWED_PATHS = [
  "/*/cart",
  "/*/checkout",
  "/*/account",
  "/*/account/*",
  "/*/order/*",
]

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL().replace(/\/$/, "")

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      // AI answer-engine / assistant crawlers — allow explicitly for retrieval & citation.
      { userAgent: "GPTBot", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "ChatGPT-User", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "ClaudeBot", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "Claude-User", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "Claude-SearchBot", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "anthropic-ai", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "PerplexityBot", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "Perplexity-User", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "Google-Extended", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "GoogleOther", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "Applebot-Extended", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "Bingbot", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "cohere-ai", allow: "/", disallow: DISALLOWED_PATHS },
      { userAgent: "Meta-ExternalAgent", allow: "/", disallow: DISALLOWED_PATHS },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
