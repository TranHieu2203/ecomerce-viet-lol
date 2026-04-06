/**
 * POST Next.js on-demand revalidate (tag `cms`). Set STOREFRONT_REVALIDATE_URL + REVALIDATE_SECRET.
 */
export async function revalidateStorefrontCms(): Promise<void> {
  const base = process.env.STOREFRONT_REVALIDATE_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!base || !secret) {
    return
  }
  const url = `${base.replace(/\/$/, "")}/api/revalidate`
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, tag: "cms" }),
    })
    if (!res.ok) {
      console.warn(
        `[revalidate] storefront returned ${res.status} ${await res.text()}`
      )
    }
  } catch (e) {
    console.warn("[revalidate] failed", e)
  }
}
