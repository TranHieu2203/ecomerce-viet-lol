import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { isGuestOrderStubEmail } from "@lib/util/phone"
import Input from "@modules/common/components/input"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const ShippingAddress = ({
  customer,
  cart,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
}) => {
  const m = useStorefrontMessages()
  const s = m.checkoutSteps
  const isGuest = !customer

  const defaultCountry =
    cart?.region?.countries?.[0]?.iso_2?.toLowerCase() || "vn"

  const defaultFullName = [customer?.first_name, customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  const [formData, setFormData] = useState<Record<string, string>>({
    shipping_full_name:
      defaultFullName ||
      [cart?.shipping_address?.first_name, cart?.shipping_address?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    "shipping_address.postal_code":
      cart?.shipping_address?.postal_code || "000000",
    "shipping_address.city": cart?.shipping_address?.city || ".",
    "shipping_address.country_code":
      cart?.shipping_address?.country_code || defaultCountry,
    "shipping_address.province": cart?.shipping_address?.province || "",
    email: cart?.email || customer?.email || "",
    marketing_email:
      cart?.email && !isGuestOrderStubEmail(cart.email) ? cart.email : "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      const full = [address.first_name, address.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()
      setFormData((prev) => ({
        ...prev,
        shipping_full_name: full,
        "shipping_address.address_1": address.address_1 || "",
        "shipping_address.phone": address.phone || "",
        "shipping_address.postal_code": address.postal_code || "000000",
        "shipping_address.city": address.city || ".",
        "shipping_address.country_code":
          address.country_code?.toLowerCase() || defaultCountry,
        "shipping_address.province": address.province || "",
      }))
    }
    if (email) {
      setFormData((prev) => ({ ...prev, email }))
    }
  }

  useEffect(() => {
    if (cart?.shipping_address) {
      const full = [
        cart.shipping_address.first_name,
        cart.shipping_address.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
      setFormData((prev) => ({
        ...prev,
        shipping_full_name: full || prev.shipping_full_name,
        "shipping_address.address_1":
          cart.shipping_address?.address_1 || prev["shipping_address.address_1"],
        "shipping_address.phone":
          cart.shipping_address?.phone || prev["shipping_address.phone"],
        "shipping_address.postal_code":
          cart.shipping_address?.postal_code || "000000",
        "shipping_address.city": cart.shipping_address?.city || ".",
        "shipping_address.country_code":
          cart.shipping_address?.country_code?.toLowerCase() ||
          defaultCountry,
        "shipping_address.province":
          cart.shipping_address?.province || "",
      }))
    }
    if (!cart?.email && customer?.email) {
      setFormData((prev) => ({ ...prev, email: customer.email || "" }))
    }
    if (isGuest && cart?.email && !isGuestOrderStubEmail(cart.email)) {
      setFormData((prev) => ({
        ...prev,
        marketing_email: cart.email || "",
      }))
    }
  }, [cart, customer?.email, defaultCountry, isGuest])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const savedPrompt = customer?.first_name
    ? s.savedAddressPrompt.replace("{name}", customer.first_name)
    : s.savedAddressPrompt.replace("{name}", "").replace(/,\s*/, "")

  const fullParts = formData.shipping_full_name.trim().split(/\s+/).filter(Boolean)
  const derivedFirst = fullParts[0] || ""
  const derivedLast =
    fullParts.length > 1 ? fullParts.slice(1).join(" ") : "."

  const addressInputForCompare = {
    first_name: derivedFirst,
    last_name: derivedLast,
    address_1: formData["shipping_address.address_1"],
    postal_code: formData["shipping_address.postal_code"],
    city: formData["shipping_address.city"],
    country_code: formData["shipping_address.country_code"],
    province: formData["shipping_address.province"],
    phone: formData["shipping_address.phone"],
    company: "",
  } as HttpTypes.StoreCartAddress

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">{savedPrompt}</p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={addressInputForCompare}
            onSelect={setFormAddress}
          />
        </Container>
      )}

      <input
        type="hidden"
        name="shipping_address.first_name"
        value={derivedFirst}
      />
      <input
        type="hidden"
        name="shipping_address.last_name"
        value={derivedLast}
      />

      {isGuest && (
        <>
          <input
            type="hidden"
            name="shipping_address.postal_code"
            value={formData["shipping_address.postal_code"] || "000000"}
          />
          <input
            type="hidden"
            name="shipping_address.city"
            value={formData["shipping_address.city"] || "."}
          />
          <input
            type="hidden"
            name="shipping_address.country_code"
            value={defaultCountry}
          />
          <input
            type="hidden"
            name="shipping_address.province"
            value={formData["shipping_address.province"] || ""}
          />
        </>
      )}

      <div className="flex flex-col gap-y-5 w-full min-w-0">
        <Input
          label={s.fullNameLabel}
          name="shipping_full_name"
          autoComplete="name"
          value={formData.shipping_full_name}
          onChange={handleChange}
          required
          data-testid="shipping-full-name-input"
        />
        <Input
          label={s.addressLineLabel}
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
        <Input
          label={s.phoneLabel}
          name="shipping_address.phone"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          required
          data-testid="shipping-phone-input"
        />
        {isGuest && (
          <Input
            label={m.auth.email}
            name="marketing_email"
            type="email"
            title={m.auth.emailValidationTitle}
            autoComplete="email"
            value={formData.marketing_email}
            onChange={handleChange}
            data-testid="shipping-marketing-email-input"
          />
        )}
        {!isGuest && (
          <Input
            label={m.auth.email}
            name="email"
            type="email"
            title={m.auth.emailValidationTitle}
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
            data-testid="shipping-email-input"
          />
        )}
      </div>

      {!isGuest && (
        <div className="grid grid-cols-1 small:grid-cols-2 gap-4 mt-4 w-full min-w-0">
          <Input
            label={s.postalCodeLabel}
            name="shipping_address.postal_code"
            autoComplete="postal-code"
            value={formData["shipping_address.postal_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-postal-code-input"
          />
          <Input
            label={s.cityLabel}
            name="shipping_address.city"
            autoComplete="address-level2"
            value={formData["shipping_address.city"]}
            onChange={handleChange}
            required
            data-testid="shipping-city-input"
          />
          <CountrySelect
            name="shipping_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["shipping_address.country_code"]}
            onChange={handleChange}
            required
            data-testid="shipping-country-select"
          />
          <Input
            label={s.provinceLabel}
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            data-testid="shipping-province-input"
          />
        </div>
      )}
    </>
  )
}

export default ShippingAddress
