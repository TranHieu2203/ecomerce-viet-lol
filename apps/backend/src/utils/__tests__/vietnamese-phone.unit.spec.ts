import {
  guestCustomerEmailFromNormalizedPhone,
  isGuestOrderLocalEmail,
  normalizeVietnamesePhone,
} from "../vietnamese-phone"

describe("normalizeVietnamesePhone", () => {
  it("strips spaces and normalizes leading 0 to 84", () => {
    expect(normalizeVietnamesePhone("090 123 4567")).toBe("84901234567")
  })

  it("keeps +84 prefix", () => {
    expect(normalizeVietnamesePhone("+84 901234567")).toBe("84901234567")
  })

  it("handles 9 digits without leading 0 as VN mobile", () => {
    expect(normalizeVietnamesePhone("901234567")).toBe("84901234567")
  })

  it("returns empty for empty input", () => {
    expect(normalizeVietnamesePhone("")).toBe("")
    expect(normalizeVietnamesePhone(undefined)).toBe("")
  })
})

describe("guestCustomerEmailFromNormalizedPhone", () => {
  it("builds deterministic guest email", () => {
    expect(guestCustomerEmailFromNormalizedPhone("84901234567")).toBe(
      "guest.84901234567@guest.order.local"
    )
  })
})

describe("isGuestOrderLocalEmail", () => {
  it("detects guest domain", () => {
    expect(isGuestOrderLocalEmail("guest.84@guest.order.local")).toBe(true)
    expect(isGuestOrderLocalEmail("a@b.com")).toBe(false)
  })
})
