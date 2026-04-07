import {
  CmsSettingsValidationError,
  parseAnnouncement,
  parseFooterContact,
  parseNotFound,
  parseSeoDefaults,
} from "../cms-settings-adr13"

describe("cms-settings-adr13", () => {
  it("parseSeoDefaults null và object rỗng", () => {
    expect(parseSeoDefaults(null)).toBeNull()
    expect(parseSeoDefaults({})).toEqual({})
  })

  it("parseFooterContact yêu cầu url cho social", () => {
    expect(() =>
      parseFooterContact({ social: [{ url: "" }] })
    ).toThrow(CmsSettingsValidationError)
    expect(
      parseFooterContact({
        hotline: " 090 ",
        social: [{ url: "https://x.com/a", label: { vi: "X", en: "X" } }],
      })
    ).toMatchObject({
      hotline: "090",
      social: [{ url: "https://x.com/a", label: { vi: "X", en: "X" } }],
    })
  })

  it("parseAnnouncement", () => {
    const a = parseAnnouncement({
      enabled: true,
      text: { vi: "H", en: "E" },
      link_url: "https://a",
    })
    expect(a).toMatchObject({ enabled: true, link_url: "https://a" })
    expect(() => parseAnnouncement({ enabled: true, text: { vi: "x" } })).toThrow(
      CmsSettingsValidationError
    )
  })

  it("parseNotFound sanitize body", () => {
    const n = parseNotFound({
      title: { vi: "L", en: "L" },
      body: { vi: "<script>x</script><p>a</p>", en: "" },
    })
    expect(n?.body).toEqual({ vi: "<p>a</p>", en: "" })
  })
})
