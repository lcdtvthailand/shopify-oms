export interface FormData {
  documentType: 'tax' | 'receipt'
  documentNumber: string
  branchCode: string
  companyName: string
  companyNameEng: string
  provinceCode: number | null
  districtCode: number | null
  subdistrictCode: number | null
  postalCode: string
  address: string
  branchType?: 'head' | 'branch' | null
  branchNumber?: string
  subBranchCode?: string
}

export interface OrderData {
  id: string
  name: string
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
    defaultAddress?: {
      address1?: string
      address2?: string
      city?: string
      zip?: string
      province?: string
      country?: string
    }
  }
}
