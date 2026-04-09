import { getCmsSettingsPublic, resolveCmsSiteTitle } from "@lib/data/cms"
import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { displayCollection } from "@lib/util/i18n-catalog"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { SUPPORTED_LOCALES } from "@lib/util/locales"
import { StoreCollection } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

/** Catalog thay đổi sau seed/build — tránh pre-render tĩnh với danh sách rỗng. */
export const dynamic = "force-dynamic"

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  try {
    const { collections } = await listCollections({
      fields: "*products",
    })

    if (!collections) {
      return []
    }

    const collectionHandles = collections.map(
      (collection: StoreCollection) => collection.handle
    )

    return SUPPORTED_LOCALES.flatMap((countryCode) =>
      collectionHandles.map((handle: string | undefined) => ({
        countryCode,
        handle,
      }))
    )
  } catch (e) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[collections] generateStaticParams: bỏ qua khi Store API không sẵn sàng (vd. build CI không có backend).",
        e instanceof Error ? e.message : e
      )
    }
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const cms = await getCmsSettingsPublic()
  const m = getStorefrontMessages(params.countryCode)
  const brand = resolveCmsSiteTitle(params.countryCode, cms, m)
  const { title: colTitle } = displayCollection(
    params.countryCode,
    collection.title,
    collection.metadata as Record<string, unknown> | null | undefined
  )
  const title = `${colTitle} | ${brand}`

  return {
    title,
    description: `${colTitle}`.trim() || title,
  }
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
    />
  )
}
