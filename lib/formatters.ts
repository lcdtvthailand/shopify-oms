import DOMPurify from 'isomorphic-dompurify'

/**
 * Format Thai phone number
 * Supports both Bangkok (02) and mobile numbers
 */
export const formatThaiPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (!digits) return ''
  
  // Bangkok numbers (02-xxx-xxxx)
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5, 9)}`
  }
  
  // Mobile numbers (xxx-xxx-xxxx)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

/**
 * Format Thai Tax ID (x-xxxx-xxxxx-xx-x)
 */
export const formatThaiTaxId = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 13)
  if (!digits) return ''
  
  const parts = [
    digits.slice(0, 1),
    digits.slice(1, 5),
    digits.slice(5, 10),
    digits.slice(10, 12),
    digits.slice(12, 13)
  ].filter(Boolean)
  
  return parts.join('-')
}

/**
 * Validate Thai Tax ID (13 digits)
 */
export const validateThaiTaxId = (taxId: string): boolean => {
  const digits = taxId.replace(/\D/g, '')
  return digits.length === 13
}

/**
 * Validate Thai phone number (9-10 digits)
 */
export const validateThaiPhone = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 10
}

/**
 * Sanitize input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
}

/**
 * Format postal code (5 digits)
 */
export const formatPostalCode = (raw: string): string => {
  return raw.replace(/\D/g, '').slice(0, 5)
}

/**
 * Normalize string for comparison (remove spaces, lowercase)
 */
export const normalizeString = (str: string): string => {
  return str.toLowerCase().replace(/\s+/g, '').trim()
}

/**
 * Constants for validation
 */
export const VALIDATION = {
  TAX_ID_LENGTH: 13,
  PHONE_MIN_LENGTH: 9,
  PHONE_MAX_LENGTH: 10,
  POSTAL_CODE_LENGTH: 5,
  NAME_MAX_LENGTH: 200,
  ADDRESS_MAX_LENGTH: 500,
} as const