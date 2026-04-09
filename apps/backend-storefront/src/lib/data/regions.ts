"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { isAppLocale } from "@lib/util/locales"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

const MEDUSA_REGION_COUNTRY =
  process.env.NEXT_PUBLIC_DEFAULT_REGION || "vn"

export const listRegions = async () => {
  const next = {
    ...(await getCacheOptions("regions")),
  }

  return sdk.client
    .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ regions }) => regions)
    .catch(medusaError)
}

export const retrieveRegion = async (id: string) => {
  const next = {
    ...(await getCacheOptions(["regions", id].join("-"))),
  }

  return sdk.client
    .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
      method: "GET",
      next,
      cache: "force-cache",
    })
    .then(({ region }) => region)
    .catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

const LOCALE_TO_REGION_COUNTRY: Record<string, string> = {
  vi: "vn",
  en: "us",
}

function resolveRegionLookupCountry(input: string): string {
  if (!input) {
    return MEDUSA_REGION_COUNTRY
  }

  const key = input.toLowerCase()

  if (isAppLocale(key)) {
    return LOCALE_TO_REGION_COUNTRY[key] ?? MEDUSA_REGION_COUNTRY
  }

  return key
}

export const getRegion = async (countryCode: string) => {
  try {
    const code = resolveRegionLookupCountry(countryCode)

    if (regionMap.has(code)) {
      return regionMap.get(code)
    }

    const regions = await listRegions()

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    const region = code
      ? regionMap.get(code)
      : regionMap.get(MEDUSA_REGION_COUNTRY)

    return region
  } catch (e: any) {
    return null
  }
}
