import type {
  CreateInventoryLevelInput,
  ExecArgs,
  UpdateInventoryLevelInput,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  deleteProductCategoriesWorkflow,
  deleteProductsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import type { IFileModuleService } from "@medusajs/types"
import * as fs from "node:fs"
import * as path from "node:path"
import sharp from "sharp"
import { CMS_SETTINGS_ID, STORE_CMS_MODULE } from "../modules/store-cms"
import { BANNER_PUBLICATION } from "../modules/store-cms/models/store-banner-slide"
import { CMS_PAGE_STATUS } from "../modules/store-cms/models/store-cms-page"
import { CMS_NEWS_STATUS } from "../modules/store-cms/models/store-cms-news-article"
import type StoreCmsModuleService from "../modules/store-cms/service"
import { generateBannerDerivatives } from "../utils/banner-derivatives"
import { appendPageRevision } from "../utils/cms-page-revision"
import { sanitizeCmsPageBody } from "../utils/cms-page"
import { appendNewsRevisionWithTaxonomy } from "../utils/cms-news-revision"
import {
  replaceNewsArticleCategories,
  replaceNewsArticleTags,
} from "../utils/cms-news-taxonomy"
import { revalidateStorefrontCms } from "../utils/revalidate-storefront"
import { validateAndNormalizeNavTree } from "../utils/nav-tree"
import {
  kitSegmentsForProductHandle,
  loadWebtayaPlanFromXlsx,
  NONG_SAN_POSTER_ORDER,
} from "./webtaya-xlsx-catalog"

const IMG_EXT = /\.(jpe?g|png|webp)$/i
const POSTER_MARKER = "__POSTER_INDEX__"

function stableHash(raw: string): number {
  // FNV-1a 32-bit (deterministic; good enough for seed variance)
  let h = 0x811c9dc5
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function stableUnit(seed: string, salt: string): number {
  const x = stableHash(`${seed}:${salt}`)
  return x / 0xffffffff
}

function stableIntInRange(
  seed: string,
  salt: string,
  minInclusive: number,
  maxInclusive: number
): number {
  const u = stableUnit(seed, salt)
  return Math.floor(minInclusive + u * (maxInclusive - minInclusive + 1))
}

function roundTo(amount: number, step: number): number {
  if (step <= 1) return amount
  return Math.round(amount / step) * step
}

function slugify(raw: string): string {
  return String(raw)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0110/g, "d")
    .replace(/\u0111/g, "d")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200)
}

function repoRootFromScriptsDir(): string {
  return path.resolve(__dirname, "..", "..", "..", "..")
}

function resolveSalesKitRoot(): string {
  const docs =
    process.env.SALES_KIT_DOCS_PATH?.trim() ||
    path.join(repoRootFromScriptsDir(), "docs")
  if (!fs.existsSync(docs)) {
    throw new Error(
      `Thiếu thư mục docs/ tại ${docs}. Trong Docker: mount thư mục docs/ của repo vào /app/docs (xem deploy/docker-compose.prod.yml) hoặc set SALES_KIT_DOCS_PATH.`
    )
  }
  const dir = fs
    .readdirSync(docs)
    .find((n) => /sales kit/i.test(n))
  if (!dir) {
    throw new Error(
      `Không tìm thấy thư mục Sales Kit trong docs/ (tên chứa "Sales Kit")`
    )
  }
  return path.join(docs, dir)
}

function firstImageDeep(dir: string): string | null {
  if (!fs.existsSync(dir)) {
    return null
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      const x = firstImageDeep(p)
      if (x) {
        return x
      }
    } else if (IMG_EXT.test(e.name)) {
      return p
    }
  }
  return null
}

function joinKit(salesKit: string, segments: string[]): string {
  return path.join(salesKit, ...segments)
}

function mimeForPath(abs: string): string {
  const ext = path.extname(abs).toLowerCase()
  if (ext === ".png") {
    return "image/png"
  }
  if (ext === ".webp") {
    return "image/webp"
  }
  return "image/jpeg"
}

async function uploadLocalImage(
  fileModule: IFileModuleService,
  absPath: string
): Promise<{ id: string; url: string }> {
  const buf = fs.readFileSync(absPath)
  const created = await fileModule.createFiles({
    filename: path.basename(absPath),
    mimeType: mimeForPath(absPath),
    content: buf.toString("base64"),
  })
  const row = created as { id: string; url: string }
  return { id: row.id, url: row.url }
}

/**
 * Logo nguồn thường nền đen — đưa pixel gần đen về alpha=0 để header trắng hiện đúng vàng kim.
 * Ngưỡng ~42: cân bằng giữa cạnh anti-alias và loại nền #000.
 */
async function pngKnockoutNearBlack(
  absPath: string,
  threshold = 42
): Promise<Buffer> {
  const { data, info } = await sharp(absPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const channels = info.channels
  if (channels !== 4) {
    return sharp(absPath).png().toBuffer()
  }
  const out = Buffer.from(data)
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i]!
    const g = out[i + 1]!
    const b = out[i + 2]!
    if (r <= threshold && g <= threshold && b <= threshold) {
      out[i + 3] = 0
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer()
}

async function uploadLogoForCms(
  fileModule: IFileModuleService,
  absPath: string,
  repoRoot: string
): Promise<{ id: string; url: string }> {
  const ext = path.extname(absPath).toLowerCase()
  let buf: Buffer
  let filename: string
  let mimeType: string
  if (ext === ".png") {
    buf = await pngKnockoutNearBlack(absPath)
    filename = "tay-a-logo-rgb.png"
    mimeType = "image/png"
    try {
      fs.writeFileSync(path.join(repoRoot, "docs", "logo-header.png"), buf)
      const pubDir = path.join(
        repoRoot,
        "apps",
        "backend-storefront",
        "public"
      )
      fs.mkdirSync(pubDir, { recursive: true })
      fs.writeFileSync(path.join(pubDir, "tay-a-logo.png"), buf)
    } catch {
      /* ghi file phụ trợ không chặn seed */
    }
  } else {
    buf = fs.readFileSync(absPath)
    filename = path.basename(absPath)
    mimeType = mimeForPath(absPath)
  }
  const created = await fileModule.createFiles({
    filename,
    mimeType,
    content: buf.toString("base64"),
  })
  const row = created as { id: string; url: string }
  return { id: row.id, url: row.url }
}

function listDirectImageFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && IMG_EXT.test(e.name))
    .map((e) => path.join(dir, e.name))
}

