import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260331120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "store_cms_settings" add column if not exists "site_title" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "store_cms_settings" drop column if exists "site_title";`
    )
  }
}
