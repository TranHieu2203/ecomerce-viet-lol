import "server-only"

import { sdk } from "@lib/config"
import { absolutizeMedusaFileUrl } from "@lib/util/cms-assets"
import { cache } from "react"

export type SiteBackground = {
  id: string
  name: string
  image_url: string
  /** Phần trăm 0–100. */
  opacity: number
  /** Phần trăm, 100 = giữ nguyên màu gốc. */
  saturate: number
  base_color: string
}

/**
 * Ảnh nền đến từ hai nơi khác nhau:
 *  - Nền dựng sẵn: nằm trong `public/backgrounds/` của chính storefront nên
 *    giữ nguyên đường dẫn tương đối.
 *  - Nền Admin tự tải lên: là file của Medusa, cần nối origin backend.
 */
function resolveImageUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/static")) {
    return absolutizeMedusaFileUrl(raw) ?? raw
  }
  return raw
}

async function fetchSiteBackground(): Promise<SiteBackground | null> {
  try {
    const data = await sdk.client.fetch<{
      background: SiteBackground | null
    }>(`/store/custom/background`, {
      method: "GET",
      // 30s: đủ ngắn để Admin đổi nền thấy kết quả gần như ngay, mà vẫn không
      // gọi backend ở mọi lượt truy cập.
      next: { tags: ["cms-background"], revalidate: 30 },
      cache: "force-cache",
    })

    const bg = data?.background
    if (!bg?.image_url) {
      return null
    }

    return { ...bg, image_url: resolveImageUrl(bg.image_url) }
  } catch {
    // Backend lỗi thì web vẫn chạy với nền trắng, không chặn render trang.
    return null
  }
}

export const getSiteBackground = cache(fetchSiteBackground)
