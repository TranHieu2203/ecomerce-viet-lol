import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260330155442 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "store_banner_slide" ("id" text not null, "image_file_id" text null, "image_urls" jsonb null, "title" jsonb not null, "subtitle" jsonb null, "cta_label" jsonb null, "target_url" text null, "sort_order" integer not null, "is_active" boolean not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "store_banner_slide_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_store_banner_slide_deleted_at" ON "store_banner_slide" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "store_cms_settings" ("id" text not null, "default_locale" text not null, "enabled_locales" jsonb not null, "logo_file_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "store_cms_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_store_cms_settings_deleted_at" ON "store_cms_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "store_banner_slide" cascade;`);

    this.addSql(`drop table if exists "store_cms_settings" cascade;`);
  }

}
