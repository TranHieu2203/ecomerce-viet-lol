import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { displayCollection, displayProduct } from "@lib/util/i18n-catalog"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type Props = {
  product: HttpTypes.StoreProduct
  locale: string
}

const ProductBreadcrumb = ({ product, locale }: Props) => {
  const m = getStorefrontMessages(locale)
  const { title } = displayProduct(
    locale,
    product.title,
    product.description,
    product.metadata as Record<string, unknown> | null | undefined
  )
  const collectionTitle =
    product.collection &&
    displayCollection(
      locale,
      product.collection.title,
      product.collection.metadata as Record<string, unknown> | null | undefined
    ).title

  return (
    <nav
      aria-label="breadcrumb"
      className="content-container pt-4 pb-0 small:pt-6"
    >
      <ol className="flex items-center gap-1.5 flex-wrap text-small-regular text-ui-fg-muted">
        <li>
          <LocalizedClientLink href="/" className="hover:text-ui-fg-base">
            {m.sideMenu.home}
          </LocalizedClientLink>
        </li>
        {product.collection ? (
          <>
            <li aria-hidden="true">/</li>
            <li>
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="hover:text-ui-fg-base"
              >
                {collectionTitle}
              </LocalizedClientLink>
            </li>
          </>
        ) : null}
        <li aria-hidden="true">/</li>
        <li
          className="text-ui-fg-base truncate max-w-[70vw]"
          aria-current="page"
        >
          {title}
        </li>
      </ol>
    </nav>
  )
}

export default ProductBreadcrumb
