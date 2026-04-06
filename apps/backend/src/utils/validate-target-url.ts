const DANGEROUS = /^\s*(javascript:|data:|vbscript:)/i

/** Allowed: http(s) and root-relative paths starting with `/` (not `//`). */
export function validateTargetUrl(raw: string | null | undefined): {
  ok: true
  value: string
} {
  const value = (raw ?? "").trim()
  if (!value) {
    return { ok: true, value: "" }
  }
  if (DANGEROUS.test(value)) {
    throw new Error("URL scheme not allowed")
  }
  if (value.startsWith("/")) {
    if (value.startsWith("//")) {
      throw new Error("Protocol-relative URLs are not allowed")
    }
    return { ok: true, value }
  }
  try {
    const u = new URL(value)
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("Only http(s) URLs are allowed")
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("Only http")) {
      throw e
    }
    throw new Error("Invalid URL")
  }
  return { ok: true, value }
}
