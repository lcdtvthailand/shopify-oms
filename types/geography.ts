export interface Province {
  code: number
  nameTh: string
  nameEn: string
}

export interface District {
  code: number
  nameTh: string
  nameEn: string
}

export interface Subdistrict {
  code: number
  nameTh: string
  nameEn: string
  postalCode: number
}

export interface ThailandGeography {
  provinces: Province[]
  districts: Record<number, District[]>
  subdistricts: Record<number, Subdistrict[]>
}
