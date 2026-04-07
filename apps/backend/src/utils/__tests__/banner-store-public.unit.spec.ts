import {
  hashVisitorVariant,
  pickAbVariant,
  selectBannerSlidesForStore,
} from "../banner-store-public"
import { BANNER_PUBLICATION } from "../../modules/store-cms/models/store-banner-slide"

describe("banner-store-public", () => {
  it("filters drafts from store", () => {
    const now = new Date("2026-06-15T12:00:00.000Z")
    const s = selectBannerSlidesForStore(
      [
        {
          id: "1",
          sort_order: 0,
          is_active: true,
          publication_status: BANNER_PUBLICATION.DRAFT,
          display_start_at: null,
          display_end_at: null,
          campaign_id: null,
          variant_label: null,
        },
        {
          id: "2",
          sort_order: 1,
          is_active: true,
          publication_status: BANNER_PUBLICATION.PUBLISHED,
          display_start_at: null,
          display_end_at: null,
          campaign_id: null,
          variant_label: null,
        },
      ],
      [],
      now,
      "v1"
    )
    expect(s.map((x) => x.id)).toEqual(["2"])
  })

  it("respects display window", () => {
    const now = new Date("2026-06-15T12:00:00.000Z")
    const s = selectBannerSlidesForStore(
      [
        {
          id: "a",
          sort_order: 0,
          is_active: true,
          publication_status: BANNER_PUBLICATION.PUBLISHED,
          display_start_at: new Date("2026-06-16T00:00:00.000Z"),
          display_end_at: null,
          campaign_id: null,
          variant_label: null,
        },
      ],
      [],
      now,
      "v1"
    )
    expect(s.length).toBe(0)
  })

  it("pickAbVariant is stable for same visitor+campaign", () => {
    const a = pickAbVariant("u1", "camp", 50)
    const b = pickAbVariant("u1", "camp", 50)
    expect(a).toBe(b)
  })

  it("hashVisitorVariant in 0..99", () => {
    expect(hashVisitorVariant("x", "y")).toBeGreaterThanOrEqual(0)
    expect(hashVisitorVariant("x", "y")).toBeLessThanOrEqual(99)
  })
})