function firstImageUnderSegments(
  salesKit: string,
  segments: string[]
): string | null {
  return firstImageDeep(joinKit(salesKit, segments))
}

async function wipeCartsAndReservations(
  container: ExecArgs["container"],
  logger: { info: (m: string) => void }
) {
  const cartModule = container.resolve(Modules.CART) as {
    listCarts: (
      filters?: object,
      config?: { take?: number; skip?: number; withDeleted?: boolean }
    ) => Promise<{ id: string }[]>
    deleteCarts: (ids: string[]) => Promise<void>
  }
  const inventoryModule = container.resolve(Modules.INVENTORY) as {
    listAndCountReservationItems: (
      filters?: object,
      config?: { take?: number; skip?: number; withDeleted?: boolean }
    ) => Promise<[{ id: string }[], number]>
    deleteReservationItems: (ids: string[]) => Promise<void>
  }

  // 1) Delete reservation items to unblock inventory item deletion.
  try {
    const [items] = await inventoryModule.listAndCountReservationItems(
      {},
      { take: 50_000, skip: 0, withDeleted: false }
    )
    const ids = (items ?? []).map((r) => r.id).filter(Boolean)
    if (ids.length) {
      const BATCH = 200
      for (let i = 0; i < ids.length; i += BATCH) {
        await inventoryModule.deleteReservationItems(ids.slice(i, i + BATCH))
      }
      logger.info(`Đã xóa ${ids.length} inventory reservation items.`)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    logger.info(`Bỏ qua xóa reservation items (không critical): ${msg}`)
  }

  // 2) Delete carts (often the source of reservations).
  try {
    const carts = await cartModule.listCarts(
      {},
      { take: 50_000, skip: 0, withDeleted: false }
    )
    const ids = (carts ?? []).map((c) => c.id).filter(Boolean)
    if (ids.length) {
      const BATCH = 200
      for (let i = 0; i < ids.length; i += BATCH) {
        await cartModule.deleteCarts(ids.slice(i, i + BATCH))
      }
      logger.info(`Đã xóa ${ids.length} carts.`)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    logger.info(`Bỏ qua xóa carts (không critical): ${msg}`)
  }
}

async function wipeAllProducts(
  container: ExecArgs["container"],
  logger: { info: (m: string) => void }
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id"],
  })
  const ids = (data ?? []).map((p: { id: string }) => p.id).filter(Boolean)
  if (!ids.length) {
    logger.info("Không có sản phẩm để xóa.")
    return
  }
  const BATCH = 50
  for (let i = 0; i < ids.length; i += BATCH) {
    await deleteProductsWorkflow(container).run({
      input: { ids: ids.slice(i, i + BATCH) },
    })
  }
  logger.info(`Đã xóa ${ids.length} sản phẩm.`)
}

type ProductCategoryListRow = {
  id: string
  parent_category_id?: string | null
  deleted_at?: Date | string | null
}

async function listProductCategoriesGraph(
  container: ExecArgs["container"]
): Promise<{ id: string; parent_category_id: string | null }[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_category",
    fields: ["id", "parent_category_id"],
    pagination: { skip: 0, take: 100_000, order: { rank: "ASC" } },
  })
  return (data ?? []).map(
    (r: { id: string; parent_category_id?: string | null }) => ({
      id: r.id,
      parent_category_id: r.parent_category_id ?? null,
    })
  )
}

async function listAllProductCategories(
  productModule: {
    listAndCountProductCategories: (
      filters?: object,
      config?: {
        take?: number
        skip?: number
        order?: Record<string, "ASC" | "DESC">
        withDeleted?: boolean
      }
    ) => Promise<[ProductCategoryListRow[], number]>
  },
  withDeleted: boolean
): Promise<ProductCategoryListRow[]> {
  const [rows] = await productModule.listAndCountProductCategories(
    {},
    {
      take: 50_000,
      skip: 0,
      withDeleted,
      order: { rank: "ASC" },
    }
  )
  return rows
}

async function wipeAllProductCategories(
  container: ExecArgs["container"],
  logger: { info: (m: string) => void }
) {
  /** Product module: đủ category + xử lý bản ghi soft-delete (Medusa vẫn tính là “con” khi xóa cha). */
  const productModule = container.resolve(Modules.PRODUCT) as {
    listAndCountProductCategories: (
      filters?: object,
      config?: {
        take?: number
        skip?: number
        order?: Record<string, "ASC" | "DESC">
        withDeleted?: boolean
      }
    ) => Promise<[ProductCategoryListRow[], number]>
    restoreProductCategories: (ids: string[]) => Promise<void>
  }

  const withDeletedRows = await listAllProductCategories(productModule, true)
  const restoreIds = withDeletedRows
    .filter((c) => c.deleted_at != null)
    .map((c) => c.id)
  if (restoreIds.length) {
    const RESTORE_BATCH = 100
    for (let i = 0; i < restoreIds.length; i += RESTORE_BATCH) {
      await productModule.restoreProductCategories(
        restoreIds.slice(i, i + RESTORE_BATCH)
      )
    }
    logger.info(
      `Đã khôi phục ${restoreIds.length} product category (trước đó soft-delete) để xóa cây đúng thứ tự.`
    )
  }

  let deleted = 0
  for (;;) {
    const snapshot = await listProductCategoriesGraph(container)
    if (!snapshot.length) {
      break
    }
    const leaves = snapshot.filter(
      (r) => !snapshot.some((c) => c.parent_category_id === r.id)
    )
    if (!leaves.length) {
      throw new Error(
        "Không thể xóa product category: không có nút lá (kiểm tra vòng parent_category_id)."
      )
    }
    await deleteProductCategoriesWorkflow(container).run({
      input: [leaves[0].id],
    })
    deleted++
  }
  if (deleted) {
    logger.info(`Đã xóa ${deleted} product category.`)
  } else {
    logger.info("Không có product category để xóa.")
  }
}

