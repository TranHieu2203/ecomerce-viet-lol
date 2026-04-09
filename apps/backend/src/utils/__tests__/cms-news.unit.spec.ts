import {
  parseAndValidateBodyHtmlI18nJson,
  parseAndValidateExcerptI18nJson,
} from "../cms-news"

describe("cms-news utils", () => {
  it("body_html_i18n: loại script theo từng locale", () => {
    const out = parseAndValidateBodyHtmlI18nJson({
      vi: "<p>ok</p><script>x</script>",
      en: "<p>e</p>",
    })
    expect(out.vi).toBe("<p>ok</p>")
    expect(out.en).toBe("<p>e</p>")
  })

  it("excerpt: null khi rỗng", () => {
    expect(parseAndValidateExcerptI18nJson({ vi: "", en: "" })).toBeNull()
    expect(parseAndValidateExcerptI18nJson(null)).toBeNull()
  })
})
