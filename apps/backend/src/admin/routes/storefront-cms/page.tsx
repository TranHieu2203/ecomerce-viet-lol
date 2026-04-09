import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import {
  ArrowDown,
  ArrowUp,
  FileText,
  FileX2,
  Plus,
  Power,
  Rocket,
  Save,
  Trash2,
  Zap,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CmsCollapsibleSection } from "../../components/cms-collapsible-section"
import { adminFetch } from "./admin-fetch"
import { MediaPickerField } from "./media-picker-field"
import { NavHeaderMenuSection } from "./nav-header-menu-section"
import { CmsRevisionDrawer } from "./revision-drawer"
import { SiteContentAdr13Section } from "./site-content-adr13-section"

type Slide = {
  id: string
  image_file_id: string | null
  image_urls: { mobile?: string; desktop?: string } | null
  title: Record<string, string>
  subtitle?: Record<string, string> | null
  cta_label?: Record<string, string> | null
  target_url: string | null
  sort_order: number
  is_active: boolean
  publication_status?: string
  display_start_at?: string | null
  display_end_at?: string | null
  campaign_id?: string | null
  variant_label?: string | null
}

type BannerCampaign = {
  id: string
  name: string
  split_a_percent: number
  is_active: boolean
}

type Settings = {
  id: string
  default_locale: string
  enabled_locales: unknown
  logo_file_id: string | null
  site_title: string | null
  seo_defaults?: unknown
  og_image_file_id?: string | null
  footer_contact?: unknown
  announcement?: unknown
  not_found?: unknown
}

