'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminContactModal } from '@/app/components/modals/AdminContactModal'
import { OrderStatusAlert } from '@/app/components/ui/OrderStatusAlert'
import {
  type OrderFinancialStatus,
  type OrderFulfillmentStatus,
  type OrderStatus,
  validateOrderStatus,
} from '@/lib/services/order-status'
import { logger } from '@/lib/utils/errors'
import type { ShopifyGraphQLResponse } from '@/types/shopify'

// Geography types are imported from thailand.ts

// GraphQL Response Types
interface OrderNode {
  id: string
  name: string
  createdAt: string
  fullyPaid?: boolean
  displayFinancialStatus?: string
  displayFulfillmentStatus?: string
  cancelledAt?: string | null
  customer?: {
    id?: string
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
  lineItems?: {
    edges: Array<{
      node: {
        title: string
        quantity: number
        variant?: { price: string }
      }
    }>
  }
  totalPriceSet?: {
    shopMoney: {
      amount: string
      currencyCode: string
    }
  }
  metafields?: {
    nodes: Array<{
      key: string
      value: string
      type?: string
    }>
  }
}

interface OrdersQueryResponse {
  orders: {
    edges: Array<{
      node: OrderNode
    }>
  }
}

interface OrderQueryResponse {
  order: OrderNode
}

// Removed unused MetafieldNode interface - metafield nodes are part of OrderNode

interface MetafieldsSetResponse {
  metafieldsSet: {
    metafields: Array<{
      id: string
      key: string
      namespace: string
    }>
    userErrors: Array<{
      field?: string[]
      message: string
      code?: string
    }>
  }
}

// Geography Types
interface GeographyItem {
  code: number
  nameTh: string
  nameEn: string
  postalCode?: number
}

interface FormData {
  documentType: 'tax' | 'receipt'
  titleName: string
  fullName: string
  companyNameText: string
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

// Minimal shape for order data we show on screen
type OrderData = {
  id: string
  name: string
  customerId?: string | null
  customer?: {
    id?: string
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

export default function TaxInvoiceForm() {
  const router = useRouter()
  // Guard to prevent cascading resets when we are pre-filling from metafields
  const prefillGuard = useRef(false)
  const [referrerUrl, setReferrerUrl] = useState<string | null>(null)
  // Timestamp to help detect orders created after landing on this page
  const arrivalAtRef = useRef<string>(new Date().toISOString())
  const [formData, setFormData] = useState<FormData>({
    documentType: 'tax',
    titleName: '',
    fullName: '',
    companyNameText: '',
    documentNumber: '',
    branchCode: '',
    companyName: '',
    companyNameEng: '',
    provinceCode: null,
    districtCode: null,
    subdistrictCode: null,
    postalCode: '',
    address: '',
    branchType: null,
    branchNumber: '',
  })

  // Cascading options loaded from lib/geography/thailand.ts via dynamic import
  const [provinces, setProvinces] = useState<
    Array<{ code: number; nameTh: string; nameEn: string }>
  >([])
  const [districts, setDistricts] = useState<
    Array<{ code: number; nameTh: string; nameEn: string }>
  >([])
  const [subdistricts, setSubdistricts] = useState<
    Array<{ code: number; nameTh: string; nameEn: string; postalCode: number }>
  >([])

  // URL parameter validation states
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [_loading, setLoading] = useState(false)
  const [_error, setError] = useState<string | null>(null)
  const [showValidationPopup, setShowValidationPopup] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [isValidated, setIsValidated] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  // Saving states for Shopify metafields
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  // After-save popup
  const [showSavePopup, setShowSavePopup] = useState(false)
  // Order status validation
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [showAdminContact, setShowAdminContact] = useState(false)
  // Overlay form states
  const [showFormOverlay, setShowFormOverlay] = useState(false)
  const [validationInProgress, setValidationInProgress] = useState(false)

  const searchParams = useSearchParams()

  // Forward declarations for functions used in useEffect
  const validateParametersRef = useRef<
    ((orderIdParam?: string, emailParam?: string) => Promise<void>) | null
  >(null)
  const loadExistingMetafieldsRef = useRef<((orderGid: string) => Promise<void>) | null>(null)

  // Helper: Fetch latest order by email with createdAt for recency checks
  const fetchLatestOrderByEmail = useCallback(
    async (customerEmail: string): Promise<{ orderNumber: string; createdAt: string } | null> => {
      const FIND_BY_EMAIL = `
      query findOrdersByEmail($query: String!) {
        orders(first: 1, query: $query, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              customer { email }
            }
          }
        }
      }
    `
      const runSearch = async (queryString: string) => {
        const response = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: FIND_BY_EMAIL, variables: { query: queryString } }),
        })
        let result: ShopifyGraphQLResponse<OrdersQueryResponse> | null
        try {
          result = await response.json()
        } catch {
          result = null
        }
        const node = result?.data?.orders?.edges?.[0]?.node
        if (!node) {
          return null
        }
        if ((node.customer?.email || '').toLowerCase() !== customerEmail.toLowerCase()) {
          return null
        }
        const orderNumber = String((node.name || '').replace(/^#/, ''))
        const createdAt = String(node.createdAt || '')
        if (!orderNumber || !createdAt) {
          return null
        }
        return { orderNumber, createdAt }
      }

      try {
        // Important: quote the email to avoid parsing issues with '@'
        // Also constrain by created_at to only pick orders created after arrival (minus skew)
        const skewMs = 60000
        const sinceIso = new Date(new Date(arrivalAtRef.current).getTime() - skewMs).toISOString()
        const primaryQueries = [
          `email:"${customerEmail}" created_at:>=${sinceIso}`,
          `customer_email:"${customerEmail}" created_at:>=${sinceIso}`,
        ]
        for (const q of primaryQueries) {
          const res = await runSearch(q)
          if (res) {
            return res
          }
        }
        // Fallback: if none found after arrival (index lag), try without created_at but still return something
        const fallbackQueries = [`email:"${customerEmail}"`, `customer_email:"${customerEmail}"`]
        for (const q of fallbackQueries) {
          const res = await runSearch(q)
          if (res) {
            return res
          }
        }
        return null
      } catch {
        // fetchLatestOrderByEmail failed
        return null
      }
    },
    []
  )

  // Poll until a newly created order (>= arrival time minus a small skew) appears
  const waitForNewestOrderAfter = useCallback(
    async (customerEmail: string, timeoutMs = 60000, intervalMs = 1500): Promise<string | null> => {
      const skewMs = 60000 // 1 minute clock/indexing skew tolerance
      const deadline = Date.now() + timeoutMs
      const arrival = new Date(arrivalAtRef.current).getTime()
      let lastSeen: { orderNumber: string; createdAt: string } | null = null
      while (Date.now() < deadline) {
        const latest = await fetchLatestOrderByEmail(customerEmail)
        if (latest) {
          lastSeen = latest
          const createdTs = new Date(latest.createdAt).getTime()
          if (!Number.isNaN(createdTs) && createdTs >= arrival - skewMs) {
            return latest.orderNumber
          }
        }
        await new Promise((r) => setTimeout(r, intervalMs))
      }
      // Fallback: return whatever we last saw (may be previous order)
      return lastSeen?.orderNumber ?? null
    },
    [fetchLatestOrderByEmail]
  )

  // Load provinces and auto-validate URL parameters on mount
  useEffect(() => {
    let mounted = true
    // Remember the URL before arriving here
    if (typeof window !== 'undefined') {
      const ref = document.referrer || ''
      setReferrerUrl(ref || null)
    }
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) {
        return
      }
      setProvinces(geo.getProvinces())
    })

    // Auto-validate URL parameters
    const urlOrderId = searchParams.get('order')
    const urlEmail = searchParams.get('email')
    const urlOms = searchParams.get('oms')
    const urlKey = searchParams.get('key')
    const urlTs = searchParams.get('ts')
    const urlToken = searchParams.get('token')
    const urlCode = searchParams.get('code')

