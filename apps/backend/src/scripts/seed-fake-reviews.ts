/**
 * Tạo review giả lập ban đầu cho các sản phẩm hiện có — để trang không trống
 * sao trong lúc chờ review thật từ khách. Đánh dấu is_seed=true để phân biệt.
 *
 * Chạy: npx medusa exec ./src/scripts/seed-fake-reviews.ts
 * (rerun-able — xoá review giả lập cũ của mỗi sản phẩm rồi tạo lại, review
 * thật của khách (is_seed=false) không bao giờ bị đụng tới)
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_REVIEWS_MODULE } from "../modules/product-reviews"
import type ProductReviewsModuleService from "../modules/product-reviews/service"
import { PRODUCT_REVIEW_STATUS } from "../modules/product-reviews/models/product-review"

function stableHash(raw: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function stableUnit(seed: string, salt: string): number {
  return stableHash(`${seed}:${salt}`) / 0xffffffff
}

function stableIntInRange(seed: string, salt: string, min: number, max: number): number {
  return Math.floor(min + stableUnit(seed, salt) * (max - min + 1))
}

function stablePick<T>(seed: string, salt: string, arr: T[]): T {
  const idx = stableIntInRange(seed, salt, 0, arr.length - 1)
  return arr[idx]
}

const NAMES = [
  "Thu Hà", "Minh Anh", "Ngọc Linh", "Thanh Tùng", "Hoài Thương",
  "Quốc Bảo", "Phương Thảo", "Đức Anh", "Thùy Dương", "Văn Hùng",
  "Kim Chi", "Gia Bảo", "Lan Anh", "Trọng Nghĩa", "Bích Ngọc",
  "Anh Thư", "Hữu Phước", "Mai Linh", "Tấn Phát", "Diễm My",
]

const COMMENTS_5 = [
  "Sản phẩm đúng như mô tả, đóng gói cẩn thận, giao hàng nhanh. Rất hài lòng!",
  "Chất lượng tốt, sẽ ủng hộ shop lâu dài. Cảm ơn shop đã tư vấn nhiệt tình.",
  "Mua tặng người thân, ai cũng khen. Chắc chắn sẽ quay lại mua thêm.",
  "Hàng chuẩn, giá hợp lý so với chất lượng. 5 sao xứng đáng.",
  "Đóng gói kỹ, không bị móp méo khi vận chuyển. Rất đáng tiền.",
  "Đây là lần thứ 2 mình mua, vẫn giữ được chất lượng như lần đầu.",
]
const COMMENTS_4 = [
  "Sản phẩm ổn, giao hơi chậm một chút nhưng chất lượng bù lại được.",
  "Nhìn chung hài lòng, chỉ mong bao bì được cải thiện thêm.",
  "Dùng thử thấy khá tốt, giá cả phải chăng, sẽ ủng hộ tiếp.",
  "Chất lượng đúng như quảng cáo, đóng gói ổn.",
]
const COMMENTS_3 = [
  "Sản phẩm tạm ổn, không có gì đặc biệt nhưng cũng không tệ.",
  "Giao hàng hơi lâu, chất lượng ở mức trung bình.",
]

const TITLES_5 = ["Rất hài lòng", "Đáng mua", "Chất lượng tốt", "Sẽ ủng hộ tiếp"]
const TITLES_4 = ["Ổn trong tầm giá", "Khá hài lòng", null]
const TITLES_3 = ["Tạm ổn", null]

function reviewsForRating(rating: number) {
  if (rating >= 5) return { comments: COMMENTS_5, titles: TITLES_5 }
  if (rating === 4) return { comments: COMMENTS_4, titles: TITLES_4 }
  return { comments: COMMENTS_3, titles: TITLES_3 }
}

export default async function seedFakeReviewsScript({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const reviewsService = container.resolve(
    PRODUCT_REVIEWS_MODULE
  ) as ProductReviewsModuleService

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
  })

  let totalCreated = 0

  for (const product of products) {
    const existing = await reviewsService.listProductReviews({
      product_id: product.id,
      is_seed: true,
    })
    if (existing.length > 0) {
      await reviewsService.deleteProductReviews(existing.map((r) => r.id))
    }

    // Phân bố lệch: đa số sản phẩm ở mức trung bình, một ít "bán chạy" có
    // rất nhiều đánh giá, một ít mới/ít người mua — để số lượng trông tự
    // nhiên thay vì cụm sát nhau trong 1 khoảng hẹp.
    const tierRoll = stableIntInRange(product.handle, "tier", 1, 100)
    const reviewCount =
      tierRoll <= 15
        ? stableIntInRange(product.handle, "count", 2, 7)
        : tierRoll <= 85
        ? stableIntInRange(product.handle, "count", 8, 26)
        : stableIntInRange(product.handle, "count", 35, 90)
    const createInput = [] as {
      product_id: string
      rating: number
      title: string | null
      comment: string
      customer_name: string
      status: string
      is_seed: boolean
    }[]

    for (let i = 0; i < reviewCount; i++) {
      const salt = `review-${i}`
      // Thiên về 4-5 sao (đa số khách hài lòng), thỉnh thoảng 3 sao cho tự nhiên.
      const ratingRoll = stableIntInRange(product.handle, `${salt}-rating`, 1, 10)
      const rating = ratingRoll <= 6 ? 5 : ratingRoll <= 9 ? 4 : 3
      const { comments, titles } = reviewsForRating(rating)
      const comment = stablePick(product.handle, `${salt}-comment`, comments)
      const title = stablePick(product.handle, `${salt}-title`, titles)
      const name = stablePick(product.handle, `${salt}-name`, NAMES)

      createInput.push({
        product_id: product.id,
        rating,
        title,
        comment,
        customer_name: name,
        status: PRODUCT_REVIEW_STATUS.APPROVED,
        is_seed: true,
      })
    }

    await reviewsService.createProductReviews(createInput)
    totalCreated += createInput.length
    logger.info(`${product.title}: tạo ${createInput.length} review giả lập.`)
  }

  logger.info(`Hoàn tất — tổng ${totalCreated} review giả lập.`)
}
