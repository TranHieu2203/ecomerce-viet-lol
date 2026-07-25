import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/**
 * Thêm bảng `store_background` — nền website chọn được trong Admin.
 *
 * Bản Medusa sinh tự động kèm lệnh tạo lại toàn bộ bảng CMS: vô hại ở `up`
 * vì đều `create table if not exists`, nhưng `down` lại xoá sạch mọi bảng CMS.
 * Đã rút gọn để migration chỉ đụng đúng bảng mới, tránh mất dữ liệu khi rollback.
 */
export class Migration20260725165740 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "store_background" ("id" text not null, "name" text not null, "image_url" text null, "image_file_id" text null, "opacity" integer not null default 30, "saturate" integer not null default 100, "base_color" text not null default '#FAF7F2', "is_active" boolean not null default false, "sort_order" integer not null default 0, "is_preset" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "store_background_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_store_background_deleted_at" ON "store_background" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "store_background" cascade;`);
  }

}
