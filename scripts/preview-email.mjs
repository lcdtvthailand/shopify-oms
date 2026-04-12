#!/usr/bin/env node

/**
 * Email Template Preview Generator
 *
 * Generates HTML preview files for the tax invoice email templates.
 * Open the generated files in a browser to preview.
 *
 * Usage:
 *   pnpm email:preview
 */

import { writeFileSync } from 'node:fs'

const { buildCustomerEmail, buildAdminEmail } = await import('../lib/services/email-templates.ts')

const base = {
  orderName: '#1234',
  customerEmail: 'customer@example.com',
  submittedAt: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }),
}

const individual = {
  ...base,
  customerType: 'บุคคลธรรมดา',
  titleName: 'นาย',
  fullName: 'ปิยะพงษ์ มากบวล',
  companyName: '',
  branchType: '',
  branchCode: '',
  taxId: '5410190030302',
  taxIdFormatted: '5-4101-90030-30-2',
  phoneNumber: '081-872-3139',
  province: 'มุกดาหาร',
  district: 'เมืองมุกดาหาร',
  subDistrict: 'มุกดาหาร',
  postalCode: '49000',
  fullAddress: '5/9 ถ.ตาดแคน',
}

const company = {
  ...base,
  customerType: 'นิติบุคคล',
  titleName: '',
  fullName: '',
  companyName: 'บริษัท คูโบต้าเพชรบูรณ์ จำกัด',
  branchType: 'สำนักงานใหญ่',
  branchCode: '',
  taxId: '0675548000025',
  taxIdFormatted: '0-6755-48000-02-5',
  phoneNumber: '',
  province: 'เพชรบูรณ์',
  district: 'เมืองเพชรบูรณ์',
  subDistrict: 'บ้านโตก',
  postalCode: '67000',
  fullAddress: '99/9 หมู่13',
}

const versions = [
  { data: { ...individual, lang: 'th' }, prefix: 'individual-th' },
  { data: { ...individual, lang: 'en' }, prefix: 'individual-en' },
  { data: { ...company, lang: 'th' }, prefix: 'company-th' },
  { data: { ...company, lang: 'en' }, prefix: 'company-en' },
]

for (const { data, prefix } of versions) {
  const customer = buildCustomerEmail(data)
  const admin = buildAdminEmail(data)
  writeFileSync(`scripts/preview-customer-${prefix}.html`, customer.html)
  writeFileSync(`scripts/preview-admin-${prefix}.html`, admin.html)
}

console.log('Generated 8 preview files:')
versions.forEach(({ prefix }) => {
  console.log(`  scripts/preview-customer-${prefix}.html`)
  console.log(`  scripts/preview-admin-${prefix}.html`)
})