    // Priority 0: Single combined code param
    if (urlCode) {
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          const q = new URLSearchParams({ code: urlCode, format: 'json' })
          const res = await fetch(`/api/resolve-oms?${q.toString()}`)
          const json = (await res.json()) as {
            ok: boolean
            valid?: boolean
            order?: string
            email?: string
            reason?: string
          }
          if (!json?.ok || json.valid !== true || !json.order || !json.email) {
            setValidationMessage('ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าหน้าฟอร์มจากร้านค้าอีกครั้ง')
            setShowValidationPopup(true)
            setIsValidated(false)
            return
          }
          setOrderId(json.order)
          setEmail(json.email)
          setTimeout(() => {
            if (mounted && validateParametersRef.current) {
              validateParametersRef.current(json.order!, json.email!)
            }
          }, 100)
        } catch {
          setValidationMessage('ไม่สามารถตรวจสอบลิงก์ได้ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ')
          setShowValidationPopup(true)
          setIsValidated(false)
        } finally {
          setLoading(false)
        }
      })()
    }
    // Priority 1: New Shopify link format using oms/key/ts/token
    else if (urlOms && urlKey && urlTs && urlToken) {
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          const q = new URLSearchParams({
            key: urlKey,
            oms: urlOms,
            ts: urlTs,
            token: urlToken,
            format: 'json',
          })
          const res = await fetch(`/api/resolve-oms?${q.toString()}`)
          const json = (await res.json()) as {
            ok: boolean
            valid?: boolean
            order?: string
            email?: string
            reason?: string
          }
          if (!json?.ok || json.valid !== true || !json.order || !json.email) {
            setValidationMessage('ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าหน้าฟอร์มจากร้านค้าอีกครั้ง')
            setShowValidationPopup(true)
            setIsValidated(false)
            return
          }
          setOrderId(json.order)
          setEmail(json.email)
          // Keep OMS-style parameters in URL (no rewrite). Proceed with validation below.
          // Trigger validation
          setTimeout(() => {
            if (mounted && validateParametersRef.current) {
              validateParametersRef.current(json.order!, json.email!)
            }
          }, 100)
        } catch {
          setValidationMessage('ไม่สามารถตรวจสอบลิงก์ได้ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ')
          setShowValidationPopup(true)
          setIsValidated(false)
        } finally {
          setLoading(false)
        }
      })()
    } else if (urlOrderId && urlEmail) {
      // If canonical params provided, transform to OMS format for consistency
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          const q = new URLSearchParams({
            order: urlOrderId,
            email: urlEmail,
            format: 'json',
          })
          const res = await fetch(`/api/build-oms?${q.toString()}`)
          const json = (await res.json()) as {
            ok: boolean
            url?: string
          }
          if (json?.ok && json.url) {
            // Replace to OMS-style URL; the OMS branch above will handle validation
            router.replace(json.url)
            return
          }
          // Fallback: keep old behavior if build-oms not available
          setOrderId(urlOrderId)
          setEmail(urlEmail)
          setTimeout(() => {
            if (mounted && validateParametersRef.current) {
              validateParametersRef.current(urlOrderId, urlEmail)
            }
          }, 100)
        } catch {
          // Fallback to prior behavior on error
          setOrderId(urlOrderId)
          setEmail(urlEmail)
          setTimeout(() => {
            if (mounted && validateParametersRef.current) {
              validateParametersRef.current(urlOrderId, urlEmail)
            }
          }, 100)
        } finally {
          setLoading(false)
        }
      })()
    } else if (urlEmail && !urlOrderId) {
      // If email exists but order is missing, try to auto-detect the latest order for this email
      ;(async () => {
        try {
          setLoading(true)
          setError(null)
          setEmail(urlEmail)
          const found = await waitForNewestOrderAfter(urlEmail)
          if (found) {
            setOrderId(found)
            // Update the URL query to include the order id and then auto-validate
            if (typeof window !== 'undefined') {
              const u = new URL(window.location.href)
              u.searchParams.set('order', found)
              u.searchParams.set('email', urlEmail)
              // Update the URL without full reload
              router.replace(`${u.pathname}?${u.searchParams.toString()}`)
            }
            // Small delay to ensure state/url settled
            setTimeout(() => {
              if (mounted && validateParametersRef.current) {
                validateParametersRef.current(found, urlEmail)
              }
            }, 100)
          } else {
            setValidationMessage('ไม่พบออเดอร์ล่าสุดของอีเมลนี้ กรุณาระบุ Order ID ด้วยตนเอง')
            setShowValidationPopup(true)
            setIsValidated(false)
          }
        } catch {
          setValidationMessage('ไม่สามารถค้นหาออเดอร์จากอีเมลได้ กรุณาระบุ Order ID และ Email ใน URL')
          setShowValidationPopup(true)
          setIsValidated(false)
        } finally {
          setLoading(false)
        }
      })()
    } else if (urlOrderId || urlEmail) {
      // Missing one parameter and we cannot auto-detect
      setValidationMessage('กรุณาระบุทั้ง Order ID และ Email ใน URL')
      setShowValidationPopup(true)
      setIsValidated(false)
    }

    return () => {
      mounted = false
    }
  }, [searchParams, router, waitForNewestOrderAfter])

  // When province changes, load districts
  useEffect(() => {
    if (formData.provinceCode == null) {
      setDistricts([])
      setSubdistricts([])
      // Only reset if not prefilling from saved data
      if (!prefillGuard.current) {
        setFormData((p) => ({ ...p, districtCode: null, subdistrictCode: null, postalCode: '' }))
      }
      return
    }
    let mounted = true
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) {
        return
      }
      const districtList = geo.getDistrictsByProvince(formData.provinceCode!)
      setDistricts(districtList)
      // reset lower levels only when not pre-filling
      if (prefillGuard.current) {
        // When prefilling, ensure district options are loaded for the current district selection
        if (formData.districtCode) {
          const subdistrictList = geo.getSubdistrictsByDistrict(formData.districtCode)
          setSubdistricts(subdistrictList)
        }
      } else {
        setSubdistricts([])
        setFormData((p) => ({ ...p, districtCode: null, subdistrictCode: null, postalCode: '' }))
      }
    })
    return () => {
      mounted = false
    }
  }, [formData.provinceCode, formData.districtCode])

  // When district changes, load subdistricts
  useEffect(() => {
    if (formData.districtCode == null) {
      setSubdistricts([])
      if (!prefillGuard.current) {
        setFormData((p) => ({ ...p, subdistrictCode: null, postalCode: '' }))
      }
      return
    }
    let mounted = true
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) {
        return
      }
      const subdistrictList = geo.getSubdistrictsByDistrict(formData.districtCode!)
      setSubdistricts(subdistrictList)
      if (!prefillGuard.current) {
        setFormData((p) => ({ ...p, subdistrictCode: null, postalCode: '' }))
      }
    })
    return () => {
      mounted = false
    }
  }, [formData.districtCode])

  // When subdistrict changes, auto-fill postal code (only if not already set from saved data)
  useEffect(() => {
    if (formData.subdistrictCode == null) {
      return
    }
    import('@/lib/geography/thailand').then((geo) => {
      const item = geo.findBySubdistrictCode(formData.subdistrictCode!)
      if (item) {
        // Only auto-fill postal code if it's empty or if we're not prefilling from saved data
        setFormData((p) => {
          if (!prefillGuard.current || !p.postalCode) {
            return { ...p, postalCode: String(item.postalCode) }
          }
          return p
        })
      }
    })
  }, [formData.subdistrictCode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Helper: format Thai phone number with dashes as user types
    const formatThaiPhone = (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 10)
      if (!digits) {
        return ''
      }
      // Bangkok landline starts with 02 -> format 02-XXX-XXXX
      if (digits.startsWith('02')) {
        if (digits.length <= 2) {
          return digits
        }
        if (digits.length <= 5) {
          return `${digits.slice(0, 2)}-${digits.slice(2)}`
        }
        if (digits.length <= 9) {
          return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
        }
        return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 9)}${digits.length > 9 ? digits.slice(9) : ''}`
      }
      // Mobile and other numbers -> format 0xx-xxx-xxxx
      if (digits.length <= 3) {
        return digits
      }
      if (digits.length <= 6) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`
      }
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }

    if (name === 'companyName' || name === 'companyNameEng') {
      setFormData((prev) => ({ ...prev, [name]: formatThaiPhone(value) }))
      return
    }
    // Helper: format 13-digit Thai ID/Tax ID -> keep only digits, no dashes
    const formatThaiId13 = (raw: string) => {
      const d = raw.replace(/\D/g, '').slice(0, 13)
      return d
    }
    if (name === 'branchCode') {
      setFormData((prev) => ({ ...prev, [name]: formatThaiId13(value) }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const _handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (formData.documentType === 'tax') {
      if (!formData.fullName.trim()) {
        alert('กรุณากรอกชื่อ-นามสกุล')
        return
      }
    } else if (!formData.companyNameText.trim()) {
      alert('กรุณากรอกชื่อบริษัท')
      return
    }

    if (!formData.branchCode.trim()) {
      alert('กรุณากรอกหมายเลขประจำตัวผู้เสียภาษี')
      return
    }

    if (formData.branchCode.length !== 13) {
      alert('หมายเลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก')
      return
    }

    if (!formData.companyName.trim()) {
      alert('กรุณากรอกหมายเลขโทรศัพท์')
      return
    }

    if (!formData.provinceCode) {
      alert('กรุณาเลือกจังหวัด')
      return
    }

    if (!formData.districtCode) {
      alert('กรุณาเลือกอำเภอ/เขต')
      return
    }

    if (!formData.subdistrictCode) {
      alert('กรุณาเลือกตำบล/แขวง')
      return
    }

    if (!formData.address.trim()) {
      alert('กรุณากรอกที่อยู่')
      return
    }

    if (formData.documentType === 'receipt' && formData.branchType === 'branch') {
      if (!formData.branchNumber || !formData.branchNumber.trim()) {
        alert('กรุณากรอกรหัสสาขาย่อย')
        return
      }
    }

    // Save to localStorage
    const savedData = {
      ...formData,
      savedAt: new Date().toISOString(),
      id: Date.now().toString(),
    }

    const existingData = JSON.parse(localStorage.getItem('taxInvoiceData') || '[]')
    existingData.push(savedData)
    localStorage.setItem('taxInvoiceData', JSON.stringify(existingData))

    alert('บันทึกข้อมูลเรียบร้อยแล้ว!')

    // Reset form
    setFormData({
      documentType: 'tax',
      titleName: '',
      fullName: '',
      companyNameText: '',
      documentNumber: '',
      branchCode: '',
      companyName: '',
      companyNameEng: '',
      provinceCode: null,
      districtCode: null,
      subdistrictCode: null,
      postalCode: '',
      address: '',
      branchType: null,
      branchNumber: '',
    })

    setProvinces([])
    setDistricts([])
    setSubdistricts([])
  }

  const handleRadioChange = (value: 'tax' | 'receipt') => {
    setFormData((prev) => ({
      ...prev,
      documentType: value,
      // Independent fields: clear the other field when switching types
      fullName: value === 'tax' ? prev.fullName : '',
      companyNameText: value === 'receipt' ? prev.companyNameText : '',
      // reset branch type when switching to บุคคลธรรมดา
      branchType: value === 'receipt' ? (prev.branchType ?? 'head') : null,
      branchNumber: value === 'receipt' ? prev.branchNumber : '',
    }))
  }

  const handleGoBack = () => {
    if (referrerUrl) {
      // If the referrer is an absolute URL (may be external), redirect directly
      if (/^https?:\/\//i.test(referrerUrl)) {
        window.location.href = referrerUrl
        return
      }
      // Otherwise, treat it as an internal path
      router.push(referrerUrl)
      return
    }
    // Fallback: browser history back
    router.back()
  }

  // Explicit redirect to Shopify storefront
  const handleGoToShop = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'https://lcdtvthailand.myshopify.com/'
    }
  }

  // options are now driven by dataset above

  // Load existing metafields for the order and populate form
  const loadExistingMetafields = async (orderGid: string) => {
    try {
      const GET_ORDER_METAFIELDS = `
        query getOrderMetafields($id: ID!) {
          order(id: $id) {
            id
            metafields(first: 100, namespace: "custom") {
              nodes { key value }
            }
          }
        }
      `

      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: GET_ORDER_METAFIELDS, variables: { id: orderGid } }),
      })

      const result = (await response.json()) as ShopifyGraphQLResponse<OrderQueryResponse>
      const nodes = result?.data?.order?.metafields?.nodes || []

      if (nodes.length > 0) {
        // Create a map of metafield keys to values
        const metaMap: Record<string, string> = {}
        nodes.forEach((node) => {
          metaMap[node.key] = node.value || ''
        })

        // Debug: Log all retrieved metafields
        // Metafields retrieved successfully

        // Map metafields back to form data
        const customerType = metaMap.customer_type || metaMap.custom_customer_type || ''
        const titleName = metaMap.title_name || metaMap.custom_title_name || ''
        const fullName = metaMap.full_name || metaMap.custom_full_name || ''
        const customCompanyName =
          metaMap.custom_company_name || metaMap.custom_custom_company_name || ''
        // Keep legacy company_name for backward compatibility only (not mixing with custom_company_name)
        const legacyCompanyName = metaMap.company_name || ''
        const branchType = metaMap.branch_type || metaMap.custom_branch_type || ''
        const branchCode = metaMap.branch_code || metaMap.custom_branch_code || ''
        const taxId = metaMap.tax_id || metaMap.custom_tax_id || ''
        const phoneNumber = metaMap.phone_number || metaMap.custom_phone_number || ''
        const altPhoneNumber = metaMap.alt_phone_number || metaMap.custom_alt_phone_number || ''
        const province =
          metaMap.province ||
          metaMap.custom_province ||
          (orderData?.customer?.defaultAddress?.province ?? '')
        const district =
          metaMap.district ||
          metaMap.custom_district ||
          metaMap.custom_custom_district ||
          metaMap.district_th ||
          metaMap.amphoe ||
          metaMap.amphur ||
          (orderData?.customer?.defaultAddress?.city ?? '')
        const subDistrict =
          metaMap.sub_district ||
          metaMap.custom_sub_district ||
          metaMap.custom_custom_district2 ||
          metaMap.tambon ||
          metaMap.khwaeng ||
          ''
        const postalCode =
          metaMap.postal_code ||
          metaMap.custom_postal_code ||
          metaMap.postcode ||
          metaMap.post_code ||
          metaMap.zip ||
          metaMap.custom_zip ||
          (orderData?.customer?.defaultAddress?.zip ?? '')
        const fullAddress = metaMap.full_address || metaMap.custom_full_address || ''

        // Extracted values for geo matching

        // Helper to format 13-digit tax ID for display (no dashes)
        const fmtId = (raw: string) => {
          const d = String(raw || '')
            .replace(/\D/g, '')
            .slice(0, 13)
          return d
        }

        // Update form data with existing values
        // Use appropriate field based on customer type - strict separation
        let documentName = ''
        if (customerType === 'นิติบุคคล') {
          // For juristic person, only use custom_company_name fields
          documentName = customCompanyName
          // Fallback to legacy only if no custom_company_name exists
          if (!documentName && !fullName) {
            documentName = legacyCompanyName
          }
        } else {
          // For individual person, only use full_name fields
          documentName = fullName
          // Fallback to legacy only if no full_name exists
          if (!documentName && !customCompanyName) {
            documentName = legacyCompanyName
          }
        }

        setFormData((prev) => ({
          ...prev,
          documentType: customerType === 'นิติบุคคล' ? 'receipt' : 'tax',
          titleName: titleName,
          fullName: customerType === 'นิติบุคคล' ? '' : documentName,
          companyNameText: customerType === 'นิติบุคคล' ? documentName : '',
          branchCode: fmtId(taxId),
          companyName: phoneNumber,
          companyNameEng: altPhoneNumber,
          address: fullAddress,
          postalCode: postalCode,
          branchType:
            branchType === 'สาขาย่อย' ? 'branch' : branchType === 'สำนักงานใหญ่' ? 'head' : null,
          branchNumber: branchCode,
        }))

        // Load geography data and set codes based on names
        import('@/lib/geography/thailand').then((geo) => {
          // prevent cascading effects from wiping our prefilled values
          prefillGuard.current = true
          // Start prefilling form data
          const normalize = (s: string) =>
            (s || '')
              .replace(/^\s*(จังหวัด|จ\.|อำเภอ|อ\.|เขต|ตำบล|ต\.|แขวง)\s*/, '')
              .replace(/[()]/g, '')
              .trim()
              .toLowerCase()

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
              setFormData((prev) => ({ ...prev, provinceCode: provinceData.code }))

              const districts = geo.getDistrictsByProvince(provinceData.code)
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
              if (!districtData && subDistrict) {
                const normSub = normalize(subDistrict)
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
                setFormData((prev) => ({ ...prev, districtCode: districtData.code }))
                const subdistricts = geo.getSubdistrictsByDistrict(districtData.code)
                let subdistrictData: GeographyItem | null = null
                if (subDistrict) {
                  subdistrictData =
                    subdistricts.find(
                      (s) =>
                        normalize(s.nameTh) === normalize(subDistrict) ||
                        normalize(s.nameEn) === normalize(subDistrict) ||
                        s.nameTh === subDistrict ||
                        s.nameEn === subDistrict
                    ) || null
                }
                if (!subdistrictData && postalCode && String(postalCode).length >= 5) {
                  subdistrictData =
                    subdistricts.find((s) => String(s.postalCode) === String(postalCode)) || null
                }
                // Fallback 3: if still not found, try first subdistrict that matches by name across province (already tried), or leave empty
                if (subdistrictData) {
                  setFormData((prev) => ({
                    ...prev,
                    subdistrictCode: subdistrictData.code,
                    postalCode: String(subdistrictData.postalCode || postalCode),
                  }))
                }
              } else {
                // Final fallback: try to locate subdistrict anywhere in province by name/postal then infer its district
                let found: { dCode: number; sCode: number; sPostal: number } | null = null
                const normSub = normalize(subDistrict || '')
                for (const d of districts) {
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
                    found = { dCode: d.code, sCode: hit.code, sPostal: hit.postalCode || 0 }
                    break
                  }
                }
                if (found) {
                  setFormData((prev) => ({
                    ...prev,
                    districtCode: found.dCode,
                    subdistrictCode: found.sCode,
                    postalCode: String(found.sPostal || postalCode),
                  }))
                }
                // Global fallback: search across all provinces if still nothing
                if (!found && (subDistrict || (postalCode && String(postalCode).length >= 5))) {
                  const provincesAll = geo.getProvinces()
                  let g: { pCode: number; dCode: number; sCode: number; sPostal: number } | null =
                    null
                  const normSub = normalize(subDistrict || '')
                  for (const p of provincesAll) {
                    const ds = geo.getDistrictsByProvince(p.code)
                    for (const d of ds) {
                      const subs = geo.getSubdistrictsByDistrict(d.code)
                      let hit: GeographyItem | null = null
                      if (normSub) {
                        hit =
                          subs.find(
                            (s) =>
                              normalize(s.nameTh) === normSub || normalize(s.nameEn) === normSub
                          ) || null
                      }
                      if (!hit && postalCode && String(postalCode).length >= 5) {
                        hit = subs.find((s) => String(s.postalCode) === String(postalCode)) || null
                      }
                      if (hit) {
                        g = {
                          pCode: p.code,
                          dCode: d.code,
                          sCode: hit.code,
                          sPostal: hit.postalCode || 0,
                        }
                        break
                      }
                    }
                    if (g) {
                      break
                    }
                  }
                  if (g) {
                    setFormData((prev) => ({
                      ...prev,
                      provinceCode: g.pCode,
                      districtCode: g.dCode,
                      subdistrictCode: g.sCode,
                      postalCode: String(g.sPostal || postalCode),
                    }))
                    // Global geo fallback matched
                  }
                }
              }
              // Geo resolution completed
              // allow effects to run normally after a longer delay to ensure all data is loaded
              setTimeout(() => {
                prefillGuard.current = false
                // Prefilling completed
              }, 100)
            }
          }
        })
      }
    } catch {
      // Failed to load existing metafields
      // Don't show error to user, just continue with empty form
    }
  }

  // Assign ref for useEffect
  loadExistingMetafieldsRef.current = loadExistingMetafields

  // Validate order and email parameters (can be called directly or from UI)
  const validateParameters = async (orderIdParam?: string, emailParam?: string) => {
    const checkOrderId = orderIdParam || orderId
    const checkEmail = emailParam || email

    if (!checkOrderId || !checkEmail) {
      setValidationMessage('กรุณาระบุทั้ง Order ID และ Email ใน URL')
      setShowValidationPopup(true)
      setIsValidated(false)
      return
    }

    setLoading(true)
    setError(null)
    setOrderData(null)
    setValidationInProgress(true)
    setShowFormOverlay(false)

    // ค้นหาออเดอร์จากเลข Order Number และตรวจสอบ email
    const GET_ORDER_DETAILS = `
      query getOrderByName($query: String!) {
        orders(first: 1, query: $query) {
          edges {
            node {
              id
              name
              fullyPaid
              displayFinancialStatus
              displayFulfillmentStatus
              cancelledAt
              customer {
                id
                firstName
                lastName
                email
                defaultAddress {
                  address1
                  address2
                  city
                  zip
                  province
                  country
                }
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    variant { price }
                  }
                }
              }
              totalPriceSet { shopMoney { amount currencyCode } }
            }
          }
        }
      }
    `

    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GET_ORDER_DETAILS,
          variables: { query: `name:#${checkOrderId}` },
        }),
      })

      let result: ShopifyGraphQLResponse<OrdersQueryResponse> | null
      try {
        result = await response.json()
      } catch {
        result = null
      }

      if (!response.ok) {
        const message = result?.errors?.[0]?.message || 'Failed to fetch order data'
        throw new Error(message)
      }

      if (result?.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error')
      }

      const node = result?.data?.orders?.edges?.[0]?.node
      if (!node) {
        setValidationMessage('ไม่พบออเดอร์ตามเลขที่ระบุ กรุณาตรวจสอบ Order ID')
        setShowValidationPopup(true)
        setIsValidated(false)
        return
      }

      // ตรวจสอบว่า email ตรงกันหรือไม่
      // For anonymous orders, customer might be null - skip email validation if anonymous email pattern
      const isAnonymousEmail =
        checkEmail.includes('anonymous-') && checkEmail.includes('@example.com')
      const customerEmail = node.customer?.email?.toLowerCase()

      if (!isAnonymousEmail && customerEmail !== checkEmail.toLowerCase()) {
        setValidationMessage('ไม่มีคำสั่งซื้อหรือผู้ใช้นี้ในระบบ')
        setShowValidationPopup(true)
        setIsValidated(false)
        return
      }

      // Check order status for eligibility
      const status: OrderStatus = {
        financialStatus:
          (node.displayFinancialStatus?.toLowerCase() as OrderFinancialStatus) || 'pending',
        fulfillmentStatus:
          (node.displayFulfillmentStatus?.toLowerCase() as OrderFulfillmentStatus) || null,
        cancelledAt: node.cancelledAt || null,
        displayFinancialStatus: node.displayFinancialStatus,
        displayFulfillmentStatus: node.displayFulfillmentStatus,
      }

      setOrderStatus(status)

      const validation = validateOrderStatus(status)
      if (!validation.isEligible) {
        // Log blocked attempt
        logger.warn('Tax invoice creation blocked', {
          orderNumber: node.name,
          email: checkEmail,
          reason: validation.reason,
          status: status,
        })

        setValidationMessage(validation.message)
        setShowValidationPopup(true)
        setIsValidated(false)
        setShowAdminContact(true)
        return
      }

      // ข้อมูลตรงกัน - อนุญาตให้กรอกฟอร์ม และเก็บ Order GID เพื่อนำไปอัปเดต
      setOrderData({
        id: node.id,
        name: node.name,
        customerId: node.customer?.id || null,
        customer: node.customer,
      })
      setIsValidated(true)
      setValidationMessage('ตรวจสอบข้อมูลสำเร็จ! สามารถกรอกฟอร์มได้')
      // Show success toast and auto-hide, no popup on success
      setShowValidationPopup(false)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)

      // Load existing metafields for this order to pre-populate form
      await loadExistingMetafields(node.id)

      // Show form overlay after a short delay
      setTimeout(() => {
        setShowFormOverlay(true)
        setValidationInProgress(false)
      }, 500)
    } catch (err) {
      setValidationMessage(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล')
      setShowValidationPopup(true)
      setIsValidated(false)
    } finally {
      setLoading(false)
      setValidationInProgress(false)
    }
  }

  // Assign ref for useEffect
  validateParametersRef.current = validateParameters

  // ส่งข้อมูลไปบันทึกเป็น Metafields ที่ออเดอร์ใน Shopify
  const handleSaveTaxInfo = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidated || !orderData?.id) {
      setShowValidationPopup(true)
      setValidationMessage('กรุณาตรวจสอบ Order ID และ Email ให้ถูกต้องก่อนบันทึก')
      return
    }

    setIsSaving(true)
    setSaveMessage('')
    setSaveError('')

    // Required field validations (general)
    if (formData.documentType === 'tax') {
      if (!formData.fullName.trim()) {
        setIsSaving(false)
        setSaveError('กรุณากรอกชื่อ-นามสกุล')
        return
      }
      if (!formData.titleName.trim()) {
        setIsSaving(false)
        setSaveError('กรุณาเลือกคำนำหน้าชื่อ')
        return
      }
    } else if (!formData.companyNameText.trim()) {
      setIsSaving(false)
      setSaveError('กรุณากรอกชื่อบริษัท')
      return
    }
    if (!formData.companyName.trim()) {
      setIsSaving(false)
      setSaveError('กรุณากรอกหมายเลขโทรศัพท์')
      return
    }
    if (!formData.provinceCode) {
      setIsSaving(false)
      setSaveError('กรุณาเลือกจังหวัด')
      return
    }
    if (!formData.districtCode) {
      setIsSaving(false)
      setSaveError('กรุณาเลือกอำเภอ/เขต')
      return
    }
    if (!formData.subdistrictCode) {
      setIsSaving(false)
      setSaveError('กรุณาเลือกตำบล/แขวง')
      return
    }
    if (!formData.postalCode.trim()) {
      setIsSaving(false)
      setSaveError('กรุณากรอกรหัสไปรษณีย์')
      return
    }
    if (!formData.address.trim()) {
      setIsSaving(false)
      setSaveError('กรุณากรอกที่อยู่')
      return
    }

    // Map ชื่อจังหวัด/อำเภอ/ตำบลจาก code ที่เลือก
    const provinceName = provinces.find((p) => p.code === formData.provinceCode)?.nameTh || ''
    const districtName = districts.find((d) => d.code === formData.districtCode)?.nameTh || ''
    const subdistrictName =
      subdistricts.find((s) => s.code === formData.subdistrictCode)?.nameTh || ''

    // แปลงค่าจาก UI เดิมให้ตรงกับฟิลด์ที่ต้องการบันทึก
    const customerType = formData.documentType === 'receipt' ? 'นิติบุคคล' : 'บุคคลธรรมดา'
    const fullNameToSave = formData.fullName || ''
    const companyNameToSave = formData.companyNameText || ''
    const branchTypeTh =
      formData.documentType === 'receipt'
        ? formData.branchType === 'branch'
          ? 'สาขาย่อย'
          : 'สำนักงานใหญ่'
        : ''
    // Validate branch number when "สาขาย่อย"
    if (
      formData.documentType === 'receipt' &&
      formData.branchType === 'branch' &&
      !(formData.branchNumber || '').trim()
    ) {
      setIsSaving(false)
      setSaveError('กรุณากรอกรหัสสาขาย่อย')
      return
    }

    const branchCode = formData.branchType === 'branch' ? formData.branchNumber || '' : ''

    // Normalize and validate 13-digit tax ID (required for all)
    const taxIdDigits = (formData.branchCode || '').replace(/\D/g, '')
    if (!taxIdDigits || taxIdDigits.length !== 13) {
      setIsSaving(false)
      setSaveError(
        formData.documentType === 'receipt'
          ? 'กรุณากรอกหมายเลขประจำตัวผู้เสียภาษีให้ครบ 13 หลัก'
          : 'กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก'
      )
      return
    }
    // Still require branch type selection for juristic
    if (formData.documentType === 'receipt' && !formData.branchType) {
      setIsSaving(false)
      setSaveError('กรุณาเลือกประเภทสาขา')
      return
    }
    // build dashed variant for display in metafields panel
    const taxIdFormatted = (() => {
      const d = taxIdDigits
      const p1 = d.slice(0, 1),
        p2 = d.slice(1, 5),
        p3 = d.slice(5, 10),
        p4 = d.slice(10, 12),
        p5 = d.slice(12, 13)
      return [p1, p2, p3, p4, p5].join('-')
    })()
    const phoneNumber = formData.companyName || ''
    const altPhoneNumber = formData.companyNameEng || ''
    const province = provinceName
    const district = districtName
    const subDistrict = subdistrictName
    const postalCode = formData.postalCode || ''
    const fullAddress = formData.address || ''

    const METAFIELDS_SET = `
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key namespace }
          userErrors { field message code }
        }
      }
    `

    // Build inputs with two key variants for compatibility with Admin definitions
    const baseFields = [
      { key: 'customer_type', value: customerType, type: 'single_line_text_field' },
      { key: 'title_name', value: formData.titleName || '', type: 'single_line_text_field' },
      {
        key: 'full_name',
        value: formData.documentType === 'tax' ? fullNameToSave : '',
        type: 'single_line_text_field',
      },
      {
        key: 'custom_company_name',
        value: formData.documentType === 'receipt' ? companyNameToSave : '',
        type: 'single_line_text_field',
      },
      { key: 'branch_type', value: branchTypeTh, type: 'single_line_text_field' },
      { key: 'branch_code', value: branchCode, type: 'single_line_text_field' },
      { key: 'tax_id', value: taxIdFormatted, type: 'single_line_text_field' },
      { key: 'tax_id_formatted', value: taxIdFormatted, type: 'single_line_text_field' },
      { key: 'phone_number', value: phoneNumber, type: 'single_line_text_field' },
      { key: 'alt_phone_number', value: altPhoneNumber, type: 'single_line_text_field' },
      { key: 'province', value: province, type: 'single_line_text_field' },
      { key: 'district', value: district, type: 'single_line_text_field' },
      { key: 'sub_district', value: subDistrict, type: 'single_line_text_field' },
      { key: 'postal_code', value: postalCode, type: 'single_line_text_field' },
      { key: 'full_address', value: fullAddress, type: 'single_line_text_field' },
    ]

    const metafieldsToSave = baseFields
      .flatMap((f) => [
        { namespace: 'custom', key: f.key, value: f.value, type: f.type },
        { namespace: 'custom', key: `custom_${f.key}`, value: f.value, type: f.type },
        // Special additional key for sub-district per requirement
        ...(f.key === 'sub_district'
          ? [{ namespace: 'custom', key: 'custom_custom_district2', value: f.value, type: f.type }]
          : []),
      ])
      .filter((m) => (m.value ?? '') !== '')

    // Prepare inputs and batch into chunks of 25 to satisfy Shopify limits
    const allInputs = metafieldsToSave.map((m) => ({
      ownerId: orderData.id,
      namespace: m.namespace,
      key: m.key,
      type: m.type,
      value: m.value,
    }))

    try {
      const CHUNK_SIZE = 25
      const userErrors: Array<{ field?: string[]; message: string; code?: string }> = []

      for (let i = 0; i < allInputs.length; i += CHUNK_SIZE) {
        const chunk = allInputs.slice(i, i + CHUNK_SIZE)
        const variables = { metafields: chunk }

        const resp = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: METAFIELDS_SET, variables }),
        })
        const json = (await resp.json()) as ShopifyGraphQLResponse<MetafieldsSetResponse>

        if (!resp.ok || json?.errors) {
          const errMsg = json?.errors?.[0]?.message || 'Failed to save metafields'
          throw new Error(errMsg)
        }
        if (json?.data?.metafieldsSet?.userErrors?.length) {
          userErrors.push(...json.data.metafieldsSet.userErrors)
        }
      }

      if (userErrors.length) {
        const ue = userErrors[0]
        const errMsg = `${ue.message}${ue.code ? ` (${ue.code})` : ''}${
          ue.field ? ` [${ue.field}]` : ''
        }`
        throw new Error(errMsg)
      }

      // Aggregate into JSON array metafield: custom.default_tax_profile
      // Prefer Customer owner if available (so it shows on Customer page), fallback to Order
      const ownerCustomerId = orderData.customerId || orderData.customer?.id || null
      let profiles: any[] = []
      let existingValue: string | undefined

      if (ownerCustomerId) {
        const GET_CUSTOMER_PROFILE = `
          query getDefaultTaxProfile($id: ID!) {
            customer(id: $id) {
              id
              metafield(namespace: "custom", key: "default_tax_profile") {
                id
                value
                type
              }
            }
          }
        `
        const profileRes = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: GET_CUSTOMER_PROFILE, variables: { id: ownerCustomerId } }),
        })
        const profileJson = (await profileRes.json()) as ShopifyGraphQLResponse<{
          customer: { metafield?: { id?: string; value?: string; type?: string } | null } | null
        }>
        existingValue = profileJson?.data?.customer?.metafield?.value
      }
      // Fallback: try order-level if customer-level empty
      if (!existingValue) {
        const GET_ORDER_PROFILE = `
          query getDefaultTaxProfile($id: ID!) {
            order(id: $id) {
              id
              metafield(namespace: "custom", key: "default_tax_profile") {
                id
                value
                type
              }
            }
          }
        `
        const profileRes2 = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: GET_ORDER_PROFILE, variables: { id: orderData.id } }),
        })
        const profileJson2 = (await profileRes2.json()) as ShopifyGraphQLResponse<{
          order: { metafield?: { id?: string; value?: string; type?: string } | null } | null
        }>
        existingValue = profileJson2?.data?.order?.metafield?.value
      }

      if (existingValue) {
        try {
          const parsed = JSON.parse(existingValue)
          if (Array.isArray(parsed)) {
            profiles = parsed
          }
        } catch {
          // ignore invalid json and start fresh
          profiles = []
        }
      }

      // 2) Build current profile payload
      const currentProfile = {
        customer_type: customerType,
        title_name: formData.titleName || '',
        full_name: formData.documentType === 'tax' ? fullNameToSave : '',
        custom_company_name: formData.documentType === 'receipt' ? companyNameToSave : '',
        branch_type: branchTypeTh,
        branch_code: branchCode,
        tax_id: taxIdDigits,
        tax_id_formatted: taxIdFormatted,
        phone_number: phoneNumber,
        alt_phone_number: altPhoneNumber,
        province,
        district,
        sub_district: subDistrict,
        postal_code: postalCode,
        full_address: fullAddress,
        savedAt: new Date().toISOString(),
        status: 'normal' as 'default' | 'normal',
      }

      // 3) Upsert by key (tax_id + branch_code + full_address)
      const keyMatch = (p: any) =>
        (p?.tax_id || '') === currentProfile.tax_id &&
        (p?.branch_code || '') === currentProfile.branch_code &&
        (p?.full_address || '') === currentProfile.full_address

      const existingIndex = profiles.findIndex(keyMatch)
      if (existingIndex >= 0) {
        // Preserve existing status when updating
        const existingStatus = profiles[existingIndex]?.status === 'default' ? 'default' : 'normal'
        profiles[existingIndex] = {
          ...profiles[existingIndex],
          ...currentProfile,
          status: existingStatus,
        }
      } else {
        // Determine status for new entry: keep exactly one default
        const hasDefault = profiles.some((p) => p?.status === 'default')
        currentProfile.status = hasDefault ? 'normal' : 'default'
        profiles.push(currentProfile)
      }

      // 4) Enforce only one default (if multiple somehow exist, keep the earliest one)
      const defaultIndices = profiles
        .map((p, idx) => (p?.status === 'default' ? idx : -1))
        .filter((i) => i >= 0)
      if (defaultIndices.length > 1) {
        const keep = defaultIndices[0]
        profiles = profiles.map((p, idx) => ({ ...p, status: idx === keep ? 'default' : 'normal' }))
      }

      // 4.1) Deduplicate by tax_id_formatted so only 1 record per tax ID is kept
      {
        const groups: Record<string, any[]> = {}
        for (const p of profiles as any[]) {
          const key = String((p && (p.tax_id_formatted || p.tax_id)) || '')
          if (!groups[key]) groups[key] = []
          groups[key].push(p)
        }
        const deduped: any[] = []
        for (const key in groups) {
          const arr: any[] = groups[key]
          if (!key) {
            // If key is empty, keep all as-is (shouldn't normally happen)
            deduped.push(...arr)
            continue
          }
          // Prefer the one marked default
          const preferred = arr.find((x: any) => x && x.status === 'default')
          if (preferred) {
            deduped.push(preferred)
          } else if (arr.length) {
            // Otherwise, keep the most recently saved
            const sorted = arr
              .slice()
              .sort(
                (a: any, b: any) =>
                  new Date(b?.savedAt || 0).getTime() - new Date(a?.savedAt || 0).getTime()
              )
            deduped.push(sorted[0])
          }
        }
        profiles = deduped
      }

      // 4.2) Re-enforce only one default globally after deduplication
      {
        const defaultIdxs = profiles
          .map((p, idx) => (p?.status === 'default' ? idx : -1))
          .filter((i) => i >= 0)
        if (defaultIdxs.length === 0 && profiles.length) {
          profiles[0] = { ...profiles[0], status: 'default' }
        } else if (defaultIdxs.length > 1) {
          const keep = defaultIdxs[0]
          profiles = profiles.map((p, idx) => ({
            ...p,
            status: idx === keep ? 'default' : 'normal',
          }))
        }
      }

      // 5) Save back to Shopify as JSON metafield
      const SAVE_DEFAULT_PROFILE = `
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id key namespace }
            userErrors { field message code }
          }
        }
      `
      // Save to customer (if available)
      if (ownerCustomerId) {
        const variablesCust = {
          metafields: [
            {
              ownerId: ownerCustomerId,
              namespace: 'custom',
              key: 'default_tax_profile',
              type: 'json',
              value: JSON.stringify(profiles),
            },
          ],
        }
        const respCust = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: SAVE_DEFAULT_PROFILE, variables: variablesCust }),
        })
        const jsonCust = (await respCust.json()) as ShopifyGraphQLResponse<MetafieldsSetResponse>
        if (!respCust.ok || jsonCust?.errors) {
          const errMsg =
            jsonCust?.errors?.[0]?.message || 'Failed to save default tax profile (customer)'
          throw new Error(errMsg)
        }
        if (jsonCust?.data?.metafieldsSet?.userErrors?.length) {
          const ue = jsonCust.data.metafieldsSet.userErrors[0]
          const errMsg = `${ue.message}${ue.code ? ` (${ue.code})` : ''}${
            ue.field ? ` [${ue.field}]` : ''
          }`
          throw new Error(errMsg)
        }
      }
      // Also save to order for reference
      {
        const variablesOrd = {
          metafields: [
            {
              ownerId: orderData.id,
              namespace: 'custom',
              key: 'default_tax_profile',
              type: 'json',
              value: JSON.stringify(profiles),
            },
          ],
        }
        const respOrd = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: SAVE_DEFAULT_PROFILE, variables: variablesOrd }),
        })
        const jsonOrd = (await respOrd.json()) as ShopifyGraphQLResponse<MetafieldsSetResponse>
        if (!respOrd.ok || jsonOrd?.errors) {
          const errMsg =
            jsonOrd?.errors?.[0]?.message || 'Failed to save default tax profile (order)'
          throw new Error(errMsg)
        }
        if (jsonOrd?.data?.metafieldsSet?.userErrors?.length) {
          const ue = jsonOrd.data.metafieldsSet.userErrors[0]
          const errMsg = `${ue.message}${ue.code ? ` (${ue.code})` : ''}${
            ue.field ? ` [${ue.field}]` : ''
          }`
          throw new Error(errMsg)
        }
      }

      // Confirm by reading back the saved metafields
      const GET_ORDER_METAFIELDS = `
        query getOrderMetafields($id: ID!) {
          order(id: $id) {
            id
            metafields(first: 100, namespace: "custom") {
              nodes { key value type }
            }
          }
        }
      `
      const confirmRes = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: GET_ORDER_METAFIELDS, variables: { id: orderData.id } }),
      })
      const confirmJson = (await confirmRes.json()) as ShopifyGraphQLResponse<OrderQueryResponse>
      // Verify the metafields were saved successfully
      if (!confirmJson?.data?.order?.metafields?.nodes?.length) {
        logger.warn('No metafields found after save')
      }
      setSaveMessage('บันทึกข้อมูลใบกำกับภาษีสำเร็จ!')
      setShowSavePopup(true)
      // Keep Tax ID as digits only (no dashes) after save
      const fmtId = (raw: string) => {
        const d = String(raw || '')
          .replace(/\D/g, '')
          .slice(0, 13)
        return d
      }
      setFormData((prev) => ({ ...prev, branchCode: fmtId(prev.branchCode) }))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Initial validation screen */}
      {validationInProgress && !showFormOverlay && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">กำลังตรวจสอบข้อมูล</h3>
            <p className="text-gray-600">กรุณารอสักครู่...</p>
          </div>
        </div>
      )}

      {/* Form Overlay - shows after successful validation */}
      {showFormOverlay && isValidated && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto z-40">
          <div className="min-h-screen px-4 text-center">
            {/* This element is to trick the browser into centering the modal contents. */}
            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">เพิ่มข้อมูลสำหรับออกใบกำกับภาษี</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowFormOverlay(false)
                    handleGoBack()
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Order Status Alert */}
              {orderStatus && !validateOrderStatus(orderStatus).isEligible && orderData && (
                <OrderStatusAlert
                  status={orderStatus}
                  message={validateOrderStatus(orderStatus).message}
                  orderNumber={orderData.name}
                />
              )}

              {/* Admin Contact Modal */}
              {showAdminContact && orderStatus && orderData && (
                <AdminContactModal
                  isOpen={showAdminContact}
                  onClose={() => setShowAdminContact(false)}
                  orderNumber={orderData.name}
                  orderStatus={orderStatus}
                  customerEmail={email}
                />
              )}

              {/* Validation Popup */}
              {showValidationPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex items-center mb-4">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                          isValidated ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {isValidated ? (
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <h3
                        className={`text-lg font-semibold ${
                          isValidated ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {isValidated ? 'ตรวจสอบสำเร็จ' : 'ข้อผิดพลาด'}
                      </h3>
                    </div>
                    <p className="text-gray-700 mb-4 text-center">{validationMessage}</p>
                    <button
                      type="button"
                      onClick={() => setShowValidationPopup(false)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
                    >
                      ตกลง
                    </button>
                  </div>
                </div>
              )}

              {/* Success Toast */}
              {showSuccessToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                  <div className="flex items-center space-x-3 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">ตรวจสอบข้อมูลสำเร็จ</span>
                    <span className="opacity-90">สามารถกรอกฟอร์มได้</span>
                  </div>
                </div>
              )}

              {/* Save Success Popup */}
              {showSavePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="flex items-center mb-4">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3 bg-green-100">
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-green-800">บันทึกสำเร็จ</h3>
                    </div>
                    <p className="text-gray-700 mb-4 text-center">บันทึกข้อมูลใบกำกับภาษีเรียบร้อยแล้ว</p>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleGoToShop}
                        className="min-w-[200px] bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md"
                      >
                        กลับไปหน้าก่อนหน้า
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveTaxInfo} className="space-y-6">
                {/* Document Type Radio Buttons */}
                <div className="space-y-3">
                  <div className="radio-group flex flex-wrap items-center gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="documentType"
                        value="tax"
                        checked={formData.documentType === 'tax'}
                        onChange={() => handleRadioChange('tax')}
                        className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <span
                        className={`${formData.documentType === 'tax' ? 'text-red-600' : 'text-gray-600'} font-medium`}
                      >
                        บุคคลธรรมดา
                      </span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="documentType"
                        value="receipt"
                        checked={formData.documentType === 'receipt'}
                        onChange={() => handleRadioChange('receipt')}
                        className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <span
                        className={`${formData.documentType === 'receipt' ? 'text-red-600' : 'text-gray-600'} font-medium`}
                      >
                        นิติบุคคล
                      </span>
                    </label>
                  </div>
                </div>

                {/* Title Name and Name/Company Name Row */}
                {formData.documentType === 'tax' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Title Name - 1/3 width */}
                    <div className="space-y-2">
                      <label className="block text-gray-700 font-medium">คำนำหน้าชื่อ</label>
                      <div className="relative">
                        <select
                          name="titleName"
                          value={formData.titleName}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              titleName: e.target.value,
                            }))
                          }
                          onInvalid={(e) => {
                            ;(e.target as HTMLSelectElement).setCustomValidity('กรุณาเลือกคำนำหน้าชื่อ')
                          }}
                          onInput={(e) => {
                            ;(e.target as HTMLSelectElement).setCustomValidity('')
                          }}
                          required={formData.documentType === 'tax'}
                          className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                        >
                          <option value="">เลือกคำนำหน้าชื่อ</option>
                          <option value="นาย">นาย</option>
                          <option value="นาง">นาง</option>
                          <option value="นางสาว">นางสาว</option>
                        </select>
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>

                    {/* Name - 2/3 width */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-gray-700 font-medium">ชื่อ-นามสกุล</label>
                      <input
                        key={`fullName-${formData.documentType}`}
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        autoComplete="name"
                        onInvalid={(e) => {
                          ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกชื่อ-นามสกุล')
                        }}
                        onInput={(e) => {
                          ;(e.target as HTMLInputElement).setCustomValidity('')
                        }}
                        placeholder="ชื่อ-นามสกุล"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ) : (
                  /* Company Name - Full Width for juristic person */
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">ชื่อบริษัท</label>
                    <input
                      key={`companyName-${formData.documentType}`}
                      type="text"
                      name="companyNameText"
                      value={formData.companyNameText}
                      onChange={handleInputChange}
                      autoComplete="organization"
                      onInvalid={(e) => {
                        ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกชื่อบริษัท')
                      }}
                      onInput={(e) => {
                        ;(e.target as HTMLInputElement).setCustomValidity('')
                      }}
                      placeholder="ชื่อบริษัท"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Head office / Branch for juristic person */}
                {formData.documentType === 'receipt' && (
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">สาขา</label>
                    <div className="flex items-center space-x-6 gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="branchType"
                          value="head"
                          checked={formData.branchType === 'head'}
                          onChange={() => setFormData((p) => ({ ...p, branchType: 'head' }))}
                          required={formData.documentType === 'receipt' && !formData.branchType}
                          className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span
                          className={`${formData.branchType === 'head' ? 'text-red-600' : 'text-gray-600'} font-medium`}
                        >
                          สำนักงานใหญ่
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="branchType"
                          value="branch"
                          checked={formData.branchType === 'branch'}
                          onChange={() => setFormData((p) => ({ ...p, branchType: 'branch' }))}
                          className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
                        />
                        <span
                          className={`${formData.branchType === 'branch' ? 'text-red-600' : 'text-gray-600'} font-medium`}
                        >
                          สาขาย่อย
                        </span>
                      </label>
                    </div>

                    {/* Sub-branch code input */}
                    {formData.branchType === 'branch' && (
                      <div className="space-y-2 pt-2">
                        <label className="block text-gray-700">รหัสสาขาย่อย</label>
                        <input
                          type="text"
                          name="branchNumber"
                          value={formData.branchNumber || ''}
                          onChange={handleInputChange}
                          onInvalid={(e) => {
                            ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกรหัสสาขาย่อย')
                          }}
                          onInput={(e) => {
                            ;(e.target as HTMLInputElement).setCustomValidity('')
                          }}
                          placeholder="รหัสสาขาย่อย"
                          inputMode="numeric"
                          required={formData.branchType === 'branch'}
                          className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Tax Identification Number - Full Width */}
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">
                    {formData.documentType === 'receipt'
                      ? 'หมายเลขประจำตัวผู้เสียภาษี'
                      : 'เลขประจำตัวประชาชน'}
                    <span className="ml-2 text-gray-500 text-sm">
                      (กรอกเลข 13 หลักโดยไม่ต้องมีขีดคั่นหรือเว้นวรรค)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="branchCode"
                    value={formData.branchCode}
                    onChange={handleInputChange}
                    onInvalid={(e) => {
                      ;(e.target as HTMLInputElement).setCustomValidity(
                        formData.documentType === 'receipt'
                          ? 'กรุณากรอกหมายเลขประจำตัวผู้เสียภาษี'
                          : 'กรุณากรอกเลขประจำตัวประชาชน'
                      )
                    }}
                    onInput={(e) => {
                      ;(e.target as HTMLInputElement).setCustomValidity('')
                    }}
                    placeholder={`${formData.documentType === 'receipt' ? 'หมายเลขประจำตัวผู้เสียภาษี' : 'เลขประจำตัวประชาชน'} (กรอกเลข 13 หลักโดยไม่ต้องมีขีดคั่นหรือเว้นวรรค)`}
                    inputMode="tel"
                    maxLength={13}
                    onBlur={(e) => {
                      const d = String(e.target.value || '')
                        .replace(/\D/g, '')
                        .slice(0, 13)
                      setFormData((prev) => ({ ...prev, branchCode: d }))
                    }}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Phone Numbers Row - Two Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">หมายเลขโทรศัพท์</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      onInvalid={(e) => {
                        ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกหมายเลขโทรศัพท์')
                      }}
                      onInput={(e) => {
                        ;(e.target as HTMLInputElement).setCustomValidity('')
                      }}
                      placeholder="หมายเลขโทรศัพท์"
                      inputMode="tel"
                      maxLength={12}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">
                      หมายเลขโทรศัพท์สำรอง (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      name="companyNameEng"
                      value={formData.companyNameEng}
                      onChange={handleInputChange}
                      placeholder="หมายเลขโทรศัพท์สำรอง"
                      inputMode="tel"
                      maxLength={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Province and District Row - Two Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">จังหวัด</label>
                    <div className="relative">
                      <select
                        name="provinceCode"
                        value={formData.provinceCode ?? ''}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            provinceCode: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        onInvalid={(e) => {
                          ;(e.target as HTMLSelectElement).setCustomValidity('กรุณาเลือกจังหวัด')
                        }}
                        onInput={(e) => {
                          ;(e.target as HTMLSelectElement).setCustomValidity('')
                        }}
                        required
                        className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                      >
                        <option value="">เลือกจังหวัด</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.nameTh}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">อำเภอ/ เขต</label>
                    <div className="relative">
                      <select
                        name="districtCode"
                        value={formData.districtCode ?? ''}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            districtCode: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        onInvalid={(e) => {
                          ;(e.target as HTMLSelectElement).setCustomValidity('กรุณาเลือกอำเภอ/เขต')
                        }}
                        onInput={(e) => {
                          ;(e.target as HTMLSelectElement).setCustomValidity('')
                        }}
                        disabled={!formData.provinceCode}
                        required
                        className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
                      >
                        <option value="">เลือกอำเภอ/เขต</option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.nameTh}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subdistrict and Postal Code Row - Two Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">ตำบล/ แขวง</label>
                    <div className="relative">
                      <select
                        name="subdistrictCode"
                        value={formData.subdistrictCode ?? ''}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            subdistrictCode: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        onInvalid={(e) => {
                          ;(e.target as HTMLSelectElement).setCustomValidity('กรุณาเลือกตำบล/แขวง')
                        }}
                        onInput={(e) => {
                          ;(e.target as HTMLSelectElement).setCustomValidity('')
                        }}
                        disabled={!formData.districtCode}
                        required
                        className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-white cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
                      >
                        <option value="">เลือกตำบล/แขวง</option>
                        {subdistricts.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.nameTh}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">รหัสไปรษณีย์</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      onInvalid={(e) => {
                        ;(e.target as HTMLInputElement).setCustomValidity('กรุณากรอกรหัสไปรษณีย์')
                      }}
                      onInput={(e) => {
                        ;(e.target as HTMLInputElement).setCustomValidity('')
                      }}
                      placeholder="รหัสไปรษณีย์"
                      inputMode="numeric"
                      maxLength={5}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Address - Full Width */}
                <div className="space-y-2">
                  <label className="block text-gray-700 font-medium">
                    ที่อยู่
                    <span className="ml-2 text-gray-500 text-sm">
                      {formData.documentType === 'receipt'
                        ? '(กรอกตามที่อยู่จดทะเบียนบริษัท)'
                        : '(กรอก เลขที่, ชื่อหมู่บ้าน อาคาร คอนโด, หมู่ที่, ซอย, ถนน)'}
                    </span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onInvalid={(e) => {
                      ;(e.target as HTMLTextAreaElement).setCustomValidity('กรุณากรอกที่อยู่')
                    }}
                    onInput={(e) => {
                      ;(e.target as HTMLTextAreaElement).setCustomValidity('')
                    }}
                    placeholder="ที่อยู่"
                    rows={3}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 sm:px-5 sm:py-2.5 text-sm sm:text-base rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                  {!isValidated && (
                    <p className="mt-2 text-sm text-gray-500">
                      กรุณาเข้าถึงหน้านี้ผ่าน URL ที่มี Order ID และ Email ที่ถูกต้อง
                    </p>
                  )}
                  {saveMessage && <p className="mt-2 text-sm text-green-600">{saveMessage}</p>}
                  {saveError && <p className="mt-2 text-sm text-red-600">Error: {saveError}</p>}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Original content for non-overlay mode */}
      {!showFormOverlay && (
        <div className="tax-form max-w-6xl mx-auto bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-8 md:p-10 m-4 md:m-6">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
              เพิ่มข้อมูลสำหรับออกใบกำกับภาษี
            </h1>
            <button
              type="button"
              onClick={handleGoBack}
              className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors duration-200"
            >
              ย้อนกลับ
            </button>
          </div>

          {!isValidated && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p className="text-gray-600 text-lg">กรุณารอการตรวจสอบข้อมูล</p>
              <p className="text-gray-500 mt-2">ระบบกำลังตรวจสอบ Order ID และ Email จาก URL</p>
            </div>
          )}
        </div>
      )}

      {/* Order Status Alert */}
      {orderStatus && !validateOrderStatus(orderStatus).isEligible && orderData && (
        <OrderStatusAlert
          status={orderStatus}
          message={validateOrderStatus(orderStatus).message}
          orderNumber={orderData.name}
        />
      )}

      {/* Admin Contact Modal */}
      {showAdminContact && orderStatus && orderData && (
        <AdminContactModal
          isOpen={showAdminContact}
          onClose={() => setShowAdminContact(false)}
          orderNumber={orderData.name}
          orderStatus={orderStatus}
          customerEmail={email}
        />
      )}

      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                  isValidated ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {isValidated ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <h3
                className={`text-lg font-semibold ${
                  isValidated ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {isValidated ? 'ตรวจสอบสำเร็จ' : 'ข้อผิดพลาด'}
              </h3>
            </div>
            <p className="text-gray-700 mb-4 text-center">{validationMessage}</p>
            <button
              type="button"
              onClick={() => setShowValidationPopup(false)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center space-x-3 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">ตรวจสอบข้อมูลสำเร็จ</span>
            <span className="opacity-90">สามารถกรอกฟอร์มได้</span>
          </div>
        </div>
      )}

      {/* Save Success Popup */}
      {showSavePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3 bg-green-100">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800">บันทึกสำเร็จ</h3>
            </div>
            <p className="text-gray-700 mb-4 text-center">บันทึกข้อมูลใบกำกับภาษีเรียบร้อยแล้ว</p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleGoToShop}
                className="min-w-[200px] bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md"
              >
                กลับไปหน้าก่อนหน้า
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
