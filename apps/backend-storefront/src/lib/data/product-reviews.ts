"use server"

import { sdk } from "@lib/config"

export type ProductReviewSummary = { average: number; count: number }

export type ProductReviewItem = {
  id: string
  rating: number
  title: string | null
  comment: string
  customer_name: string
  created_at: string
}

const REVIEWS_CACHE_REVALIDATE_SECONDS = 120

/** Sao trung bình + số lượt cho nhiều sản phẩm cùng lúc — dùng cho lưới sản phẩm. */
export async function getReviewSummaries(
  productIds: string[]
): Promise<Record<string, ProductReviewSummary>> {
  if (!productIds.length) {
    return {}
  }
  try {
    const data = await sdk.client.fetch<{
      summaries: Record<string, ProductReviewSummary>
    }>(`/store/custom/product-reviews/summary`, {
      method: "GET",
      query: { product_ids: productIds.join(",") },
      next: {
        tags: ["product-reviews"],
        revalidate: REVIEWS_CACHE_REVALIDATE_SECONDS,
      },
      cache: "force-cache",
    })
    return data.summaries ?? {}
  } catch {
    return {}
  }
}

/** Danh sách review đã duyệt + trung bình sao cho 1 sản phẩm — dùng ở trang chi tiết. */
export async function getProductReviews(
  productId: string,
  limit = 10,
  offset = 0
): Promise<{
  reviews: ProductReviewItem[]
  count: number
  average: number
  total_reviews: number
}> {
  try {
    const data = await sdk.client.fetch<{
      reviews: ProductReviewItem[]
      count: number
      average: number
      total_reviews: number
    }>(`/store/custom/product-reviews`, {
      method: "GET",
      query: { product_id: productId, limit, offset },
      next: {
        tags: ["product-reviews"],
        revalidate: REVIEWS_CACHE_REVALIDATE_SECONDS,
      },
      cache: "force-cache",
    })
    return data
  } catch {
    return { reviews: [], count: 0, average: 0, total_reviews: 0 }
  }
}

export type SubmitReviewResult =
  | { ok: true }
  | { ok: false; message: string }

/** Server Action cho form "Viết đánh giá" — review khách gửi luôn ở trạng thái chờ duyệt. */
export async function submitProductReview(input: {
  product_id: string
  rating: number
  title?: string
  comment: string
  customer_name: string
  customer_email?: string
}): Promise<SubmitReviewResult> {
  try {
    await sdk.client.fetch(`/store/custom/product-reviews`, {
      method: "POST",
      body: input,
    })
    return { ok: true }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Không gửi được đánh giá, thử lại sau."
    return { ok: false, message }
  }
}
