import { MedusaService } from "@medusajs/framework/utils"
import CmsSetting from "./models/store-cms-settings"
import StoreBannerSlide from "./models/store-banner-slide"
import StoreCmsPage from "./models/store-cms-page"
import StoreCmsRevision from "./models/store-cms-revision"

export const CMS_SETTINGS_ID = "cms"

class StoreCmsModuleService extends MedusaService({
  StoreBannerSlide,
  CmsSetting,
  StoreCmsPage,
  StoreCmsRevision,
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
      },
    ])
    return created
  }
}

export default StoreCmsModuleService
