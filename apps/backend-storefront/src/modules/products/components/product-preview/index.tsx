import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { displayProduct } from "@lib/util/i18n-catalog"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
  locale,
  showDescription,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  locale: string
  showDescription?: boolean
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })
  const { title, description } = displayProduct(
    locale,
    product.title,
    product.description,
    product.metadata as Record<string, unknown> | null | undefined
  )

  const showDescriptionBlock = Boolean(showDescription && description?.trim())

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive focus-visible:ring-offset-2 focus-visible:ring-offset-ui-bg-base rounded-large"
    >
      <div data-testid="product-wrapper">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
        />
        <div className="txt-compact-medium mt-4">
          <div className="flex justify-between gap-x-4">
            <Text className="text-ui-fg-subtle" data-testid="product-title">
              {title}
            </Text>
            <div className="flex items-center gap-x-2 shrink-0">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>
          </div>
          {showDescriptionBlock && (
            <Text className="text-ui-fg-muted mt-2 line-clamp-2">
              {description}
            </Text>
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
