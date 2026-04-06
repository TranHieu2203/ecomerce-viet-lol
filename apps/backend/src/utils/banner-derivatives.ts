import type { IFileModuleService } from "@medusajs/types"
import sharp from "sharp"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

const MOBILE_W = 430
const DESKTOP_W = 1280
const MAX_ORIGINAL_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export type ImageUrls = { mobile: string; desktop: string }

export async function assertBannerImageFile(
  fileModule: IFileModuleService,
  fileId: string
) {
  const meta = await fileModule.retrieveFile(fileId)
  const ext = meta as { size?: number; mime_type?: string }
  if (typeof ext.size === "number" && ext.size > MAX_ORIGINAL_BYTES) {
    throw new Error("Image exceeds 10MB limit")
  }
  const mime = ext.mime_type ?? ""
  if (mime && !ALLOWED_MIME.has(mime)) {
    throw new Error(`MIME type not allowed for banner: ${mime}`)
  }
  return meta
}

async function resizeWebp(buf: Buffer, width: number): Promise<Buffer> {
  return sharp(buf)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
}

/**
 * Reads original from file module, uploads two WebP derivatives, returns public URLs.
 */
export async function generateBannerDerivatives(
  container: {
    resolve: (k: string) => IFileModuleService | unknown
  },
  imageFileId: string,
  basename: string
): Promise<ImageUrls> {
  const fileModule = container.resolve(
    Modules.FILE
  ) as IFileModuleService
  await assertBannerImageFile(fileModule, imageFileId)
  const buf = await fileModule.getAsBuffer(imageFileId)

  const mobileBuf = await resizeWebp(buf, MOBILE_W)
  const desktopBuf = await resizeWebp(buf, DESKTOP_W)

  const mobile = await fileModule.createFiles({
    filename: `${basename}-w${MOBILE_W}.webp`,
    mimeType: "image/webp",
    content: mobileBuf.toString("base64"),
  })
  const desktop = await fileModule.createFiles({
    filename: `${basename}-w${DESKTOP_W}.webp`,
    mimeType: "image/webp",
    content: desktopBuf.toString("base64"),
  })

  return {
    mobile: mobile.url,
    desktop: desktop.url,
  }
}

/** Resolve logger from scope when available */
export function logDerivativeSize(scope: {
  resolve: (k: string) => unknown
}, label: string, bytes: number) {
  try {
    const logger = scope.resolve(ContainerRegistrationKeys.LOGGER) as {
      info: (m: string) => void
    }
    logger.info(`[banner-derivatives] ${label} size_bytes=${bytes}`)
  } catch {
    // ignore
  }
}
