export interface TaxInvoiceEmailData {
  orderName: string
  customerType: string
  titleName: string
  fullName: string
  companyName: string
  branchType: string
  branchCode: string
  taxId: string
  taxIdFormatted: string
  phoneNumber: string
  province: string
  district: string
  subDistrict: string
  postalCode: string
  fullAddress: string
  customerEmail: string
  submittedAt: string
  lang?: 'th' | 'en'
  invoiceUrl?: string
}

type Lang = 'th' | 'en'

const i18n = {
  th: {
    taxInvoice: 'ใบกำกับภาษี',
    taxInvoiceUpper: 'Tax Invoice',
    confirmed: '✓ ยืนยันแล้ว',
    customerInfo: '👤 ข้อมูลผู้ขอใบกำกับภาษี',
    companyInfo: '🏢 ข้อมูลนิติบุคคล',
    addressInfo: '📍 ที่อยู่สำหรับใบกำกับภาษี',
    contactInfo: '📧 ข้อมูลติดต่อลูกค้า',
    type: 'ประเภท (นิติบุคคล/บุคคลธรรมดา)',
    individual: 'บุคคลธรรมดา',
    company: 'นิติบุคคล',
    title: 'คำนำหน้าชื่อ',
    fullName: 'ชื่อ-นามสกุล',
    companyName: 'ชื่อบริษัท',
    branch: 'สาขา',
    branchCode: 'รหัสสาขา',
    taxId: 'หมายเลขประจำตัวผู้เสียภาษี',
    phone: 'หมายเลขโทรศัพท์',
    province: 'จังหวัด',
    district: 'อำเภอ/เขต',
    subDistrict: 'ตำบล/แขวง',
    postalCode: 'ไปรษณีย์',
    address: 'ที่อยู่',
    order: 'คำสั่งซื้อ',
    greetingPrefix: 'สวัสดีคุณ',
    thankYou: 'ขอบคุณที่ส่งข้อมูลสำหรับการออกใบกำกับภาษี คำสั่งซื้อหมายเลข',
    received: 'ทางร้านได้รับข้อมูลของท่านเรียบร้อยแล้ว กรุณาตรวจสอบรายละเอียดด้านล่าง',
    successTitle: 'ระบบบันทึกข้อมูลสำเร็จ',
    successDesc: 'เจ้าหน้าที่จะดำเนินการจัดส่งใบกำกับภาษีให้ท่านตามขั้นตอนต่อไป',
    noteTitle: 'หมายเหตุสำคัญ',
    noteDesc: 'หากข้อมูลไม่ถูกต้อง กรุณากรอกแบบฟอร์มใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่',
    submittedAt: 'บันทึกเมื่อ',
    needHelp: 'ต้องการความช่วยเหลือ?',
    autoEmail: 'อีเมลนี้ถูกส่งอัตโนมัติจากระบบออกใบกำกับภาษี กรุณาอย่าตอบกลับอีเมลนี้โดยตรง',
    allRights: 'All rights reserved.',
    viewInvoice: '📋 ดูรายละเอียดใบกำกับภาษี',
    viewInvoiceDesc: 'พิมพ์หรือบันทึก PDF ได้ที่หน้านี้',
    newSubmission: 'New Submission',
    subjectCustomer: (order: string, brand: string) =>
      `ยืนยันข้อมูลใบกำกับภาษี - คำสั่งซื้อ ${order} | ${brand}`,
    preheaderCustomer: (order: string) =>
      `ยืนยันข้อมูลใบกำกับภาษี คำสั่งซื้อ ${order} - ทางร้านได้รับข้อมูลเรียบร้อยแล้ว`,
    preheaderAdmin: (order: string, name: string, type: string) =>
      `ข้อมูลใบกำกับภาษีใหม่ ${order} จาก ${name} - ${type}`,
  },
  en: {
    taxInvoice: 'Tax Invoice',
    taxInvoiceUpper: 'Tax Invoice',
    confirmed: '✓ Confirmed',
    customerInfo: '👤 Customer Information',
    companyInfo: '🏢 Company Information',
    addressInfo: '📍 Invoice Address',
    contactInfo: '📧 Customer Contact',
    type: 'Type (Company/Individual)',
    individual: 'Individual',
    company: 'Juristic Person (Company)',
    title: 'Title',
    fullName: 'Full Name',
    companyName: 'Company Name',
    branch: 'Branch',
    branchCode: 'Branch Code',
    taxId: 'Tax ID Number',
    phone: 'Phone Number',
    province: 'Province',
    district: 'District',
    subDistrict: 'Sub-district',
    postalCode: 'Postal Code',
    address: 'Address',
    order: 'Order',
    greetingPrefix: 'Dear ',
    thankYou: 'Thank you for submitting your tax invoice information for order',
    received: 'We have received your information. Please review the details below.',
    successTitle: 'Information Saved Successfully',
    successDesc: 'Our team will process and issue your tax invoice accordingly.',
    noteTitle: 'Important Note',
    noteDesc: 'If any information is incorrect, please resubmit the form or contact our staff.',
    submittedAt: 'Submitted at',
    needHelp: 'Need help?',
    autoEmail:
      'This email was sent automatically from the tax invoice system. Please do not reply directly to this email.',
    allRights: 'All rights reserved.',
    viewInvoice: '📋 View Tax Invoice Details',
    viewInvoiceDesc: 'Print or save as PDF from this page',
    newSubmission: 'New Submission',
    subjectCustomer: (order: string, brand: string) =>
      `Tax Invoice Confirmation - Order ${order} | ${brand}`,
    preheaderCustomer: (order: string) =>
      `Tax invoice confirmation for order ${order} - We have received your information.`,
    preheaderAdmin: (order: string, name: string, type: string) =>
      `New tax invoice submission ${order} from ${name} - ${type}`,
  },
} as const

