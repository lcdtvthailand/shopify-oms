'use client'

import { useCallback, useState } from 'react'
import type { ShopifyGraphQLResponse } from '@/types/shopify'

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

interface OrderQueryResponse {
  order: OrderNode
}

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

interface UseMetafieldOperationsReturn {
  isSaving: boolean
  saveMessage: string
  saveError: string
  showSavePopup: boolean
  loadExistingMetafields: (orderGid: string, orderData?: OrderData) => Promise<FormData | null>
  saveTaxInfo: (
    formData: FormData,
    orderData: OrderData,
    provinces: Array<{ code: number; nameTh: string }>,
    districts: Array<{ code: number; nameTh: string }>,
    subdistricts: Array<{ code: number; nameTh: string; postalCode: number }>
  ) => Promise<boolean>
  setShowSavePopup: (show: boolean) => void
}

export const useMetafieldOperations = (): UseMetafieldOperationsReturn => {
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [showSavePopup, setShowSavePopup] = useState(false)

  const loadExistingMetafields = useCallback(
    async (orderGid: string, orderData?: OrderData): Promise<FormData | null> => {
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
          const _province =
            metaMap.province ||
            metaMap.custom_province ||
            (orderData?.customer?.defaultAddress?.province ?? '')
          const _district =
            metaMap.district ||
            metaMap.custom_district ||
            metaMap.custom_custom_district ||
            metaMap.district_th ||
            metaMap.amphoe ||
            metaMap.amphur ||
            (orderData?.customer?.defaultAddress?.city ?? '')
          const _subDistrict =
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

          return {
            documentType: customerType === 'นิติบุคคล' ? 'receipt' : 'tax',
            titleName: titleName,
            fullName: customerType === 'นิติบุคคล' ? '' : documentName,
            companyNameText: customerType === 'นิติบุคคล' ? documentName : '',
            documentNumber: '',
            branchCode: fmtId(taxId),
            companyName: phoneNumber,
            provinceCode: null, // Will be resolved by geography matching
            districtCode: null,
            subdistrictCode: null,
            postalCode: postalCode,
            address: fullAddress,
            branchType:
              branchType === 'สาขาย่อย' ? 'branch' : branchType === 'สำนักงานใหญ่' ? 'head' : null,
            branchNumber: branchCode,
            subBranchCode: '',
          }
        }

        return null
      } catch (error) {
        console.error('Failed to load existing metafields:', error)
        return null
      }
    },
    []
  )

  const saveTaxInfo = useCallback(
    async (
      formData: FormData,
      orderData: OrderData,
      provinces: Array<{ code: number; nameTh: string }>,
      districts: Array<{ code: number; nameTh: string }>,
      subdistricts: Array<{ code: number; nameTh: string; postalCode: number }>
    ): Promise<boolean> => {
      setIsSaving(true)
      setSaveMessage('')
      setSaveError('')

      try {
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

        const branchCode =
          formData.branchType === 'branch'
            ? (formData.branchNumber || '').replace(/\D/g, '').slice(0, 5)
            : ''

        // Normalize and validate 13-digit tax ID
        const taxIdDigits = (formData.branchCode || '').replace(/\D/g, '')

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
        const province = provinceName
        const district = districtName
        const subDistrict = subdistrictName
        // Prefer postal code from the selected subdistrict; fallback to user input digits
        const selectedSub = subdistricts.find((s) => s.code === formData.subdistrictCode)
        const postalCode = selectedSub
          ? String(selectedSub.postalCode || '')
          : (formData.postalCode || '').replace(/\D/g, '')
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
              ? [
                  {
                    namespace: 'custom',
                    key: 'custom_custom_district2',
                    value: f.value,
                    type: f.type,
                  },
                ]
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

        // Save aggregated profile data (simplified version)
        const ownerCustomerId = orderData.customerId || orderData.customer?.id || null
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
          province,
          district,
          sub_district: subDistrict,
          postal_code: postalCode,
          full_address: fullAddress,
          savedAt: new Date().toISOString(),
          status: 'normal' as 'default' | 'normal',
        }

        // Save profile to customer if available
        if (ownerCustomerId) {
          const SAVE_DEFAULT_PROFILE = `
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id key namespace }
              userErrors { field message code }
            }
          }
        `
          const variablesCust = {
            metafields: [
              {
                ownerId: ownerCustomerId,
                namespace: 'custom',
                key: 'default_tax_profile',
                type: 'json',
                value: JSON.stringify([currentProfile]),
              },
            ],
          }
          await fetch('/api/shopify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: SAVE_DEFAULT_PROFILE, variables: variablesCust }),
          })
        }

        setSaveMessage('บันทึกข้อมูลใบกำกับภาษีสำเร็จ!')
        setShowSavePopup(true)
        return true
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    []
  )

  return {
    isSaving,
    saveMessage,
    saveError,
    showSavePopup,
    loadExistingMetafields,
    saveTaxInfo,
    setShowSavePopup,
  }
}
