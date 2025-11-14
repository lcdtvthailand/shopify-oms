export type Language = 'th' | 'en'

export const LANGUAGE_LABELS = {
  th: 'TH',
  en: 'EN',
} as const

export const TAX_INVOICE_TEXTS = {
  th: {
    // Main title and headers
    title: 'เพิ่มข้อมูลสำหรับใบกำกับภาษี',

    // Document types
    individual: 'บุคคลธรรมดา',
    corporate: 'นิติบุคคล',

    // Personal info fields
    titleLabel: 'คำนำหน้าชื่อ',
    selectTitle: 'เลือกคำนำหน้าชื่อ',
    fullName: 'ชื่อ-นามสกุล',
    nationalId: 'เลขประจำตัวประชาชน (กรอกเลข 13 หลัก)',
    phoneNumber: 'หมายเลขโทรศัพท์ (ไม่บังคับ)',

    // Company info fields
    companyName: 'ชื่อบริษัท',
    branch: 'สาขา',
    headOffice: 'สำนักงานใหญ่',
    branchOffice: 'สาขาย่อย',
    taxId: 'หมายเลขประจำตัวผู้เสียภาษี (กรอกเลข 13 หลัก)',

    // Address fields
    address: 'ที่อยู่ (กรอก เลขที่, ชื่อหมู่บ้าน อาคาร คอนโด, หมู่ที่, ซอย, ถนน)',
    registeredAddress: 'ที่อยู่ (กรอกตามที่อยู่จดทะเบียนบริษัท)',
    province: 'จังหวัด',
    selectProvince: 'เลือกจังหวัด',
    district: 'อำเภอ/เขต',
    selectDistrict: 'เลือกอำเภอ/เขต',
    subdistrict: 'ตำบล/แขวง',
    selectSubdistrict: 'เลือกตำบล/แขวง',
    postalCode: 'รหัสไปรษณีย์',

    // Buttons and actions
    save: 'บันทึก',
    saving: 'กำลังบันทึก...',
    back: 'ย้อนกลับ',
    close: 'ปิด',
    ok: 'ตกลง',

    // Status messages
    validating: 'กำลังตรวจสอบข้อมูล',
    pleaseWait: 'กรุณารอสักครู่...',
    validationSuccess: 'ตรวจสอบข้อมูลสำเร็จ',
    canFillForm: 'สามารถกรอกฟอร์มได้',
    saveSuccess: 'บันทึกสำเร็จ',
    saveComplete: 'บันทึกข้อมูลใบกำกับภาษีเรียบร้อยแล้ว',
    goBackToPrevious: 'กลับไปหน้าก่อนหน้า',

    // Validation messages
    pleaseAccessViaUrl: 'กรุณาเข้าถึงหน้านี้ผ่าน URL ที่มี Order ID และ Email ที่ถูกต้อง',
    waitingValidation: 'กรุณารอการตรวจสอบข้อมูล',
    systemValidating: 'ระบบกำลังตรวจสอบ Order ID และ Email จาก URL',
    validationSuccessTitle: 'ตรวจสอบสำเร็จ',
    errorTitle: 'ข้อผิดพลาด',
  },
  en: {
    // Main title and headers
    title: 'Add Information for Tax Invoice',

    // Document types
    individual: 'Individual',
    corporate: 'Corporate',

    // Personal info fields
    titleLabel: 'Title',
    selectTitle: 'Select Title',
    fullName: 'Full Name',
    nationalId: 'National ID Number (13 digits)',
    phoneNumber: 'Phone Number (optional)',

    // Company info fields
    companyName: 'Company Name',
    branch: 'Branch',
    headOffice: 'Head Office',
    branchOffice: 'Branch Office',
    taxId: 'Tax Identification Number (13 digits)',

    // Address fields
    address: 'Address (House No., Village/Building/Condo, Alley, Road)',
    registeredAddress: 'Registered Address (as listed in company documents)',
    province: 'Province',
    selectProvince: 'Select Province',
    district: 'District',
    selectDistrict: 'Select District',
    subdistrict: 'Sub-district',
    selectSubdistrict: 'Select Sub-district',
    postalCode: 'Postal Code',

    // Buttons and actions
    save: 'Save',
    saving: 'Saving...',
    back: 'Back',
    close: 'Close',
    ok: 'OK',

    // Status messages
    validating: 'Validating Information',
    pleaseWait: 'Please wait...',
    validationSuccess: 'Validation Successful',
    canFillForm: 'You can now fill the form',
    saveSuccess: 'Save Successful',
    saveComplete: 'Tax invoice information saved successfully',
    goBackToPrevious: 'Go Back to Previous Page',

    // Validation messages
    pleaseAccessViaUrl: 'Please access this page via URL with valid Order ID and Email',
    waitingValidation: 'Please wait for data validation',
    systemValidating: 'System is validating Order ID and Email from URL',
    validationSuccessTitle: 'Validation Successful',
    errorTitle: 'Error',
  },
} as const

export type TaxInvoiceTexts = (typeof TAX_INVOICE_TEXTS)[Language]
