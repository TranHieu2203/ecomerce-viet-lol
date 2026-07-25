import { Suspense } from "react"

import { getStorefrontMessages } from "@lib/i18n/storefront-messages"
import { listCategories } from "@lib/data/categories"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  q,
  categoryId,
  minRating,
  minPrice,
  maxPrice,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  q?: string
  categoryId?: string
  minRating?: string
  minPrice?: string
  maxPrice?: string
  countryCode: string
}) => {
  const m = getStorefrontMessages(countryCode)
  const parsed = page ? parseInt(page, 10) : 1
  const pageNumber =
    Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
  const sort = sortBy || "created_at"
  const query = q?.trim()

  // Loại bỏ danh mục gốc dạng "wrapper" (không có parent) — chỉ giữ danh mục
  // con thực sự hữu ích để lọc (vd "Saffron", "Mỹ Phẩm"...).
  const allCategories = await listCategories({ fields: "id,name,parent_category_id" }).catch(
    () => []
  )
  const categories = allCategories.filter((c) => c.parent_category_id)

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList
        sortBy={sort}
        categoryId={categoryId}
        minRating={minRating}
        minPrice={minPrice}
        maxPrice={maxPrice}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
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
            categoryId={categoryId}
            minRating={minRating ? Number(minRating) : undefined}
            minPrice={minPrice ? Number(minPrice) : undefined}
            maxPrice={maxPrice ? Number(maxPrice) : undefined}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
