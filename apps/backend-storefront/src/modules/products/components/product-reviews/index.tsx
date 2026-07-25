import { getProductReviews } from "@lib/data/product-reviews"
import StarRating from "@modules/products/components/star-rating"
import WriteReviewForm from "./write-review-form"

export default async function ProductReviews({
  productId,
}: {
  productId: string
}) {
  const { reviews, average, total_reviews } = await getProductReviews(
    productId,
    20
  )

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-brand-gold/25">
        <div>
          <h2 className="text-2xl-semi text-ui-fg-base mb-1">Đánh giá sản phẩm</h2>
          {total_reviews > 0 ? (
            <div className="flex items-center gap-2">
              <StarRating rating={average} size="medium" />
              <span className="text-ui-fg-muted text-small-regular">
                {average.toFixed(1)}/5 · {total_reviews} đánh giá
              </span>
            </div>
          ) : (
            <p className="text-ui-fg-muted text-small-regular">
              Chưa có đánh giá nào — hãy là người đầu tiên.
            </p>
          )}
        </div>
        <WriteReviewForm productId={productId} />
      </div>

      {reviews.length > 0 ? (
        <ul className="flex flex-col gap-5">
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-1.5 pb-5 border-b border-ui-border-base last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <StarRating rating={r.rating} />
                <span className="text-xsmall-regular text-ui-fg-muted">
                  {new Date(r.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {r.title ? (
                <p className="text-small-semi text-ui-fg-base">{r.title}</p>
              ) : null}
              <p className="text-small-regular text-ui-fg-subtle whitespace-pre-line">
                {r.comment}
              </p>
              <p className="text-xsmall-regular text-ui-fg-muted">
                {r.customer_name}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
