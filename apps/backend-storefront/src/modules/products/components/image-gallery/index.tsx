"use client"

import { normalizeMedusaAssetUrl } from "@lib/util/cms-assets"
import { HttpTypes } from "@medusajs/types"
import { ChevronLeft, ChevronRight, XMark, MagnifyingGlass } from "@medusajs/icons"
import { Container, clx } from "@medusajs/ui"
import { Dialog, Transition } from "@headlessui/react"
import Image from "next/image"
import { Fragment, useEffect, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const validImages = images.filter(
    (image): image is HttpTypes.StoreProductImage & { url: string } =>
      !!image.url
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%")

  const handleZoomMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomOrigin(`${x}% ${y}%`)
  }

  const index = Math.min(activeIndex, Math.max(validImages.length - 1, 0))

  const goTo = (next: number) => {
    if (validImages.length === 0) {
      return
    }
    setActiveIndex(
      ((next % validImages.length) + validImages.length) % validImages.length
    )
  }

  useEffect(() => {
    if (!isLightboxOpen) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goTo(index - 1)
      } else if (e.key === "ArrowRight") {
        goTo(index + 1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, index])

  if (validImages.length === 0) {
    return null
  }

  const active = validImages[index]

  return (
    <div className="flex flex-col w-full gap-y-3">
      <Container className="relative aspect-square w-full overflow-hidden bg-ui-bg-subtle">
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleZoomMove}
          aria-label="Xem ảnh lớn"
          className="absolute inset-0 cursor-zoom-in overflow-hidden"
        >
          <Image
            src={normalizeMedusaAssetUrl(active.url) || active.url}
            priority
            className={clx(
              "absolute inset-0 rounded-rounded transition-transform duration-200 ease-standard motion-reduce:!scale-100",
              isZooming && "small:scale-[2.2]"
            )}
            alt={`Ảnh sản phẩm ${index + 1}`}
            fill
            sizes="(max-width: 576px) 480px, (max-width: 768px) 600px, (max-width: 992px) 640px, 720px"
            style={{
              objectFit: "cover",
              transformOrigin: zoomOrigin,
            }}
          />
        </button>
        <div className="absolute bottom-2 left-2 flex items-center justify-center w-8 h-8 rounded-full bg-black/50 text-white pointer-events-none">
          <MagnifyingGlass />
        </div>
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
                "relative shrink-0 w-14 h-14 small:w-16 small:h-16 overflow-hidden rounded-rounded border-2 bg-ui-bg-subtle",
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
                sizes="64px"
                style={{
                  objectFit: "cover",
                }}
              />
            </button>
          ))}
        </div>
      )}

      <Transition appear show={isLightboxOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[100]"
          onClose={() => setIsLightboxOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90" />
          </Transition.Child>

          <div className="fixed inset-0 flex flex-col">
            <div className="flex justify-end p-4">
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setIsLightboxOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <XMark />
              </button>
            </div>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative flex-1 flex items-center justify-center px-4 pb-4 min-h-0">
                <div className="relative w-full h-full max-w-4xl">
                  <Image
                    src={normalizeMedusaAssetUrl(active.url) || active.url}
                    alt={`Ảnh sản phẩm ${index + 1}`}
                    fill
                    sizes="90vw"
                    style={{
                      objectFit: "contain",
                    }}
                  />
                </div>

                {validImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Ảnh trước"
                      onClick={() => goTo(index - 1)}
                      className="absolute left-2 small:left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      type="button"
                      aria-label="Ảnh sau"
                      onClick={() => goTo(index + 1)}
                      className="absolute right-2 small:right-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <ChevronRight />
                    </button>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>

            {validImages.length > 1 && (
              <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar px-4 pb-6">
                {validImages.map((image, thumbIndex) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => goTo(thumbIndex)}
                    aria-label={`Xem ảnh ${thumbIndex + 1}`}
                    aria-current={thumbIndex === index}
                    className={clx(
                      "relative shrink-0 w-14 h-14 overflow-hidden rounded-rounded border-2",
                      thumbIndex === index
                        ? "border-white"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={normalizeMedusaAssetUrl(image.url) || image.url}
                      className="absolute inset-0"
                      alt={`Ảnh nhỏ ${thumbIndex + 1}`}
                      fill
                      sizes="56px"
                      style={{
                        objectFit: "cover",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default ImageGallery
