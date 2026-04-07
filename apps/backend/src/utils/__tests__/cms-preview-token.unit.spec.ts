import {
  signCmsPreviewToken,
  verifyCmsPreviewToken,
} from "../cms-preview-token"

describe("cms-preview-token", () => {
  const secret = "test-secret-key"

  it("ký và verify round-trip", () => {
    const exp = Math.floor(Date.now() / 1000) + 120
    const token = signCmsPreviewToken(
      { pageId: "page_1", slug: "about", exp },
      secret
    )
    const v = verifyCmsPreviewToken(token, secret)
    expect(v).toEqual({ pageId: "page_1", slug: "about", exp })
  })

  it("sai secret → null", () => {
    const exp = Math.floor(Date.now() / 1000) + 120
    const token = signCmsPreviewToken(
      { pageId: "p", slug: "s", exp },
      secret
    )
    expect(verifyCmsPreviewToken(token, "other")).toBeNull()
  })

  it("token hết hạn → null", () => {
    const exp = Math.floor(Date.now() / 1000) - 10
    const token = signCmsPreviewToken(
      { pageId: "p", slug: "s", exp },
      secret
    )
    expect(verifyCmsPreviewToken(token, secret)).toBeNull()
  })
})
