import {
  getCmsSettingsPublic,
  resolveCmsFooterContactPlain,
  resolveCmsSiteTitle,
  resolveCmsSocialLinks,
  resolveCmsTagline,
} from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { normalizeMedusaAssetUrl } from "@lib/util/cms-assets"
import { getBaseURL } from "@lib/util/env"

/** Serialize JSON-LD an toàn: tránh `</script>` cắt sớm thẻ script khi dữ liệu chứa chuỗi lạ. */
function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

export default async function OrganizationJsonLd({
  countryCode,
}: {
  countryCode: string
}) {
  const cms = await getCmsSettingsPublic()
  const m = getStorefrontMessages(countryCode)

  const baseUrl = getBaseURL().replace(/\/$/, "")
  const siteUrl = `${baseUrl}/${countryCode}`
  const name = resolveCmsSiteTitle(countryCode, cms, m)
  const description = resolveCmsTagline(countryCode, cms, m)
  const logo = normalizeMedusaAssetUrl(cms.logo_url)
  const { hotline } = resolveCmsFooterContactPlain(cms)
  const socialLinks = resolveCmsSocialLinks(
    cms,
    countryCode,
    m.footer.socialFallback
  )

  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: siteUrl,
    ...(logo ? { logo } : {}),
    ...(description ? { description } : {}),
    ...(socialLinks.length ? { sameAs: socialLinks.map((s) => s.href) } : {}),
    ...(hotline
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            telephone: hotline,
            contactType: "customer service",
          },
        }
      : {}),
  }

  const website: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: siteUrl,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(website) }}
      />
    </>
  )
}