const BRAND = {
  name: 'LCDTVTHAILAND SHOP',
  logo: 'https://lcdtvthailand.com/cdn/shop/files/LOGO_LCDTVTHAILAND_SHOP_Official_2.png?v=1747763313&width=300',
  website: 'https://lcdtvthailand.com',
  color: '#CC0000',
  colorDark: '#991B1B',
  colorLight: '#FF0000',
  colorBg: '#FFF5F5',
  colorBorder: '#FECACA',
  gray: '#6B7280',
  grayMedium: '#9CA3AF',
  grayLight: '#F9FAFB',
  grayBorder: '#E5E7EB',
  dark: '#111827',
  darkSoft: '#374151',
  white: '#FFFFFF',
  contactEmail: 'sales@lcdtvthailand.com',
  contactPhone: '091-901-7000',
  contactPhone2: '091-901-8000',
  contactLine: '@LCDTVTHAILAND',
}

function baseLayout(content: string, preheader: string, t: (typeof i18n)[Lang]): string {
  return `<!DOCTYPE html>
<html lang="th" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${BRAND.name} - ${t.taxInvoice}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&display=swap');
  body, table, td, p, a, li, span { font-family: 'Anuphan', 'Helvetica Neue', Arial, sans-serif; }
  a { text-decoration: none; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
</style>
<!--[if mso]>
<style>body, table, td, p, a, li, span { font-family: Arial, sans-serif !important; }</style>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#EBEDF0; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<!-- Preheader -->
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#EBEDF0;">
  ${preheader}&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
</div>

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EBEDF0;">
<tr><td align="center" style="padding:32px 16px;">

<!-- Main card -->
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${BRAND.white}; border-radius:20px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">

<!-- Logo Header -->
<tr>
<td style="padding:28px 40px 20px; text-align:center; background-color:${BRAND.white}; border-bottom:1px solid ${BRAND.grayBorder};">
  <a href="${BRAND.website}" target="_blank" style="display:inline-block;">
    <img src="${BRAND.logo}" alt="${BRAND.name}" width="220" style="display:block; max-width:220px; height:auto;" />
  </a>
</td>
</tr>

<!-- Red accent bar -->
<tr>
<td style="background: linear-gradient(90deg, ${BRAND.color} 0%, ${BRAND.colorDark} 100%); height:4px; font-size:0; line-height:0;">&nbsp;</td>
</tr>

<!-- Title bar -->
<tr>
<td style="padding:24px 40px 20px; background-color:${BRAND.colorBg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="vertical-align:middle;">
      <p style="margin:0 0 2px; font-size:12px; color:${BRAND.grayMedium}; font-weight:500; text-transform:uppercase; letter-spacing:1.5px;">${t.taxInvoiceUpper}</p>
      <h1 style="margin:0; font-size:20px; color:${BRAND.dark}; font-weight:700;">${t.taxInvoice}</h1>
    </td>
    <td style="text-align:right; vertical-align:middle;">
      <span style="display:inline-block; padding:6px 14px; background-color:${BRAND.white}; border:1px solid ${BRAND.colorBorder}; border-radius:999px; font-size:11px; color:${BRAND.color}; font-weight:600; letter-spacing:0.5px;">
        ${t.confirmed}
      </span>
    </td>
  </tr>
  </table>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:28px 40px 32px;">
  ${content}
</td>
</tr>

<!-- Divider -->
<tr>
<td style="padding:0 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr><td style="border-top:1px solid ${BRAND.grayBorder}; font-size:0; line-height:0; height:1px;">&nbsp;</td></tr>
  </table>
</td>
</tr>

<!-- Contact section -->
<tr>
<td style="padding:24px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="text-align:center;">
      <p style="margin:0 0 12px; font-size:13px; color:${BRAND.dark}; font-weight:600;">${t.needHelp}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="padding:0 12px;">
          <a href="mailto:${BRAND.contactEmail}" style="font-size:12px; color:${BRAND.color}; font-weight:500;">&#9993; ${BRAND.contactEmail}</a>
        </td>
        <td style="padding:0 12px; border-left:1px solid ${BRAND.grayBorder};">
          <a href="tel:${BRAND.contactPhone.replace(/-/g, '')}" style="font-size:12px; color:${BRAND.color}; font-weight:500;">&#9742; ${BRAND.contactPhone}</a>
          <span style="font-size:12px; color:${BRAND.grayMedium};"> / </span>
          <a href="tel:${BRAND.contactPhone2.replace(/-/g, '')}" style="font-size:12px; color:${BRAND.color}; font-weight:500;">${BRAND.contactPhone2}</a>
        </td>
        <td style="padding:0 12px; border-left:1px solid ${BRAND.grayBorder};">
          <a href="https://lin.ee/lcdtvthailand" style="font-size:12px; color:#06C755; font-weight:500;">LINE ${BRAND.contactLine}</a>
        </td>
      </tr>
      </table>
    </td>
  </tr>
  </table>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:20px 40px 24px; background-color:#F3F4F6; border-top:1px solid ${BRAND.grayBorder};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="text-align:center;">
      <p style="margin:0 0 6px; font-size:12px; color:${BRAND.grayMedium};">
        &copy; ${new Date().getFullYear()} ${BRAND.name} &mdash; ${t.allRights}
      </p>
      <p style="margin:0 0 4px; font-size:11px; color:${BRAND.grayMedium};">
        ${t.autoEmail}
      </p>
      <p style="margin:0; font-size:11px; color:${BRAND.grayMedium};">
        <a href="${BRAND.website}" style="color:${BRAND.color};">lcdtvthailand.com</a>
      </p>
    </td>
  </tr>
  </table>
</td>
</tr>

</table>
<!-- End main card -->

</td></tr>
</table>
</body>
</html>`
}

