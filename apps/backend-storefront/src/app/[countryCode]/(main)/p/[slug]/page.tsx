import {
  getCmsPagePublic,
  getCmsSettingsPublic,
  resolveCmsFooterContactPlain,
  resolveCmsSiteTitle,
} from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

/** Trang liên hệ lấy thông tin từ Admin nên không phải sửa HTML mỗi lần đổi. */
const CONTACT_SLUG = "lien-he"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
  searchParams: Promise<{ cms_preview?: string }>
}

function ContactDetails({
  countryCode,
  cms,
}: {
  countryCode: string
  cms: Awaited<ReturnType<typeof getCmsSettingsPublic>>
}) {
  const { hotline, email, companyName, taxCode, address, businessLines } =
    resolveCmsFooterContactPlain(cms)

  if (!hotline && !email && !companyName && !taxCode && !address) {
    return null
  }

  const en = countryCode === "en"
  const rows: { label: string; value: React.ReactNode }[] = []

  if (hotline) {
    rows.push({
      label: "Hotline",
      value: (
        <a
          className="underline text-ui-fg-interactive"
          href={`tel:${hotline.replace(/[\s().-]/g, "")}`}
        >
          {hotline}
        </a>
      ),
    })
  }
  if (email) {
    rows.push({
      label: "Email",
      value: (
        <a
          className="underline text-ui-fg-interactive break-words"
          href={`mailto:${email}`}
        >
          {email}
        </a>
      ),
    })
  }
  if (address) {
    rows.push({ label: en ? "Address" : "Địa chỉ", value: address })
  }
  if (taxCode) {
    rows.push({ label: en ? "Tax code" : "Mã số thuế", value: taxCode })
  }
  if (businessLines) {
    rows.push({
      label: en ? "Business lines" : "Ngành nghề",
      value: businessLines,
    })
  }

  return (
    <section className="mt-8 rounded-rounded border border-brand-gold/25 bg-brand-cream/40 p-6">
      {companyName ? (
        <h2 className="text-base-semi text-ui-fg-base mb-4">{companyName}</h2>
      ) : null}
      <dl className="flex flex-col gap-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex flex-col gap-1 small:flex-row small:gap-3"
          >
            <dt className="text-small-regular text-ui-fg-muted small:w-32 small:shrink-0">
              {r.label}
            </dt>
            <dd className="text-base-regular text-ui-fg-base min-w-0">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams
  const preview =
    typeof searchParams.cms_preview === "string" &&
    searchParams.cms_preview.trim().length > 0
      ? searchParams.cms_preview.trim()
      : undefined

  const [page, cms] = await Promise.all([
    getCmsPagePublic(params.slug, params.countryCode, preview),
    getCmsSettingsPublic(),
  ])

  if (!page) {
    notFound()
  }

  const m = getStorefrontMessages(params.countryCode)
  const brand = resolveCmsSiteTitle(
    params.countryCode,
    cms,
    m,
    m.home.metaFallbackTitle
  )
  const metaTitle = page.meta_title?.trim() || page.title
  const metaDesc =
    page.meta_description?.trim() || m.home.metaDescription

  const title = `${metaTitle} | ${brand}`
  const ogImage = cms.og_image_url || "/og-default.jpg"

  return {
    title,
    description: metaDesc,
    openGraph: {
      title,
      description: metaDesc,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: metaDesc,
      images: [ogImage],
    },
  }
}

export default async function CmsStaticPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const preview =
    typeof searchParams.cms_preview === "string" &&
    searchParams.cms_preview.trim().length > 0
      ? searchParams.cms_preview.trim()
      : undefined

  const isContact = params.slug === CONTACT_SLUG
  const [page, cms] = await Promise.all([
    getCmsPagePublic(params.slug, params.countryCode, preview),
    isContact ? getCmsSettingsPublic() : Promise.resolve(null),
  ])
  if (!page) {
    notFound()
  }

  const m = getStorefrontMessages(params.countryCode)

  return (
    <div className="flex flex-col w-full py-8 small:py-12 px-4 small:px-8">
      {page.status === "draft" && preview ? (
        <p className="text-small-regular text-ui-fg-muted mb-4" role="status">
          {params.countryCode === "en"
            ? "Preview — draft"
            : "Xem trước — bản nháp"}
        </p>
      ) : null}

      <nav
        className="text-small-regular text-ui-fg-muted mb-6"
        aria-label="Breadcrumb"
      >
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link
              href={`/${params.countryCode}`}
              className="hover:text-ui-fg-base"
            >
              {m.sideMenu.home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-ui-fg-base">{page.title}</li>
        </ol>
      </nav>

      <article className="max-w-3xl w-full mx-auto">
        <h1 className="text-3xl-semi text-ui-fg-base mb-6">{page.title}</h1>
        <div
          className="cms-page-body text-base-regular text-ui-fg-base [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:underline [&_a]:text-ui-fg-interactive"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
        {cms ? (
          <ContactDetails countryCode={params.countryCode} cms={cms} />
        ) : null}
      </article>
    </div>
  )
}
