"use server"

import { HttpTypes } from "@medusajs/types"
import { getCmsNewsList, type CmsNewsListItem } from "./cms"
import { listProducts } from "./products"

export type StorefrontSearchResult = {
  products: HttpTypes.StoreProduct[]
  news: CmsNewsListItem[]
}

const RESULT_LIMIT = 5

/** Server Action dùng cho ô tìm kiếm header (client component) — gộp search sản phẩm + tin tức. */
export async function searchStorefront(
  query: string,
  countryCode: string
): Promise<StorefrontSearchResult> {
  const q = query.trim()
  if (!q) {
    return { products: [], news: [] }
  }

  const [productsResult, newsResult] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: {
        q,
        limit: RESULT_LIMIT,
        fields: "id,handle,title,description,thumbnail,metadata",
      },
    }).catch(() => ({
      response: { products: [] as HttpTypes.StoreProduct[], count: 0 },
      nextPage: null,
    })),
    getCmsNewsList(countryCode, RESULT_LIMIT, 0, { q }).catch(() => ({
      articles: [] as CmsNewsListItem[],
      count: 0,
    })),
  ])

  return {
    products: productsResult.response.products,
    news: newsResult.articles,
  }
}