function infoRow(label: string, value: string, isLast = false): string {
  const display = value || '-'
  return `
  <tr>
    <td style="padding:12px 16px; font-size:13px; color:${BRAND.gray}; font-weight:500; white-space:nowrap; vertical-align:top; width:150px;${isLast ? '' : ` border-bottom:1px solid ${BRAND.grayBorder};`}">
      ${label}
    </td>
    <td style="padding:12px 16px; font-size:14px; color:${BRAND.dark}; font-weight:500;${isLast ? '' : ` border-bottom:1px solid ${BRAND.grayBorder};`}">
      ${display}
    </td>
  </tr>`
}

function dataTable(data: TaxInvoiceEmailData, t: (typeof i18n)[Lang]): string {
  const isCompany = data.customerType === 'นิติบุคคล'

  const infoRows = isCompany
    ? [
        infoRow(
          t.type,
          `<span style="display:inline-block; padding:3px 12px; border-radius:999px; font-size:12px; font-weight:600; background-color:#EFF6FF; color:#1D4ED8;">${t.company}</span>`
        ),
        infoRow(
          t.companyName,
          data.companyName
            ? `<strong style="color:${BRAND.dark};">${data.companyName}</strong>`
            : ''
        ),
        infoRow(t.branch, data.branchType),
        infoRow(t.branchCode, data.branchCode),
        infoRow(
          t.taxId,
          data.taxIdFormatted
            ? `<span style="font-family:'Courier New',monospace; font-size:15px; font-weight:700; letter-spacing:1.5px; color:${BRAND.dark};">${data.taxIdFormatted}</span>`
            : ''
        ),
        infoRow(
          t.phone,
          data.phoneNumber
            ? `<a href="tel:${data.phoneNumber.replace(/-/g, '')}" style="color:${BRAND.color}; font-weight:500;">${data.phoneNumber}</a>`
            : '',
          true
        ),
      ]
    : [
        infoRow(
          t.type,
          `<span style="display:inline-block; padding:3px 12px; border-radius:999px; font-size:12px; font-weight:600; background-color:#F0FDF4; color:#15803D;">${t.individual}</span>`
        ),
        infoRow(t.title, data.titleName),
        infoRow(
          t.fullName,
          data.fullName ? `<strong style="color:${BRAND.dark};">${data.fullName}</strong>` : ''
        ),
        infoRow(
          t.taxId,
          data.taxIdFormatted
            ? `<span style="font-family:'Courier New',monospace; font-size:15px; font-weight:700; letter-spacing:1.5px; color:${BRAND.dark};">${data.taxIdFormatted}</span>`
            : ''
        ),
        infoRow(
          t.phone,
          data.phoneNumber
            ? `<a href="tel:${data.phoneNumber.replace(/-/g, '')}" style="color:${BRAND.color}; font-weight:500;">${data.phoneNumber}</a>`
            : '',
          true
        ),
      ]

  const addressRows = [
    infoRow(t.province, data.province),
    infoRow(t.district, data.district),
    infoRow(t.subDistrict, data.subDistrict),
    infoRow(
      t.postalCode,
      data.postalCode
        ? `<span style="font-family:'Courier New',monospace; font-weight:600; letter-spacing:1px;">${data.postalCode}</span>`
        : ''
    ),
    infoRow(t.address, data.fullAddress, true),
  ]

  const sectionLabel = isCompany ? t.companyInfo : t.customerInfo

  return `
  <!-- Person/Company Info -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.grayBorder}; border-radius:12px; overflow:hidden; margin-bottom:16px;">
    <tr>
      <td colspan="2" style="padding:10px 16px; background-color:${BRAND.grayLight}; border-bottom:1px solid ${BRAND.grayBorder};">
        <p style="margin:0; font-size:12px; color:${BRAND.gray}; font-weight:600; text-transform:uppercase; letter-spacing:1px;">${sectionLabel}</p>
      </td>
    </tr>
    ${infoRows.join('')}
  </table>
  <!-- Address Info -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.grayBorder}; border-radius:12px; overflow:hidden;">
    <tr>
      <td colspan="2" style="padding:10px 16px; background-color:${BRAND.grayLight}; border-bottom:1px solid ${BRAND.grayBorder};">
        <p style="margin:0; font-size:12px; color:${BRAND.gray}; font-weight:600; text-transform:uppercase; letter-spacing:1px;">${t.addressInfo}</p>
      </td>
    </tr>
    ${addressRows.join('')}
  </table>`
}

