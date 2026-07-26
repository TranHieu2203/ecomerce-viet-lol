import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260726034718 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "stock_movement" ("id" text not null, "inventory_item_id" text not null, "variant_id" text null, "product_id" text null, "product_title" text null, "variant_title" text null, "sku" text null, "location_id" text not null, "location_name" text null, "type" text not null, "quantity" integer not null, "balance_after" integer not null, "unit_cost" integer null, "note" text null, "actor_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stock_movement_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_movement_inventory_item_id" ON "stock_movement" ("inventory_item_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_movement_product_id" ON "stock_movement" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_movement_location_id" ON "stock_movement" ("location_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stock_movement_deleted_at" ON "stock_movement" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "stock_movement" cascade;`);
  }

}
