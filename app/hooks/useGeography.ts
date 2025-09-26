'use client'

import { useCallback, useEffect, useState } from 'react'

// Geography Types
interface GeographyItem {
  code: number
  nameTh: string
  nameEn: string
  postalCode?: number
}

interface UseGeographyReturn {
  provinces: Array<{ code: number; nameTh: string; nameEn: string }>
  districts: Array<{ code: number; nameTh: string; nameEn: string }>
  subdistricts: Array<{ code: number; nameTh: string; nameEn: string; postalCode: number }>
  loadDistricts: (provinceCode: number) => Promise<void>
  loadSubdistricts: (districtCode: number) => Promise<void>
  findGeographyByName: (
    province?: string,
    district?: string,
    subdistrict?: string,
    postalCode?: string
  ) => Promise<{
    provinceCode?: number
    districtCode?: number
    subdistrictCode?: number
    postalCode?: string
  }>
}

export const useGeography = (): UseGeographyReturn => {
  const [provinces, setProvinces] = useState<
    Array<{ code: number; nameTh: string; nameEn: string }>
  >([])
  const [districts, setDistricts] = useState<
    Array<{ code: number; nameTh: string; nameEn: string }>
  >([])
  const [subdistricts, setSubdistricts] = useState<
    Array<{ code: number; nameTh: string; nameEn: string; postalCode: number }>
  >([])

  // Load provinces on mount
  useEffect(() => {
    let mounted = true
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) return
      setProvinces(geo.getProvinces())
    })
    return () => {
      mounted = false
    }
  }, [])

  const loadDistricts = useCallback(async (provinceCode: number) => {
    try {
      const geo = await import('@/lib/geography/thailand')
      const districtList = geo.getDistrictsByProvince(provinceCode)
      setDistricts(districtList)
      setSubdistricts([]) // Reset subdistricts when province changes
    } catch (error) {
      console.error('Failed to load districts:', error)
      setDistricts([])
      setSubdistricts([])
    }
  }, [])

  const loadSubdistricts = useCallback(async (districtCode: number) => {
    try {
      const geo = await import('@/lib/geography/thailand')
      const subdistrictList = geo.getSubdistrictsByDistrict(districtCode)
      setSubdistricts(subdistrictList)
    } catch (error) {
      console.error('Failed to load subdistricts:', error)
      setSubdistricts([])
    }
  }, [])

  const findGeographyByName = useCallback(
    async (province?: string, district?: string, subdistrict?: string, postalCode?: string) => {
      try {
        const geo = await import('@/lib/geography/thailand')
        const result: {
          provinceCode?: number
          districtCode?: number
          subdistrictCode?: number
          postalCode?: string
        } = {}

        const normalize = (s: string) =>
          (s || '')
            .replace(/^\s*(จังหวัด|จ\.|อำเภอ|อ\.|เขต|ตำบล|ต\.|แขวง)\s*/, '')
            .replace(/[()]/g, '')
            .trim()
            .toLowerCase()

        // Find province
        if (province) {
          const provinceData = geo
            .getProvinces()
            .find(
              (p) =>
                normalize(p.nameTh) === normalize(province) ||
                normalize(p.nameEn) === normalize(province) ||
                p.nameTh === province ||
                p.nameEn === province
            )

          if (provinceData) {
            result.provinceCode = provinceData.code
            const districts = geo.getDistrictsByProvince(provinceData.code)

            // Find district
            let districtData: GeographyItem | null = null
            if (district) {
              districtData =
                districts.find(
                  (d) =>
                    normalize(d.nameTh) === normalize(district) ||
                    normalize(d.nameEn) === normalize(district) ||
                    d.nameTh === district ||
                    d.nameEn === district
                ) || null
            }

            // Fallback: try to find by postal code via subdistricts
            if (!districtData && postalCode && String(postalCode).length >= 5) {
              for (const d of districts) {
                const subs = geo.getSubdistrictsByDistrict(d.code)
                if (subs.some((s) => String(s.postalCode).startsWith(String(postalCode)))) {
                  districtData = d
                  break
                }
              }
            }

            // Fallback 2: resolve by subdistrict name across all districts in province
            if (!districtData && subdistrict) {
              const normSub = normalize(subdistrict)
              for (const d of districts) {
                const subs = geo.getSubdistrictsByDistrict(d.code)
                const hit = subs.find(
                  (s) => normalize(s.nameTh) === normSub || normalize(s.nameEn) === normSub
                )
                if (hit) {
                  districtData = d
                  break
                }
              }
            }

            if (districtData) {
              result.districtCode = districtData.code
              const subdistricts = geo.getSubdistrictsByDistrict(districtData.code)

              // Find subdistrict
              let subdistrictData: GeographyItem | null = null
              if (subdistrict) {
                subdistrictData =
                  subdistricts.find(
                    (s) =>
                      normalize(s.nameTh) === normalize(subdistrict) ||
                      normalize(s.nameEn) === normalize(subdistrict) ||
                      s.nameTh === subdistrict ||
                      s.nameEn === subdistrict
                  ) || null
              }

              if (!subdistrictData && postalCode && String(postalCode).length >= 5) {
                subdistrictData =
                  subdistricts.find((s) => String(s.postalCode) === String(postalCode)) || null
              }

              if (subdistrictData) {
                result.subdistrictCode = subdistrictData.code
                result.postalCode = String(subdistrictData.postalCode || postalCode)
              }
            }
          }
        }

        // Global fallback: search across all provinces if still nothing found
        if (
          !result.provinceCode &&
          (subdistrict || (postalCode && String(postalCode).length >= 5))
        ) {
          const provincesAll = geo.getProvinces()
          let found: { pCode: number; dCode: number; sCode: number; sPostal: number } | null = null
          const normSub = normalize(subdistrict || '')

          for (const p of provincesAll) {
            const ds = geo.getDistrictsByProvince(p.code)
            for (const d of ds) {
              const subs = geo.getSubdistrictsByDistrict(d.code)
              let hit: GeographyItem | null = null

              if (normSub) {
                hit =
                  subs.find(
                    (s) => normalize(s.nameTh) === normSub || normalize(s.nameEn) === normSub
                  ) || null
              }

              if (!hit && postalCode && String(postalCode).length >= 5) {
                hit = subs.find((s) => String(s.postalCode) === String(postalCode)) || null
              }

              if (hit) {
                found = {
                  pCode: p.code,
                  dCode: d.code,
                  sCode: hit.code,
                  sPostal: hit.postalCode || 0,
                }
                break
              }
            }
            if (found) break
          }

          if (found) {
            result.provinceCode = found.pCode
            result.districtCode = found.dCode
            result.subdistrictCode = found.sCode
            result.postalCode = String(found.sPostal || postalCode)
          }
        }

        return result
      } catch (error) {
        console.error('Failed to find geography by name:', error)
        return {}
      }
    },
    []
  )

  return {
    provinces,
    districts,
    subdistricts,
    loadDistricts,
    loadSubdistricts,
    findGeographyByName,
  }
}
