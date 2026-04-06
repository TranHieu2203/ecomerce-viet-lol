import {
  childSortableId,
  editorToNavTree,
  groupSortableId,
  navTreeToEditor,
  parseNavEditorDragId,
} from "../nav-editor-model"
import type { NavTree } from "../../../../utils/nav-tree"

describe("nav-editor-model", () => {
  it("navTreeToEditor then editorToNavTree preserves tree shape", () => {
    const tree: NavTree = {
      version: 1,
      items: [
        {
          id: "g1",
          label: { vi: "Nhóm A", en: "Group A" },
          children: [
            {
              type: "collection",
              handle: "foo",
              label_override: { vi: "Tùy VI" },
            },
            {
              type: "link",
              url: "https://example.com",
              label: { en: "Ex" },
            },
          ],
        },
      ],
    }
    const { version, groups } = navTreeToEditor(tree)
    const back = editorToNavTree(version, groups)
    expect(back).toEqual(tree)
    expect(groups[0].children).toHaveLength(2)
    expect(groups[0].children[0].key.length).toBeGreaterThan(8)
  })

  it("parseNavEditorDragId handles group and child ids", () => {
    expect(parseNavEditorDragId(groupSortableId("abc"))).toEqual({
      kind: "group",
      groupId: "abc",
    })
    expect(
      parseNavEditorDragId(childSortableId("gid", "row1"))
    ).toEqual({
      kind: "child",
      groupId: "gid",
      rowKey: "row1",
    })
    expect(parseNavEditorDragId("unknown")).toBeNull()
  })
})
