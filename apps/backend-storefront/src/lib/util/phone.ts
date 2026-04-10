/**
 * Đồng bộ logic với `apps/backend/src/utils/vietnamese-phone.ts`.
 */
export function normalizeVietnamesePhone(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") {
    return ""
  }
  let d = raw.replace(/\D/g, "")
  if (d.startsWith("84")) {
    return d
  }
  if (d.startsWith("0") && d.length >= 9) {
    return `84${d.slice(1)}`
  }
  if (d.length === 9) {
    return `84${d}`
  }
  return d
}

export const GUEST_ORDER_EMAIL_DOMAIN = "guest.order.local"

export function guestCustomerEmailFromNormalizedPhone(
  normalizedDigits: string
): string {
  const safe = normalizedDigits.replace(/\D/g, "") || "unknown"
  return `guest.${safe}@${GUEST_ORDER_EMAIL_DOMAIN}`
}

/** Email trên giỏ/đơn guest khi không nhập email marketing (stub theo SĐT). */
export function isGuestOrderStubEmail(email: string | null | undefined): boolean {
  if (!email?.trim()) {
    return true
  }
  return email
    .trim()
    .toLowerCase()
    .endsWith(`@${GUEST_ORDER_EMAIL_DOMAIN}`)
}
