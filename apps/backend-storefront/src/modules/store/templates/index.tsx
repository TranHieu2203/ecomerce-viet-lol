import { Suspense } from "react"

import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  q,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  q?: string
  countryCode: string
}) => {
  const m = getStorefrontMessages(countryCode)
  const parsed = page ? parseInt(page, 10) : 1
  const pageNumber =
    Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
  const sort = sortBy || "created_at"
  const query = q?.trim()

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">
            {query
              ? m.store.searchResultsFor.replace("{query}", query)
              : m.store.allProducts}
          </h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            q={query}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
