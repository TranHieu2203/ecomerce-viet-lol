"use client"

import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import FilterRadioGroup from "@modules/common/components/filter-radio-group"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const s = useStorefrontMessages().store
  const sortOptions = [
    { value: "created_at" as const, label: s.sortLatest },
    { value: "price_asc" as const, label: s.sortPriceAsc },
    { value: "price_desc" as const, label: s.sortPriceDesc },
  ]

  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <FilterRadioGroup
      title={s.sortBy}
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
