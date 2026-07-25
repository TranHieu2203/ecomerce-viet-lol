"use client"

import { clx } from "@medusajs/ui"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const p = useStorefrontMessages().product
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const isSale = selectedPrice.price_type === "sale"

  return (
    <div className="flex flex-col text-ui-fg-base gap-1">
      {isSale ? (
        <div className="flex items-center gap-2">
          <span
            className="line-through text-ui-fg-muted text-small-regular"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            <span className="sr-only">{p.priceOriginal}</span>
            {selectedPrice.original_price}
          </span>
          <span className="text-[11px] leading-none font-semibold text-white bg-brand-accent rounded-full px-2 py-1">
            -{selectedPrice.percentage_diff}%
          </span>
        </div>
      ) : null}
      <span
        className={clx("text-2xl-semi", {
          "text-brand-accent": isSale,
        })}
      >
        {!variant && p.priceFrom}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
    </div>
  )
}
