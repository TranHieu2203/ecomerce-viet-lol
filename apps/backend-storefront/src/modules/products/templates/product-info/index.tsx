import { displayCollection, displayProduct } from "@lib/util/i18n-catalog"
import { getBaseURL } from "@lib/util/env"
import { normalizeMedusaAssetUrl } from "@lib/util/cms-assets"
import { getReviewSummaries } from "@lib/data/product-reviews"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShareButtons from "@modules/common/components/share-buttons"
import StarRating from "@modules/products/components/star-rating"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  locale: string
}

const ProductInfo = async ({ product, locale }: ProductInfoProps) => {
  const reviewSummaries = await getReviewSummaries([product.id])
  const reviewSummary = reviewSummaries[product.id]
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

        {reviewSummary && reviewSummary.count > 0 ? (
          <a href="#product-reviews" className="flex items-center gap-2 -mt-2">
            <StarRating rating={reviewSummary.average} size="medium" />
            <span className="text-small-regular text-ui-fg-muted">
              {reviewSummary.average.toFixed(1)}/5 · {reviewSummary.count} đánh giá
            </span>
          </a>
        ) : null}

        <Text
          className="text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {description}
        </Text>
        <ShareButtons
          url={`${getBaseURL()}/${locale}/products/${product.handle}`}
          title={title}
          image={normalizeMedusaAssetUrl(product.thumbnail) || undefined}
        />
      </div>
    </div>
  )
}

export default ProductInfo
