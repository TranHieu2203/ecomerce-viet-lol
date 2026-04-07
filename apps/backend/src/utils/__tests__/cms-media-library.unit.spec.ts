import {
  mergeMediaLibraryIdOrder,
  parseSessionIdsQuery,
} from "../cms-media-library"

describe("cms-media-library", () => {
  describe("mergeMediaLibraryIdOrder", () => {
    it("puts db ids first in order, then session-only", () => {
      expect(
        mergeMediaLibraryIdOrder(["a", "b"], ["c", "a"])
      ).toEqual(["a", "b", "c"])
    })

    it("dedupes and trims", () => {
      expect(
        mergeMediaLibraryIdOrder([" file_1 ", "file_1"], ["", "  file_1  "])
      ).toEqual(["file_1"])
    })
  })

  describe("parseSessionIdsQuery", () => {
    it("parses comma list", () => {
      expect(parseSessionIdsQuery("a, b ,c")).toEqual(["a", "b", "c"])
    })

    it("returns empty for non-string", () => {
      expect(parseSessionIdsQuery(undefined)).toEqual([])
      expect(parseSessionIdsQuery(1)).toEqual([])
    })
  })
})
