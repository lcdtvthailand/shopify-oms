export const VALIDATION_MESSAGES = {
  REQUIRED: 'ข้อมูลนี้จำเป็น',
  INVALID_EMAIL: 'รูปแบบอีเมลไม่ถูกต้อง',
  INVALID_TAX_ID: 'เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง',
  INVALID_PHONE: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
} as const

export const INPUT_LIMITS = {
  TAX_ID_LENGTH: 13,
  BRANCH_CODE_LENGTH: 5,
  PHONE_LENGTH: 10,
  COMPANY_NAME_MAX: 200,
  ADDRESS_MAX: 500,
} as const