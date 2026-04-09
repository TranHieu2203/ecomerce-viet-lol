import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** ADR-22 / FR-39 — Thêm mục menu "Tin tức" → `/news` vào `nav_tree` (idempotent). */
const NEWS_GROUP_ID = "cms-migrate-wp-news-20260409"

export class Migration20260409120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      INSERT INTO "store_cms_settings" ("id", "default_locale", "enabled_locales")
      VALUES ('cms', 'vi', '["vi","en"]'::jsonb)
      ON CONFLICT ("id") DO NOTHING;
    `)

    this.addSql(`
      UPDATE "store_cms_settings" AS s
      SET
        "nav_tree" = jsonb_set(
          COALESCE(s."nav_tree", '{"version":1,"items":[]}'::jsonb),
          '{items}',
          ('[{"id":"${NEWS_GROUP_ID}","label":{"vi":"Tin tức","en":"News"},"children":[{"type":"link","url":"/news","label":{"vi":"Tin tức","en":"News"}}]}]'::jsonb)
            || COALESCE(s."nav_tree"->'items', '[]'::jsonb)
        ),
        "updated_at" = now()
      WHERE s."id" = 'cms'
        AND s."deleted_at" IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(s."nav_tree"->'items', '[]'::jsonb)) AS grp(elem)
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(elem->'children', '[]'::jsonb)) AS ch(child)
          WHERE child->>'type' = 'link'
            AND (
              child->>'url' = '/news'
              OR btrim(child->>'url', '/') = 'news'
            )
        );
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      UPDATE "store_cms_settings" AS s
      SET
        "nav_tree" = jsonb_set(
          COALESCE(s."nav_tree", '{"version":1,"items":[]}'::jsonb),
          '{items}',
          COALESCE(
            (
              SELECT jsonb_agg(elem) FILTER (
                WHERE elem->>'id' IS DISTINCT FROM '${NEWS_GROUP_ID}'
              )
              FROM jsonb_array_elements(COALESCE(s."nav_tree"->'items', '[]'::jsonb)) AS elem
            ),
            '[]'::jsonb
          )
        ),
        "updated_at" = now()
      WHERE s."id" = 'cms'
        AND s."deleted_at" IS NULL;
    `)
  }
}
