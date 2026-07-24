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
    <div className="bg-ui-bg-subtle py-6">
      <div
        className="flex flex-col small:flex-row small:items-start gap-6 content-container"
        data-testid="category-container"
      >
        <RefinementList sortBy={sort} />
        <div className="w-full bg-white rounded-large shadow-elevation-card-rest p-4 xsmall:p-6 small:p-8">
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
    </div>
  )
}

export default StoreTemplate
