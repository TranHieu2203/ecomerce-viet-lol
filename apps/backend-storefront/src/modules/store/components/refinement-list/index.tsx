"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { Button, Input, Text } from "@medusajs/ui"
import FilterRadioGroup from "@modules/common/components/filter-radio-group"

import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  categoryId?: string
  minRating?: string
  minPrice?: string
  maxPrice?: string
  categories?: { id: string; name: string }[]
  search?: boolean
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  categoryId,
  minRating,
  minPrice,
  maxPrice,
  categories = [],
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const s = useStorefrontMessages().store
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [priceFrom, setPriceFrom] = useState(minPrice ?? "")
  const [priceTo, setPriceTo] = useState(maxPrice ?? "")

  const setQueryParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams)
      for (const [name, value] of Object.entries(updates)) {
        if (value) {
          params.set(name, value)
        } else {
          params.delete(name)
        }
      }
      if (resetPage) {
        params.delete("page")
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  const categoryOptions = [
    { value: "", label: s.filterCategoryAll },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const ratingOptions = [
    { value: "", label: s.filterRatingAll },
    { value: "4", label: s.filterRating4 },
    { value: "3", label: s.filterRating3 },
  ]

  const applyPriceFilter = () => {
    setQueryParams({
      minPrice: priceFrom.trim() || null,
      maxPrice: priceTo.trim() || null,
    })
  }

  const clearPriceFilter = () => {
    setPriceFrom("")
    setPriceTo("")
    setQueryParams({ minPrice: null, maxPrice: null })
  }

  return (
    <div
      className="flex flex-col gap-y-10 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]"
    >
      <SortProducts
        sortBy={sortBy}
        setQueryParams={(name, value) => setQueryParams({ [name]: value })}
        data-testid={dataTestId}
      />

      {categories.length > 0 ? (
        <FilterRadioGroup
          title={s.filterCategoryTitle}
          items={categoryOptions}
          value={categoryId || ""}
          handleChange={(value: string) =>
            setQueryParams({ categoryId: value || null })
          }
        />
      ) : null}

      <FilterRadioGroup
        title={s.filterRatingTitle}
        items={ratingOptions}
        value={minRating || ""}
        handleChange={(value: string) =>
          setQueryParams({ minRating: value || null })
        }
      />

      <div className="flex flex-col gap-y-3">
        <Text className="txt-compact-small-plus text-ui-fg-muted">
          {s.filterPriceTitle}
        </Text>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder={s.filterPriceFrom}
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="w-full"
          />
          <span className="text-ui-fg-muted">—</span>
          <Input
            type="number"
            min={0}
            placeholder={s.filterPriceTo}
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" onClick={applyPriceFilter}>
            {s.filterPriceApply}
          </Button>
          {minPrice || maxPrice ? (
            <Button size="small" variant="transparent" onClick={clearPriceFilter}>
              {s.filterPriceClear}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default RefinementList
