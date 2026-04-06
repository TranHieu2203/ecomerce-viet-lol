import { resolveI18nField } from "../resolve-i18n"

describe("resolveI18nField", () => {
  it("falls back to vi when en missing", () => {
    expect(
      resolveI18nField(
        { vi: { title: "A" }, en: {} },
        "en",
        "title"
      )
    ).toBe("A")
  })

  it("prefers en when present", () => {
    expect(
      resolveI18nField(
        { vi: { title: "A" }, en: { title: "B" } },
        "en",
        "title"
      )
    ).toBe("B")
  })
})
