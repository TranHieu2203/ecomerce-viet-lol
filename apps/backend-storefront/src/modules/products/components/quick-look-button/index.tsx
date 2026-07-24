"use client"

import { listProducts } from "@lib/data/products"
import { useStorefrontMessages } from "@lib/i18n/storefront-i18n-provider"
import { normalizeMedusaAssetUrl } from "@lib/util/cms-assets"
import { displayProduct } from "@lib/util/i18n-catalog"
import { Eye, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Dialog, Transition } from "@headlessui/react"
import ProductActions from "@modules/products/components/product-actions"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Fragment, useState } from "react"

type Props = {
  handle: string
  region: HttpTypes.StoreRegion
}

export default function QuickLookButton({ handle, region }: Props) {
  const m = useStorefrontMessages().product
  const countryCode = useParams().countryCode as string

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<HttpTypes.StoreProduct | null>(null)

  const openQuickLook = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
    if (!product) {
      setLoading(true)
      listProducts({
        countryCode,
        queryParams: { handle },
      })
        .then(({ response }) => {
          setProduct(response.products[0] ?? null)
        })
        .finally(() => setLoading(false))
    }
  }

  const close = () => setIsOpen(false)

  const displayTitle = product
    ? displayProduct(
        countryCode,
        product.title,
        product.description,
        product.metadata as Record<string, unknown> | null | undefined
      ).title
    : ""

  return (
    <>
      <button
        type="button"
        onClick={openQuickLook}
        aria-label={m.quickLook}
        className="hidden small:flex absolute inset-x-3 bottom-3 items-center justify-center gap-2 h-10 rounded-full bg-white/95 text-ui-fg-base text-small-semi opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-180 ease-standard motion-reduce:transition-none shadow-elevation-card-hover focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
      >
        <Eye />
        {m.quickLook}
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[75]" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-2xl bg-white rounded-large shadow-xl p-6">
                  <button
                    type="button"
                    onClick={close}
                    aria-label={m.quickLookClose}
                    className="absolute right-4 top-4 flex items-center justify-center w-9 h-9 rounded-rounded hover:bg-ui-bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
                  >
                    <XMark />
                  </button>

                  {loading || !product ? (
                    <div className="grid grid-cols-1 small:grid-cols-2 gap-6 min-h-[320px]">
                      <div className="aspect-square rounded-rounded bg-ui-bg-subtle animate-pulse" />
                      <div className="flex flex-col gap-3 pt-2">
                        <div className="h-6 w-3/4 rounded bg-ui-bg-subtle animate-pulse" />
                        <div className="h-5 w-1/3 rounded bg-ui-bg-subtle animate-pulse" />
                        <div className="h-10 w-full rounded bg-ui-bg-subtle animate-pulse mt-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 small:grid-cols-2 gap-6">
                      <div className="relative aspect-square rounded-rounded overflow-hidden bg-ui-bg-subtle">
                        {product.thumbnail ? (
                          <Image
                            src={
                              normalizeMedusaAssetUrl(product.thumbnail) ||
                              product.thumbnail
                            }
                            alt={displayTitle}
                            fill
                            sizes="(max-width: 1023px) 90vw, 400px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-y-3">
                        <Dialog.Title className="text-xl-semi text-ui-fg-base pr-8">
                          {displayTitle}
                        </Dialog.Title>
                        <ProductActions product={product} region={region} />
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
