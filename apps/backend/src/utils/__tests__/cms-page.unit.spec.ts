import {
  assertValidCmsPageSlug,
  CmsPageValidationError,
  CMS_PAGE_SLUG_MAX_LEN,
  CMS_PAGE_SLUG_REGEX,
  parseAndValidatePageSeoJson,
  parseAndValidateTitleJson,
  resolveCmsPageI18nField,
  sanitizeCmsPageBody,
} from "../cms-page"

describe("cms-page utils", () => {
  it("CMS_PAGE_SLUG_REGEX chấp nhận slug hợp lệ", () => {
    expect(CMS_PAGE_SLUG_REGEX.test("about-us")).toBe(true)
    expect(CMS_PAGE_SLUG_REGEX.test("a1-b2")).toBe(true)
  })

  it("assertValidCmsPageSlug từ chối slug không hợp lệ", () => {
    expect(() => assertValidCmsPageSlug("About")).toThrow(CmsPageValidationError)
    expect(() => assertValidCmsPageSlug("a b")).toThrow(CmsPageValidationError)
    expect(() => assertValidCmsPageSlug("")).toThrow(CmsPageValidationError)
  })

  it("assertValidCmsPageSlug từ chối slug quá dài", () => {
    const long = `${"a".repeat(CMS_PAGE_SLUG_MAX_LEN)}x`
    expect(() => assertValidCmsPageSlug(long)).toThrow(CmsPageValidationError)
    expect(assertValidCmsPageSlug("a".repeat(CMS_PAGE_SLUG_MAX_LEN))).toBe(
      "a".repeat(CMS_PAGE_SLUG_MAX_LEN)
    )
  })

  it("parseAndValidateTitleJson yêu cầu vi và en", () => {
    expect(parseAndValidateTitleJson({ vi: "A", en: "B" })).toEqual({
      vi: "A",
      en: "B",
    })
    expect(() => parseAndValidateTitleJson({ vi: "A" })).toThrow(
      CmsPageValidationError
    )
  })

  it("sanitizeCmsPageBody loại script và on*", () => {
    expect(sanitizeCmsPageBody('<script>alert(1)</script><p>x</p>')).toBe(
      "<p>x</p>"
    )
    expect(sanitizeCmsPageBody('<img onerror="x" src="a">')).toContain("src=")
    expect(sanitizeCmsPageBody('<img onerror="x" src="a">')).not.toMatch(
      /onerror/i
    )
    expect(sanitizeCmsPageBody('<svg/onload=alert(1)>')).not.toMatch(/onload/i)
    expect(sanitizeCmsPageBody("vbscript:evil")).toBe("evil")
    expect(sanitizeCmsPageBody(null)).toBeNull()
    expect(sanitizeCmsPageBody("")).toBeNull()
  })

  it("resolveCmsPageI18nField ưu tiên locale rồi vi/en", () => {
    const raw = { vi: "V", en: "E" }
    expect(
      resolveCmsPageI18nField(raw, "en", ["vi", "en"], "vi")
    ).toBe("E")
    expect(
      resolveCmsPageI18nField({ vi: "", en: "E" }, "vi", ["vi", "en"], "vi")
    ).toBe("E")
  })

  it("parseAndValidatePageSeoJson chấp nhận null và object tối thiểu", () => {
    expect(parseAndValidatePageSeoJson(null)).toBeNull()
    expect(parseAndValidatePageSeoJson({})).toEqual({})
    expect(
      parseAndValidatePageSeoJson({
        meta_title: { vi: "T", en: "" },
      })
    ).toEqual({ meta_title: { vi: "T", en: "" } })
  })
})
