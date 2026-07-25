"use client"

import { submitProductReview } from "@lib/data/product-reviews"
import { Button, Input, Textarea, Text } from "@medusajs/ui"
import { useState } from "react"

export default function WriteReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (done) {
    return (
      <div className="rounded-large border border-brand-gold/25 bg-brand-cream/60 p-4 text-small-regular text-brand-ink">
        Cảm ơn bạn đã đánh giá! Đánh giá đang chờ duyệt và sẽ hiển thị sau khi
        được xác nhận.
      </div>
    )
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Viết đánh giá
      </Button>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !comment.trim()) {
      setError("Vui lòng nhập tên và nội dung đánh giá.")
      return
    }
    setError(null)
    setSubmitting(true)
    const res = await submitProductReview({
      product_id: productId,
      rating,
      comment: comment.trim(),
      customer_name: name.trim(),
    })
    setSubmitting(false)
    if (res.ok) {
      setDone(true)
    } else {
      setError(res.message)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-large border border-ui-border-base p-4"
    >
      <div>
        <Text size="small" weight="plus" className="mb-1.5">
          Số sao
        </Text>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const value = i + 1
            const active = value <= (hoverRating ?? rating)
            return (
              <button
                key={value}
                type="button"
                aria-label={`${value} sao`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-0.5"
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`w-6 h-6 ${active ? "fill-brand-gold" : "fill-ui-border-base"}`}
                >
                  <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.8L10 14.9l-5.2 2.73.99-5.8-4.21-4.1 5.82-.85z" />
                </svg>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <Text size="small" weight="plus" className="mb-1.5">
          Tên của bạn
        </Text>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nguyễn Văn A"
          maxLength={120}
        />
      </div>
      <div>
        <Text size="small" weight="plus" className="mb-1.5">
          Nhận xét
        </Text>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Sản phẩm dùng thế nào, có đúng như mô tả không..."
          rows={4}
          maxLength={2000}
        />
      </div>
      {error ? (
        <Text size="small" className="text-red-600">
          {error}
        </Text>
      ) : null}
      <div className="flex items-center gap-2">
        <Button type="submit" isLoading={submitting}>
          Gửi đánh giá
        </Button>
        <Button
          type="button"
          variant="transparent"
          onClick={() => setOpen(false)}
        >
          Huỷ
        </Button>
      </div>
    </form>
  )
}
