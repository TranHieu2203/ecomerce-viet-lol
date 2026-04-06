import { validateTargetUrl } from "../validate-target-url"

describe("validateTargetUrl", () => {
  it("allows https", () => {
    expect(validateTargetUrl("https://example.com/x").value).toBe(
      "https://example.com/x"
    )
  })

  it("allows relative", () => {
    expect(validateTargetUrl("/collections/foo").value).toBe("/collections/foo")
  })

  it("rejects javascript", () => {
    expect(() => validateTargetUrl("javascript:alert(1)")).toThrow()
  })

  it("rejects data", () => {
    expect(() => validateTargetUrl("data:text/html,<script>")).toThrow()
  })
})
