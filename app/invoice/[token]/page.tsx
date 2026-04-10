import crypto from 'node:crypto'
import type { Metadata } from 'next'
import InvoiceView from './InvoiceView'

export const metadata: Metadata = {
  title: 'ใบกำกับภาษี - Tax Invoice | LCDTVTHAILAND SHOP',
  description: 'View your tax invoice details',
}

function hmacToken(input: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(input, 'utf8').digest('hex')
}

interface TokenPayload {
  order: string
  email: string
  ts: number
  token: string
}

function verifyToken(code: string): TokenPayload | null {
  try {
    const b64 = code
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(code.length / 4) * 4, '=')
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as TokenPayload

    const key = process.env.SHOPIFY_STORE_DOMAIN || ''
    const secret = process.env.OMS_TOKEN_SECRET || key
    const expected = hmacToken(
      `invoice|${payload.order}|${payload.email}|${payload.ts}|${key}`,
      secret
    )

    const valid = crypto.timingSafeEqual(
      Buffer.from(payload.token, 'utf8'),
      Buffer.from(expected, 'utf8')
    )

    if (!valid) return null

    // Check TTL (30 days for invoice viewing)
    const ageSeconds = Math.floor(Date.now() / 1000) - payload.ts
    if (ageSeconds > 30 * 24 * 3600) return null

    return payload
  } catch {
    return null
  }
}

interface InvoiceData {
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
}

async function fetchInvoiceData(orderNumber: string, email: string): Promise<InvoiceData | null> {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

  if (!storeDomain || !accessToken) return null

  const query = `
    query findOrderByName($query: String!) {
      orders(first: 1, query: $query) {
        nodes {
          id
          name
          customer { email }
          metafields(first: 100, namespace: "custom") {
            nodes { key value }
          }
        }
      }
    }
  `

  const resp = await fetch(`https://${storeDomain}/admin/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query,
      variables: { query: `name:#${orderNumber}` },
    }),
    next: { revalidate: 0 },
  })

  if (!resp.ok) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await resp.json()) as any
  const order = json?.data?.orders?.nodes?.[0]
  if (!order) return null

  // Verify email matches
  const orderEmail = (order.customer?.email || '').toLowerCase()
  if (orderEmail !== email.toLowerCase()) return null

  const metaMap: Record<string, string> = {}
  for (const node of order.metafields?.nodes || []) {
    metaMap[node.key] = node.value || ''
  }

  const customerType = metaMap.customer_type || metaMap.custom_customer_type || ''
  const isCompany = customerType === 'นิติบุคคล'

  return {
    orderName: order.name,
    customerType,
    titleName: metaMap.title_name || metaMap.custom_title_name || '',
    fullName: isCompany ? '' : metaMap.full_name || metaMap.custom_full_name || '',
    companyName: isCompany
      ? metaMap.custom_company_name || metaMap.custom_custom_company_name || ''
      : '',
    branchType: metaMap.branch_type || metaMap.custom_branch_type || '',
    branchCode: metaMap.branch_code || metaMap.custom_branch_code || '',
    taxId: metaMap.tax_id || metaMap.custom_tax_id || '',
    taxIdFormatted: metaMap.tax_id_formatted || metaMap.custom_tax_id_formatted || '',
    phoneNumber: metaMap.phone_number || metaMap.custom_phone_number || '',
    province: metaMap.province || metaMap.custom_province || '',
    district: metaMap.district || metaMap.custom_district || '',
    subDistrict:
      metaMap.sub_district || metaMap.custom_sub_district || metaMap.custom_custom_district2 || '',
    postalCode: metaMap.postal_code || metaMap.custom_postal_code || '',
    fullAddress: metaMap.full_address || metaMap.custom_full_address || '',
    customerEmail: email,
  }
}

export default async function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const payload = verifyToken(decodeURIComponent(token))

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h1>
          <p className="text-gray-500 text-sm">Invalid or expired link</p>
        </div>
      </div>
    )
  }

  const data = await fetchInvoiceData(payload.order, payload.email)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📄</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่พบข้อมูลใบกำกับภาษี</h1>
          <p className="text-gray-500 text-sm">Tax invoice data not found</p>
        </div>
      </div>
    )
  }

  return <InvoiceView data={data} />
}
