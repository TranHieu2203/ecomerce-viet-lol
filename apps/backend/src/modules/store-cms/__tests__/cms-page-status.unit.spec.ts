import * as fs from "node:fs"
import * as path from "node:path"

import storeCmsModule, { STORE_CMS_MODULE } from "../index"
import StoreCmsModuleService from "../service"
import {
  CMS_PAGE_STATUS,
  type CmsPageStatus,
} from "../models/store-cms-page"
import {
  CMS_REVISION_ENTITY_TYPES,
  type CmsRevisionEntityType,
} from "../models/store-cms-revision"

describe("store-cms module & migration 9.1", () => {
  it("module definition và service load được", () => {
    expect(STORE_CMS_MODULE).toBe("store_cms")
    expect(storeCmsModule).toBeTruthy()
    expect(StoreCmsModuleService).toBeDefined()
  })

  it("migration tạo bảng store_cms_page và store_cms_revision", () => {
    const migrationPath = path.join(
      __dirname,
      "../migrations/Migration20260406150000.ts"
    )
    const src = fs.readFileSync(migrationPath, "utf8")
    expect(src).toContain("store_cms_page")
    expect(src).toContain("store_cms_revision")
    expect(src).toContain("IDX_store_cms_revision_entity_created")
  })
})

describe("store-cms page & revision constants", () => {
  it("CMS_PAGE_STATUS chỉ draft | published", () => {
    const values: CmsPageStatus[] = [
      CMS_PAGE_STATUS.DRAFT,
      CMS_PAGE_STATUS.PUBLISHED,
    ]
    expect(values).toEqual(["draft", "published"])
  })

  it("CMS_REVISION_ENTITY_TYPES khớp ADR-16 + tin tức (ADR-21)", () => {
    const expected: CmsRevisionEntityType[] = [
      "settings",
      "nav",
      "page",
      "banner",
      "news_article",
    ]
    expect([...CMS_REVISION_ENTITY_TYPES]).toEqual(expected)
  })
})
