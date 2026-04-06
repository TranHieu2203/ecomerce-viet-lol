import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  return (
    <div className="content-container py-10 xsmall:py-14 small:py-20 border-b border-ui-border-base last:border-b-0">
      <div className="flex flex-col gap-3 xsmall:flex-row xsmall:items-end xsmall:justify-between mb-6 xsmall:mb-8">
        <Text className="txt-xlarge text-ui-fg-base font-semibold tracking-tight">
          {collection.title}
        </Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          Xem tất cả
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-4 xsmall:gap-x-6 gap-y-10 xsmall:gap-y-16 small:gap-y-24">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
      </ul>
    </div>
  )
}
