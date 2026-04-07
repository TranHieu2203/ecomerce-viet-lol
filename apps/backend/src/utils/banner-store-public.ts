import { BANNER_PUBLICATION } from "../modules/store-cms/models/store-banner-slide"

export type BannerSlideForStore = {
  id: string
  sort_order: number
  is_active: boolean
  publication_status: string
  display_start_at: Date | string | null | undefined
  display_end_at: Date | string | null | undefined
  campaign_id: string | null | undefined
  variant_label: string | null | undefined
}

export type CampaignForStore = {
  id: string
  split_a_percent: number
  is_active: boolean
}

function withinWindow(
  s: BannerSlideForStore,
  now: Date
): boolean {
  if (s.display_start_at) {
    const t = new Date(s.display_start_at)
    if (t.getTime() > now.getTime()) {
      return false
    }
  }
  if (s.display_end_at) {
    const t = new Date(s.display_end_at)
    if (t.getTime() < now.getTime()) {
      return false
    }
  }
  return true
}

export function hashVisitorVariant(seed: string, campaignId: string): number {
  const s = `${seed}::${campaignId}`
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h % 100
}

export function pickAbVariant(
  visitorId: string,
  campaignId: string,
  splitAPercent: number
): "A" | "B" {
  const n = hashVisitorVariant(visitorId, campaignId)
  return n < splitAPercent ? "A" : "B"
}

/**
 * FR-18 / FR-20 / FR-21 — lọc slides cho Store công khai (đã published/active/cửa sổ thời gian + A/B).
 */
export function selectBannerSlidesForStore(
  slides: BannerSlideForStore[],
  campaigns: CampaignForStore[],
  now: Date,
  visitorId: string
): BannerSlideForStore[] {
  const byCamp = new Map<string, CampaignForStore>()
  for (const c of campaigns) {
    byCamp.set(c.id, c)
  }

  const candidates = slides.filter(
    (s) =>
      s.is_active &&
      s.publication_status === BANNER_PUBLICATION.PUBLISHED &&
      withinWindow(s, now)
  )

  const noCamp: BannerSlideForStore[] = []
  const grouped = new Map<string, BannerSlideForStore[]>()

  for (const s of candidates) {
    const cid = s.campaign_id?.trim() || ""
    if (!cid) {
      noCamp.push(s)
      continue
    }
    const arr = grouped.get(cid) ?? []
    arr.push(s)
    grouped.set(cid, arr)
  }

  const out: BannerSlideForStore[] = [...noCamp]

  for (const [cid, group] of grouped) {
    const camp = byCamp.get(cid)
    if (!camp?.is_active) {
      continue
    }
    const split = Math.min(100, Math.max(0, camp.split_a_percent))
    const variant = pickAbVariant(visitorId, cid, split)
    const matching = group.filter(
      (g) => (g.variant_label ?? "").toUpperCase() === variant
    )
    const chosen = matching.length ? matching : group
    out.push(...chosen)
  }

  out.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return out
}
