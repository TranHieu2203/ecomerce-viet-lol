import { createHmac, timingSafeEqual } from "node:crypto"

const B64 = {
  encode: (buf: Buffer) =>
    buf
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, ""),
  decode: (s: string) => {
    let b = s.replace(/-/g, "+").replace(/_/g, "/")
    while (b.length % 4) {
      b += "="
    }
    return Buffer.from(b, "base64")
  },
}

/** Payload khi ký — `kind` mặc định page nếu chỉ có pageId (tương thích token cũ). */
export type CmsPreviewPayload = {
  exp: number
  slug: string
  kind?: "page" | "news_article"
  pageId?: string
  articleId?: string
}

export type VerifiedCmsPreview =
  | { kind: "page"; pageId: string; slug: string; exp: number }
  | { kind: "news_article"; articleId: string; slug: string; exp: number }

export function signCmsPreviewToken(
  payload: CmsPreviewPayload,
  secret: string
): string {
  const body = JSON.stringify(payload)
  const bodyB64 = B64.encode(Buffer.from(body, "utf8"))
  const sig = createHmac("sha256", secret).update(bodyB64).digest()
  const sigB64 = B64.encode(sig)
  return `${bodyB64}.${sigB64}`
}

export function verifyCmsPreviewToken(
  token: string,
  secret: string
): VerifiedCmsPreview | null {
  const parts = token.split(".")
  if (parts.length !== 2) {
    return null
  }
  const [bodyB64, sigB64] = parts
  let bodyBuf: Buffer
  let sigBuf: Buffer
  try {
    bodyBuf = B64.decode(bodyB64)
    sigBuf = B64.decode(sigB64)
  } catch {
    return null
  }
  const expected = createHmac("sha256", secret).update(bodyB64).digest()
  if (sigBuf.length !== expected.length || !timingSafeEqual(sigBuf, expected)) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(bodyBuf.toString("utf8"))
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== "object") {
    return null
  }
  const o = parsed as Record<string, unknown>
  if (typeof o.slug !== "string" || typeof o.exp !== "number") {
    return null
  }
  if (Date.now() / 1000 > o.exp) {
    return null
  }
  const slug = o.slug
  const exp = o.exp
  const kindRaw = o.kind
  if (kindRaw === "news_article") {
    if (typeof o.articleId !== "string") {
      return null
    }
    return { kind: "news_article", articleId: o.articleId, slug, exp }
  }
  if (typeof o.pageId !== "string") {
    return null
  }
  return { kind: "page", pageId: o.pageId, slug, exp }
}
