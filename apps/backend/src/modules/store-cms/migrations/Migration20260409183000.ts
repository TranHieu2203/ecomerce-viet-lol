import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * WordPress-like taxonomy: hierarchical categories + tags + article links (Epic 12).
 */
export class Migration20260409183000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "store_cms_news_category" (
        "id" text not null,
        "slug" text not null,
        "title_i18n" jsonb not null,
        "parent_id" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "store_cms_news_category_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_cms_news_category_slug_unique" ON "store_cms_news_category" ("slug") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_news_category_deleted_at" ON "store_cms_news_category" ("deleted_at") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_news_category_parent" ON "store_cms_news_category" ("parent_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(`
      alter table "store_cms_news_category"
      add constraint "store_cms_news_category_parent_fk"
      foreign key ("parent_id") references "store_cms_news_category" ("id")
      on update cascade on delete set null;
    `)

    this.addSql(`
      create table if not exists "store_cms_news_tag" (
        "id" text not null,
        "slug" text not null,
        "title_i18n" jsonb not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "store_cms_news_tag_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_store_cms_news_tag_slug_unique" ON "store_cms_news_tag" ("slug") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_store_cms_news_tag_deleted_at" ON "store_cms_news_tag" ("deleted_at") WHERE deleted_at IS NULL;`
    )

    this.addSql(`
      create table if not exists "store_cms_news_article_category" (
        "id" text not null,
        "article_id" text not null,
        "category_id" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "store_cms_news_article_category_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_news_article_category_pair" ON "store_cms_news_article_category" ("article_id", "category_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_news_article_category_cat" ON "store_cms_news_article_category" ("category_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(`
      alter table "store_cms_news_article_category"
      add constraint "news_article_category_article_fk"
      foreign key ("article_id") references "store_cms_news_article" ("id")
      on update cascade on delete cascade;
    `)
    this.addSql(`
      alter table "store_cms_news_article_category"
      add constraint "news_article_category_category_fk"
      foreign key ("category_id") references "store_cms_news_category" ("id")
      on update cascade on delete cascade;
    `)

    this.addSql(`
      create table if not exists "store_cms_news_article_tag" (
        "id" text not null,
        "article_id" text not null,
        "tag_id" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "store_cms_news_article_tag_pkey" primary key ("id")
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_news_article_tag_pair" ON "store_cms_news_article_tag" ("article_id", "tag_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_news_article_tag_tag" ON "store_cms_news_article_tag" ("tag_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(`
      alter table "store_cms_news_article_tag"
      add constraint "news_article_tag_article_fk"
      foreign key ("article_id") references "store_cms_news_article" ("id")
      on update cascade on delete cascade;
    `)
    this.addSql(`
      alter table "store_cms_news_article_tag"
      add constraint "news_article_tag_tag_fk"
      foreign key ("tag_id") references "store_cms_news_tag" ("id")
      on update cascade on delete cascade;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "store_cms_news_article_tag" cascade;`)
    this.addSql(`drop table if exists "store_cms_news_article_category" cascade;`)
    this.addSql(`drop table if exists "store_cms_news_tag" cascade;`)
    this.addSql(`drop table if exists "store_cms_news_category" cascade;`)
  }
}