async function wipeAllCollections(
  container: ExecArgs["container"],
  logger: { info: (m: string) => void }
) {
  const productModule = container.resolve(Modules.PRODUCT) as {
    deleteProductCollections: (ids: string[]) => Promise<void>
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_collection",
    fields: ["id"],
  })
  const ids = (data ?? []).map((c: { id: string }) => c.id).filter(Boolean)
  if (!ids.length) {
    logger.info("Không có collection để xóa.")
    return
  }
  const BATCH = 50
  for (let i = 0; i < ids.length; i += BATCH) {
    await productModule.deleteProductCollections(ids.slice(i, i + BATCH))
  }
  logger.info(`Đã xóa ${ids.length} collection.`)
}

function posterFilesSorted(salesKit: string): string[] {
  const dir = joinKit(salesKit, ["4. Bộ poster toàn bộ sản phẩm"])
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs
    .readdirSync(dir)
    .filter((f) => IMG_EXT.test(f))
    .sort()
    .map((f) => path.join(dir, f))
}

function resolveWebtayaLocalImagePaths(
  salesKit: string,
  productHandle: string,
  maxImages: number,
  logger: { info: (m: string) => void }
): string[] {
  const seg = kitSegmentsForProductHandle(productHandle)
  if (!seg?.length) {
    logger.info(`WEBTAYA: chưa map ảnh cho handle=${productHandle}`)
    return []
  }
  if (seg[0] === POSTER_MARKER) {
    const rest = productHandle.replace(/^nong-san-viet-/, "")
    const idx = (NONG_SAN_POSTER_ORDER as readonly string[]).indexOf(rest)
    const files = posterFilesSorted(salesKit)
    if (idx < 0 || !files[idx]) {
      logger.info(`WEBTAYA: poster không khớp cho ${productHandle}`)
      return []
    }
    return [files[idx]!]
  }
  const base = joinKit(salesKit, seg)
  const direct = listDirectImageFiles(base).slice(0, maxImages)
  if (direct.length) {
    return direct
  }
  const one = firstImageDeep(base)
  return one ? [one] : []
}

async function seedCatalogWebtayaFromXlsx(
  container: ExecArgs["container"],
  repoRoot: string,
  salesKit: string,
  salesChannelId: string,
  shippingProfileId: string,
  fileModule: IFileModuleService,
  logger: { info: (m: string) => void }
) {
  const xlsxPath = path.join(repoRoot, "docs", "WEBTAYA.xlsx")
  const plan = loadWebtayaPlanFromXlsx(xlsxPath)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT) as {
    createProductCollections: (data: {
      handle: string
      title: string
      metadata?: Record<string, unknown>
    }[]) => Promise<{ id: string; handle: string }[]>
    listProducts: (f: { handle: string }) => Promise<{ id: string }[]>
  }

  const maxProducts = Number(process.env.SEED_MAX_PRODUCTS ?? 200)
  const maxImagesPerProduct = Number(
    process.env.SEED_MAX_IMAGES_PER_PRODUCT ?? 24
  )

  const collectionIdByHandle = new Map<string, string>()
  for (const col of plan) {
    const { data: existing } = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle"],
      filters: { handle: col.collectionHandle },
    })
    const found = (existing?.[0] as { id: string } | undefined)?.id
    if (found) {
      collectionIdByHandle.set(col.collectionHandle, found)
      continue
    }
    const [created] = await productModule.createProductCollections([
      {
        handle: col.collectionHandle,
        title: col.collectionTitle,
        metadata: {
          i18n: {
            vi: { title: col.collectionTitle, description: "" },
            en: { title: col.collectionTitle, description: "" },
          },
        },
      },
    ])
    collectionIdByHandle.set(col.collectionHandle, created.id)
  }

  const { result: rootCats } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Tây Á Group",
          handle: "tay-a-group",
          is_active: true,
          is_internal: false,
          description: "Danh mục gốc — seed WEBTAYA / Sales Kit",
          metadata: { seed: "webtaya", role: "root" },
        },
      ],
    },
  })
  const rootCategoryId = rootCats?.[0]?.id
  if (!rootCategoryId) {
    throw new Error("Không tạo được product category gốc Tây Á Group.")
  }

  const { result: leafCats } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: plan.map((col, idx) => ({
        name: col.collectionTitle,
        handle: col.collectionHandle,
        parent_category_id: rootCategoryId,
        is_active: true,
        is_internal: false,
        description: `WEBTAYA · ${col.collectionTitle}`,
        rank: idx,
        metadata: {
          webtaya_collection_handle: col.collectionHandle,
          seed: "webtaya",
        },
      })),
    },
  })
  const categoryIdByHandle = new Map<string, string>()
  for (const c of leafCats ?? []) {
    if (c.handle) {
      categoryIdByHandle.set(c.handle, c.id)
    }
  }

  let createdCount = 0
  for (const col of plan) {
    const collectionId = collectionIdByHandle.get(col.collectionHandle)
    const categoryId = categoryIdByHandle.get(col.collectionHandle)
    if (!collectionId || !categoryId) {
      continue
    }
    for (const p of col.products) {
      if (createdCount >= maxProducts) {
        logger.info(`Đã đạt SEED_MAX_PRODUCTS=${maxProducts}; dừng.`)
        return
      }
      const exists = await productModule.listProducts({ handle: p.handle })
      if (exists.length) {
        continue
      }
      const locals = resolveWebtayaLocalImagePaths(
        salesKit,
        p.handle,
        maxImagesPerProduct,
        logger
      )
      if (!locals.length) {
        logger.info(`WEBTAYA: bỏ qua (không có ảnh): ${p.title}`)
        continue
      }
      const urls: string[] = []
      for (const abs of locals) {
        const up = await uploadLocalImage(fileModule, abs)
        if (up.url) {
          urls.push(up.url)
        }
      }
      if (!urls.length) {
        continue
      }

      await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: p.title,
              handle: p.handle,
              status: "published",
              description: `Tây Á — ${col.collectionTitle}: ${p.title}`,
              shipping_profile_id: shippingProfileId,
              collection_id: collectionId,
              categories: [{ id: categoryId }],
              sales_channels: [{ id: salesChannelId }],
              thumbnail: urls[0],
              images: urls.map((url) => ({ url })),
              metadata: {
                i18n: {
                  vi: {
                    title: p.title,
                    description: `Danh mục ${col.collectionTitle}`,
                  },
                  en: {
                    title: p.title,
                    description: `${col.collectionTitle} line`,
                  },
                },
              },
              options: [{ title: "Default", values: ["Default"] }],
              variants: [
                {
                  title: "Default",
                  sku: p.handle.toUpperCase().replace(/-/g, "_").slice(0, 60),
                  options: { Default: "Default" },
                  prices: [
                    {
                      amount: roundTo(
                        stableIntInRange(p.handle, "vnd", 90_000, 1_950_000),
                        1_000
                      ),
                      currency_code: "vnd",
                    },
                    {
                      amount: roundTo(
                        stableIntInRange(p.handle, "usd", 9_99, 199_99),
                        5
                      ),
                      currency_code: "usd",
                    },
                  ],
                } as never,
              ],
            } as never,
          ],
        },
      })
      createdCount++
    }
  }

  logger.info(
    `WEBTAYA: đã tạo ${createdCount} sản phẩm, ${1 + plan.length} product category (1 gốc + ${plan.length} nhóm), ${plan.length} collection (WEBTAYA.xlsx).`
  )
}

