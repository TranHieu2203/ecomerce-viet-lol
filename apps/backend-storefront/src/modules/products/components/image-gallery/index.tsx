"use client"

import { normalizeMedusaAssetUrl } from "@lib/util/cms-assets"
import { HttpTypes } from "@medusajs/types"
import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const validImages = images.filter(
    (image): image is HttpTypes.StoreProductImage & { url: string } =>
      !!image.url
  )
  const [activeIndex, setActiveIndex] = useState(0)

  if (validImages.length === 0) {
    return null
  }

  const index = Math.min(activeIndex, validImages.length - 1)
  const active = validImages[index]

  const goTo = (next: number) => {
    setActiveIndex(
      ((next % validImages.length) + validImages.length) % validImages.length
    )
  }

  return (
    <div className="flex flex-col w-full gap-y-3">
      <Container className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle">
        <Image
          src={normalizeMedusaAssetUrl(active.url) || active.url}
          priority
          className="absolute inset-0 rounded-rounded"
          alt={`Ảnh sản phẩm ${index + 1}`}
          fill
          sizes="(max-width: 576px) 480px, (max-width: 768px) 600px, (max-width: 992px) 640px, 720px"
          style={{
            objectFit: "cover",
          }}
        />
        {validImages.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={() => goTo(index - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 text-ui-fg-base hover:bg-white shadow-elevation-card-rest focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              aria-label="Ảnh sau"
              onClick={() => goTo(index + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 text-ui-fg-base hover:bg-white shadow-elevation-card-rest focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
            >
              <ChevronRight />
            </button>
            <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xsmall-regular text-white">
              {index + 1}/{validImages.length}
            </div>
          </>
        )}
      </Container>

      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {validImages.map((image, thumbIndex) => (
            <button
              key={image.id}
              type="button"
              onClick={() => goTo(thumbIndex)}
              aria-label={`Xem ảnh ${thumbIndex + 1}`}
              aria-current={thumbIndex === index}
              className={clx(
                "relative shrink-0 w-16 h-16 small:w-20 small:h-20 overflow-hidden rounded-rounded border-2 bg-ui-bg-subtle",
                thumbIndex === index
                  ? "border-ui-fg-interactive"
                  : "border-transparent hover:border-ui-border-strong"
              )}
            >
              <Image
                src={normalizeMedusaAssetUrl(image.url) || image.url}
                className="absolute inset-0"
                alt={`Ảnh nhỏ ${thumbIndex + 1}`}
                fill
                sizes="80px"
                style={{
                  objectFit: "cover",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
