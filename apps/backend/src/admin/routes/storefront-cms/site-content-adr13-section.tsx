import { Button, Heading, Input, Label, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { adminFetch } from "./admin-fetch"
import { MediaPickerField } from "./media-picker-field"

type SocialRow = { url: string; label_vi: string; label_en: string }

const emptySocial = (): SocialRow[] => [
  { url: "", label_vi: "", label_en: "" },
  { url: "", label_vi: "", label_en: "" },
  { url: "", label_vi: "", label_en: "" },
]

type Props = {
  settings: Record<string, unknown> | null
  onReload: () => Promise<void>
}

/**
 * Story 9.3 — ADR-13: SEO mặc định, OG, footer/MXH, announcement, 404.
 */
export function SiteContentAdr13Section({ settings, onReload }: Props) {
  const [seoMtVi, setSeoMtVi] = useState("")
  const [seoMtEn, setSeoMtEn] = useState("")
  const [seoMdVi, setSeoMdVi] = useState("")
  const [seoMdEn, setSeoMdEn] = useState("")
  const [ogFileId, setOgFileId] = useState("")
  const [hotline, setHotline] = useState("")
  const [email, setEmail] = useState("")
  const [socialRows, setSocialRows] = useState<SocialRow[]>(emptySocial)
  const [annEnabled, setAnnEnabled] = useState(false)
  const [annVi, setAnnVi] = useState("")
  const [annEn, setAnnEn] = useState("")
  const [annLink, setAnnLink] = useState("")
  const [annStart, setAnnStart] = useState("")
  const [annEnd, setAnnEnd] = useState("")
  const [nfTitleVi, setNfTitleVi] = useState("")
  const [nfTitleEn, setNfTitleEn] = useState("")
  const [nfBodyVi, setNfBodyVi] = useState("")
  const [nfBodyEn, setNfBodyEn] = useState("")
  const [saving, setSaving] = useState(false)

  const hydrate = useCallback((s: Record<string, unknown> | null) => {
    if (!s) {
      return
    }
    const sd = s.seo_defaults as Record<string, unknown> | undefined
    const mt = sd?.meta_title as Record<string, string> | undefined
    const md = sd?.meta_description as Record<string, string> | undefined
    setSeoMtVi(mt?.vi ?? "")
    setSeoMtEn(mt?.en ?? "")
    setSeoMdVi(md?.vi ?? "")
    setSeoMdEn(md?.en ?? "")
    setOgFileId(
      typeof s.og_image_file_id === "string" ? s.og_image_file_id : ""
    )
    const fc = s.footer_contact as Record<string, unknown> | undefined
    setHotline(typeof fc?.hotline === "string" ? fc.hotline : "")
    setEmail(typeof fc?.email === "string" ? fc.email : "")
    const soc = Array.isArray(fc?.social) ? fc?.social : []
    const nextSoc = emptySocial()
    soc.slice(0, 3).forEach((item, i) => {
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>
        nextSoc[i] = {
          url: typeof o.url === "string" ? o.url : "",
          label_vi:
            typeof o.label === "object" && o.label
              ? String((o.label as Record<string, string>).vi ?? "")
              : "",
          label_en:
            typeof o.label === "object" && o.label
              ? String((o.label as Record<string, string>).en ?? "")
              : "",
        }
      }
    })
    setSocialRows(nextSoc)
    const an = s.announcement as Record<string, unknown> | undefined
    setAnnEnabled(Boolean(an?.enabled))
    const tx = an?.text as Record<string, string> | undefined
    setAnnVi(tx?.vi ?? "")
    setAnnEn(tx?.en ?? "")
    setAnnLink(typeof an?.link_url === "string" ? an.link_url : "")
    setAnnStart(typeof an?.starts_at === "string" ? an.starts_at : "")
    setAnnEnd(typeof an?.ends_at === "string" ? an.ends_at : "")
    const nf = s.not_found as Record<string, unknown> | undefined
    const nft = nf?.title as Record<string, string> | undefined
    const nfb = nf?.body as Record<string, string> | undefined
    setNfTitleVi(nft?.vi ?? "")
    setNfTitleEn(nft?.en ?? "")
    setNfBodyVi(nfb?.vi ?? "")
    setNfBodyEn(nfb?.en ?? "")
  }, [])

  useEffect(() => {
    hydrate(settings)
  }, [settings, hydrate])

  const save = async () => {
    setSaving(true)
    try {
      const social = socialRows
        .filter((r) => r.url.trim().length > 0)
        .map((r) => {
          const url = r.url.trim()
          const hasLabel = r.label_vi.trim() || r.label_en.trim()
          return hasLabel
            ? {
                url,
                label: { vi: r.label_vi.trim(), en: r.label_en.trim() },
              }
            : { url }
        })
      await adminFetch("/admin/custom/cms-settings", {
        method: "PATCH",
        body: JSON.stringify({
          seo_defaults: {
            meta_title: { vi: seoMtVi.trim(), en: seoMtEn.trim() },
            meta_description: { vi: seoMdVi.trim(), en: seoMdEn.trim() },
          },
          og_image_file_id: ogFileId.trim() || null,
          footer_contact: {
            hotline: hotline.trim() || undefined,
            email: email.trim() || undefined,
            social: social.length ? social : undefined,
          },
          announcement: {
            enabled: annEnabled,
            text: { vi: annVi, en: annEn },
            link_url: annLink.trim() || null,
            starts_at: annStart.trim() || null,
            ends_at: annEnd.trim() || null,
          },
          not_found: {
            title: { vi: nfTitleVi, en: nfTitleEn },
            body: { vi: nfBodyVi, en: nfBodyEn },
          },
        }),
      })
      toast.success("Đã lưu SEO & nội dung site")
      await onReload()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lưu thất bại")
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return null
  }

  return (
    <section className="pt-8 flex flex-col gap-6 border-t border-ui-border-base">
      <div>
        <Heading level="h2">SEO &amp; nội dung site (ADR-13)</Heading>
        <Text size="small" className="text-ui-fg-muted mt-1 max-w-2xl">
          Meta mặc định cho storefront, ảnh OG, thông tin chân trang / MXH,
          thanh thông báo và trang 404. Lỗi validation hiển thị bằng tiếng Việt.
        </Text>
      </div>

      <div className="grid max-w-2xl gap-4 border border-ui-border-base rounded-md p-4">
        <Text weight="plus">SEO mặc định</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Meta title (vi)</Label>
            <Input value={seoMtVi} onChange={(e) => setSeoMtVi(e.target.value)} />
          </div>
          <div>
            <Label>Meta title (en)</Label>
            <Input value={seoMtEn} onChange={(e) => setSeoMtEn(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Meta description (vi)</Label>
            <Textarea
              rows={2}
              value={seoMdVi}
              onChange={(e) => setSeoMdVi(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Meta description (en)</Label>
            <Textarea
              rows={2}
              value={seoMdEn}
              onChange={(e) => setSeoMdEn(e.target.value)}
            />
          </div>
        </div>
        <MediaPickerField
          htmlId="cms-og-image-file-id"
          label="OG image — file id"
          value={ogFileId}
          onValueChange={setOgFileId}
        />
      </div>

      <div className="grid max-w-2xl gap-4 border border-ui-border-base rounded-md p-4">
        <Text weight="plus">Chân trang / liên hệ / MXH</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Hotline</Label>
            <Input value={hotline} onChange={(e) => setHotline(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <Text size="small" className="text-ui-fg-muted">
          Tối đa 3 liên kết MXH (URL bắt buộc; nhãn hiển thị tùy chọn song ngữ).
        </Text>
        {socialRows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-2 border border-dashed border-ui-border-base rounded p-2"
          >
            <Label>MXH #{i + 1}</Label>
            <Input
              placeholder="https://..."
              className="font-mono text-sm"
              value={row.url}
              onChange={(e) => {
                const v = e.target.value
                setSocialRows((rows) =>
                  rows.map((r, j) => (j === i ? { ...r, url: v } : r))
                )
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Nhãn (vi)"
                value={row.label_vi}
                onChange={(e) => {
                  const v = e.target.value
                  setSocialRows((rows) =>
                    rows.map((r, j) => (j === i ? { ...r, label_vi: v } : r))
                  )
                }}
              />
              <Input
                placeholder="Nhãn (en)"
                value={row.label_en}
                onChange={(e) => {
                  const v = e.target.value
                  setSocialRows((rows) =>
                    rows.map((r, j) => (j === i ? { ...r, label_en: v } : r))
                  )
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid max-w-2xl gap-4 border border-ui-border-base rounded-md p-4">
        <Text weight="plus">Thanh thông báo (AnnouncementBar)</Text>
        <div className="flex items-center gap-2">
          <Switch checked={annEnabled} onCheckedChange={setAnnEnabled} />
          <Label>Bật hiển thị</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Nội dung (vi)</Label>
            <Textarea rows={2} value={annVi} onChange={(e) => setAnnVi(e.target.value)} />
          </div>
          <div>
            <Label>Nội dung (en)</Label>
            <Textarea rows={2} value={annEn} onChange={(e) => setAnnEn(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Link (tùy chọn)</Label>
          <Input value={annLink} onChange={(e) => setAnnLink(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Bắt đầu (ISO hoặc datetime-local)</Label>
            <Input value={annStart} onChange={(e) => setAnnStart(e.target.value)} />
          </div>
          <div>
            <Label>Kết thúc</Label>
            <Input value={annEnd} onChange={(e) => setAnnEnd(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="grid max-w-2xl gap-4 border border-ui-border-base rounded-md p-4">
        <Text weight="plus">Trang 404 (copy hiển thị storefront)</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Tiêu đề (vi)</Label>
            <Input value={nfTitleVi} onChange={(e) => setNfTitleVi(e.target.value)} />
          </div>
          <div>
            <Label>Tiêu đề (en)</Label>
            <Input value={nfTitleEn} onChange={(e) => setNfTitleEn(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>HTML nội dung (vi)</Label>
          <Textarea
            rows={4}
            className="font-mono text-sm"
            value={nfBodyVi}
            onChange={(e) => setNfBodyVi(e.target.value)}
          />
        </div>
        <div>
          <Label>HTML nội dung (en)</Label>
          <Textarea
            rows={4}
            className="font-mono text-sm"
            value={nfBodyEn}
            onChange={(e) => setNfBodyEn(e.target.value)}
          />
        </div>
      </div>

      <Button disabled={saving} variant="primary" onClick={() => void save()}>
        Lưu SEO &amp; nội dung site
      </Button>
    </section>
  )
}