async function seedPublishedCmsPages(
  cms: StoreCmsModuleService,
  logger: { info: (m: string) => void }
) {
  type PageDef = {
    slug: string
    title: { vi: string; en: string }
    bodyVi: string
    bodyEn: string
    seo: {
      meta_title: { vi: string; en: string }
      meta_description: { vi: string; en: string }
    }
  }

  const defs: PageDef[] = [
    {
      slug: "gioi-thieu",
      title: { vi: "Giới thiệu cửa hàng", en: "About our store" },
      bodyVi: `<p><strong>Tây Á Group</strong> — saffron, mỹ phẩm, quà doanh nghiệp và đặc sản. Danh mục đồng bộ file <em>WEBTAYA.xlsx</em> và ảnh <em>Sales Kit</em>.</p>
<ul><li>Sản phẩm hiển thị theo nhóm trên trang chủ.</li><li>SEO chỉnh được trong Admin CMS.</li></ul>`,
      bodyEn: `<p><strong>Tay A Group</strong> — saffron, cosmetics, corporate gifts and specialty foods. Catalog is driven by <em>WEBTAYA.xlsx</em> and the <em>Sales Kit</em> imagery.</p>
<ul><li>Homepage rails follow your Excel groupings.</li><li>SEO fields are editable in the CMS admin.</li></ul>`,
      seo: {
        meta_title: {
          vi: "Giới thiệu | Tây Á Group",
          en: "About us | Tay A Group",
        },
        meta_description: {
          vi: "Tây Á Group — saffron, mỹ phẩm, quà tặng và đặc sản.",
          en: "Tay A Group — saffron, cosmetics, gifts and specialty products.",
        },
      },
    },
    {
      slug: "chinh-sach-giao-hang",
      title: { vi: "Chính sách giao hàng", en: "Shipping policy" },
      bodyVi: `<p>Chúng tôi giao hàng toàn quốc. Thời gian ước tính <strong>2–5 ngày làm việc</strong> tùy khu vực.</p><p>Phí vận chuyển hiển thị tại bước thanh toán.</p>`,
      bodyEn: `<p>We ship nationwide. Estimated delivery <strong>2–5 business days</strong> depending on region.</p><p>Shipping fees are shown at checkout.</p>`,
      seo: {
        meta_title: {
          vi: "Chính sách giao hàng | Tây Á Group",
          en: "Shipping policy | Tay A Group",
        },
        meta_description: {
          vi: "Thông tin giao hàng, thời gian và phí vận chuyển.",
          en: "Shipping times and fees.",
        },
      },
    },
    {
      slug: "chinh-sach-doi-tra",
      title: { vi: "Chính sách đổi trả", en: "Returns & refunds" },
      bodyVi: `<p>Sản phẩm lỗi hoặc không đúng mô tả có thể đổi trong <strong>7 ngày</strong> kể từ khi nhận.</p><p>Liên hệ hotline hoặc email trong footer để được hỗ trợ.</p>`,
      bodyEn: `<p>Defective or misdescribed items may be exchanged within <strong>7 days</strong> of receipt.</p><p>Use the footer hotline or email for support.</p>`,
      seo: {
        meta_title: {
          vi: "Đổi trả & hoàn tiền | Tây Á Group",
          en: "Returns & refunds | Tay A Group",
        },
        meta_description: {
          vi: "Điều kiện đổi trả trong 7 ngày.",
          en: "7-day exchange conditions.",
        },
      },
    },
    {
      slug: "lien-he",
      title: { vi: "Liên hệ", en: "Contact" },
      bodyVi: `<p>Vui lòng cập nhật <strong>hotline</strong> và <strong>email</strong> trong Admin → Storefront CMS.</p><p>Gợi ý giờ làm việc: 9:00–18:00, thứ Hai–thứ Sáu.</p>`,
      bodyEn: `<p>Please update the <strong>hotline</strong> and <strong>email</strong> in Admin → Storefront CMS.</p><p>Suggested hours: 9:00–18:00, Monday–Friday.</p>`,
      seo: {
        meta_title: {
          vi: "Liên hệ | Tây Á Group",
          en: "Contact | Tay A Group",
        },
        meta_description: {
          vi: "Thông tin liên hệ cửa hàng.",
          en: "Store contact information.",
        },
      },
    },
  ]

  const now = new Date()
  for (const d of defs) {
    const existing = await cms.listStoreCmsPages({ slug: d.slug })
    if (existing.length) {
      continue
    }
    const body =
      sanitizeCmsPageBody(
        `<div lang="vi">${d.bodyVi}</div><div lang="en">${d.bodyEn}</div>`
      ) ?? ""
    const [created] = await cms.createStoreCmsPages([
      {
        slug: d.slug,
        title: d.title,
        body,
        seo: d.seo,
        status: CMS_PAGE_STATUS.PUBLISHED,
        published_at: now,
      },
    ])
    await appendPageRevision(
      cms,
      {
        id: created.id,
        slug: created.slug,
        title: created.title,
        body: created.body,
        seo: created.seo,
        status: created.status,
        published_at: created.published_at,
      },
      null
    )
  }
  logger.info(`Đã seed ${defs.length} trang CMS published + revision (nếu chưa tồn tại).`)
}

