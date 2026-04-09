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
    expect(v).toEqual({
      kind: "page",
      pageId: "page_1",
      slug: "about",
      exp,
    })
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

  it("ký và verify bài tin (news_article)", () => {
    const exp = Math.floor(Date.now() / 1000) + 120
    const token = signCmsPreviewToken(
      {
        kind: "news_article",
        articleId: "news_1",
        slug: "bai-moi",
        exp,
      },
      secret
    )
    const v = verifyCmsPreviewToken(token, secret)
    expect(v).toEqual({
      kind: "news_article",
      articleId: "news_1",
      slug: "bai-moi",
      exp,
    })
  })
})
