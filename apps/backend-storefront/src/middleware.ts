import { NextRequest, NextResponse } from "next/server"

import { getCmsLocalesForMiddleware } from "@lib/middleware-cms-locales"
import { isAppLocale } from "@lib/util/locales"

/**
 * URL prefix = locale (vi | en | ja). Giá region Medusa: NEXT_PUBLIC_DEFAULT_REGION.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  const search = request.nextUrl.search ?? ""
  const { enabled: enabledLocales, defaultLocale } =
    await getCmsLocalesForMiddleware()

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}${search}`, request.url),
      307
    )
  }

  const segments = pathname.split("/").filter(Boolean)
  const first = segments[0] ?? ""

  if (!isAppLocale(first)) {
    const rest = segments.slice(1).join("/")
    const target = rest
      ? `/${defaultLocale}/${rest}${search}`
      : `/${defaultLocale}${search}`
    return NextResponse.redirect(new URL(target, request.url), 307)
  }

  if (!enabledLocales.includes(first)) {
    const rest = segments.slice(1).join("/")
    const target = rest
      ? `/${defaultLocale}/${rest}${search}`
      : `/${defaultLocale}${search}`
    return NextResponse.redirect(new URL(target, request.url), 307)
  }

  let response = NextResponse.next()

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value ?? crypto.randomUUID()
  if (!cacheIdCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })
  }

  const localeCookie = request.cookies.get("_medusa_locale")
  if (localeCookie?.value !== first) {
    response.cookies.set("_medusa_locale", first, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
