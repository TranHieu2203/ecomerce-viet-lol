import { Metadata } from "next"

import {
  getCmsNewsList,
  getCmsSettingsPublic,
  listBannerSlides,
  resolveCmsSeoDefaults,
  resolveCmsSiteTitle,
} from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { getBaseURL } from "@lib/util/env"
import FeaturedProducts from "@modules/home/components/featured-products"
import HeroSlider from "@modules/home/components/hero-slider"
import CmsNewsTeaser from "@modules/home/components/cms-news-teaser"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await params
  const m = getStorefrontMessages(countryCode)
  const cms = await getCmsSettingsPublic()
  const seoDefaults = resolveCmsSeoDefaults(countryCode, cms)
  const siteTitle = resolveCmsSiteTitle(
    countryCode,
    cms,
    m,
    m.home.metaFallbackTitle
  )
  const title = seoDefaults.title || siteTitle
  const description = seoDefaults.description || m.home.metaDescription
  const canonical = `${getBaseURL()}/${countryCode}`
  const ogImage = cms.og_image_url || "/og-default.jpg"

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const [{ collections }, slides, newsList] = await Promise.all([
    listCollections({
      fields: "id, handle, title, metadata",
    }),
    listBannerSlides(countryCode),
    getCmsNewsList(countryCode, 4, 0),
  ])

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <HeroSlider slides={slides} locale={countryCode} />
      <div className="py-5 xsmall:py-8">
        <ul className="content-container flex flex-col gap-y-8 xsmall:gap-y-10 small:gap-y-12">
          <FeaturedProducts
            collections={collections}
            region={region}
            countryCode={countryCode}
          />
        </ul>
      </div>
      <CmsNewsTeaser
        locale={countryCode}
        articles={newsList.articles}
        isEn={countryCode === "en"}
      />
    </>
  )
}
