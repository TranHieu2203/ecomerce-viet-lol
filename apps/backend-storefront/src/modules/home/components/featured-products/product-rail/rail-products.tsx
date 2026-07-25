"use client"

import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import Reveal from "@modules/common/components/reveal"
import { useState } from "react"
import { RailPagination } from "./rail-pagination"

/**
 * Giới hạn số cột theo đúng số sản phẩm thực có — tránh lưới 5 cột để trống 4 ô
 * khi collection chỉ có 1-2 sản phẩm (nhìn như lỗi/thiếu nội dung).
 */
function gridClassForCount(count: number): string {
  if (count === 1) {
    return "grid-cols-1 max-w-[220px] xsmall:max-w-[260px]"
  }
  if (count === 2) {
    return "grid-cols-2 max-w-[460px] xsmall:max-w-[540px]"
  }
  if (count === 3) {
    return "grid-cols-2 small:grid-cols-3 max-w-[700px] xsmall:max-w-[820px]"
  }
  if (count === 4) {
    return "grid-cols-2 small:grid-cols-4 max-w-[940px] xsmall:max-w-[1100px]"
  }
  return "grid-cols-2 small:grid-cols-3 medium:grid-cols-4 large:grid-cols-5"
}

export default function RailProducts({
  collectionId,
  region,
  countryCode,
  initialProducts,
  count,
  limit,
}: {
  collectionId: string
  region: HttpTypes.StoreRegion
  countryCode: string
  initialProducts: HttpTypes.StoreProduct[]
  count: number
  limit: number
}) {
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState(initialProducts)
  const [isPending, setIsPending] = useState(false)
  const totalPages = Math.ceil(count / limit)

  const handlePageChange = (newPage: number) => {
    setIsPending(true)
    listProducts({
      pageParam: newPage,
      regionId: region.id,
      queryParams: {
        collection_id: collectionId,
        limit,
        fields: "*variants.calculated_price",
      },
    })
      .then(({ response }) => {
        setProducts(response.products)
        setPage(newPage)
      })
      .finally(() => setIsPending(false))
  }

  return (
    <div aria-busy={isPending}>
      <ul
        className={`grid ${gridClassForCount(products.length)} gap-x-4 xsmall:gap-x-6 gap-y-6 xsmall:gap-y-8 small:gap-y-10 transition-opacity duration-180 ${isPending ? "opacity-50" : "opacity-100"}`}
      >
        {products.map((product, idx) => (
          <li key={product.id} className="h-full">
            <Reveal
              variant="up"
              delayMs={Math.min(240, idx * 40)}
              initialInView={idx < 5}
              className="h-full"
            >
              <ProductPreview
                product={product}
                region={region}
                isFeatured
                locale={countryCode}
              />
            </Reveal>
          </li>
        ))}
      </ul>
      {totalPages > 1 ? (
        <RailPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      ) : null}
    </div>
  )
}
