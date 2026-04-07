/**
 * POST Next.js on-demand ISR. Set STOREFRONT_REVALIDATE_URL + REVALIDATE_SECRET.
 * @param tag — Next `revalidateTag` (mặc định `cms`; nav menu `cms-nav`; trang CMS `cms-pages`).
 */
export async function revalidateStorefrontCms(tag = "cms"): Promise<void> {
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
      body: JSON.stringify({ secret, tag }),
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