async function ensureCmsNewsTaxonomyForSeed(
  cms: StoreCmsModuleService,
  logger: { info: (m: string) => void }
): Promise<{
  cat: Record<string, string>
  tag: Record<string, string>
}> {
  const catDefs: {
    slug: string
    title: { vi: string; en: string }

    parent: string | null
  }[] = [
    {
      slug: "tin-noi-bo",
      title: { vi: "Tin nội bộ", en: "Company news" },
      parent: null,
    },
    {
      slug: "san-pham-suc-khoe",
      title: { vi: "Sản phẩm & sức khỏe", en: "Products & wellness" },
      parent: "tin-noi-bo",
    },
    {
      slug: "doanh-nghiep",
      title: { vi: "Doanh nghiệp & quà tặng", en: "Business & gifts" },
      parent: "tin-noi-bo",
    },
  ]
  const tagDefs: { slug: string; title: { vi: string; en: string } }[] = [
    { slug: "saffron", title: { vi: "Saffron", en: "Saffron" } },
    { slug: "my-pham", title: { vi: "Mỹ phẩm", en: "Cosmetics" } },
    { slug: "qua-tang", title: { vi: "Quà tặng", en: "Gifts" } },
  ]

  const cat: Record<string, string> = {}
  for (const d of catDefs) {
    const ex = await cms.listStoreCmsNewsCategories({ slug: d.slug })
    if (ex[0]) {
      cat[d.slug] = ex[0].id
      continue
    }
    const parentId = d.parent ? cat[d.parent] ?? null : null
    const [c] = await cms.createStoreCmsNewsCategories([
      {
        slug: d.slug,
        title_i18n: d.title,
        parent_id: parentId,
      },
    ])
    cat[d.slug] = c.id
  }

  const tag: Record<string, string> = {}
  for (const d of tagDefs) {
    const ex = await cms.listStoreCmsNewsTags({ slug: d.slug })
    if (ex[0]) {
      tag[d.slug] = ex[0].id
      continue
    }
    const [t] = await cms.createStoreCmsNewsTags([
      { slug: d.slug, title_i18n: d.title },
    ])
    tag[d.slug] = t.id
  }

  logger.info("Đã đảm bảo chủ đề & nhãn tin (seed taxonomy).")
  return { cat, tag }
}

