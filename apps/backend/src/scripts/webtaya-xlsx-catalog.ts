import * as fs from "node:fs"
import * as XLSX from "xlsx"

/** Chuẩn hoá handle giống seed-sales-kit. */
export function slugify(raw: string): string {
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

export type WebtayaProductLine = { title: string; handle: string }

export type WebtayaCollectionPlan = {
  collectionTitle: string
  collectionHandle: string
  products: WebtayaProductLine[]
}

function normalizeDetailLines(a: unknown, b: unknown): string[] {
  const raw = `${a ?? ""}\n${b ?? ""}`.split(/\r?\n/)
  const out: string[] = []
  for (let line of raw) {
    line = line.trim()
    if (!line) {
      continue
    }
    line = line.replace(/^\d+\.?\s*/u, "").trim()
    if (!line || /^\d+$/.test(line)) {
      continue
    }
    if (!out.includes(line)) {
      out.push(line)
    }
  }
  return out
}

function productHandle(collectionHandle: string, productTitle: string): string {
  const pt = slugify(productTitle)
  if (pt === collectionHandle) {
    return collectionHandle
  }
  return `${collectionHandle}-${pt}`.slice(0, 120)
}

/**
 * Đọc `docs/WEBTAYA.xlsx` (cột "Sản phẩm" + khối mô tả).
 * Mỗi dòng = một collection; các dòng con trong ô = từng SKU hiển thị trên web.
 */
export function loadWebtayaPlanFromXlsx(absPath: string): WebtayaCollectionPlan[] {
  if (!fs.existsSync(absPath)) {
    throw new Error(`Không tìm thấy WEBTAYA.xlsx tại ${absPath}`)
  }
  const wb = XLSX.readFile(absPath)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) {
    throw new Error("WEBTAYA.xlsx: không có sheet")
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  })
  const plans: WebtayaCollectionPlan[] = []
  for (const row of rows) {
    const collectionTitle = String(row["Sản phẩm"] ?? "").trim()
    if (!collectionTitle) {
      continue
    }
    const collectionHandle = slugify(collectionTitle)
    const lines = normalizeDetailLines(row["__EMPTY"], row["__EMPTY_1"])
    const productTitles = lines.length ? lines : [collectionTitle]
    const products: WebtayaProductLine[] = productTitles.map((title) => ({
      title,
      handle: productHandle(collectionHandle, title),
    }))
    plans.push({ collectionTitle, collectionHandle, products })
  }
  return plans
}

/**
 * Đường dẫn con trong thư mục Sales Kit (ảnh lấy từ đây).
 * Key = product `handle` duy nhất toàn catalog.
 */
export function kitSegmentsForProductHandle(handle: string): string[] | null {
  const M: Record<string, string[]> = {
    saffron: ["1. Saffron", "Ảnh đẹp", "Saffron sợi + Pack"],
    "my-pham-kem-chong-nang": [
      "2. Mỹ phẩm Bs Cosmetics",
      "2.10. Kem chống nắng",
      "Ảnh đẹp",
    ],
    "my-pham-serum-b5": [
      "2. Mỹ phẩm Bs Cosmetics",
      "2.4. Serum B5",
      "Ảnh đẹp",
    ],
    "my-pham-bot-rua-mat": [
      "2. Mỹ phẩm Bs Cosmetics",
      "2.2. Bột rửa mặt",
      "Ảnh đẹp",
    ],
    "my-pham-mash": [
      "2. Mỹ phẩm Bs Cosmetics",
      "2.6. Son dưỡng",
      "Ảnh đẹp",
    ],
    "my-pham-xit-khoang-3in1": [
      "2. Mỹ phẩm Bs Cosmetics",
      "2.3. Xịt khoáng",
      "Ảnh",
    ],
    "qua-doanh-nghiep-qua-trung-thu": [
      "5. Chiến dịch Ngày của mẹ 2025",
      "Set quà",
    ],
    "qua-doanh-nghiep-qua-tet": ["10. Chiến dịch Tết 2025"],
    "qua-doanh-nghiep-hop-qua-2-banh": ["10. Chiến dịch Tết 2025", "Hà Nội"],
    "qua-doanh-nghiep-hop-qua-4-banh": ["10. Chiến dịch Tết 2025", "Hồ Chí Minh"],
    "qua-doanh-nghiep-hop-qua-6-banh": ["10. Chiến dịch Tết 2025", "Hà Nội"],
    "qua-doanh-nghiep-gia-cong-banh-trung-thu": [
      "10. Chiến dịch Tết 2025",
      "Hà Nội",
    ],
    "qua-theo-nhu-cau-ngan-sach-duoi-500k": [
      "11. Chiến dịch 8.3.2025",
      "Ảnh đẹp set quà",
    ],
    "qua-theo-nhu-cau-ngan-sach-500-1000": [
      "9. Chiến dịch 20-11-2024",
      "Ảnh set quà",
    ],
    "qua-theo-nhu-cau-ngan-sach-tu-1000-tro-len": [
      "8. Chiến dịch 20-10 Phụ Nữ Việt Nam",
      "Ảnh set quà",
    ],
    "nong-san-viet-mat-ong-rung": [
      "1. Saffron",
      "Ảnh đẹp",
      "Saffron mật ong",
    ],
  }
  if (M[handle]) {
    return M[handle]
  }
  if (handle.startsWith("nong-san-viet-")) {
    return ["__POSTER_INDEX__"]
  }
  return null
}

/** Thứ tự poster khớp Excel (bỏ mật ong — map riêng). */
export const NONG_SAN_POSTER_ORDER = [
  "hat-dieu",
  "hat-macca",
  "dua-say",
  "xoai-say-deo",
  "mit-say",
  "du-du-say-deo",
] as const
