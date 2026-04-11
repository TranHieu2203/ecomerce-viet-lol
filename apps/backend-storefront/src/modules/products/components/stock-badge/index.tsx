"use client"

/**
 * StockBadge — Epic 14 Story 14.6
 *
 * Hiển thị trạng thái tồn kho cho variant đang chọn trên PDP.
 * Gọi Store API GET /store/custom/inventory/variant-status?variant_ids=...
 * Không expose số lượng cụ thể cho khách.
 */

import { useEffect, useState } from "react"

type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "backorder" | "untracked"

type StatusInfo = {
  status: StockStatus
  label_vi: string
  label_en: string
  allow_backorder: boolean
}

type ApiResponse = {
  statuses: Record<string, StatusInfo>
}

const STATUS_STYLE: Record<
  StockStatus,
  { dot: string; text: string; bg: string }
> = {
  in_stock: {
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
  },
  low_stock: {
    dot: "bg-blue-400",
    text: "text-blue-700",
    bg: "bg-blue-50",
  },
  out_of_stock: {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-50",
  },
  backorder: {
    dot: "bg-orange-400",
    text: "text-orange-700",
    bg: "bg-orange-50",
  },
  untracked: {
    dot: "bg-green-500",
    text: "text-green-700",
    bg: "bg-green-50",
  },
}

type Props = {
  variantId: string | undefined | null
  locale?: string
  backendUrl?: string
}

export default function StockBadge({ variantId, locale = "vi", backendUrl }: Props) {
  const [info, setInfo] = useState<StatusInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!variantId) {
      setInfo(null)
      return
    }

    let cancelled = false
    setLoading(true)

    const base =
      backendUrl?.replace(/\/$/, "") ||
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ||
      "http://localhost:9000"

    fetch(
      `${base}/store/custom/inventory/variant-status?variant_ids=${variantId}`,
      { credentials: "omit" }
    )
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (!cancelled) {
          const s = data.statuses?.[variantId]
          setInfo(s ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) setInfo(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [variantId, backendUrl])

  if (!variantId || loading || !info) return null

  const style = STATUS_STYLE[info.status] ?? STATUS_STYLE.in_stock
  const label = locale === "vi" ? info.label_vi : info.label_en

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </div>
  )
}
