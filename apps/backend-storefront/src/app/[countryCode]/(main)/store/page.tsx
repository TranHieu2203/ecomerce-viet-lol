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

  if (query) {
    return {
      title: m.store.searchResultsFor.replace("{query}", query),
      description: m.store.searchResultsFor.replace("{query}", query),
      // Trang kết quả tìm kiếm nội bộ: không index (tránh nội dung mỏng/trùng lặp).
      robots: { index: false, follow: true },
    }
  }

  return {
    title: m.store.metaTitle,
    description: m.store.metaDescription,
  }
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, q } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      q={q}
      countryCode={params.countryCode}
    />
  )
}
