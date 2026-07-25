/** Hiển thị sao chỉ để xem (không tương tác) — dùng cho thẻ sản phẩm và trang chi tiết. */
export default function StarRating({
  rating,
  count,
  size = "small",
  showValue = false,
}: {
  rating: number
  count?: number
  size?: "small" | "medium"
  showValue?: boolean
}) {
  const starSize = size === "small" ? "w-3 h-3" : "w-4 h-4"
  const textSize = size === "small" ? "text-[11px]" : "text-small-regular"
  // % lấp đầy trên tổng chiều rộng 5 sao — cho phép sao thứ N lấp một phần
  // (vd 4.7 sao => 4 sao đầy + sao thứ 5 lấp ~70%) thay vì làm tròn cả sao.
  const fillPercent = Math.max(0, Math.min(1, rating / 5)) * 100

  const stars = (filled: boolean) =>
    Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        viewBox="0 0 20 20"
        className={`${starSize} shrink-0 ${filled ? "fill-brand-gold" : "fill-ui-border-base"}`}
      >
        <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.9l-5.2 2.73.99-5.8-4.21-4.1 5.82-.85z" />
      </svg>
    ))

  return (
    <div className="flex items-center gap-1">
      <div className="relative inline-flex" aria-hidden>
        <div className="flex items-center gap-[1px]">{stars(false)}</div>
        <div
          className="absolute inset-y-0 left-0 overflow-hidden flex items-center gap-[1px]"
          style={{ width: `${fillPercent}%` }}
        >
          {stars(true)}
        </div>
      </div>
      {showValue && rating > 0 ? (
        <span className={`${textSize} text-ui-fg-base font-medium`}>
          {rating.toFixed(1)}
        </span>
      ) : null}
      {typeof count === "number" ? (
        <span className={`${textSize} text-ui-fg-muted`}>({count})</span>
      ) : null}
    </div>
  )
}
