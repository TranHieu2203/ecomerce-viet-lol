import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { listProducts } from "@lib/data/products"
import { displayCollection } from "@lib/util/i18n-catalog"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"
import Reveal from "@modules/common/components/reveal"

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
    <div className="content-container py-10 xsmall:py-14 small:py-20 border-b border-ui-border-base last:border-b-0">
      <div className="flex flex-col gap-3 xsmall:flex-row xsmall:items-end xsmall:justify-between mb-6 xsmall:mb-8">
        <Text className="txt-xlarge text-ui-fg-base font-semibold tracking-tight">
          {displayTitle}
        </Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          {m.home.viewAll}
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 large:grid-cols-5 gap-x-4 xsmall:gap-x-6 gap-y-10 xsmall:gap-y-16 small:gap-y-24">
        {pricedProducts.map((product, idx) => (
          <li key={product.id}>
            <Reveal
              variant="up"
              delayMs={Math.min(240, idx * 40)}
              initialInView={idx < 5}
            >
              <ProductPreview
                product={product}
                region={region}
                isFeatured
                locale={countryCode}
                showDescription
              />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  )
}
