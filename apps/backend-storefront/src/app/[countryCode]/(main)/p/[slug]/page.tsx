import {
  getCmsPagePublic,
  getCmsSettingsPublic,
  resolveCmsSiteTitle,
} from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
  searchParams: Promise<{ cms_preview?: string }>
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
  const ogImages = cms.og_image_url ? [cms.og_image_url] : []

  return {
    title,
    description: metaDesc,
    openGraph: {
      title,
      description: metaDesc,
      images: ogImages,
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

  const page = await getCmsPagePublic(params.slug, params.countryCode, preview)
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
      </article>
    </div>
  )
}
