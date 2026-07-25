import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { listProducts } from "@lib/data/products"
import { displayCollection } from "@lib/util/i18n-catalog"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import RailProducts from "./rail-products"

/** Số sản phẩm mỗi trang trên rail trang chủ (2 hàng ở màn hình rộng nhất). */
const RAIL_PRODUCT_LIMIT = 10

export default async function ProductRail({
  collection,
  region,
  countryCode,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const m = getStorefrontMessages(countryCode)
  const { title: displayTitle } = displayCollection(
    countryCode,
    collection.title,
    collection.metadata as Record<string, unknown> | null | undefined
  )
  const {
    response: { products: pricedProducts, count },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      limit: RAIL_PRODUCT_LIMIT,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts || pricedProducts.length === 0) {
    return null
  }

  return (
    <div>
      <div className="flex flex-col gap-3 xsmall:flex-row xsmall:items-end xsmall:justify-between mb-5 xsmall:mb-6 pb-2.5 xsmall:pb-3 border-b border-brand-gold/25">
        <Text className="text-2xl-semi xsmall:text-3xl-semi text-ui-fg-base tracking-tight">
          {displayTitle}
        </Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          {m.home.viewAll}
        </InteractiveLink>
      </div>
      <RailProducts
        collectionId={collection.id}
        region={region}
        countryCode={countryCode}
        initialProducts={pricedProducts}
        count={count}
        limit={RAIL_PRODUCT_LIMIT}
      />
    </div>
  )
}
