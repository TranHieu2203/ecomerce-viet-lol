import { Metadata } from "next"

import { getCmsSettingsPublic, listBannerSlides } from "@lib/data/cms"
import FeaturedProducts from "@modules/home/components/featured-products"
import HeroSlider from "@modules/home/components/hero-slider"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getCmsSettingsPublic()
  const title =
    cms.site_title?.trim() ||
    process.env.NEXT_PUBLIC_STORE_DISPLAY_NAME?.trim() ||
    "Cửa hàng trực tuyến"
  return {
    title,
    description: `Mua sắm tại ${title}. Sản phẩm đa dạng, trải nghiệm mua hàng nhanh chóng.`,
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
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
