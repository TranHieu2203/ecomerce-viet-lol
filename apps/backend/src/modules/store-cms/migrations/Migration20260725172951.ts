import { Migration } from "@medusajs/framework/mikro-orm/migrations";

/**
 * Thêm cột `theme` cho `store_background` — nhóm nền theo dịp (trung-thu,
 * saffron, tet, khac).
 *
 * Bản Medusa sinh tự động chỉ có `create table if not exists`, mà bảng đã tồn
 * tại từ migration trước nên lệnh đó là no-op và cột `theme` sẽ không bao giờ
 * được thêm. Phải viết ALTER tay. `add column if not exists` để chạy lại được
 * và cũng đúng với database mới tinh (bảng vừa tạo đã có sẵn cột).
 */
export class Migration20260725172951 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "store_background" add column if not exists "theme" text not null default 'khac';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "store_background" drop column if exists "theme";`);
  }

}
