'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface FormData {
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

// Minimal shape for order data we show on screen
type OrderData = {
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

export default function TaxInvoiceForm() {
  const router = useRouter()
  // Guard to prevent cascading resets when we are pre-filling from metafields
  const prefillGuard = useRef(false)
  const [referrerUrl, setReferrerUrl] = useState<string | null>(null)
  // Timestamp to help detect orders created after landing on this page
  const arrivalAtRef = useRef<string>(new Date().toISOString())
  const [formData, setFormData] = useState<FormData>({
    documentType: 'tax',
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
    branchNumber: ''
  })

  // Cascading options loaded from lib/geography/thailand.ts via dynamic import
  const [provinces, setProvinces] = useState<Array<{ code: number; nameTh: string; nameEn: string }>>([])
  const [districts, setDistricts] = useState<Array<{ code: number; nameTh: string; nameEn: string }>>([])
  const [subdistricts, setSubdistricts] = useState<Array<{ code: number; nameTh: string; nameEn: string; postalCode: number }>>([])

  // URL parameter validation states
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  
  const searchParams = useSearchParams()

  // Helper: Fetch latest order by email with createdAt for recency checks
  const fetchLatestOrderByEmail = async (customerEmail: string): Promise<{ orderNumber: string; createdAt: string } | null> => {
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
      let result: any
      try { result = await response.json() } catch { result = null }
      const node = result?.data?.orders?.edges?.[0]?.node
      if (!node) return null
      if ((node.customer?.email || '').toLowerCase() !== customerEmail.toLowerCase()) return null
      const orderNumber = String((node.name || '').replace(/^#/, ''))
      const createdAt = String(node.createdAt || '')
      if (!orderNumber || !createdAt) return null
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
        if (res) return res
      }
      // Fallback: if none found after arrival (index lag), try without created_at but still return something
      const fallbackQueries = [
        `email:"${customerEmail}"`,
        `customer_email:"${customerEmail}"`,
      ]
      for (const q of fallbackQueries) {
        const res = await runSearch(q)
        if (res) return res
      }
      return null
    } catch (e) {
      console.warn('fetchLatestOrderByEmail failed', e)
      return null
    }
  }

  // Poll until a newly created order (>= arrival time minus a small skew) appears
  const waitForNewestOrderAfter = async (customerEmail: string, timeoutMs = 60000, intervalMs = 1500): Promise<string | null> => {
    const skewMs = 60000 // 1 minute clock/indexing skew tolerance
    const deadline = Date.now() + timeoutMs
    const arrival = new Date(arrivalAtRef.current).getTime()
    let lastSeen: { orderNumber: string; createdAt: string } | null = null
    while (Date.now() < deadline) {
      const latest = await fetchLatestOrderByEmail(customerEmail)
      if (latest) {
        lastSeen = latest
        const createdTs = new Date(latest.createdAt).getTime()
        if (!isNaN(createdTs) && createdTs >= (arrival - skewMs)) {
          return latest.orderNumber
        }
      }
      await new Promise(r => setTimeout(r, intervalMs))
    }
    // Fallback: return whatever we last saw (may be previous order)
    return lastSeen?.orderNumber ?? null
  }

  // Load provinces and auto-validate URL parameters on mount
  useEffect(() => {
    let mounted = true
    // Remember the URL before arriving here
    if (typeof window !== 'undefined') {
      const ref = document.referrer || ''
      setReferrerUrl(ref || null)
    }
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) return
      setProvinces(geo.getProvinces())
    })
    
    // Auto-validate URL parameters
    const urlOrderId = searchParams.get('order')
    const urlEmail = searchParams.get('email')
    
    if (urlOrderId && urlEmail) {
      setOrderId(urlOrderId)
      setEmail(urlEmail)
      // Auto-validate immediately
      setTimeout(() => {
        if (mounted) {
          validateParameters(urlOrderId, urlEmail)
        }
      }, 100)
    } else if (urlEmail && !urlOrderId) {
      // If email exists but order is missing, try to auto-detect the latest order for this email
      (async () => {
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
              if (mounted) validateParameters(found, urlEmail)
            }, 100)
          } else {
            setValidationMessage('ไม่พบออเดอร์ล่าสุดของอีเมลนี้ กรุณาระบุ Order ID ด้วยตนเอง')
            setShowValidationPopup(true)
            setIsValidated(false)
          }
        } catch (_) {
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
    
    return () => { mounted = false }
  }, [searchParams])

  // When province changes, load districts
  useEffect(() => {
    if (formData.provinceCode == null) {
      setDistricts([])
      setSubdistricts([])
      setFormData((p) => ({ ...p, districtCode: null, subdistrictCode: null, postalCode: '' }))
      return
    }
    let mounted = true
    import('@/lib/geography/thailand').then((geo) => {
      if (!mounted) return
      setDistricts(geo.getDistrictsByProvince(formData.provinceCode!))
      // reset lower levels only when not pre-filling
      if (!prefillGuard.current) {
        setSubdistricts([])
        setFormData((p) => ({ ...p, districtCode: null, subdistrictCode: null, postalCode: '' }))
      }
    })
    return () => { mounted = false }
  }, [formData.provinceCode])

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
      if (!mounted) return
      setSubdistricts(geo.getSubdistrictsByDistrict(formData.districtCode!))
      if (!prefillGuard.current) {
        setFormData((p) => ({ ...p, subdistrictCode: null, postalCode: '' }))
      }
    })
    return () => { mounted = false }
  }, [formData.districtCode])

  // When subdistrict changes, auto-fill postal code
  useEffect(() => {
    if (formData.subdistrictCode == null) return
    import('@/lib/geography/thailand').then((geo) => {
      const item = geo.findBySubdistrictCode(formData.subdistrictCode!)
      if (item) setFormData((p) => ({ ...p, postalCode: String(item.postalCode) }))
    })
  }, [formData.subdistrictCode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Helper: format Thai phone number with dashes as user types
    const formatThaiPhone = (raw: string) => {
      const digits = raw.replace(/\D/g, '').slice(0, 10)
      if (!digits) return ''
      // Bangkok landline starts with 02 -> format 02-XXX-XXXX
      if (digits.startsWith('02')) {
        if (digits.length <= 2) return digits
        if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
        if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
        return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 9)}${digits.length > 9 ? digits.slice(9) : ''}`
      }
      // Mobile and other numbers -> format 0xx-xxx-xxxx
      if (digits.length <= 3) return digits
      if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }

    if (name === 'companyName' || name === 'companyNameEng') {
      setFormData(prev => ({ ...prev, [name]: formatThaiPhone(value) }))
      return
    }
    // Helper: format 13-digit Thai ID/Tax ID -> 1-2345-67890-12-3
    const formatThaiId13 = (raw: string) => {
      const d = raw.replace(/\D/g, '').slice(0, 13)
      if (!d) return ''
      const p1 = d.slice(0, 1)
      const p2 = d.slice(1, 5)
      const p3 = d.slice(5, 10)
      const p4 = d.slice(10, 12)
      const p5 = d.slice(12, 13)
      let out = p1
      if (p2) out += '-' + p2
      if (p3) out += '-' + p3
      if (p4) out += '-' + p4
      if (p5) out += '-' + p5
      return out
    }
    if (name === 'branchCode') {
      setFormData(prev => ({ ...prev, [name]: formatThaiId13(value) }))
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.documentNumber.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล')
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
      id: Date.now().toString()
    }
    
    const existingData = JSON.parse(localStorage.getItem('taxInvoiceData') || '[]')
    existingData.push(savedData)
    localStorage.setItem('taxInvoiceData', JSON.stringify(existingData))
    
    alert('บันทึกข้อมูลเรียบร้อยแล้ว!')
    
    // Reset form
    setFormData({
      documentType: 'tax',
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
      branchNumber: ''
    })
    
    setProvinces([])
    setDistricts([])
    setSubdistricts([])
  }

  const handleRadioChange = (value: 'tax' | 'receipt') => {
    setFormData(prev => ({
      ...prev,
      documentType: value,
      // reset branch type when switching to บุคคลธรรมดา
      branchType: value === 'receipt' ? (prev.branchType ?? 'head') : null,
      branchNumber: value === 'receipt' ? prev.branchNumber : ''
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
      
      const result: any = await response.json()
      const nodes = result?.data?.order?.metafields?.nodes || []
      
      if (nodes.length > 0) {
        // Create a map of metafield keys to values
        const metaMap: Record<string, string> = {}
        nodes.forEach((node: any) => {
          metaMap[node.key] = node.value || ''
        })
        
        // Debug: Log all retrieved metafields
        console.log('Retrieved metafields:', metaMap)
        
        // Map metafields back to form data
        const customerType = metaMap['customer_type'] || metaMap['custom_customer_type'] || ''
        const companyName = metaMap['company_name'] || metaMap['custom_company_name'] || ''
        const branchType = metaMap['branch_type'] || metaMap['custom_branch_type'] || ''
        const branchCode = metaMap['branch_code'] || metaMap['custom_branch_code'] || ''
        const taxId = metaMap['tax_id'] || metaMap['custom_tax_id'] || ''
        const phoneNumber = metaMap['phone_number'] || metaMap['custom_phone_number'] || ''
        const altPhoneNumber = metaMap['alt_phone_number'] || metaMap['custom_alt_phone_number'] || ''
        const province = metaMap['province'] || metaMap['custom_province'] || (orderData?.customer?.defaultAddress?.province ?? '')
        const district = (
          metaMap['district'] ||
          metaMap['custom_district'] ||
          metaMap['custom_custom_district'] ||
          metaMap['district_th'] ||
          metaMap['amphoe'] ||
          metaMap['amphur'] ||
          (orderData?.customer?.defaultAddress?.city ?? '')
        )
        const subDistrict = (
          metaMap['sub_district'] ||
          metaMap['custom_sub_district'] ||
          metaMap['custom_custom_district2'] ||
          metaMap['tambon'] ||
          metaMap['khwaeng'] ||
          ''
        )
        const postalCode = (
          metaMap['postal_code'] ||
          metaMap['custom_postal_code'] ||
          metaMap['postcode'] ||
          metaMap['post_code'] ||
          metaMap['zip'] ||
          metaMap['custom_zip'] ||
          (orderData?.customer?.defaultAddress?.zip ?? '')
        )
        const fullAddress = metaMap['full_address'] || metaMap['custom_full_address'] || ''
        
        // Debug: Log extracted values
        console.log('Extracted values for geo matching:', {
          province, district, subDistrict, postalCode
        })
        
        // Helper to format 13-digit tax ID for display
        const fmtId = (raw: string) => {
          const d = String(raw || '').replace(/\D/g, '').slice(0,13)
          if (!d) return ''
          const p1 = d.slice(0,1), p2 = d.slice(1,5), p3 = d.slice(5,10), p4 = d.slice(10,12), p5 = d.slice(12,13)
          return [p1, p2, p3, p4, p5].filter(Boolean).join('-')
        }

        // Update form data with existing values
        setFormData(prev => ({
          ...prev,
          documentType: customerType === 'นิติบุคคล' ? 'receipt' : 'tax',
          documentNumber: companyName,
          branchCode: fmtId(taxId),
          companyName: phoneNumber,
          companyNameEng: altPhoneNumber,
          address: fullAddress,
          postalCode: postalCode,
          branchType: branchType === 'สาขาย่อย' ? 'branch' : (branchType === 'สำนักงานใหญ่' ? 'head' : null),
          branchNumber: branchCode,
        }))
        
        // Load geography data and set codes based on names
        import('@/lib/geography/thailand').then((geo) => {
          // prevent cascading effects from wiping our prefilled values
          prefillGuard.current = true
          console.log('Prefill start')
          const normalize = (s: string) => (s || '')
            .replace(/^\s*(จังหวัด|จ\.|อำเภอ|อ\.|เขต|ตำบล|ต\.|แขวง)\s*/,'')
            .replace(/[()]/g,'')
            .trim()
            .toLowerCase()
          
          if (province) {
            const provinceData = geo.getProvinces().find(p =>
              normalize(p.nameTh) === normalize(province) ||
              normalize(p.nameEn) === normalize(province) ||
              p.nameTh === province || p.nameEn === province
            )
            if (provinceData) {
              setFormData(prev => ({ ...prev, provinceCode: provinceData.code }))
              
              const districts = geo.getDistrictsByProvince(provinceData.code)
              let districtData = null as any
              if (district) {
                districtData = districts.find(d =>
                  normalize(d.nameTh) === normalize(district) ||
                  normalize(d.nameEn) === normalize(district) ||
                  d.nameTh === district || d.nameEn === district
                ) || null
              }
              // Fallback: try to find by postal code via subdistricts
              if (!districtData && postalCode && String(postalCode).length >= 5) {
                for (const d of districts) {
                  const subs = geo.getSubdistrictsByDistrict(d.code)
                  if (subs.some(s => String(s.postalCode).startsWith(String(postalCode)))) {
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
                  const hit = subs.find(s => normalize(s.nameTh) === normSub || normalize(s.nameEn) === normSub)
                  if (hit) {
                    districtData = d
                    break
                  }
                }
              }
              if (districtData) {
                setFormData(prev => ({ ...prev, districtCode: districtData.code }))
                const subdistricts = geo.getSubdistrictsByDistrict(districtData.code)
                let subdistrictData = null as any
                if (subDistrict) {
                  subdistrictData = subdistricts.find(s =>
                    normalize(s.nameTh) === normalize(subDistrict) ||
                    normalize(s.nameEn) === normalize(subDistrict) ||
                    s.nameTh === subDistrict || s.nameEn === subDistrict
                  ) || null
                }
                if (!subdistrictData && postalCode && String(postalCode).length >= 5) {
                  subdistrictData = subdistricts.find(s => String(s.postalCode) === String(postalCode)) || null
                }
                // Fallback 3: if still not found, try first subdistrict that matches by name across province (already tried), or leave empty
                if (subdistrictData) {
                  setFormData(prev => ({ ...prev, subdistrictCode: subdistrictData.code, postalCode: String(subdistrictData.postalCode || postalCode) }))
                }
              } else {
                // Final fallback: try to locate subdistrict anywhere in province by name/postal then infer its district
                let found: { dCode: number, sCode: number, sPostal: number } | null = null
                const normSub = normalize(subDistrict || '')
                for (const d of districts) {
                  const subs = geo.getSubdistrictsByDistrict(d.code)
                  let hit = null as any
                  if (normSub) {
                    hit = subs.find(s => normalize(s.nameTh) === normSub || normalize(s.nameEn) === normSub)
                  }
                  if (!hit && postalCode && String(postalCode).length >= 5) {
                    hit = subs.find(s => String(s.postalCode) === String(postalCode))
                  }
                  if (hit) {
                    found = { dCode: d.code, sCode: hit.code, sPostal: hit.postalCode }
                    break
                  }
                }
                if (found) {
                  setFormData(prev => ({ ...prev, districtCode: found.dCode, subdistrictCode: found.sCode, postalCode: String(found.sPostal || postalCode) }))
                }
                // Global fallback: search across all provinces if still nothing
                if (!found && (subDistrict || (postalCode && String(postalCode).length >= 5))) {
                  const provincesAll = geo.getProvinces()
                  let g: { pCode: number, dCode: number, sCode: number, sPostal: number } | null = null
                  const normSub = normalize(subDistrict || '')
                  for (const p of provincesAll) {
                    const ds = geo.getDistrictsByProvince(p.code)
                    for (const d of ds) {
                      const subs = geo.getSubdistrictsByDistrict(d.code)
                      let hit = null as any
                      if (normSub) {
                        hit = subs.find(s => normalize(s.nameTh) === normSub || normalize(s.nameEn) === normSub)
                      }
                      if (!hit && postalCode && String(postalCode).length >= 5) {
                        hit = subs.find(s => String(s.postalCode) === String(postalCode))
                      }
                      if (hit) {
                        g = { pCode: p.code, dCode: d.code, sCode: hit.code, sPostal: hit.postalCode }
                        break
                      }
                    }
                    if (g) break
                  }
                  if (g) {
                    setFormData(prev => ({ ...prev, provinceCode: g.pCode, districtCode: g.dCode, subdistrictCode: g.sCode, postalCode: String(g.sPostal || postalCode) }))
                    console.debug('Global geo fallback matched', g)
                  }
                }
              }
              // Debug diagnostics
              console.log('Prefill geo resolution', {
                saved: { province, district, subDistrict, postalCode },
                matchedProvince: provinceData?.nameTh,
                matchedDistrict: districtData?.nameTh,
              })
              // allow effects to run normally after a short tick
              setTimeout(() => { prefillGuard.current = false }, 0)
              console.log('Prefill finish')
            }
          }
        })
      }
    } catch (err) {
      console.warn('Failed to load existing metafields:', err)
      // Don't show error to user, just continue with empty form
    }
  }

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
              customer {
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

      let result: any
      try {
        result = await response.json()
      } catch (_) {
        result = null
      }

      if (!response.ok) {
        const message = result?.error || 'Failed to fetch order data'
        const details = typeof result?.details === 'string' ? result.details : JSON.stringify(result?.details || {})
        throw new Error(`${message}${details ? `: ${details}` : ''}`)
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
      if (node.customer?.email?.toLowerCase() !== checkEmail.toLowerCase()) {
        setValidationMessage('ไม่มีคำสั่งซื้อหรือผู้ใช้นี้ในระบบ')
        setShowValidationPopup(true)
        setIsValidated(false)
        return
      }

      // ข้อมูลตรงกัน - อนุญาตให้กรอกฟอร์ม และเก็บ Order GID เพื่อนำไปอัปเดต
      setOrderData({
        id: node.id,
        name: node.name,
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
      
    } catch (err: any) {
      setValidationMessage(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล')
      setShowValidationPopup(true)
      setIsValidated(false)
    } finally {
      setLoading(false)
    }
  }

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
    if (!formData.documentNumber.trim()) {
      setIsSaving(false)
      setSaveError('กรุณากรอกชื่อ/ชื่อบริษัท')
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
    const provinceName = provinces.find(p => p.code === formData.provinceCode)?.nameTh || ''
    const districtName = districts.find(d => d.code === formData.districtCode)?.nameTh || ''
    const subdistrictName = subdistricts.find(s => s.code === formData.subdistrictCode)?.nameTh || ''

    // แปลงค่าจาก UI เดิมให้ตรงกับฟิลด์ที่ต้องการบันทึก
    const customerType = formData.documentType === 'receipt' ? 'นิติบุคคล' : 'บุคคลธรรมดา'
    const companyName = formData.documentNumber || ''
    const branchTypeTh = formData.documentType === 'receipt'
      ? (formData.branchType === 'branch' ? 'สาขาย่อย' : 'สำนักงานใหญ่')
      : ''
    // Validate branch number when "สาขาย่อย"
    if (formData.documentType === 'receipt' && formData.branchType === 'branch' && !(formData.branchNumber || '').trim()) {
      setIsSaving(false)
      setSaveError('กรุณากรอกรหัสสาขาย่อย')
      return
    }

    const branchCode = formData.branchType === 'branch' ? (formData.branchNumber || '') : ''

    // Normalize and validate 13-digit tax ID (required for all)
    const taxIdDigits = (formData.branchCode || '').replace(/\D/g, '')
    if (!taxIdDigits || taxIdDigits.length !== 13) {
      setIsSaving(false)
      setSaveError('กรุณากรอกหมายเลขประจำตัวผู้เสียภาษีให้ครบ 13 หลัก')
      return
    }
    // Still require branch type selection for juristic
    if (formData.documentType === 'receipt' && !formData.branchType) {
      setIsSaving(false)
      setSaveError('กรุณาเลือกประเภทสาขา')
      return
    }
    const taxId = taxIdDigits
    // build dashed variant for display in metafields panel
    const taxIdFormatted = (() => {
      const d = taxIdDigits
      const p1 = d.slice(0,1), p2 = d.slice(1,5), p3 = d.slice(5,10), p4 = d.slice(10,12), p5 = d.slice(12,13)
      return [p1,p2,p3,p4,p5].join('-')
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
      { key: 'company_name', value: companyName, type: 'single_line_text_field' },
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
      .flatMap((f) => ([
        { namespace: 'custom', key: f.key, value: f.value, type: f.type },
        { namespace: 'custom', key: `custom_${f.key}`, value: f.value, type: f.type },
        // Special additional key for sub-district per requirement
        ...(f.key === 'sub_district'
          ? [{ namespace: 'custom', key: 'custom_custom_district2', value: f.value, type: f.type }]
          : []),
      ]))
      .filter(m => (m.value ?? '') !== '')

    const variables = {
      metafields: metafieldsToSave.map(m => ({
        ownerId: orderData.id,
        namespace: m.namespace,
        key: m.key,
        type: m.type,
        value: m.value,
      })),
    }

    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: METAFIELDS_SET, variables }),
      })

      const result: any = await response.json()

      if (!response.ok || result?.errors || (result?.data?.metafieldsSet?.userErrors?.length > 0)) {
        const ue = result?.data?.metafieldsSet?.userErrors?.[0]
        const errMsg = result?.errors?.[0]?.message || (ue ? `${ue.message}${ue.code ? ` (${ue.code})` : ''}${ue.field ? ` [${ue.field}]` : ''}` : 'Failed to save metafields')
        throw new Error(errMsg)
      }

      // Confirm by reading back the saved metafields
      const GET_ORDER_METAFIELDS = `
        query getOrderMetafields($id: ID!) {
          order(id: $id) {
            id
            metafields(first: 20, namespace: "custom") {
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
      const confirmJson: any = await confirmRes.json()
      const nodes = confirmJson?.data?.order?.metafields?.nodes || []
      setSaveMessage('บันทึกข้อมูลใบกำกับภาษีสำเร็จ!')
      setShowSavePopup(true)
      // Reformat Tax ID in UI to dashed form after save
      const fmtId = (raw: string) => {
        const d = String(raw || '').replace(/\D/g, '').slice(0,13)
        if (!d) return ''
        const p1 = d.slice(0,1), p2 = d.slice(1,5), p3 = d.slice(5,10), p4 = d.slice(10,12), p5 = d.slice(12,13)
        return [p1, p2, p3, p4, p5].filter(Boolean).join('-')
      }
      setFormData(prev => ({ ...prev, branchCode: fmtId(prev.branchCode) }))
    } catch (err: any) {
      setSaveError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">เพิ่มข้อมูลสำหรับออกใบกำกับภาษี</h1>
        <button 
          onClick={handleGoBack}
          className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors duration-200"
        >
          ย้อนกลับ
        </button>
      </div>

      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                isValidated ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {isValidated ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h3 className={`text-lg font-semibold ${
                isValidated ? 'text-green-800' : 'text-red-800'
              }`}>
                {isValidated ? 'ตรวจสอบสำเร็จ' : 'ข้อผิดพลาด'}
              </h3>
            </div>
            <p className="text-gray-700 mb-4 text-center">{validationMessage}</p>
            <button
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
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800">บันทึกสำเร็จ</h3>
            </div>
            <p className="text-gray-700 mb-4 text-center">บันทึกข้อมูลใบกำกับภาษีเรียบร้อยแล้ว</p>
            <div className="flex justify-center">
              <button
                onClick={handleGoToShop}
                className="min-w-[200px] bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md"
              >
                กลับไปหน้าก่อนหน้า
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveTaxInfo} className={`space-y-6 ${!isValidated ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Document Type Radio Buttons */}
        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="documentType"
                value="tax"
                checked={formData.documentType === 'tax'}
                onChange={() => handleRadioChange('tax')}
                className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className={`${formData.documentType === 'tax' ? 'text-red-600' : 'text-gray-600'} font-medium`}>
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
              <span className={`${formData.documentType === 'receipt' ? 'text-red-600' : 'text-gray-600'} font-medium`}>
                นิติบุคคล
              </span>
            </label>
          </div>
        </div>

        {/* Name or Company Name */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">
            {formData.documentType === 'receipt' ? 'ชื่อบริษัท' : 'ชื่อ-นามสกุล'}
          </label>
          <input
            type="text"
            name="documentNumber"
            value={formData.documentNumber}
            onChange={handleInputChange}
            placeholder={formData.documentType === 'receipt' ? 'ชื่อบริษัท' : 'ชื่อ-นามสกุล'}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Head office / Branch for juristic person */}
        {formData.documentType === 'receipt' && (
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">สาขา</label>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="branchType"
                  value="head"
                  checked={formData.branchType === 'head'}
                  onChange={() => setFormData(p => ({ ...p, branchType: 'head' }))}
                  required={formData.documentType === 'receipt' && !formData.branchType}
                  className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className={`${formData.branchType === 'head' ? 'text-red-600' : 'text-gray-600'} font-medium`}>
                  สำนักงานใหญ่
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="branchType"
                  value="branch"
                  checked={formData.branchType === 'branch'}
                  onChange={() => setFormData(p => ({ ...p, branchType: 'branch' }))}
                  className="w-4 h-4 accent-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className={`${formData.branchType === 'branch' ? 'text-red-600' : 'text-gray-600'} font-medium`}>
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
                  placeholder="รหัสสาขาย่อย"
                  inputMode="numeric"
                  required={formData.branchType === 'branch'}
                  className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {/* Tax Identification Number */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">หมายเลขประจำตัวผู้เสียภาษี</label>
          <input
            type="text"
            name="branchCode"
            value={formData.branchCode}
            onChange={handleInputChange}
            placeholder="1-2345-67890-12-3"
            inputMode="tel"
            maxLength={17}
            onBlur={(e) => {
              const d = String(e.target.value || '').replace(/\D/g, '').slice(0,13)
              if (!d) return
              const p1 = d.slice(0,1), p2 = d.slice(1,5), p3 = d.slice(5,10), p4 = d.slice(10,12), p5 = d.slice(12,13)
              const dashed = [p1, p2, p3, p4, p5].filter(Boolean).join('-')
              setFormData(prev => ({ ...prev, branchCode: dashed }))
            }}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Company Names Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">หมายเลขโทรศัพท์</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="หมายเลขโทรศัพท์"
              inputMode="tel"
              maxLength={12}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">หมายเลขโทรศัพท์สำรอง (ถ้ามี)</label>
            <input
              type="text"
              name="companyNameEng"
              value={formData.companyNameEng}
              onChange={handleInputChange}
              placeholder="หมายเลขโทรศัพท์สำรอง"
              inputMode="tel"
              maxLength={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">จังหวัด</label>
            <div className="relative">
              <select
                name="provinceCode"
                value={formData.provinceCode ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, provinceCode: e.target.value ? Number(e.target.value) : null }))}
                required
                className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="">เลือกจังหวัด</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>{p.nameTh}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
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
                onChange={(e) => setFormData((p) => ({ ...p, districtCode: e.target.value ? Number(e.target.value) : null }))}
                disabled={!formData.provinceCode}
                required
                className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกอำเภอ/เขต</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>{d.nameTh}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* District and Postal Code Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium">ตำบล/ แขวง</label>
            <div className="relative">
              <select
                name="subdistrictCode"
                value={formData.subdistrictCode ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, subdistrictCode: e.target.value ? Number(e.target.value) : null }))}
                disabled={!formData.districtCode}
                required
                className="w-full px-4 pr-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer disabled:opacity-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกตำบล/แขวง</option>
                {subdistricts.map((s) => (
                  <option key={s.code} value={s.code}>{s.nameTh}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
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
              placeholder="รหัสไปรษณีย์"
              inputMode="numeric"
              maxLength={5}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="block text-gray-700 font-medium">ที่อยู่</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="ที่อยู่"
            rows={3}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={!isValidated || isSaving}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          {!isValidated && (
            <p className="mt-2 text-sm text-gray-500">
              กรุณาเข้าถึงหน้านี้ผ่าน URL ที่มี Order ID และ Email ที่ถูกต้อง
            </p>
          )}
          {saveMessage && (
            <p className="mt-2 text-sm text-green-600">{saveMessage}</p>
          )}
          {saveError && (
            <p className="mt-2 text-sm text-red-600">Error: {saveError}</p>
          )}
        </div>
      </form>
    </div>
  )
}
