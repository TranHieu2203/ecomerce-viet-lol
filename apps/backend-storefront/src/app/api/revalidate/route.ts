import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/** On-demand ISR: Medusa gọi POST khi lưu CMS. Body: { secret, tag?: string } */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, message: "Not configured" }, { status: 501 })
  }
  let body: { secret?: string; tag?: string } = {}
  try {
    body = (await req.json()) as { secret?: string; tag?: string }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (body.secret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const tag = body.tag || "cms"
  revalidateTag(tag)
  return NextResponse.json({ revalidated: true, tag })
}