const StorefrontCmsPage = () => {
  const [slides, setSlides] = useState<Slide[]>([])
  const [campaigns, setCampaigns] = useState<BannerCampaign[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    image_file_id: "",
    title_vi: "",
    title_en: "",
    title_ja: "",
    subtitle_vi: "",
    subtitle_en: "",
    subtitle_ja: "",
    cta_vi: "",
    cta_en: "",
    cta_ja: "",
    target_url: "",
    campaign_id: "",
    variant_label: "",
  })
  const [campForm, setCampForm] = useState({
    name: "",
    split_a_percent: 50,
  })
  const [setFormState, setSetForm] = useState({
    logo_file_id: "",
    site_title: "",
    default_locale: "vi",
    en_enabled: true,
    ja_enabled: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, gRes, cRes] = await Promise.all([
        adminFetch("/admin/custom/banner-slides") as Promise<{
          banner_slides: Slide[]
        }>,
        adminFetch("/admin/custom/cms-settings") as Promise<{
          cms_settings: Settings
        }>,
        adminFetch("/admin/custom/banner-campaigns") as Promise<{
          banner_campaigns: BannerCampaign[]
        }>,
      ])
      setSlides(sRes.banner_slides ?? [])
      setCampaigns(cRes.banner_campaigns ?? [])
      const s = gRes.cms_settings
      setSettings(s)
      const enabled = (s.enabled_locales as string[]) ?? []
      setSetForm({
        logo_file_id: s.logo_file_id ?? "",
        site_title: s.site_title ?? "",
        default_locale: s.default_locale ?? "vi",
        en_enabled: enabled.includes("en"),
        ja_enabled: enabled.includes("ja"),
      })
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Load failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const addSlide = async () => {
    try {
      await adminFetch("/admin/custom/banner-slides", {
        method: "POST",
        body: JSON.stringify({
          image_file_id: form.image_file_id,
          title: {
            vi: form.title_vi,
            en: form.title_en,
            ja: form.title_ja,
          },
          subtitle: {
            vi: form.subtitle_vi,
            en: form.subtitle_en,
            ja: form.subtitle_ja,
          },
          cta_label: { vi: form.cta_vi, en: form.cta_en, ja: form.cta_ja },
          target_url: form.target_url || "",
          publication_status: "draft",
          campaign_id: form.campaign_id.trim() || null,
          variant_label: form.variant_label.trim() || null,
        }),
      })
      toast.success("Slide created")
      setForm({
        image_file_id: "",
        title_vi: "",
        title_en: "",
        title_ja: "",
        subtitle_vi: "",
        subtitle_en: "",
        subtitle_ja: "",
        cta_vi: "",
        cta_en: "",
        cta_ja: "",
        target_url: "",
        campaign_id: "",
        variant_label: "",
      })
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Create failed")
    }
  }

  const reorder = async (ordered: Slide[]) => {
    await adminFetch("/admin/custom/banner-slides/reorder", {
      method: "PATCH",
      body: JSON.stringify({ ordered_ids: ordered.map((s) => s.id) }),
    })
    await load()
  }

  const move = (index: number, dir: -1 | 1) => {
    const next = [...slides]
    const j = index + dir
    if (j < 0 || j >= next.length) {
      return
    }
    ;[next[index], next[j]] = [next[j], next[index]]
    void reorder(next)
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this slide?")) {
      return
    }
    try {
      await adminFetch(`/admin/custom/banner-slides/${id}`, {
        method: "DELETE",
      })
      toast.success("Deleted")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  const toggleEnabled = async (s: Slide) => {
    try {
      await adminFetch(`/admin/custom/banner-slides/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !s.is_active }),
      })
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    }
  }

  const publishSlide = async (id: string) => {
    try {
      await adminFetch(`/admin/custom/banner-slides/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ publication_status: "published" }),
      })
      toast.success("Đã xuất bản")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Publish failed")
    }
  }

  const unpublishSlide = async (id: string) => {
    try {
      await adminFetch(`/admin/custom/banner-slides/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ publication_status: "draft" }),
      })
      toast.success("Đã chuyển nháp")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Unpublish failed")
    }
  }

  const createCampaign = async () => {
    if (!campForm.name.trim()) {
      toast.error("Tên chiến dịch bắt buộc")
      return
    }
    try {
      await adminFetch("/admin/custom/banner-campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: campForm.name.trim(),
          split_a_percent: campForm.split_a_percent,
          is_active: true,
        }),
      })
      toast.success("Chiến dịch đã tạo và kích hoạt (các campaign khác tắt)")
      setCampForm({ name: "", split_a_percent: 50 })
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Campaign failed")
    }
  }

  const saveSettings = async () => {
    try {
      const enabled_locales = [
        "vi",
        ...(setFormState.en_enabled ? (["en"] as const) : []),
        ...(setFormState.ja_enabled ? (["ja"] as const) : []),
      ]
      await adminFetch("/admin/custom/cms-settings", {
        method: "PATCH",
        body: JSON.stringify({
          default_locale: setFormState.default_locale,
          enabled_locales,
          logo_file_id: setFormState.logo_file_id || null,
          site_title: setFormState.site_title.trim() || null,
        }),
      })
      toast.success("Settings saved")
      await load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    }
  }

  if (loading && !settings) {
    return (
      <Container className="p-8">
        <Text>Loading…</Text>
      </Container>
    )
  }

  return (
    <Container className="flex flex-col gap-4 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading className="mb-2">Storefront &amp; nội dung</Heading>
        </div>
        <Button
          size="small"
          variant="secondary"
          className="h-9 w-9 shrink-0 p-0"
          asChild
          title="Trang CMS (nội dung tĩnh)"
        >
          <Link to="../cms-pages" aria-label="Trang CMS (nội dung tĩnh)">
            <FileText className="size-4" strokeWidth={2} />
          </Link>
        </Button>
      </div>

      <CmsCollapsibleSection
        defaultOpen
        summary={
          <>
            <Heading level="h2" className="text-base">
              Cấu hình chung
            </Heading>
            <CmsRevisionDrawer
              entityType="settings"
              entityId="cms"
              triggerLabel="Lịch sử cấu hình"
              onAfterRestore={() => load()}
            />
          </>
        }
      >
        <div className="grid max-w-xl gap-4">
          <MediaPickerField
            htmlId="cms-logo-file-id"
            label="Logo (upload hoặc dán file id)"
            value={setFormState.logo_file_id}
            onValueChange={(v) =>
              setSetForm((s) => ({ ...s, logo_file_id: v }))
            }
          />
          <div>
            <Label>Tên hiển thị header (khi không có logo hoặc làm alt ảnh)</Label>
            <Input
              placeholder="VD: TayA Store"
              value={setFormState.site_title}
              onChange={(e) =>
                setSetForm((s) => ({ ...s, site_title: e.target.value }))
              }
            />
            <Text size="small" className="text-ui-fg-muted mt-1">
              Storefront lấy từ đây thay cho tiêu đề cố định &quot;Medusa Store&quot;.
            </Text>
          </div>
          <div>
            <Label>Default locale</Label>
            <Input
              value={setFormState.default_locale}
              onChange={(e) =>
                setSetForm((s) => ({
                  ...s,
                  default_locale: e.target.value,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={setFormState.en_enabled}
              onCheckedChange={(v) =>
                setSetForm((s) => ({ ...s, en_enabled: v }))
              }
            />
            <Label>Bật English</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={setFormState.ja_enabled}
              onCheckedChange={(v) =>
                setSetForm((s) => ({ ...s, ja_enabled: v }))
              }
            />
            <Label>Bật Japanese (locale thứ ba — FR-17)</Label>
          </div>
          <Text size="small" className="text-ui-fg-muted">
            RBAC publish: đặt biến môi trường backend{" "}
            <code>CMS_PUBLISHER_ADMIN_IDS</code> (id user admin, cách nhau bởi
            dấu phẩy). Không đặt = mọi admin được publish.
          </Text>
          <Button
            type="button"
            className="h-9 w-9 p-0"
            onClick={() => void saveSettings()}
            title="Lưu cấu hình"
            aria-label="Lưu cấu hình"
          >
            <Save className="size-4" strokeWidth={2} />
          </Button>
        </div>
      </CmsCollapsibleSection>

      <NavHeaderMenuSection />

      <SiteContentAdr13Section
        settings={settings as unknown as Record<string, unknown>}
        onReload={load}
      />

      <CmsCollapsibleSection
        defaultOpen={false}
        summary={
          <Heading level="h2" className="text-base">
            Chiến dịch A/B banner (FR-21)
          </Heading>
        }
      >
        <Text size="small" className="text-ui-fg-muted mb-4 max-w-2xl">
          Chỉ một campaign <code>active</code> tại một thời điểm. Gán slide vào
          campaign + nhãn variant A hoặc B. Storefront chọn nhóm cố định theo
          cookie <code>_medusa_cache_id</code>.
        </Text>
        <ul className="mb-4 flex flex-col gap-2">
          {campaigns.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 text-sm">
              <Badge color={c.is_active ? "green" : "grey"}>
                {c.is_active ? "active" : "off"}
              </Badge>
              <span>
                {c.name} — A: {c.split_a_percent}% / B: {100 - c.split_a_percent}%
              </span>
              <Text size="small" className="text-ui-fg-muted font-mono">
                {c.id}
              </Text>
            </li>
          ))}
        </ul>
        <div className="grid max-w-xl gap-3 border border-ui-border-base p-4 rounded-md">
          <Input
            placeholder="Tên chiến dịch"
            value={campForm.name}
            onChange={(e) =>
              setCampForm((f) => ({ ...f, name: e.target.value }))
            }
          />
          <div>
            <Label>Tỷ lệ nhóm A (0–100)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={campForm.split_a_percent}
              onChange={(e) =>
                setCampForm((f) => ({
                  ...f,
                  split_a_percent: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
          <Button
            variant="secondary"
            type="button"
            className="h-9 w-9 p-0"
            onClick={() => void createCampaign()}
            title="Tạo và kích hoạt campaign"
            aria-label="Tạo và kích hoạt campaign"
          >
            <Zap className="size-4" strokeWidth={2} />
          </Button>
        </div>
      </CmsCollapsibleSection>

      <CmsCollapsibleSection
        defaultOpen
        summary={
          <Heading level="h2" className="text-base">
            Banner slides
          </Heading>
        }
      >
        <div className="grid max-w-3xl gap-3 rounded-md border border-ui-border-base p-4">
          <Text size="small" weight="plus">
            Thêm slide — ảnh nền (mặc định nháp; xuất bản sau khi sẵn sàng)
          </Text>
          <MediaPickerField
            htmlId="cms-slide-image-file-id"
            label="Ảnh slide"
            value={form.image_file_id}
            onValueChange={(v) => setForm((f) => ({ ...f, image_file_id: v }))}
          />
          <div className="grid grid-cols-1 small:grid-cols-3 gap-2">
            <Input
              placeholder="Title VI"
              value={form.title_vi}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_vi: e.target.value }))
              }
            />
            <Input
              placeholder="Title EN"
              value={form.title_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_en: e.target.value }))
              }
            />
            <Input
              placeholder="Title JA"
              value={form.title_ja}
              onChange={(e) =>
                setForm((f) => ({ ...f, title_ja: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 small:grid-cols-3 gap-2">
            <Input
              placeholder="Subtitle VI"
              value={form.subtitle_vi}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtitle_vi: e.target.value }))
              }
            />
            <Input
              placeholder="Subtitle EN"
              value={form.subtitle_en}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtitle_en: e.target.value }))
              }
            />
            <Input
              placeholder="Subtitle JA"
              value={form.subtitle_ja}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtitle_ja: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 small:grid-cols-3 gap-2">
            <Input
              placeholder="CTA VI"
              value={form.cta_vi}
              onChange={(e) => setForm((f) => ({ ...f, cta_vi: e.target.value }))}
            />
            <Input
              placeholder="CTA EN"
              value={form.cta_en}
              onChange={(e) => setForm((f) => ({ ...f, cta_en: e.target.value }))}
            />
            <Input
              placeholder="CTA JA"
              value={form.cta_ja}
              onChange={(e) => setForm((f) => ({ ...f, cta_ja: e.target.value }))}
            />
          </div>
          <Input
            placeholder="Target URL"
            value={form.target_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, target_url: e.target.value }))
            }
          />
          <div className="grid grid-cols-1 small:grid-cols-2 gap-2">
            <Input
              placeholder="Campaign id (dán từ danh sách)"
              value={form.campaign_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, campaign_id: e.target.value }))
              }
            />
            <Input
              placeholder="Variant A hoặc B"
              value={form.variant_label}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  variant_label: e.target.value.toUpperCase().slice(0, 1),
                }))
              }
            />
          </div>
          <Button
            type="button"
            className="h-9 w-9 p-0"
            onClick={() => void addSlide()}
            title="Thêm slide"
            aria-label="Thêm slide"
          >
            <Plus className="size-4" strokeWidth={2} />
          </Button>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {slides.map((s, i) => (
            <li
              key={s.id}
              className="flex flex-col gap-2 border border-ui-border-base p-3 rounded-md"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Badge color={s.is_active ? "green" : "grey"}>
                  {s.is_active ? "active" : "off"}
                </Badge>
                <Badge
                  color={
                    s.publication_status === "published" ? "green" : "orange"
                  }
                >
                  {s.publication_status ?? "published"}
                </Badge>
                {s.variant_label ? (
                  <Badge color="blue">variant {s.variant_label}</Badge>
                ) : null}
                <Text>
                  {(s.title?.vi || s.title?.en || s.title?.ja || "").slice(
                    0,
                    40
                  ) || s.id}
                </Text>
                <div className="flex gap-1">
                  <Button
                    size="small"
                    variant="secondary"
                    type="button"
                    className="h-8 w-8 p-0"
                    onClick={() => move(i, -1)}
                    title="Đưa lên"
                    aria-label="Đưa lên"
                  >
                    <ArrowUp className="size-4" strokeWidth={2} />
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    type="button"
                    className="h-8 w-8 p-0"
                    onClick={() => move(i, 1)}
                    title="Đưa xuống"
                    aria-label="Đưa xuống"
                  >
                    <ArrowDown className="size-4" strokeWidth={2} />
                  </Button>
                </div>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  className="h-8 w-8 p-0"
                  onClick={() => void toggleEnabled(s)}
                  title="Bật/tắt hiển thị slide"
                  aria-label="Bật tắt hiển thị slide"
                >
                  <Power className="size-4" strokeWidth={2} />
                </Button>
                {s.publication_status === "draft" ? (
                  <Button
                    size="small"
                    type="button"
                    className="h-8 w-8 p-0"
                    onClick={() => void publishSlide(s.id)}
                    title="Xuất bản"
                    aria-label="Xuất bản"
                  >
                    <Rocket className="size-4" strokeWidth={2} />
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="secondary"
                    type="button"
                    className="h-8 w-8 p-0"
                    onClick={() => void unpublishSlide(s.id)}
                    title="Chuyển nháp"
                    aria-label="Chuyển nháp"
                  >
                    <FileX2 className="size-4" strokeWidth={2} />
                  </Button>
                )}
                <Button
                  size="small"
                  variant="danger"
                  type="button"
                  className="h-8 w-8 p-0"
                  onClick={() => void remove(s.id)}
                  title="Xóa slide"
                  aria-label="Xóa slide"
                >
                  <Trash2 className="size-4" strokeWidth={2} />
                </Button>
              </div>
              <Text size="small" className="text-ui-fg-muted">
                Lịch (UTC ISO): start{" "}
                {s.display_start_at
                  ? String(s.display_start_at).slice(0, 19)
                  : "—"}{" "}
                — end{" "}
                {s.display_end_at
                  ? String(s.display_end_at).slice(0, 19)
                  : "—"}
                {s.campaign_id ? ` — campaign ${s.campaign_id.slice(0, 8)}…` : ""}
              </Text>
            </li>
          ))}
        </ul>
      </CmsCollapsibleSection>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Storefront CMS",
  rank: 42,
})

export default StorefrontCmsPage
