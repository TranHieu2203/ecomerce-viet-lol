import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Wave 3 / Story 9.3 — ADR-13 mở rộng `store_cms_settings`;
 * SEO từng trang (`seo` JSON trên `store_cms_page`).
 */
export class Migration20260407103000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "seo_defaults" jsonb null;`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "og_image_file_id" text null;`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "footer_contact" jsonb null;`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "announcement" jsonb null;`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "not_found" jsonb null;`
    )
    this.addSql(
      `alter table if exists "store_cms_page" add column if not exists "seo" jsonb null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "store_cms_page" drop column if exists "seo";`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "not_found";`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "announcement";`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "footer_contact";`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "og_image_file_id";`
    )
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "seo_defaults";`
    )
  }
}
