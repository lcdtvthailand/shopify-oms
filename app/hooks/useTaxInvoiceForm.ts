'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPostalCode, formatThaiPhone } from '@/lib/utils/formatters'

interface FormData {
  documentType: 'tax' | 'receipt'
  titleName: string
  fullName: string
  companyNameText: string
  documentNumber: string
  branchCode: string
  companyName: string
  provinceCode: number | null
  districtCode: number | null
  subdistrictCode: number | null
  postalCode: string
  address: string
  branchType?: 'head' | 'branch' | null
  branchNumber?: string
  subBranchCode?: string
}

interface OrderData {
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

interface UseTaxInvoiceFormReturn {
  formData: FormData
  orderData: OrderData | null
  showFormOverlay: boolean
  showSuccessToast: boolean
  referrerUrl: string | null
  prefillGuard: React.MutableRefObject<boolean>
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  setOrderData: React.Dispatch<React.SetStateAction<OrderData | null>>
  setShowFormOverlay: (show: boolean) => void
  setShowSuccessToast: (show: boolean) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleRadioChange: (value: 'tax' | 'receipt') => void
  handleGoBack: () => void
  handleGoToShop: () => void
  updateFormDataFromMetafields: (metafields: FormData) => void
}

export const useTaxInvoiceForm = (): UseTaxInvoiceFormReturn => {
  // Guard to prevent cascading resets when we are pre-filling from metafields
  const prefillGuard = useRef(false)
  const [referrerUrl, setReferrerUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    documentType: 'tax',
    titleName: '',
    fullName: '',
    companyNameText: '',
    documentNumber: '',
    branchCode: '',
    companyName: '',
    provinceCode: null,
    districtCode: null,
    subdistrictCode: null,
    postalCode: '',
    address: '',
    branchType: null,
    branchNumber: '',
  })

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [showFormOverlay, setShowFormOverlay] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Remember the URL before arriving here
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ref = document.referrer || ''
      setReferrerUrl(ref || null)
    }
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target

      if (name === 'companyName') {
        setFormData((prev) => ({ ...prev, [name]: formatThaiPhone(value) }))
        return
      }

      // Numeric-only postal code (max 5)
      if (name === 'postalCode') {
        const digits = formatPostalCode(value)
        setFormData((prev) => ({ ...prev, postalCode: digits }))
        return
      }

      // Helper: format 13-digit Thai ID/Tax ID -> keep only digits, no dashes
      const formatThaiId13 = (raw: string) => {
        const d = raw.replace(/\D/g, '').slice(0, 13)
        return d
      }

      if (name === 'branchCode') {
        const formattedValue = formatThaiId13(value)
        setFormData((prev) => ({ ...prev, [name]: formattedValue }))
        return
      }

      // Enforce sub-branch number to be numeric only (5 digits)
      if (name === 'branchNumber') {
        // Enforce digits only and max length 5 for branch sub-code
        const digits = value.replace(/\D/g, '').slice(0, 5)
        setFormData((prev) => ({ ...prev, branchNumber: digits }))
        return
      }

      setFormData((prev) => ({ ...prev, [name]: value }))
    },
    []
  )

  const handleRadioChange = useCallback((value: 'tax' | 'receipt') => {
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
  }, [])

  const handleGoBack = useCallback(() => {
    if (referrerUrl) {
      // If the referrer is an absolute URL (may be external), redirect directly
      if (/^https?:\/\//i.test(referrerUrl)) {
        window.location.href = referrerUrl
        return
      }
      // Otherwise, treat it as an internal path
      if (typeof window !== 'undefined') {
        window.history.back()
      }
      return
    }
    // Fallback: browser history back
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }, [referrerUrl])

  // Explicit redirect to Shopify storefront
  const handleGoToShop = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = 'https://lcdtvthailand.myshopify.com/'
    }
  }, [])

  const updateFormDataFromMetafields = useCallback((metafields: FormData) => {
    prefillGuard.current = true
    setFormData(metafields)
    // Allow effects to run normally after a delay to ensure all data is loaded
    setTimeout(() => {
      prefillGuard.current = false
    }, 100)
  }, [])

  return {
    formData,
    orderData,
    showFormOverlay,
    showSuccessToast,
    referrerUrl,
    prefillGuard,
    setFormData,
    setOrderData,
    setShowFormOverlay,
    setShowSuccessToast,
    handleInputChange,
    handleRadioChange,
    handleGoBack,
    handleGoToShop,
    updateFormDataFromMetafields,
  }
}
