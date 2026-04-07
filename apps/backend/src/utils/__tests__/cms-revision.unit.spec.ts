import { revisionIdsToSoftDelete } from "../cms-revision"

describe("cms-revision", () => {
  it("revisionIdsToSoftDelete returns empty when at or under limit", () => {
    expect(revisionIdsToSoftDelete([], 20)).toEqual([])
    expect(revisionIdsToSoftDelete([{ id: "a" }, { id: "b" }], 20)).toEqual([])
  })

  it("revisionIdsToSoftDelete returns excess rows from tail (oldest when input is DESC)", () => {
    const rows = Array.from({ length: 22 }, (_, i) => ({ id: `id-${i}` }))
    const del = revisionIdsToSoftDelete(rows, 20)
    expect(del).toEqual(["id-20", "id-21"])
  })
})
