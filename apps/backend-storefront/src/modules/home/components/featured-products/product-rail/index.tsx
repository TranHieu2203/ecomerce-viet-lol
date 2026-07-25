import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { listProducts } from "@lib/data/products"
import { displayCollection } from "@lib/util/i18n-catalog"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"
import Reveal from "@modules/common/components/reveal"

/**
 * Giới hạn số cột theo đúng số sản phẩm thực có — tránh lưới 5 cột để trống 4 ô
 * khi collection chỉ có 1-2 sản phẩm (nhìn như lỗi/thiếu nội dung).
 */
function gridClassForCount(count: number): string {
  if (count === 1) {
    return "grid-cols-1 max-w-[220px] xsmall:max-w-[260px]"
  }
  if (count === 2) {
    return "grid-cols-2 max-w-[460px] xsmall:max-w-[540px]"
  }
  if (count === 3) {
    return "grid-cols-2 small:grid-cols-3 max-w-[700px] xsmall:max-w-[820px]"
  }
  if (count === 4) {
    return "grid-cols-2 small:grid-cols-4 max-w-[940px] xsmall:max-w-[1100px]"
  }
  return "grid-cols-2 small:grid-cols-3 medium:grid-cols-4 large:grid-cols-5"
}

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
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      limit: 100,
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
      <ul
        className={`grid ${gridClassForCount(pricedProducts.length)} gap-x-4 xsmall:gap-x-6 gap-y-6 xsmall:gap-y-8 small:gap-y-10`}
      >
        {pricedProducts.map((product, idx) => (
          <li key={product.id} className="h-full">
            <Reveal
              variant="up"
              delayMs={Math.min(240, idx * 40)}
              initialInView={idx < 5}
              className="h-full"
            >
              <ProductPreview
                product={product}
                region={region}
                isFeatured
                locale={countryCode}
              />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  )
}
