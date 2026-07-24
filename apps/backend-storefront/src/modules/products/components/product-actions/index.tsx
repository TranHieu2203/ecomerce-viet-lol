"use client"

import { addToCart } from "@lib/data/cart"
import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Minus, Plus } from "@medusajs/icons"
import { Button } from "@medusajs/ui"
import Back from "@modules/common/icons/back"
import Divider from "@modules/common/components/divider"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import StockBadge from "@modules/products/components/stock-badge"
import { useRouter } from "next/navigation"

const MAX_QUANTITY_UNTRACKED = 99

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const m = useStorefrontMessages()
  const p = m.product
  const t = m.productTabs
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const maxQuantity = useMemo(() => {
    if (
      selectedVariant?.manage_inventory &&
      !selectedVariant?.allow_backorder
    ) {
      return Math.max(1, selectedVariant.inventory_quantity ?? 1)
    }
    return MAX_QUANTITY_UNTRACKED
  }, [selectedVariant])

  // reset về 1 khi đổi variant, tránh giữ số lượng vượt tồn kho của variant mới
  useEffect(() => {
    setQuantity(1)
  }, [selectedVariant?.id])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        {/* Epic 14 — Story 14.6: Badge trạng thái tồn kho */}
        <StockBadge
          variantId={selectedVariant?.id}
          locale={countryCode}
          backendUrl={process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}
        />

        {selectedVariant ? (
          <div className="flex items-center gap-3">
            <span className="text-small-regular text-ui-fg-subtle">
              {p.quantityLabel}
            </span>
            <div className="flex items-center border border-ui-border-base rounded-rounded">
              <button
                type="button"
                aria-label={p.quantityDecrease}
                disabled={!!disabled || isAdding || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex items-center justify-center w-9 h-9 text-ui-fg-subtle hover:text-ui-fg-base disabled:opacity-40 disabled:hover:text-ui-fg-subtle"
              >
                <Minus />
              </button>
              <span
                className="w-8 text-center text-small-regular tabular-nums"
                data-testid="product-quantity"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label={p.quantityIncrease}
                disabled={!!disabled || isAdding || quantity >= maxQuantity}
                onClick={() =>
                  setQuantity((q) => Math.min(maxQuantity, q + 1))
                }
                className="flex items-center justify-center w-9 h-9 text-ui-fg-subtle hover:text-ui-fg-base disabled:opacity-40 disabled:hover:text-ui-fg-subtle"
              >
                <Plus />
              </button>
            </div>
          </div>
        ) : null}

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? p.selectVariant
            : !inStock || !isValidVariant
            ? p.outOfStock
            : p.addToCart}
        </Button>

        <div className="grid grid-cols-1 gap-y-2 pt-2 text-xsmall-regular text-ui-fg-subtle">
          <div className="flex items-center gap-x-2">
            <FastDelivery size={16} />
            <span>{t.shipFastTitle}</span>
          </div>
          <div className="flex items-center gap-x-2">
            <Refresh size={16} />
            <span>{t.exchangeTitle}</span>
          </div>
          <div className="flex items-center gap-x-2">
            <Back size={16} />
            <span>{t.returnsTitle}</span>
          </div>
        </div>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
