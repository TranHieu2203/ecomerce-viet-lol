import { Metadata } from "next"

import {
  getCmsSettingsPublic,
  listBannerSlides,
  resolveCmsSiteTitle,
} from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import FeaturedProducts from "@modules/home/components/featured-products"
import HeroSlider from "@modules/home/components/hero-slider"
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
  const title = resolveCmsSiteTitle(countryCode, cms, m, m.home.metaFallbackTitle)
  return {
    title,
    description: m.home.metaDescription,
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const [{ collections }, slides] = await Promise.all([
    listCollections({
      fields: "id, handle, title",
    }),
    listBannerSlides(countryCode),
  ])

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <HeroSlider slides={slides} locale={countryCode} />
      <div className="py-8 xsmall:py-12 bg-white">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts
            collections={collections}
            region={region}
            countryCode={countryCode}
          />
        </ul>
      </div>
    </>
  )
}
