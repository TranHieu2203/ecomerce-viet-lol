import { NextRequest, NextResponse } from "next/server"

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isAppLocale,
} from "@lib/util/locales"

/**
 * URL prefix = locale (vi | en). Giá/region Medusa: mặc định country vn (NEXT_PUBLIC_DEFAULT_REGION).
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname.includes(".")) {
    return NextResponse.next()
  }

  const search = request.nextUrl.search ?? ""

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(`/${DEFAULT_LOCALE}${search}`, request.url),
      307
    )
  }

  const segments = pathname.split("/").filter(Boolean)
  const first = segments[0] ?? ""

  if (!isAppLocale(first)) {
    const rest = segments.slice(1).join("/")
    const target = rest
      ? `/${DEFAULT_LOCALE}/${rest}${search}`
      : `/${DEFAULT_LOCALE}${search}`
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
  if (localeCookie?.value !== first && SUPPORTED_LOCALES.includes(first as "vi" | "en")) {
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