async function seedPublishedCmsNews(
  cms: StoreCmsModuleService,
  logger: { info: (m: string) => void }
) {
  type NewsDef = {
    slug: string
    title: { vi: string; en: string }
    excerpt: { vi: string; en: string }
    bodyVi: string
    bodyEn: string
    seo: {
      meta_title: { vi: string; en: string }
      meta_description: { vi: string; en: string }
    }
  }

  const defs: NewsDef[] = [
    {
      slug: "saffron-nguon-goc-va-cach-dung",
      title: {
        vi: "Saffron: nguồn gốc và cách dùng an toàn hàng ngày",
        en: "Saffron: origins and safe everyday use",
      },
      excerpt: {
        vi: "Hiểu nhanh về saffron thật, bảo quản và gợi ý liều dùng trong ẩm thực.",
        en: "A short guide to real saffron, storage, and culinary serving ideas.",
      },
      bodyVi: `<p>Saffron là gia vị quý được thu hoạch từ nhụy hoa nghệ tây. Chọn sợi dài, màu đỏ sẫm và mùi dịu — tránh bột không rõ nguồn.</p><h2>Bảo quản</h2><p>Để nơi khô ráo, tránh ánh sáng; hũ kín giúp giữ hương lâu hơn.</p><h2>Dùng trong bếp</h2><p>Ngâm ấm hoặc nước nóng vừa trước khi cho vào cơm, súp hay sữa — một nhúm nhỏ đã đủ tạo màu và hương.</p>`,
      bodyEn: `<p>Saffron is a prized spice from crocus stigmas. Pick long deep-red threads with a gentle aroma — avoid anonymous powders.</p><h2>Storage</h2><p>Keep dry, away from light; an airtight jar preserves fragrance.</p><h2>In the kitchen</h2><p>Steep in warm liquid before adding to rice, soup, or milk — a small pinch colors and perfumes the dish.</p>`,
      seo: {
        meta_title: {
          vi: "Saffron: nguồn gốc và cách dùng | Tây Á Group",
          en: "Saffron guide | Tay A Group",
        },
        meta_description: {
          vi: "Bài viết ngắn về saffron, bảo quản và dùng trong nấu ăn.",
          en: "Quick read on saffron quality, storage, and cooking tips.",
        },
      },
    },
    {
      slug: "quy-tac-chon-my-pham-an-toan",
      title: {
        vi: "Quy tắc chọn mỹ phẩm an toàn cho da nhạy cảm",
        en: "How to pick safer cosmetics for sensitive skin",
      },
      excerpt: {
        vi: "Vài tiêu chí đơn giản: thành phần, hạn dùng và nguồn nhập hàng rõ ràng.",
        en: "Simple checks: ingredients, dates, and trustworthy sourcing.",
      },
      bodyVi: `<p>Da nhạy cảm cần sản phẩm có bảng thành phần minh bạch. Ưu tiên thương hiệu có kiểm định và hướng dẫn bảo quản rõ ràng.</p><ul><li>Đọc nhãn INCI; tránh hỗn hợp hương liệu nếu dễ kích ứng.</li><li>Thử patch test trước khi dùng rộng.</li></ul>`,
      bodyEn: `<p>Sensitive skin benefits from transparent INCI lists and brands with clear quality controls.</p><ul><li>Scan for fragrance blends if you react easily.</li><li>Patch test before full use.</li></ul>`,
      seo: {
        meta_title: {
          vi: "Chọn mỹ phẩm an toàn | Tây Á Group",
          en: "Safer cosmetics | Tay A Group",
        },
        meta_description: {
          vi: "Gợi ý chọn mỹ phẩm cho da nhạy cảm.",
          en: "Tips for choosing cosmetics when your skin is reactive.",
        },
      },
    },
    {
      slug: "set-qua-doanh-nghiep-xu-huong-2026",
      title: {
        vi: "Set quà doanh nghiệp: xu hướng gọn và cá nhân hoá 2026",
        en: "Corporate gift sets: lean, personalized trends in 2026",
      },
      excerpt: {
        vi: "Gói quà vừa phải, thông điệp rõ, in logo tinh tế — phù hợp hậu tết và sự kiện cả năm.",
        en: "Right-sized kits, clear messaging, subtle branding — works year-round.",
      },
      bodyVi: `<p>Doanh nghiệp đang ưu tiên quà <strong>thực dụng</strong> (ăn uống, chăm sóc) kèm thiệp hoặc QR cảm ơn.</p><p>Cá nhân hoá nhẹ — tên nhóm hoặc segment khách — giúp tăng cảm giác trân trọng mà không tốn quy trình dài.</p>`,
      bodyEn: `<p>Teams favor <strong>useful</strong> gifts—food, wellness—with a note or QR thank-you.</p><p>Light personalization (team name or segment) lifts perceived care without heavy logistics.</p>`,
      seo: {
        meta_title: {
          vi: "Quà doanh nghiệp 2026 | Tây Á Group",
          en: "Corporate gifts 2026 | Tay A Group",
        },
        meta_description: {
          vi: "Xu hướng set quà doanh nghiệp gọn, cá nhân hoá.",
          en: "Trends in compact, personalized corporate gifting.",
        },
      },
    },
  ]

  const tax = await ensureCmsNewsTaxonomyForSeed(cms, logger)

  const articleTax: Record<
    string,
    { cats: string[]; tags: string[] }
  > = {
    "saffron-nguon-goc-va-cach-dung": {
      cats: [tax.cat["san-pham-suc-khoe"]],
      tags: [tax.tag["saffron"]],
    },
    "quy-tac-chon-my-pham-an-toan": {
      cats: [tax.cat["san-pham-suc-khoe"]],
      tags: [tax.tag["my-pham"]],
    },
    "set-qua-doanh-nghiep-xu-huong-2026": {
      cats: [tax.cat["doanh-nghiep"]],
      tags: [tax.tag["qua-tang"]],
    },
  }

  const now = new Date()
  let created = 0
  for (const d of defs) {
    const existing = await cms.listStoreCmsNewsArticles({ slug: d.slug })
    if (existing.length) {
      continue
    }
    const bodyVi = sanitizeCmsPageBody(d.bodyVi) ?? ""
    const bodyEn = sanitizeCmsPageBody(d.bodyEn) ?? ""
    const [article] = await cms.createStoreCmsNewsArticles([
      {
        slug: d.slug,
        title_i18n: d.title,
        excerpt_i18n: d.excerpt,
        body_html_i18n: { vi: bodyVi, en: bodyEn },
        featured_image_file_id: null,
        seo: d.seo,
        status: CMS_NEWS_STATUS.PUBLISHED,
        published_at: now,
      },
    ])
    const tx = articleTax[d.slug]
    if (tx) {
      await replaceNewsArticleCategories(cms, article.id, tx.cats)
      await replaceNewsArticleTags(cms, article.id, tx.tags)
    }
    await appendNewsRevisionWithTaxonomy(
      cms,
      {
        id: article.id,
        slug: article.slug,
        title_i18n: article.title_i18n,
        excerpt_i18n: article.excerpt_i18n,
        body_html_i18n: article.body_html_i18n,
        featured_image_file_id: article.featured_image_file_id ?? null,
        seo: article.seo,
        status: article.status,
        published_at: article.published_at,
      },
      null
    )
    created++
  }
  logger.info(
    `Đã seed ${created} bài tin CMS published (bỏ qua slug đã tồn tại; tổng định nghĩa ${defs.length}).`
  )
}

async function wipeStoreCms(
  cms: StoreCmsModuleService,
  logger: { info: (m: string) => void }
) {
  const slides = await cms.listStoreBannerSlides({}, {})
  if (slides.length) {
    await cms.deleteStoreBannerSlides(slides.map((s) => s.id))
    logger.info(`Đã xóa ${slides.length} banner slide.`)
  }
  const camps = await cms.listStoreBannerCampaigns({}, {})
  if (camps.length) {
    await cms.deleteStoreBannerCampaigns(camps.map((c) => c.id))
    logger.info(`Đã xóa ${camps.length} banner campaign.`)
  }
  const pages = await cms.listStoreCmsPages({}, {})
  if (pages.length) {
    await cms.deleteStoreCmsPages(pages.map((p) => p.id))
    logger.info(`Đã xóa ${pages.length} trang CMS.`)
  }
  const newsArticles = await cms.listStoreCmsNewsArticles({}, {})
  if (newsArticles.length) {
    await cms.deleteStoreCmsNewsArticles(newsArticles.map((a) => a.id))
    logger.info(`Đã xóa ${newsArticles.length} bài tin CMS.`)
  }
  for (let pass = 0; pass < 40; pass++) {
    const cats = await cms.listStoreCmsNewsCategories({})
    if (!cats.length) {
      break
    }
    const leaves = cats.filter(
      (c) => !cats.some((ch) => ch.parent_id === c.id)
    )
    if (!leaves.length) {
      break
    }
    await cms.deleteStoreCmsNewsCategories(leaves.map((c) => c.id))
  }
  const tagsLeft = await cms.listStoreCmsNewsTags({})
  if (tagsLeft.length) {
    await cms.deleteStoreCmsNewsTags(tagsLeft.map((t) => t.id))
    logger.info(`Đã xóa ${tagsLeft.length} nhãn tin CMS.`)
  }
  const revs = await cms.listStoreCmsRevisions({}, {})
  if (revs.length) {
    await cms.deleteStoreCmsRevisions(revs.map((r) => r.id))
    logger.info(`Đã xóa ${revs.length} revision snapshot.`)
  }
  const audits = await cms.listStoreCmsPublicationAudits({}, {})
  if (audits.length) {
    await cms.deleteStoreCmsPublicationAudits(audits.map((a) => a.id))
    logger.info(`Đã xóa ${audits.length} publication audit.`)
  }
}

