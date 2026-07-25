"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { ChevronDownMini } from "@medusajs/icons"
import { Button, Input, Popover, RadioGroup, Label, Text, clx } from "@medusajs/ui"

import { SortOptions } from "./sort-products"

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

function FilterDropdown({
  label,
  active,
  children,
}: {
  label: string
  active: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={clx(
            "inline-flex items-center gap-1.5 h-10 px-4 rounded-full border text-small-regular transition-colors duration-150",
            active
              ? "border-brand-gold bg-brand-cream text-brand-ink"
              : "border-ui-border-base text-ui-fg-subtle hover:border-ui-border-interactive"
          )}
        >
          {label}
          <ChevronDownMini className="shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Content
        align="start"
        className="p-4 w-64 max-h-[70vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </Popover.Content>
    </Popover>
  )
}

function DropdownRadioList({
  items,
  value,
  onSelect,
}: {
  items: { value: string; label: string }[]
  value: string
  onSelect: (value: string) => void
}) {
  return (
    <RadioGroup value={value} onValueChange={onSelect} className="flex flex-col gap-y-3">
      {items.map((i) => (
        <div key={i.value} className="flex items-center gap-x-2">
          <RadioGroup.Item value={i.value} id={`opt-${i.value || "all"}-${i.label}`} />
          <Label
            htmlFor={`opt-${i.value || "all"}-${i.label}`}
            className="!txt-compact-small !transform-none hover:cursor-pointer"
          >
            {i.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

const RefinementList = ({
  sortBy,
  categoryId,
  minRating,
  minPrice,
  maxPrice,
  categories = [],
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

  const sortItems = [
    { value: "created_at" as const, label: s.sortLatest },
    { value: "price_asc" as const, label: s.sortPriceAsc },
    { value: "price_desc" as const, label: s.sortPriceDesc },
  ]
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

  const priceLabel =
    minPrice || maxPrice
      ? `${s.filterPriceTitle}: ${minPrice || "0"} - ${maxPrice || "∞"}`
      : s.filterPriceTitle

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 mb-6">
      <FilterDropdown
        label={`${s.sortBy}: ${sortItems.find((i) => i.value === sortBy)?.label || ""}`}
        active={sortBy !== "created_at"}
      >
        <Text className="txt-compact-small-plus text-ui-fg-muted mb-3">{s.sortBy}</Text>
        <DropdownRadioList
          items={sortItems}
          value={sortBy}
          onSelect={(value) => setQueryParams({ sortBy: value }, false)}
        />
      </FilterDropdown>

      {categories.length > 0 ? (
        <FilterDropdown
          label={`${s.filterCategoryTitle}: ${
            categoryOptions.find((c) => c.value === (categoryId || ""))?.label ||
            s.filterCategoryAll
          }`}
          active={Boolean(categoryId)}
        >
          <Text className="txt-compact-small-plus text-ui-fg-muted mb-3">
            {s.filterCategoryTitle}
          </Text>
          <DropdownRadioList
            items={categoryOptions}
            value={categoryId || ""}
            onSelect={(value) => setQueryParams({ categoryId: value || null })}
          />
        </FilterDropdown>
      ) : null}

      <FilterDropdown
        label={`${s.filterRatingTitle}: ${
          ratingOptions.find((r) => r.value === (minRating || ""))?.label ||
          s.filterRatingAll
        }`}
        active={Boolean(minRating)}
      >
        <Text className="txt-compact-small-plus text-ui-fg-muted mb-3">
          {s.filterRatingTitle}
        </Text>
        <DropdownRadioList
          items={ratingOptions}
          value={minRating || ""}
          onSelect={(value) => setQueryParams({ minRating: value || null })}
        />
      </FilterDropdown>

      <FilterDropdown label={priceLabel} active={Boolean(minPrice || maxPrice)}>
        <Text className="txt-compact-small-plus text-ui-fg-muted mb-3">
          {s.filterPriceTitle}
        </Text>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            placeholder={s.filterPriceFrom}
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="min-w-0 flex-1"
          />
          <span className="text-ui-fg-muted shrink-0">—</span>
          <Input
            type="number"
            min={0}
            placeholder={s.filterPriceTo}
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
            className="min-w-0 flex-1"
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button size="small" variant="secondary" onClick={applyPriceFilter}>
            {s.filterPriceApply}
          </Button>
          {minPrice || maxPrice ? (
            <Button size="small" variant="transparent" onClick={clearPriceFilter}>
              {s.filterPriceClear}
            </Button>
          ) : null}
        </div>
      </FilterDropdown>
    </div>
  )
}

export default RefinementList
