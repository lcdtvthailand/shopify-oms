const { buildCustomerEmail, buildAdminEmail } = await import('../lib/services/email-templates.ts')

const INVOICE_URL = process.env.INVOICE_URL || ''
const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN
const SENDER = process.env.GMAIL_SENDER_EMAIL

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !SENDER) {
  console.error('Missing required env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER_EMAIL')
  console.error('Usage: npx tsx --env-file .env.dev scripts/send-test-email.mjs')
  process.exit(1)
}

const data = {
  orderName: '#LCD-1301',
  customerType: 'บุคคลธรรมดา',
  titleName: 'นาย',
  fullName: 'ตติย มีเมศกุล',
  companyName: '',
  branchType: '',
  branchCode: '',
  taxId: '1234567890123',
  taxIdFormatted: '1-2345-67890-12-3',
  phoneNumber: '081-234-5678',
  province: 'กรุงเทพมหานคร',
  district: 'จตุจักร',
  subDistrict: 'ลาดยาว',
  postalCode: '10900',
  fullAddress: '123/45 อาคารทดสอบ ชั้น 5 ถนนพหลโยธิน',
  customerEmail: 'tm@summitlenso.com',
  submittedAt: '11 เมษายน 2569 12:30',
  invoiceUrl: INVOICE_URL,
  lang: 'th',
}

const customer = buildCustomerEmail(data)
const admin = buildAdminEmail(data)

// Get access token
const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, refresh_token: REFRESH_TOKEN, grant_type: 'refresh_token' }),
})
const { access_token } = await tokenResp.json()

async function sendEmail(to, subject, html) {
  const boundary = `boundary_${Date.now()}`
  const raw = [
    `From: LCDTVTHAILAND SHOP <${SENDER}>`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(html).toString('base64'),
    `--${boundary}--`,
  ].join('\r\n')

  const resp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${SENDER}/messages/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: Buffer.from(raw).toString('base64url') }),
  })
  return resp.json()
}

console.log('Sending customer email...')
const r1 = await sendEmail(SENDER, customer.subject, customer.html)
console.log('Customer:', r1.id ? `✅ sent (${r1.id})` : `❌ failed: ${JSON.stringify(r1)}`)

console.log('Sending admin email...')
const r2 = await sendEmail(SENDER, admin.subject, admin.html)
console.log('Admin:', r2.id ? `✅ sent (${r2.id})` : `❌ failed: ${JSON.stringify(r2)}`)
