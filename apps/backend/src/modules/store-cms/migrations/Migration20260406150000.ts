import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Wave 3 / Story 9.1 — ADR-12 `store_cms_page`, ADR-16 `store_cms_revision`.
 *
 * - `body`: text (sanitize XSS ở story API).
 * - Slug unique chỉ cho bản ghi chưa xóa mềm (partial index).
 * - Revision: index (entity_type, entity_id, created_at) cho list/prune story 9.5.
 */
export class Migration20260406150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "store_cms_page" ("id" text not null, "slug" text not null, "title" jsonb not null, "body" text null, "status" text not null default 'draft', "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "store_cms_page_pkey" primary key ("id"), constraint "store_cms_page_status_check" check ("status" in ('draft', 'published')));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_page_deleted_at" ON "store_cms_page" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_cms_page_slug_unique_active" ON "store_cms_page" ("slug") WHERE deleted_at IS NULL;`
    )

    this.addSql(
      `create table if not exists "store_cms_revision" ("id" text not null, "entity_type" text not null, "entity_id" text null, "payload_snapshot" jsonb not null, "actor_user_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "store_cms_revision_pkey" primary key ("id"), constraint "store_cms_revision_entity_type_check" check ("entity_type" in ('settings', 'nav', 'page', 'banner')));`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_revision_deleted_at" ON "store_cms_revision" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_revision_entity_created" ON "store_cms_revision" ("entity_type", "entity_id", "created_at");`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "store_cms_revision" cascade;`)
    this.addSql(`drop table if exists "store_cms_page" cascade;`)
  }
}
