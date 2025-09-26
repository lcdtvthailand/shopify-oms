'use client'

import { useCallback, useState } from 'react'
import { validateThaiPhone, validateThaiTaxId } from '@/lib/utils/formatters'

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

interface UseFormValidationReturn {
  fieldErrors: Record<string, string>
  taxIdError: string
  validateForm: (formData: FormData) => string[]
  validateTaxId: (value: string, documentType: 'tax' | 'receipt') => void
  clearFieldError: (fieldName: string) => void
  setFieldError: (fieldName: string, error: string) => void
  clearAllErrors: () => void
}

export const useFormValidation = (): UseFormValidationReturn => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [taxIdError, setTaxIdError] = useState('')

  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }))
  }, [])

  const clearAllErrors = useCallback(() => {
    setFieldErrors({})
    setTaxIdError('')
  }, [])

  const validateTaxId = useCallback((value: string, documentType: 'tax' | 'receipt') => {
    const digits = value.replace(/\D/g, '')
    if (!digits) {
      setTaxIdError('')
      return
    }
    if (digits.length < 13) {
      const fieldName = documentType === 'receipt' ? 'หมายเลขประจำตัวผู้เสียภาษี' : 'เลขประจำตัวประชาชน'
      setTaxIdError(`${fieldName}ต้องมี 13 หลัก`)
    } else {
      setTaxIdError('')
    }
  }, [])

  const validateForm = useCallback((formData: FormData): string[] => {
    const errors: string[] = []

    // Required field validations (general)
    if (formData.documentType === 'tax') {
      if (!formData.fullName.trim()) {
        errors.push('กรุณากรอกชื่อ-นามสกุล')
      }
      if (!formData.titleName.trim()) {
        errors.push('กรุณาเลือกคำนำหน้าชื่อ')
      }
    } else if (!formData.companyNameText.trim()) {
      errors.push('กรุณากรอกชื่อบริษัท')
    }

    if (!formData.provinceCode) {
      errors.push('กรุณาเลือกจังหวัด')
    }

    if (!formData.districtCode) {
      errors.push('กรุณาเลือกอำเภอ/เขต')
    }

    if (!formData.subdistrictCode) {
      errors.push('กรุณาเลือกตำบล/แขวง')
    }

    if (!formData.postalCode.trim()) {
      errors.push('กรุณากรอกรหัสไปรษณีย์')
    }

    if (!formData.address.trim()) {
      errors.push('กรุณากรอกที่อยู่')
    }

    // Validate phone numbers: must start with 0 and be 9–10 digits (after stripping dashes) - only if provided
    const phoneDigits = (formData.companyName || '').replace(/\D/g, '')
    if (formData.companyName.trim() && !validateThaiPhone(phoneDigits)) {
      errors.push('กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง (ขึ้นต้นด้วย 0 และมี 9–10 หลัก)')
    }

    // Validate postal code: exactly 5 digits
    const postalDigits = (formData.postalCode || '').replace(/\D/g, '')
    if (formData.postalCode.trim() && postalDigits.length !== 5) {
      errors.push('กรุณากรอกรหัสไปรษณีย์ 5 หลัก')
    }

    // Validate branch number when "สาขาย่อย" => must be 5 digits
    if (formData.documentType === 'receipt' && formData.branchType === 'branch') {
      const branchDigitsForSave = (formData.branchNumber || '').replace(/\D/g, '')
      if (branchDigitsForSave.length !== 5) {
        errors.push('กรุณากรอกรหัสสาขาย่อย')
      }
    }

    // Normalize and validate 13-digit tax ID (required for all)
    const taxIdDigits = (formData.branchCode || '').replace(/\D/g, '')
    if (!validateThaiTaxId(taxIdDigits)) {
      errors.push(
        formData.documentType === 'receipt'
          ? 'กรุณากรอกหมายเลขประจำตัวผู้เสียภาษีให้ครบ 13 หลัก'
          : 'กรุณากรอกเลขประจำตัวประชาชนให้ครบ 13 หลัก'
      )
    }

    // Still require branch type selection for juristic
    if (formData.documentType === 'receipt' && !formData.branchType) {
      errors.push('กรุณาเลือกประเภทสาขา')
    }

    // Map errors to specific fields
    if (errors.length > 0) {
      const newFieldErrors: Record<string, string> = {}

      errors.forEach((error) => {
        if (error.includes('ชื่อ-นามสกุล')) {
          newFieldErrors.fullName = error
        } else if (error.includes('คำนำหน้าชื่อ')) {
          newFieldErrors.titleName = error
        } else if (error.includes('ชื่อบริษัท')) {
          newFieldErrors.companyNameText = error
        } else if (error.includes('จังหวัด')) {
          newFieldErrors.provinceCode = error
        } else if (error.includes('อำเภอ/เขต')) {
          newFieldErrors.districtCode = error
        } else if (error.includes('ตำบล/แขวง')) {
          newFieldErrors.subdistrictCode = error
        } else if (error.includes('รหัสไปรษณีย์')) {
          newFieldErrors.postalCode = error
        } else if (error.includes('ที่อยู่')) {
          newFieldErrors.address = error
        } else if (error.includes('หมายเลขโทรศัพท์')) {
          newFieldErrors.companyName = error
        } else if (error.includes('หมายเลขประจำตัวผู้เสียภาษี') || error.includes('เลขประจำตัวประชาชน')) {
          newFieldErrors.branchCode = error
        } else if (error.includes('รหัสสาขาย่อย')) {
          newFieldErrors.branchNumber = error
        } else if (error.includes('ประเภทสาขา')) {
          newFieldErrors.branchType = error
        }
      })

      setFieldErrors(newFieldErrors)
    } else {
      setFieldErrors({})
    }

    return errors
  }, [])

  return {
    fieldErrors,
    taxIdError,
    validateForm,
    validateTaxId,
    clearFieldError,
    setFieldError,
    clearAllErrors,
  }
}
