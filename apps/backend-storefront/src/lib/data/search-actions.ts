"use server"

import { HttpTypes } from "@medusajs/types"
import { getCmsNewsList, type CmsNewsListItem } from "./cms"
import { listProducts } from "./products"

export type StorefrontSearchResult = {
  products: HttpTypes.StoreProduct[]
  news: CmsNewsListItem[]
}

const RESULT_LIMIT = 5
/** Lấy toàn bộ sản phẩm (catalog nhỏ) để tự lọc theo từ khoá — xem ghi chú ở searchProductsByTokens. */
const CANDIDATE_POOL_LIMIT = 300

/**
 * Bỏ dấu tiếng Việt + chuẩn hoá để so khớp không phân biệt hoa/thường, có/không dấu.
 */
function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[̀-ͯ]", "g"), "")
    .replace(/đ/g, "d")
}

function tokenize(q: string): string[] {
  return normalizeForSearch(q).split(/\s+/).filter(Boolean)
}

/**
 * Medusa `q` chỉ khớp NGUYÊN CỤM, CÓ PHÂN BIỆT DẤU (ILIKE '%toàn bộ query%' trên
 * ký tự gốc) — nên tìm nhiều từ như "kem chống nắng spf", hoặc gõ không dấu như
 * "kem chong nang", đều ra 0 kết quả dù sản phẩm khớp rõ ràng. Vì catalog nhỏ
 * (vài chục sản phẩm), ta lấy toàn bộ sản phẩm rồi tự lọc trong bộ nhớ: sản phẩm
 * phải chứa TẤT CẢ các từ khoá, không phân biệt hoa/thường và có/không dấu.
 */
async function searchProductsByTokens(
  countryCode: string,
  tokens: string[]
): Promise<HttpTypes.StoreProduct[]> {
  if (!tokens.length) {
    return []
  }

  const { response } = await listProducts({
    countryCode,
    queryParams: {
      limit: CANDIDATE_POOL_LIMIT,
      fields: "id,handle,title,description,thumbnail,metadata",
    },
  }).catch(() => ({
    response: { products: [] as HttpTypes.StoreProduct[], count: 0 },
  }))

  const matched = response.products.filter((p) => {
    const haystack = normalizeForSearch(`${p.title ?? ""} ${p.description ?? ""}`)
    return tokens.every((t) => haystack.includes(t))
  })

  return matched.slice(0, RESULT_LIMIT)
}

/** Server Action dùng cho ô tìm kiếm header (client component) — gộp search sản phẩm + tin tức. */
export async function searchStorefront(
  query: string,
  countryCode: string
): Promise<StorefrontSearchResult> {
  const q = query.trim()
  if (!q) {
    return { products: [], news: [] }
  }
  const tokens = tokenize(q)

  const [products, newsResult] = await Promise.all([
    searchProductsByTokens(countryCode, tokens).catch(
      () => [] as HttpTypes.StoreProduct[]
    ),
    getCmsNewsList(countryCode, RESULT_LIMIT, 0, { q }).catch(() => ({
      articles: [] as CmsNewsListItem[],
      count: 0,
    })),
  ])

  return {
    products,
    news: newsResult.articles,
  }
}