/**
 * Customer confirmation email
 */
export function buildCustomerEmail(data: TaxInvoiceEmailData): { subject: string; html: string } {
  const lang: Lang = data.lang || 'th'
  const t = i18n[lang]
  const isCompany = data.customerType === 'นิติบุคคล'
  const displayName = isCompany ? data.companyName : `${data.titleName}${data.fullName}`
  const subject = t.subjectCustomer(data.orderName, BRAND.name)

  const content = `
  <!-- Greeting -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td>
      <p style="margin:0 0 6px; font-size:18px; color:${BRAND.dark}; font-weight:700;">
        ${t.greetingPrefix}${displayName}
      </p>
      <p style="margin:0; font-size:14px; color:${BRAND.darkSoft}; line-height:1.8;">
        ${t.thankYou}
        <strong style="color:${BRAND.color};">${data.orderName}</strong><br>
        ${t.received}
      </p>
    </td>
  </tr>
  </table>

  <!-- Status banner -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="padding:14px 20px; background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border:1px solid #A7F3D0; border-radius:12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:32px; vertical-align:top;">
          <span style="font-size:20px;">&#9989;</span>
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0 0 2px; font-size:14px; color:#065F46; font-weight:700;">${t.successTitle}</p>
          <p style="margin:0; font-size:12px; color:#047857;">${t.successDesc}</p>
        </td>
      </tr>
      </table>
    </td>
  </tr>
  </table>

  <!-- Data Card -->
  ${dataTable(data, t)}

  <!-- View Invoice CTA (hidden for now) -->

  <!-- Notice -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
  <tr>
    <td style="padding:16px 20px; background-color:#FFFBEB; border:1px solid #FDE68A; border-radius:12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width:28px; vertical-align:top;">
          <span style="font-size:16px;">&#9888;&#65039;</span>
        </td>
        <td>
          <p style="margin:0 0 4px; font-size:13px; color:#92400E; font-weight:700;">${t.noteTitle}</p>
          <p style="margin:0; font-size:12px; color:#A16207; line-height:1.7;">
            ${t.noteDesc}<br>
            &#9993; <a href="mailto:${BRAND.contactEmail}" style="color:${BRAND.color}; font-weight:600;">${BRAND.contactEmail}</a>
            &nbsp;&nbsp;&#9742; <a href="tel:${BRAND.contactPhone.replace(/-/g, '')}" style="color:${BRAND.color}; font-weight:600;">${BRAND.contactPhone}</a> / <a href="tel:${BRAND.contactPhone2.replace(/-/g, '')}" style="color:${BRAND.color}; font-weight:600;">${BRAND.contactPhone2}</a>
          </p>
        </td>
      </tr>
      </table>
    </td>
  </tr>
  </table>

  <!-- Timestamp -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
  <tr>
    <td style="text-align:right;">
      <p style="margin:0; font-size:11px; color:${BRAND.grayMedium};">
        ${t.submittedAt} ${data.submittedAt}
      </p>
    </td>
  </tr>
  </table>`

  return {
    subject,
    html: baseLayout(content, t.preheaderCustomer(data.orderName), t),
  }
}

