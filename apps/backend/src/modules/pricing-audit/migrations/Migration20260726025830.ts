import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260726025830 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "price_change" ("id" text not null, "product_id" text not null, "variant_id" text not null, "product_title" text not null, "variant_title" text null, "field" text not null, "old_amount" integer null, "new_amount" integer null, "currency_code" text not null default 'vnd', "actor_id" text null, "actor_email" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "price_change_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_change_product_id" ON "price_change" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_change_variant_id" ON "price_change" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_price_change_deleted_at" ON "price_change" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "price_change" cascade;`);
  }

}
