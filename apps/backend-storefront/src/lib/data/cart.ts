"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "@lib/data/locale-actions"
import {
  guestCustomerEmailFromNormalizedPhone,
  normalizeVietnamesePhone,
} from "@lib/util/phone"
import {
  calculatePriceForShippingOption,
  listCartShippingMethods,
} from "./fulfillment"
import { listCartPaymentMethods } from "./payment"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

const REGION_COUNTRY =
  process.env.NEXT_PUBLIC_DEFAULT_REGION ||
  process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION ||
  "vn"

/** Locale trong URL; ưu tiên map locale → region, fallback theo env để an toàn. */
export async function getOrSetCart(localeFromPath: string) {
  const region =
    (await getRegion(localeFromPath)) ?? (await getRegion(REGION_COUNTRY))

  if (!region) {
    throw new Error(
      `Region not found for country code: ${localeFromPath || REGION_COUNTRY}`
    )
  }

  let cart = await retrieveCart(undefined, "id,region_id")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
}: {
  variantId: string
  quantity: number
  countryCode: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
      },
      {},
      headers
    )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .updateLineItem(cartId, lineId, { quantity }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

type ShippingOptionWithZone = HttpTypes.StoreCartShippingOption & {
  service_zone?: { fulfillment_set?: { type?: string } }
}

/** Gán phương thức vận chuyển mặc định (ưu tiên giao tận nơi, không phải pickup). */
export async function autoSelectDefaultShippingForCart(cartId: string) {
  const options = await listCartShippingMethods(cartId, { bypassCache: true })
  if (!options?.length) {
    throw new Error(
      "Chưa cấu hình phương thức vận chuyển. Vui lòng liên hệ cửa hàng."
    )
  }
  const withZone = options as ShippingOptionWithZone[]
  const delivery = withZone.filter(
    (o) => o.service_zone?.fulfillment_set?.type !== "pickup"
  )
  const pool = delivery.length ? delivery : withZone

  /** Medusa đánh dấu insufficient khi không có inventory_level tại kho fulfillment — thường do DB thiếu seed. */
  const withStock = pool.filter((o) => !o.insufficient_inventory)
  const candidates = withStock.length > 0 ? withStock : pool

  let lastErrorMessage: string | undefined

  for (const opt of candidates) {
    if (withStock.length > 0 && opt.insufficient_inventory) continue
    if (opt.price_type === "calculated") {
      const priced = await calculatePriceForShippingOption(opt.id, cartId)
      if (!priced) {
        continue
      }
    }
    try {
      await setShippingMethod({ cartId, shippingMethodId: opt.id })
      return
    } catch (e: unknown) {
      lastErrorMessage = e instanceof Error ? e.message : String(e)
      continue
    }
  }
  const hint = lastErrorMessage
    ? ` (${lastErrorMessage})`
    : ""
  throw new Error(
    `Không thể áp dụng phương thức vận chuyển. Thử lại hoặc liên hệ cửa hàng.${hint}`
  )
}

function isManualProviderId(providerId?: string | null): boolean {
  return !!providerId?.startsWith("pp_system_default")
}

/**
 * Medusa cần payment session (ví dụ pp_system_default) trước khi complete cart.
 * Gọi trước placeOrder; không hiển thị UI thanh toán.
 */
export async function ensureManualPaymentSessionForCart(cartId: string) {
  const cart = await retrieveCart(
    cartId,
    "*region, *payment_collection, *payment_collection.payment_sessions"
  )
  if (!cart?.region_id) {
    throw new Error("Giỏ hàng chưa có khu vực (region).")
  }

  const pending = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  if (pending) {
    return
  }

  const providers = await listCartPaymentMethods(cart.region_id)
  const manual = providers?.find((p) => isManualProviderId(p.id))
  if (!manual) {
    throw new Error(
      "Cửa hàng chưa bật phương thức thanh toán thủ công (manual) cho region này."
    )
  }

  await initiatePaymentSession(cart, { provider_id: manual.id })
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = await getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const auth = await getAuthHeaders()
    const isGuest = !("authorization" in auth && auth.authorization)

    const phone = String(formData.get("shipping_address.phone") || "").trim()
    const fullName = String(formData.get("shipping_full_name") || "").trim()
    let firstName = String(
      formData.get("shipping_address.first_name") || ""
    ).trim()
    let lastName = String(
      formData.get("shipping_address.last_name") || ""
    ).trim()

    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean)
      firstName = parts[0] || firstName
      lastName = parts.length > 1 ? parts.slice(1).join(" ") : lastName || "."
    }

    if (!lastName) {
      lastName = "."
    }

    let email = String(formData.get("email") || "").trim()
    if (isGuest) {
      const norm = normalizeVietnamesePhone(phone)
      if (!norm) {
        throw new Error("Vui lòng nhập số điện thoại hợp lệ.")
      }
      const stub = guestCustomerEmailFromNormalizedPhone(norm)
      const marketingRaw = String(
        formData.get("marketing_email") || ""
      ).trim()
      const marketing = marketingRaw.toLowerCase()
      if (marketing) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(marketing)) {
          throw new Error(
            "Email nhận tin khuyến mãi không hợp lệ — để trống nếu không dùng."
          )
        }
        email = marketing
      } else {
        email = stub
      }
    } else if (!email) {
      throw new Error("Vui lòng nhập email.")
    }

    const countryCode = String(
      formData.get("shipping_address.country_code") || "vn"
    ).toLowerCase()
    const postalCode =
      String(formData.get("shipping_address.postal_code") || "000000").trim() ||
      "000000"
    const city =
      String(formData.get("shipping_address.city") || ".").trim() || "."

    const shipping_address = {
      first_name: firstName,
      last_name: lastName,
      address_1: String(formData.get("shipping_address.address_1") || "").trim(),
      address_2: "",
      company: "",
      postal_code: postalCode,
      city,
      country_code: countryCode,
      province: String(formData.get("shipping_address.province") || "").trim(),
      phone,
    }

    const data = {
      shipping_address,
      billing_address: shipping_address,
      email,
    } as HttpTypes.StoreUpdateCart

    await updateCart(data)
    await autoSelectDefaultShippingForCart(cartId)
  } catch (e: any) {
    return e.message
  }

  redirect(
    `/${String(formData.get("shipping_address.country_code") || "vn").toLowerCase()}/checkout?step=confirm`
  )
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  await ensureManualPaymentSessionForCart(id)

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()
    redirect(`/${countryCode}/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}
