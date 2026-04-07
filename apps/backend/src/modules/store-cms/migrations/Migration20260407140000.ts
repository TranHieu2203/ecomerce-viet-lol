import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Epic 10 Growth — banner publication lifecycle, schedule, A/B campaigns, audit (FR-18…21, NFR-6).
 */
export class Migration20260407140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "store_banner_slide" add column if not exists "publication_status" text not null default 'published';`
    )
    this.addSql(
      `alter table if exists "store_banner_slide" add column if not exists "display_start_at" timestamptz null;`
    )
    this.addSql(
      `alter table if exists "store_banner_slide" add column if not exists "display_end_at" timestamptz null;`
    )
    this.addSql(
      `alter table if exists "store_banner_slide" add column if not exists "campaign_id" text null;`
    )
    this.addSql(
      `alter table if exists "store_banner_slide" add column if not exists "variant_label" text null;`
    )

    this.addSql(`
      create table if not exists "store_banner_campaign" (
        "id" text not null,
        "name" text not null,
        "split_a_percent" integer not null default 50,
        "is_active" boolean not null default false,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "store_banner_campaign_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_banner_campaign_deleted_at" ON "store_banner_campaign" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "store_cms_publication_audit" (
        "id" text not null,
        "entity_type" text not null,
        "entity_id" text not null,
        "action" text not null,
        "actor_user_id" text null,
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "store_cms_publication_audit_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_publication_audit_deleted_at" ON "store_cms_publication_audit" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop table if exists "store_cms_publication_audit" cascade;`
    )
    this.addSql(`drop table if exists "store_banner_campaign" cascade;`)
    this.addSql(
      `alter table if exists "store_banner_slide" drop column if exists "variant_label";`
    )
    this.addSql(
      `alter table if exists "store_banner_slide" drop column if exists "campaign_id";`
    )
    this.addSql(
      `alter table if exists "store_banner_slide" drop column if exists "display_end_at";`
    )
    this.addSql(
      `alter table if exists "store_banner_slide" drop column if exists "display_start_at";`
    )
    this.addSql(
      `alter table if exists "store_banner_slide" drop column if exists "publication_status";`
    )
  }
}
