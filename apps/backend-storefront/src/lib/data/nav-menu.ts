import "server-only"

import { sdk } from "@lib/config"
import type { NavMenuPublic } from "@lib/nav/nav-types"
import { FetchError } from "@medusajs/js-sdk"
import { cache } from "react"

export type { NavMenuPublic, ResolvedNavChild, ResolvedNavGroup } from "@lib/nav/nav-types"

/**
 * ISR giống `getCmsSettingsPublic` / banner: cache theo thời gian + tag để on-demand.
 * Backend PATCH menu gọi revalidate với `tag: "cms-nav"`.
 */
export const NAV_MENU_CACHE_REVALIDATE_SECONDS = 180

async function fetchNavMenuOnce(locale: string): Promise<NavMenuPublic> {
  try {
    const isDev = process.env.NODE_ENV === "development"
    const data = await sdk.client.fetch<NavMenuPublic>(
      `/store/custom/nav-menu`,
      {
        method: "GET",
        query: { locale },
        next: isDev
          ? undefined
          : {
              tags: ["cms-nav"],
              revalidate: NAV_MENU_CACHE_REVALIDATE_SECONDS,
            },
        cache: isDev ? "no-store" : "force-cache",
      }
    )
    const items = Array.isArray(data?.items) ? data.items : []
    return {
      locale: typeof data?.locale === "string" ? data.locale : locale,
      items,
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      if (e instanceof FetchError) {
        console.error(
          `[nav-menu] Store API lỗi ${e.status ?? "?"}: ${e.message}. Kiểm tra MEDUSA_BACKEND_URL, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY, backend đang chạy, và ?locale= khớp enabled_locales.`
        )
      } else {
        console.error(
          "[nav-menu] Lỗi không xác định:",
          e instanceof Error ? e.message : e
        )
      }
    }
    return { locale, items: [] }
  }
}

/**
 * Một request render có thể gọi nhiều lần (layout + template); `cache()` dedupe trong cùng request.
 * Data Cache của Next (fetch) vẫn giữ bản copy theo `locale` qua các request.
 */
export const getNavMenuPublic = cache(fetchNavMenuOnce)