function assertSalesKitSeedAllowed(logger: { info: (m: string) => void }) {
  const v = process.env.SEED_SALES_KIT_ALLOW?.trim().toLowerCase()
  if (v !== "1" && v !== "true" && v !== "yes") {
    throw new Error(
      "Chưa cho phép seed Sales Kit (thao tác xóa toàn bộ sản phẩm, collection và CMS). " +
        "Đặt SEED_SALES_KIT_ALLOW=1 trong apps/backend/.env hoặc chạy npm run seed:sales-kit:confirm."
    )
  }
  logger.info("SEED_SALES_KIT_ALLOW đã bật — tiến hành reset catalog/CMS.")
}

/**
 * Xóa toàn bộ catalog + CMS store, rồi seed lại theo `docs/WEBTAYA.xlsx` + ảnh trong
 * `docs/.../Sales Kit`, logo `docs/logo.png` (hoặc `docs/logo.jpg`), banner, trang CMS (Tây Á).
 * Product categories: gốc **Tây Á Group** + các nhánh trùng handle/tên collection (phục vụ báo cáo / API category).
 *
 * Bắt buộc: `SEED_SALES_KIT_ALLOW=1` hoặc `npm run seed:sales-kit:confirm` từ `apps/backend`.
 * DB + region: chạy `npm run seed` một lần trước.
 */
