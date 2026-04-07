import { MedusaService } from "@medusajs/framework/utils"
import CmsSetting from "./models/store-cms-settings"
import StoreBannerCampaign from "./models/store-banner-campaign"
import StoreBannerSlide from "./models/store-banner-slide"
import StoreCmsPage from "./models/store-cms-page"
import StoreCmsPublicationAudit from "./models/store-cms-publication-audit"
import StoreCmsRevision from "./models/store-cms-revision"

export const CMS_SETTINGS_ID = "cms"

class StoreCmsModuleService extends MedusaService({
  StoreBannerSlide,
  StoreBannerCampaign,
  CmsSetting,
  StoreCmsPage,
  StoreCmsRevision,
  StoreCmsPublicationAudit,
}) {
  async getOrCreateSettings() {
    const existing = await this.listCmsSettings({ id: CMS_SETTINGS_ID })
    if (existing.length) {
      return existing[0]
    }
    const [created] = await this.createCmsSettings([
      {
        id: CMS_SETTINGS_ID,
        default_locale: "vi",
        enabled_locales: ["vi", "en"] as unknown as Record<string, unknown>,
        logo_file_id: null,
        site_title: null,
        nav_tree: null,
        site_title_i18n: null,
        tagline_i18n: null,
        seo_defaults: null,
        og_image_file_id: null,
        footer_contact: null,
        announcement: null,
        not_found: null,
      },
    ])
    return created
  }

  /**
   * Distinct image file ids referenced by CMS settings + banner slides.
   * Order: newest `updated_at` among entities referencing each id first (FR-35 / ADR-15).
   */
  async listCmsReferencedImageFileIdsOrdered(): Promise<string[]> {
    const settings = await this.getOrCreateSettings()
    const slides = await this.listStoreBannerSlides(
      {},
      { order: { sort_order: "ASC" } }
    )

    const byFile = new Map<string, number>()
    const bump = (
      fileId: string | null | undefined,
      updatedAt: Date | string | null | undefined
    ) => {
      const id = typeof fileId === "string" ? fileId.trim() : ""
      if (!id) {
        return
      }
      const rawTs = updatedAt ? new Date(updatedAt).getTime() : 0
      const ts = Number.isFinite(rawTs) ? rawTs : 0
      const prev = byFile.get(id)
      if (prev === undefined || ts >= prev) {
        byFile.set(id, ts)
      }
    }
    bump(settings.logo_file_id, settings.updated_at)
    bump(settings.og_image_file_id, settings.updated_at)
    for (const s of slides) {
      bump(s.image_file_id, s.updated_at)
    }

    return Array.from(byFile.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([fid]) => fid)
  }
}

export default StoreCmsModuleService
