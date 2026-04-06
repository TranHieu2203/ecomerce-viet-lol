import { model } from "@medusajs/framework/utils"

/** Singleton row id: `cms`. Table: store_cms_settings */
const CmsSetting = model.define("store_cms_settings", {
  id: model.id().primaryKey(),
  default_locale: model.text(),
  enabled_locales: model.json(),
  logo_file_id: model.text().nullable(),
  /** Tên hiển thị header storefront khi không dùng logo (hoặc kèm logo). */
  site_title: model.text().nullable(),
  /**
   * Cây menu 2 cấp (ADR-11). null = chưa cấu hình; story 8.2 sẽ validate & API.
   * @see migrations/Migration20260406140000.ts
   */
  nav_tree: model.json().nullable(),
  /** Tên site theo locale (footer / FR-11b). Legacy `site_title` giữ fallback. */
  site_title_i18n: model.json().nullable(),
  /** Tagline footer song ngữ (FR-27). */
  tagline_i18n: model.json().nullable(),
})

export default CmsSetting
