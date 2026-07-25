import { getCmsSettingsPublic } from "@lib/data/cms"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { countryCode } = await params
  const { q } = await searchParams
  const m = getStorefrontMessages(countryCode)
  const query = q?.trim()
  const cms = await getCmsSettingsPublic()
  const ogImage = cms.og_image_url || "/og-default.jpg"

  if (query) {
    const title = m.store.searchResultsFor.replace("{query}", query)
    return {
      title,
      description: title,
      // Trang kết quả tìm kiếm nội bộ: không index (tránh nội dung mỏng/trùng lặp).
      robots: { index: false, follow: true },
      openGraph: { title, description: title, images: [ogImage] },
      twitter: {
        card: "summary_large_image",
        title,
        description: title,
        images: [ogImage],
      },
    }
  }

  return {
    title: m.store.metaTitle,
    description: m.store.metaDescription,
    openGraph: {
      title: m.store.metaTitle,
      description: m.store.metaDescription,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: m.store.metaTitle,
      description: m.store.metaDescription,
      images: [ogImage],
    },
  }
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
    categoryId?: string
    minRating?: string
    minPrice?: string
    maxPrice?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, q, categoryId, minRating, minPrice, maxPrice } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      q={q}
      categoryId={categoryId}
      minRating={minRating}
      minPrice={minPrice}
      maxPrice={maxPrice}
      countryCode={params.countryCode}
    />
  )
}
