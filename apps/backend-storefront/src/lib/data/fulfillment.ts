"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"

/**
 * @param bypassCache — dùng sau khi vừa cập nhật giỏ (địa chỉ, v.v.): tránh Next.js
 *   trả danh sách shipping-options đã cache từ lúc giỏ chưa có địa chỉ, khiến addShippingMethod lỗi hàng loạt.
 */
export const listCartShippingMethods = async (
  cartId: string,
  opts?: { bypassCache?: boolean }
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const bypass = opts?.bypassCache === true
  const next = bypass ? undefined : await getCacheOptions("fulfillment")

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
        },
        headers,
        ...(bypass
          ? { cache: "no-store" as const }
          : { next, cache: "force-cache" as const }),
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => {
      return null
    })
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        next,
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch((e) => {
      return null
    })
}
