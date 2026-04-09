import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Wave 4 / Epic 11 — `store_cms_news_article` (ADR-20); revision `news_article` (ADR-21).
 */
export class Migration20260407180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "store_cms_revision" DROP CONSTRAINT IF EXISTS "store_cms_revision_entity_type_check";`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "store_cms_revision" ADD CONSTRAINT "store_cms_revision_entity_type_check" CHECK ("entity_type" IN ('settings', 'nav', 'page', 'banner', 'news_article'));`
    )

    this.addSql(`
      create table if not exists "store_cms_news_article" (
        "id" text not null,
        "slug" text not null,
        "title_i18n" jsonb not null,
        "excerpt_i18n" jsonb null,
        "body_html_i18n" jsonb not null,
        "featured_image_file_id" text null,
        "seo" jsonb null,
        "status" text not null default 'draft',
        "published_at" timestamptz null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "store_cms_news_article_pkey" primary key ("id"),
        constraint "store_cms_news_article_status_check" check ("status" in ('draft', 'published'))
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_news_article_deleted_at" ON "store_cms_news_article" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_news_article_status_published" ON "store_cms_news_article" ("status", "published_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_cms_news_article_slug_unique_active" ON "store_cms_news_article" ("slug") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "store_cms_news_article" cascade;`)
    this.addSql(
      `ALTER TABLE IF EXISTS "store_cms_revision" DROP CONSTRAINT IF EXISTS "store_cms_revision_entity_type_check";`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "store_cms_revision" ADD CONSTRAINT "store_cms_revision_entity_type_check" CHECK ("entity_type" IN ('settings', 'nav', 'page', 'banner'));`
    )
  }
}