export default async function seedSalesKitFromDocs({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as {
    info: (m: string) => void
  }
  assertSalesKitSeedAllowed(logger)
  const repoRoot = repoRootFromScriptsDir()
  const salesKit = resolveSalesKitRoot()
  logger.info(`Sales Kit: ${salesKit}`)

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const salesChannelId = (channels?.[0] as { id: string })?.id
  if (!salesChannelId) {
    throw new Error("Chưa có sales channel — chạy seed.ts trước.")
  }
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })
  const shippingProfileId = (profiles?.[0] as { id: string })?.id
  if (!shippingProfileId) {
    throw new Error("Chưa có shipping profile — chạy seed.ts trước.")
  }

  const fileModule = container.resolve(Modules.FILE) as IFileModuleService
  const cms = container.resolve(STORE_CMS_MODULE) as StoreCmsModuleService

  // Reset toàn bộ catalog (products + categories + collections) rồi seed lại từ docs/
  await wipeCartsAndReservations(container, logger)
  await wipeAllProducts(container, logger)
  await wipeAllProductCategories(container, logger)
  await wipeAllCollections(container, logger)
  await wipeStoreCms(cms, logger)

  await seedCatalogWebtayaFromXlsx(
    container,
    repoRoot,
    salesKit,
    salesChannelId,
    shippingProfileId,
    fileModule,
    logger
  )

  const storeModule = container.resolve(Modules.STORE)
  const [storeRow] = await storeModule.listStores()
  const stockLocId = storeRow?.default_location_id
  if (stockLocId) {
    const { data: inventoryItems } = await query.graph({
      entity: "inventory_item",
      fields: ["id"],
    })
    const { data: existingLevels } = await query.graph({
      entity: "inventory_level",
      fields: ["id", "inventory_item_id", "location_id"],
      filters: { location_id: stockLocId },
    })
    const levelIdByItem = new Map<string, string>()
    for (const row of existingLevels ?? []) {
      const r = row as {
        id: string
        inventory_item_id: string
        location_id: string
      }
      if (r.location_id === stockLocId && r.inventory_item_id) {
        levelIdByItem.set(r.inventory_item_id, r.id)
      }
    }
    const toCreate: CreateInventoryLevelInput[] = []
    const toUpdate: UpdateInventoryLevelInput[] = []
    for (const row of inventoryItems ?? []) {
      const itemId = (row as { id: string }).id
      if (!itemId) {
        continue
      }
      const existingLevelId = levelIdByItem.get(itemId)
      if (existingLevelId) {
        toUpdate.push({
          id: existingLevelId,
          inventory_item_id: itemId,
          location_id: stockLocId,
          stocked_quantity: 1_000_000,
        })
      } else {
        toCreate.push({
          location_id: stockLocId,
          stocked_quantity: 1_000_000,
          inventory_item_id: itemId,
        })
      }
    }
    if (toCreate.length) {
      await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: toCreate },
      })
    }
    if (toUpdate.length) {
      await updateInventoryLevelsWorkflow(container).run({
        input: { updates: toUpdate },
      })
    }
    if (toCreate.length || toUpdate.length) {
      logger.info(
        `Tồn kho kho mặc định: tạo ${toCreate.length}, cập nhật ${toUpdate.length} dòng.`
      )
    }
  }

  const navTree = validateAndNormalizeNavTree({
    version: 1,
    items: [
      {
        id: "nav-news",
        label: { vi: "Tin tức", en: "News" },
        children: [
          {
            type: "link",
            url: "/news",
            label: { vi: "Tin tức", en: "News" },
          },
        ],
      },
      {
        id: "nav-saffron",
        label: { vi: "Saffron", en: "Saffron" },
        children: [{ type: "collection", handle: "saffron" }],
      },
      {
        id: "nav-mypham",
        label: { vi: "Mỹ phẩm", en: "Cosmetics" },
        children: [{ type: "collection", handle: "my-pham" }],
      },
      {
        id: "nav-corporate",
        label: { vi: "Quà doanh nghiệp", en: "Corporate gifts" },
        children: [{ type: "collection", handle: "qua-doanh-nghiep" }],
      },
      {
        id: "nav-custom",
        label: { vi: "Quà theo nhu cầu", en: "Custom gifts" },
        children: [{ type: "collection", handle: "qua-theo-nhu-cau" }],
      },
      {
        id: "nav-farm",
        label: { vi: "Nông sản Việt", en: "Vietnamese produce" },
        children: [{ type: "collection", handle: "nong-san-viet" }],
      },
    ],
  })

  let logoId: string | null = null
  const logoPng = path.join(repoRoot, "docs", "logo.png")
  const logoJpg = path.join(repoRoot, "docs", "logo.jpg")
  const logoPath = fs.existsSync(logoPng)
    ? logoPng
    : fs.existsSync(logoJpg)
      ? logoJpg
      : null
  if (logoPath) {
    try {
      const f = await uploadLogoForCms(fileModule, logoPath, repoRoot)
      logoId = f.id
    } catch {
      logoId = null
    }
  }

  const curSettings = await cms.getOrCreateSettings()
  await cms.updateCmsSettings([
    {
      id: CMS_SETTINGS_ID,
      default_locale: curSettings.default_locale,
      enabled_locales: curSettings.enabled_locales,
      logo_file_id: logoId ?? curSettings.logo_file_id,
      site_title: "Tây Á",
      nav_tree: navTree as unknown as Record<string, unknown>,
      site_title_i18n: {
        vi: "Tây Á",
        en: "Tay A",
      },
      tagline_i18n: {
        vi: "Quà tặng & thương mại — sang trọng, tinh tế",
        en: "Premium gifts & commerce — refined selection aligned with our catalog.",
      },
      seo_defaults: {
        meta_title: {
          vi: "Tây Á | Quà tặng cao cấp · Saffron · Mỹ phẩm",
          en: "Tay A | Premium gifts · Saffron · Cosmetics",
        },
        meta_description: {
          vi: "Tây Á — quà tặng doanh nghiệp và sản phẩm cao cấp. Giao hàng toàn quốc.",
          en: "Tay A — corporate and premium gifting. Nationwide delivery.",
        },
      },
      og_image_file_id: logoId ?? curSettings.og_image_file_id ?? null,
      footer_contact: {
        social: [
          {
            url: "https://www.facebook.com",
            label: { vi: "Facebook", en: "Facebook" },
          },
          {
            url: "https://zalo.me",
            label: { vi: "Zalo", en: "Zalo" },
          },
        ],
      },
      announcement: {
        enabled: true,
        text: {
          vi: "Tây Á — quà tặng & thương mại · Giao hàng toàn quốc.",
          en: "Tay A — gifts & commerce · Nationwide delivery.",
        },
        link_url: null,
        starts_at: null,
        ends_at: null,
      },
      not_found: {
        title: {
          vi: "Không tìm thấy trang",
          en: "Page not found",
        },
        body: {
          vi: "Liên kết có thể đã thay đổi. Vui lòng về trang chủ hoặc mục Quà tặng.",
          en: "This link may have moved. Try the homepage or gift collections.",
        },
      },
    } as never,
  ])

  await seedPublishedCmsPages(cms, logger)
  await seedPublishedCmsNews(cms, logger)

  const bannerDefs: {
    rel: string[]
    title: { vi: string; en: string }
    subtitle: { vi: string; en: string }
    cta: { vi: string; en: string }
    target: string
  }[] = [
    {
      rel: ["1. Saffron", "Ảnh đẹp", "Saffron sợi + Pack"],
      title: { vi: "Saffron chuẩn Sales Kit", en: "Premium saffron line" },
      subtitle: {
        vi: "Set mật ong, sợi pack — hình thật từ kit.",
        en: "Honey infusions & thread packs from the kit.",
      },
      cta: { vi: "Xem Saffron", en: "Shop saffron" },
      target: "/collections/saffron",
    },
    {
      rel: ["11. Chiến dịch 8.3.2025", "Ảnh đẹp set quà"],
      title: { vi: "Set quà 8/3", en: "International Women's Day sets" },
      subtitle: {
        vi: "Combo quà tặng — ảnh chụp từ chiến dịch 8.3.",
        en: "Gift sets from the 8 March campaign folder.",
      },
      cta: { vi: "Quà theo nhu cầu", en: "Custom gifts" },
      target: "/collections/qua-theo-nhu-cau",
    },
    {
      rel: ["2. Mỹ phẩm Bs Cosmetics", "2.10. Kem chống nắng", "Ảnh đẹp"],
      title: { vi: "Bs Cosmetics — Kem chống nắng", en: "Bs Cosmetics SPF" },
      subtitle: {
        vi: "Routine chống nắng trong Sales Kit mỹ phẩm.",
        en: "Sun care assets from the cosmetics kit.",
      },
      cta: { vi: "Mỹ phẩm", en: "Cosmetics" },
      target: "/collections/my-pham",
    },
  ]

  let order = 0
  for (const b of bannerDefs) {
    const abs = firstImageUnderSegments(salesKit, b.rel)
    if (!abs) {
      logger.info(`Bỏ qua banner (không có ảnh): ${b.title.vi}`)
      continue
    }
    const up = await uploadLocalImage(fileModule, abs)
    const image_urls = await generateBannerDerivatives(
      container,
      up.id,
      `seed-banner-${order}`
    )
    await cms.createStoreBannerSlides([
      {
        image_file_id: up.id,
        image_urls,
        title: { vi: b.title.vi, en: b.title.en, ja: "" },
        subtitle: { vi: b.subtitle.vi, en: b.subtitle.en, ja: "" },
        cta_label: { vi: b.cta.vi, en: b.cta.en, ja: "" },
        target_url: b.target,
        sort_order: order++,
        is_active: true,
        publication_status: BANNER_PUBLICATION.PUBLISHED,
        campaign_id: null,
        variant_label: null,
        display_start_at: null,
        display_end_at: null,
      },
    ])
  }

  logger.info(`Đã tạo ${order} banner published.`)
  await revalidateStorefrontCms("cms")
  await revalidateStorefrontCms("cms-nav")
  await revalidateStorefrontCms("cms-pages")
  await revalidateStorefrontCms("cms-news")
  logger.info("seed-sales-kit hoàn tất.")
}
