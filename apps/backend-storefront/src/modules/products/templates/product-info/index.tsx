import { displayCollection, displayProduct } from "@lib/util/i18n-catalog"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  locale: string
}

const ProductInfo = ({ product, locale }: ProductInfoProps) => {
  const collectionTitle =
    product.collection &&
    displayCollection(
      locale,
      product.collection.title,
      product.collection.metadata as Record<string, unknown> | null | undefined
    ).title
  const { title, description } = displayProduct(
    locale,
    product.title,
    product.description,
    product.metadata as Record<string, unknown> | null | undefined
  )

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {collectionTitle}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {title}
        </Heading>

        <Text
          className="text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
