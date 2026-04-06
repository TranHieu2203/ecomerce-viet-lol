import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Wave 2 / FR-29, FR-11b, FR-27 — ADR-11 nav_tree, ADR-13 site_title_i18n + tagline_i18n.
 *
 * nav_tree shape (max depth 2 — validate on PATCH in story 8.2):
 * { "version": 1, "items": [
 *   { "id": string, "label": { "vi": string, "en": string },
 *     "children": [
 *       { "type": "collection", "handle": string, "label_override": { "vi"?: string, "en"?: string } | null }
 *       | { "type": "link", "url": string, "label": { "vi": string, "en": string } }
 *     ]
 *   }
 * ]}
 *
 * site_title_i18n / tagline_i18n: { "vi"?: string, "en"?: string }
 */
export class Migration20260406140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "nav_tree" jsonb null;`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "site_title_i18n" jsonb null;`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "tagline_i18n" jsonb null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "tagline_i18n";`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "site_title_i18n";`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "nav_tree";`
    )
  }
}