/**
 * Admin notification email
 */
export function buildAdminEmail(data: TaxInvoiceEmailData): { subject: string; html: string } {
  const lang: Lang = data.lang || 'th'
  const t = i18n[lang]
  const isCompany = data.customerType === 'นิติบุคคล'
  const displayName = isCompany ? data.companyName : `${data.titleName}${data.fullName}`
  const subject = `[${t.taxInvoice}] ${data.orderName} | ${displayName} | ${data.customerType}`

  const content = `
  <!-- Alert banner -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    <td style="padding:16px 20px; background: linear-gradient(135deg, ${BRAND.colorBg} 0%, #FEE2E2 100%); border:1px solid ${BRAND.colorBorder}; border-radius:12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;">
          <p style="margin:0 0 2px; font-size:11px; color:${BRAND.grayMedium}; font-weight:500; text-transform:uppercase; letter-spacing:1px;">${t.newSubmission}</p>
          <p style="margin:0; font-size:22px; color:${BRAND.color}; font-weight:700;">${data.orderName}</p>
        </td>
        <td style="text-align:right; vertical-align:middle;">
          <span style="display:inline-block; padding:5px 14px; border-radius:999px; font-size:12px; font-weight:700; background-color:${isCompany ? '#DBEAFE' : '#DCFCE7'}; color:${isCompany ? '#1D4ED8' : '#15803D'};">
            ${isCompany ? t.company : t.individual}
          </span>
        </td>
      </tr>
      </table>
    </td>
  </tr>
  </table>

  <!-- Customer quick info -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; border:1px solid ${BRAND.grayBorder}; border-radius:12px; overflow:hidden;">
  <tr>
    <td style="padding:10px 16px; background-color:${BRAND.grayLight}; border-bottom:1px solid ${BRAND.grayBorder};">
      <p style="margin:0; font-size:12px; color:${BRAND.gray}; font-weight:600; text-transform:uppercase; letter-spacing:1px;">${t.contactInfo}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px;">
      <p style="margin:0 0 6px; font-size:17px; color:${BRAND.dark}; font-weight:700;">${displayName}</p>
      <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:20px;">
          <p style="margin:0; font-size:13px; color:${BRAND.darkSoft};">
            &#9993; <a href="mailto:${data.customerEmail}" style="color:${BRAND.color}; font-weight:500;">${data.customerEmail}</a>
          </p>
        </td>
        ${
          data.phoneNumber
            ? `
        <td>
          <p style="margin:0; font-size:13px; color:${BRAND.darkSoft};">
            &#9742; <a href="tel:${data.phoneNumber.replace(/-/g, '')}" style="color:${BRAND.color}; font-weight:500;">${data.phoneNumber}</a>
          </p>
        </td>`
            : ''
        }
      </tr>
      </table>
    </td>
  </tr>
  </table>

  <!-- Full Details -->
  ${dataTable(data, t)}

  <!-- Timestamp -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
  <tr>
    <td style="padding:12px 16px; background-color:${BRAND.grayLight}; border-radius:8px;">
      <p style="margin:0; font-size:12px; color:${BRAND.grayMedium};">
        &#128337; ${t.submittedAt} <strong style="color:${BRAND.darkSoft};">${data.submittedAt}</strong>
      </p>
    </td>
  </tr>
  </table>`

  return {
    subject,
    html: baseLayout(content, t.preheaderAdmin(data.orderName, displayName, data.customerType), t),
  }
}
