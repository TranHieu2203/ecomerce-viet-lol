import {
  EMPTY_NAV_TREE,
  validateAndNormalizeNavTree,
} from "../nav-tree"

describe("validateAndNormalizeNavTree", () => {
  it("null → empty tree v1", () => {
    expect(validateAndNormalizeNavTree(null)).toEqual(EMPTY_NAV_TREE)
  })

  it("chuẩn hoá version mặc định", () => {
    const t = validateAndNormalizeNavTree({ items: [] })
    expect(t.version).toBe(1)
    expect(t.items).toEqual([])
  })

  it("chấp nhận nhóm + collection + link hợp lệ", () => {
    const t = validateAndNormalizeNavTree({
      version: 1,
      items: [
        {
          id: "g1",
          label: { vi: "Mục", en: "Cat" },
          children: [
            { type: "collection", handle: "gift-hampers" },
            {
              type: "link",
              url: "/about",
              label: { vi: "Giới thiệu" },
            },
          ],
        },
      ],
    })
    expect(t.items).toHaveLength(1)
    expect(t.items[0].children).toHaveLength(2)
    const link = t.items[0].children[1]
    expect(link.type).toBe("link")
    if (link.type === "link") {
      expect(link.url).toBe("/about")
    }
  })

  it("từ chối link thiếu url", () => {
    expect(() =>
      validateAndNormalizeNavTree({
        items: [
          {
            id: "g",
            label: {},
            children: [{ type: "link", url: "", label: { vi: "x" } }],
          },
        ],
      })
    ).toThrow(/url/)
  })

  it("từ chối link url không hợp lệ (javascript:)", () => {
    expect(() =>
      validateAndNormalizeNavTree({
        items: [
          {
            id: "g",
            label: {},
            children: [
              {
                type: "link",
                url: "javascript:alert(1)",
                label: { vi: "x" },
              },
            ],
          },
        ],
      })
    ).toThrow()
  })

  it("từ chối collection thiếu handle", () => {
    expect(() =>
      validateAndNormalizeNavTree({
        items: [
          {
            id: "g",
            label: {},
            children: [{ type: "collection", handle: "  " }],
          },
        ],
      })
    ).toThrow(/handle/)
  })
})
