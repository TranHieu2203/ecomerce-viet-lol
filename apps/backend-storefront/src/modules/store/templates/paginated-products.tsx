import { listProducts } from "@lib/data/products"
import { getReviewSummaries } from "@lib/data/product-reviews"
import { getRegion } from "@lib/data/regions"
import { getProductPrice } from "@lib/util/get-product-price"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import Reveal from "@modules/common/components/reveal"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string
  category_id?: string
  id?: string[]
  q?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  q,
  minRating,
  minPrice,
  maxPrice,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  q?: string
  minRating?: number
  minPrice?: number
  maxPrice?: number
  countryCode: string
}) {
  // Toàn bộ catalog hiện chỉ vài chục sản phẩm — lấy hết 1 lần rồi lọc/sắp
  // xếp/phân trang ở đây, tránh phải xây filter giá/rating phía backend.
  const queryParams: PaginatedProductsParams = {
    limit: 100,
  }

  if (collectionId) {
    queryParams.collection_id = collectionId
  }

  if (categoryId) {
    queryParams.category_id = categoryId
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (q) {
    queryParams.q = q
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products: fetchedProducts },
  } = await listProducts({
    pageParam: 1,
    queryParams,
    countryCode,
  })

  const reviewSummaries = await getReviewSummaries(
    fetchedProducts.map((p) => p.id)
  )

  let filtered: HttpTypes.StoreProduct[] = fetchedProducts

  if (minPrice !== undefined || maxPrice !== undefined) {
    filtered = filtered.filter((p) => {
      const price = getProductPrice({ product: p }).cheapestPrice
        ?.calculated_price_number
      if (price === undefined || price === null) {
        return false
      }
      if (minPrice !== undefined && price < minPrice) {
        return false
      }
      if (maxPrice !== undefined && price > maxPrice) {
        return false
      }
      return true
    })
  }

  if (minRating !== undefined) {
    filtered = filtered.filter(
      (p) => (reviewSummaries[p.id]?.average ?? 0) >= minRating
    )
  }

  const sortedProducts = sortProducts(filtered, sortBy || "created_at")

  const count = sortedProducts.length
  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const offset = (page - 1) * PRODUCT_LIMIT
  const products = sortedProducts.slice(offset, offset + PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 large:grid-cols-5 gap-x-4 xsmall:gap-x-6 gap-y-6 xsmall:gap-y-8 small:gap-y-10"
        data-testid="products-list"
      >
        {products.map((p, idx) => {
          return (
            <li key={p.id} className="h-full">
              <Reveal
                variant="up"
                delayMs={Math.min(300, idx * 30)}
                initialInView={idx < 8}
                className="h-full"
              >
                <ProductPreview
                  product={p}
                  region={region}
                  locale={countryCode}
                  reviewSummary={reviewSummaries[p.id]}
                />
              </Reveal>
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
