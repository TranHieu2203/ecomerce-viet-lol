import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

type I18nBlock = {
  vi?: { title?: string; subtitle?: string; description?: string }
  en?: { title?: string; subtitle?: string; description?: string }
}

const CatalogI18nProductWidget = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<Record<string, unknown>>({})
  const [viTitle, setViTitle] = useState("")
  const [viDesc, setViDesc] = useState("")
  const [enTitle, setEnTitle] = useState("")
  const [enDesc, setEnDesc] = useState("")

  useEffect(() => {
    if (!id) {
      return
    }
    void (async () => {
      try {
        const res = await fetch(`/admin/products/${id}`, { credentials: "include" })
        const json = (await res.json()) as { product?: { metadata?: Record<string, unknown> } }
        const m = json.product?.metadata ?? {}
        setMeta(m)
        const i18n = m.i18n as I18nBlock | undefined
        setViTitle(i18n?.vi?.title ?? "")
        setViDesc(i18n?.vi?.description ?? "")
        setEnTitle(i18n?.en?.title ?? "")
        setEnDesc(i18n?.en?.description ?? "")
      } catch {
        toast.error("Cannot load product")
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const save = async () => {
    if (!id) {
      return
    }
    const i18n: I18nBlock = {
      vi: { title: viTitle, description: viDesc },
      en: { title: enTitle, description: enDesc },
    }
    try {
      const res = await fetch(`/admin/products/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          metadata: { ...meta, i18n },
        }),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      toast.success("Đã lưu metadata i18n (không đổi title/handle gốc)")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  if (!id || loading) {
    return null
  }

  return (
    <Container className="divide-y border-t mt-6 pt-6 flex flex-col gap-4">
      <Heading level="h2">Song ngữ (metadata.i18n)</Heading>
      <Text size="small" className="text-ui-fg-muted">
        Tab logic: VI bắt buộc đầy đủ hơn EN; storefront fallback về vi.
      </Text>
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <Text weight="plus">Tiếng Việt</Text>
          <div>
            <Label>Title (hiển thị)</Label>
            <Input value={viTitle} onChange={(e) => setViTitle(e.target.value)} />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Input value={viDesc} onChange={(e) => setViDesc(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Text weight="plus">English</Text>
          <div>
            <Label>Title</Label>
            <Input value={enTitle} onChange={(e) => setEnTitle(e.target.value)} />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={enDesc} onChange={(e) => setEnDesc(e.target.value)} />
          </div>
        </div>
      </div>
      <Button onClick={() => void save()}>Lưu i18n</Button>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "product.details.after" })

export default CatalogI18nProductWidget
