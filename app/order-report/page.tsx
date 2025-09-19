'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ShopifyGraphQLResponse } from '@/types/shopify'

// Minimal types for Orders response used on the page
interface MoneyV2 {
  amount: string
  currencyCode: string
}
interface PriceSet {
  shopMoney: MoneyV2
}
interface OrderLineItem {
  id: string
  name: string
  sku?: string | null
  quantity: number
  originalUnitPriceSet?: PriceSet
  discountedUnitPriceSet?: PriceSet
  totalDiscountSet?: PriceSet
  variant?: { id: string; sku?: string | null; title?: string | null } | null
  product?: { id: string; title?: string | null; vendor?: string | null } | null
}
interface OrderNode {
  id: string
  name: string
  createdAt: string
  processedAt?: string | null
  updatedAt?: string | null
  displayFinancialStatus?: string | null
  displayFulfillmentStatus?: string | null
  email?: string | null
  customer?: {
    id: string
    displayName?: string | null
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    email?: string | null
  } | null
  currentTotalPriceSet?: PriceSet
  currentSubtotalPriceSet?: PriceSet
  currentShippingPriceSet?: PriceSet
  currentTotalTaxSet?: PriceSet
  currentTotalDiscountsSet?: PriceSet
  lineItems?: { edges: Array<{ node: OrderLineItem }> }
  shippingAddress?: {
    name?: string | null
    phone?: string | null
    address1?: string | null
    address2?: string | null
    city?: string | null
    province?: string | null
    country?: string | null
    zip?: string | null
    company?: string | null
  } | null
  billingAddress?: {
    name?: string | null
    phone?: string | null
    address1?: string | null
    address2?: string | null
    city?: string | null
    province?: string | null
    country?: string | null
    zip?: string | null
    company?: string | null
  } | null
  shippingLines?: {
    edges: Array<{
      node: {
        title?: string | null
        code?: string | null
        source?: string | null
        originalPriceSet?: PriceSet
        discountedPriceSet?: PriceSet
      }
    }>
  }
  fulfillments?: Array<{
    name?: string | null
    status?: string | null
    createdAt?: string | null
    deliveredAt?: string | null
    estimatedDeliveryAt?: string | null
    trackingInfo?: Array<{ number?: string | null; company?: string | null; url?: string | null }>
    service?: { serviceName?: string | null } | null
  }>
  transactions?: {
    edges?: Array<{
      node: {
        gateway?: string | null
        kind?: string | null
        status?: string | null
        amountSet?: { shopMoney: MoneyV2 }
        fees?: Array<{
          amount?: { amount: string; currencyCode: string }
          rate?: number | null
          rateName?: string | null
          type?: string | null
        }>
        processedAt?: string | null
        paymentDetails?: { company?: string | null }
      }
    }>
  }
  refunds?: {
    edges?: Array<{
      node: {
        id: string
        createdAt?: string | null
        note?: string | null
        totalRefundedSet?: { shopMoney: MoneyV2 }
      }
    }>
  }
  returns?: {
    edges?: Array<{
      node: {
        id: string
        name?: string | null
        status?: string | null
        totalQuantity?: number | null
      }
    }>
  }
  customAttributes?: Array<{ key: string; value: string }>
  metafields?: { edges?: Array<{ node: { namespace: string; key: string; value: string } }> }
  cancelReason?: string | null
  cancelledAt?: string | null
  confirmed?: boolean | null
  note?: string | null
  tags?: string[]
  sourceName?: string | null
  sourceIdentifier?: string | null
  discountCode?: string | null
  discountCodes?: string[] | null
  discountApplications?: {
    edges: Array<{
      node: {
        __typename?: string
        code?: string | null
        title?: string | null
        value?: { amount?: string; currencyCode?: string; percentage?: number }
      }
    }>
  }
}
interface OrdersResponse {
  orders: {
    edges: Array<{ node: OrderNode }>
    pageInfo: { hasNextPage: boolean; endCursor: string }
  }
}

// Helper functions
const isLikelyJSON = (s: string) => {
  if (!s) return false
  const t = s.trim()
  if (!((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))))
    return false
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

const prettyJSON = (s: string) => {
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch {
    return s
  }
}

// Component definitions
const KeyValueRow = ({ k, v }: { k: string; v: string }) => {
  const [expanded, setExpanded] = useState(true)
  const longText = v && v.length > 120
  const isJson = isLikelyJSON(v)
  const preview = isJson
    ? prettyJSON(v).slice(0, 200) + (prettyJSON(v).length > 200 ? '…' : '')
    : longText
      ? `${v.slice(0, 200)}…`
      : v
  return (
    <div className="flex items-start gap-3">
      <dt className="text-xs font-medium text-gray-600 min-w-36 sm:min-w-44 break-words">{k}</dt>
      <dd className="text-xs text-gray-900 break-words max-w-full">
        {isJson ? (
          expanded ? (
            <pre
              className="text-[11px] leading-4 bg-gray-50 border rounded p-2 overflow-x-auto whitespace-pre-wrap break-words"
              style={{ fontFamily: 'inherit' }}
            >
              {prettyJSON(v)}
            </pre>
          ) : (
            <pre
              className="text-[11px] leading-4 bg-gray-50 border rounded p-2 overflow-x-auto whitespace-pre break-words"
              style={{ fontFamily: 'inherit' }}
            >
              {preview}
            </pre>
          )
        ) : (
          <span className={'whitespace-pre-wrap break-words'}>{expanded ? v : preview}</span>
        )}
        {(longText || isJson) && (
          <div className="mt-1">
            <button
              type="button"
              className="text-[11px] text-red-600 hover:text-red-800 underline"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'ย่อ' : 'แสดงทั้งหมด'}
            </button>
          </div>
        )}
      </dd>
    </div>
  )
}

const _KeyValueList = ({ items }: { items: Array<{ k: string; v: string }> }) => (
  <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
    {items.map((p, idx) => (
      <KeyValueRow key={`${p.k}-${idx}`} k={p.k} v={p.v} />
    ))}
  </dl>
)

const Badge = ({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode
  tone?: 'gray' | 'green' | 'red' | 'yellow' | 'blue'
}) => {
  const tones: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
  }
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

const PaginationControls = ({
  startIndex,
  endIndex,
  totalItems,
  pageSize,
  setPageSize,
  safePage,
  totalPages,
  setPage,
  variant = 'top',
  monthFilter,
  setMonthFilter,
  yearFilter,
  setYearFilter,
  thaiMonths,
  years,
  dateQuickFilter,
  setDateQuickFilter,
}: {
  startIndex: number
  endIndex: number
  totalItems: number
  pageSize: number
  setPageSize: (n: number) => void
  safePage: number
  totalPages: number
  setPage: (updater: (p: number) => number) => void
  variant?: 'top' | 'bottom'
  monthFilter?: number | 'all'
  setMonthFilter?: (v: number | 'all') => void
  yearFilter?: number | 'all'
  setYearFilter?: (v: number | 'all') => void
  thaiMonths?: string[]
  years?: number[]
  dateQuickFilter?: 'all' | 'today' | 'yesterday' | 'last7'
  setDateQuickFilter?: (v: 'all' | 'today' | 'yesterday' | 'last7') => void
}) =>
  variant === 'bottom' ? (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 text-sm px-4 py-2 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-red-200 transition-all duration-200 font-medium text-red-700"
          disabled={safePage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          ก่อนหน้า
        </button>
        <button
          type="button"
          className="flex items-center gap-2 text-sm px-4 py-2 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-red-200 transition-all duration-200 font-medium text-red-700"
          disabled={safePage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          ถัดไป
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  ) : (
    <div className="bg-white border border-red-200 rounded-xl px-6 py-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg">
          <svg
            className="h-4 w-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </div>
        <div className="text-sm text-red-700 font-medium flex items-center gap-2 whitespace-nowrap">
          แสดง{' '}
          <span className="font-bold">
            {startIndex + 1}-{endIndex}
          </span>{' '}
          จากทั้งหมด <span className="font-bold">{totalItems}</span> รายการ
          <span className="text-xs text-red-600/70 font-normal">
            • หน้า {safePage} จาก {totalPages}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6 flex-wrap sm:ml-auto w-full justify-end">
        {typeof dateQuickFilter !== 'undefined' && typeof setDateQuickFilter !== 'undefined' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-red-700 font-medium">ช่วงวันที่</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDateQuickFilter('today')}
                className={`px-3 py-1.5 text-sm rounded-lg border ${dateQuickFilter === 'today' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => setDateQuickFilter('yesterday')}
                className={`px-3 py-1.5 text-sm rounded-lg border ${dateQuickFilter === 'yesterday' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
              >
                เมื่อวาน
              </button>
              <button
                type="button"
                onClick={() => setDateQuickFilter('last7')}
                className={`px-3 py-1.5 text-sm rounded-lg border ${dateQuickFilter === 'last7' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setDateQuickFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg border ${dateQuickFilter === 'all' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                title="ล้างตัวกรองวันที่แบบด่วน"
              >
                ทั้งหมด
              </button>
            </div>
          </div>
        )}
        {typeof monthFilter !== 'undefined' &&
          typeof setMonthFilter !== 'undefined' &&
          thaiMonths && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-red-700 font-medium">เดือน</label>
              <select
                className="text-sm border-2 border-red-200 rounded-lg px-3 py-2 bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 min-w-[8rem]"
                value={monthFilter}
                onChange={(e) => {
                  setDateQuickFilter?.('all')
                  setMonthFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
                }}
              >
                <option value="all">ทั้งหมด</option>
                {thaiMonths.map((m, idx) => (
                  <option key={`month-${m}`} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        {typeof yearFilter !== 'undefined' && typeof setYearFilter !== 'undefined' && years && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-red-700 font-medium">ปี</label>
            <select
              className="text-sm border-2 border-red-200 rounded-lg px-3 py-2 bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 min-w-[6rem]"
              value={yearFilter}
              onChange={(e) => {
                setDateQuickFilter?.('all')
                setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
              }}
            >
              <option value="all">ทั้งหมด</option>
              {years
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y} value={y}>
                    {y + 543}
                  </option>
                ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-sm text-red-700 font-medium">แสดงต่อหน้า</label>
          <select
            className="text-sm border-2 border-red-200 rounded-lg px-3 py-2 bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
            value={pageSize}
            onChange={(e) => {
              setPage(() => 1)
              setPageSize(parseInt(e.target.value, 10))
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  )

const _groupMetafields = (list: any[]) => {
  const map = new Map<string, Array<{ k: string; v: string }>>()
  for (const m of list) {
    const ns = String(m?.namespace ?? 'default')
    const key = String(m?.key ?? '')
    const val = String(m?.value ?? '')
    if (!map.has(ns)) map.set(ns, [])
    map.get(ns)!.push({ k: key, v: val })
  }
  return Array.from(map.entries()).map(([ns, items]) => ({ ns, items }))
}

// Authentication Popup Component (top-level to avoid recreating on each render)
const AuthPopup = ({
  authCode,
  setAuthCode,
  handleAuth,
  authError,
  authAttempts,
}: {
  authCode: string
  setAuthCode: (v: string) => void
  handleAuth: () => void
  authError: string
  authAttempts: number
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-red-200 p-8 max-w-md w-full mx-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เข้าสู่ระบบรายงาน</h2>
        <p className="text-gray-600">กรุณาใส่รหัสเพื่อเข้าถึงหน้ารายงานคำสั่งซื้อ</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รหัสเข้าใช้งาน</label>
          <input
            type="password"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && authAttempts < 3 && authCode.trim() && handleAuth()
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            placeholder="ใส่รหัสที่นี่"
            disabled={authAttempts >= 3}
          />
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAuth}
          disabled={!authCode.trim() || authAttempts >= 3}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {authAttempts >= 3 ? 'ถูกล็อค กรุณารอ...' : 'เข้าสู่ระบบ'}
        </button>

        <div className="text-right text-xs text-gray-500 mt-4">ความพยายาม: {authAttempts}/3</div>
      </div>
    </div>
  </div>
)

export default function TestPage() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthPopup, setShowAuthPopup] = useState(true)
  const [authCode, setAuthCode] = useState('')
  const [authError, setAuthError] = useState('')
  const [authAttempts, setAuthAttempts] = useState(0)

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OrderNode[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pageInfo, setPageInfo] = useState<{ hasNextPage: boolean; endCursor: string } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  })
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(1)
  const [exportingAll, setExportingAll] = useState(false)
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [dateQuickFilter, setDateQuickFilter] = useState<'all' | 'today' | 'yesterday' | 'last7'>(
    'all'
  )
  const detailsRef = useRef<HTMLDivElement>(null)
  const orderRowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({})
  const thaiMonths: string[] = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ]
  const getFilteredOrders = (): OrderNode[] => {
    const startOfDay = (dt: Date) =>
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0)
    const endOfDay = (dt: Date) =>
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999)
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStart = startOfDay(yesterday)
    const yesterdayEnd = endOfDay(yesterday)
    const last7Start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)) // รวมวันนี้ = 7 วันย้อนหลัง

    return data.filter((o: OrderNode) => {
      const d = new Date(o.createdAt)

      // Quick date filters take precedence over month/year filters
      if (dateQuickFilter === 'today') {
        return d >= todayStart && d <= todayEnd
      }
      if (dateQuickFilter === 'yesterday') {
        return d >= yesterdayStart && d <= yesterdayEnd
      }
      if (dateQuickFilter === 'last7') {
        return d >= last7Start && d <= todayEnd
      }

      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const okMonth = monthFilter === 'all' ? true : m === monthFilter
      const okYear = yearFilter === 'all' ? true : y === yearFilter
      return okMonth && okYear
    })
  }
  const scrollToDetails = useCallback(() => {
    if (!detailsRef.current) return
    const rect = detailsRef.current.getBoundingClientRect()
    const absoluteY = window.scrollY + rect.top
    const offset = 80 // keep title visible
    window.scrollTo({ top: Math.max(absoluteY - offset, 0), behavior: 'smooth' })
  }, [])
  const exportToXlsx = async () => {
    try {
      const ExcelJSImport: any = await import('exceljs')
      const ExcelJS = ExcelJSImport?.default ? ExcelJSImport.default : ExcelJSImport
      const orders = getFilteredOrders()
      const ordersRows: any[] = []
      orders.forEach((o) => {
        const customerName = o.customer?.displayName || o.customer?.email || ''
        const ship = (o.shippingLines as any)?.edges?.[0]?.node
        const tracking = Array.isArray(o.fulfillments)
          ? o.fulfillments.flatMap((f: any) =>
              Array.isArray(f?.trackingInfo)
                ? f.trackingInfo.map((t: any) => t?.number).filter(Boolean)
                : []
            )
          : []
        const shippingAddress = o.shippingAddress || {}
        const _billingAddress = o.billingAddress || {}

        // Consolidated summaries (Option A)
        const itemEdges: any[] = (o.lineItems as any)?.edges || []
        const formatItem = (it: any) => {
          const name = it?.name || ''
          // Return only the item name; do not append SKU in brackets
          return `${name}`
        }
        const _itemsCount = itemEdges.reduce(
          (n: number, e: any) => n + Number(e?.node?.quantity ?? 0),
          0
        )
        const _itemsSkus = itemEdges
          .map((e: any) => e?.node?.sku || e?.node?.variant?.sku)
          .filter(Boolean)
          .join(' | ')

        const shipEdges: any[] = (o.shippingLines as any)?.edges || []
        const _shippingSummary = shipEdges
          .map((e: any) => {
            const s = e.node
            const title = s?.title || s?.source || ''
            const code = s?.code || ''
            const before = s?.originalPriceSet?.shopMoney?.amount || ''
            const after = s?.discountedPriceSet?.shopMoney?.amount || ''
            return `${title}${code ? ` (${code})` : ''} before:${before} after:${after}`
          })
          .join(' | ')

        const discEdges: any[] = (o.discountApplications as any)?.edges || []
        const discountSummary = discEdges
          .map((e: any) => {
            const d = e.node
            const type = d?.__typename || ''
            const codeOrTitle = d?.code || d?.title || ''
            const amount = d?.value?.amount || ''
            return `${type}${codeOrTitle ? `:${codeOrTitle}` : ''}${amount ? ` amount:${amount}` : ''}`
          })
          .join(' | ')

        const txEdges: any[] = (o.transactions as any)?.edges || []
        const _transactionsSummary = txEdges
          .map((e: any) => {
            const t = e.node
            const feeSum = Array.isArray(t?.fees)
              ? t.fees.reduce(
                  (sum: number, f: any) => sum + parseFloat(f?.amount?.amount || '0'),
                  0
                )
              : 0
            const when = t?.processedAt ? new Date(t.processedAt).toLocaleString('th-TH') : ''
            const bank = t?.paymentDetails?.company || ''
            return `${t?.gateway || ''}/${t?.kind || ''}/${t?.status || ''} amount:${t?.amountSet?.shopMoney?.amount || ''} fee:${feeSum} ${when}${bank ? ` ${bank}` : ''}`
          })
          .join(' | ')

        const refEdges: any[] = (o.refunds as any)?.edges || []
        const _refundsSummary = refEdges
          .map((e: any) => {
            const r = e.node
            const when = r?.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : ''
            return `${r?.id || ''} amount:${r?.totalRefundedSet?.shopMoney?.amount || ''}${when ? ` @ ${when}` : ''}${r?.note ? ` (${r.note})` : ''}`
          })
          .join(' | ')

        const caList: any[] = o.customAttributes || []
        const _customAttrSummary = caList
          .map((c: any) => `${c?.key || ''}:${c?.value || ''}`)
          .join(' | ')

        // Tax invoice fields from metafields (custom.*)
        const mlist = nodesFrom((o as any).metafields)
        const getMf = (candidates: string[]): string => {
          for (const cand of candidates) {
            const [ns, key] = String(cand).split('.')
            const found = (mlist as any[]).find(
              (m: any) => String(m?.namespace) === ns && String(m?.key) === key
            )
            if (found && typeof found.value !== 'undefined' && String(found.value).trim() !== '') {
              return String(found.value)
            }
          }
          return ''
        }

        // Determine shipping option display and delivery method per checkout mapping
        const shippingOptionRaw = String(ship?.title || ship?.source || '')
        const shippingOptionDisplay =
          shippingOptionRaw === 'Thailand Shipping'
            ? `${shippingOptionRaw} (รับสินค้าเองที่ร้าน)`
            : shippingOptionRaw
        const deliveryMethodText =
          shippingOptionDisplay === 'Thailand Shipping (รับสินค้าเองที่ร้าน)'
            ? 'รับสินค้าเองที่ร้าน'
            : 'จัดส่งตามที่อยู่'

        // Determine whether buyer requested a tax invoice based on presence of key TI metafields
        const requestedTaxInvoice = !!(
          getMf(['custom.customer_type', 'custom.custom_customer_type']) ||
          getMf(['custom.company_name', 'custom.custom_company_name']) ||
          getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]) ||
          getMf(['custom.full_address', 'custom.custom_full_address'])
        )

        const baseRow = {
          หมายเลขคำสั่งซื้อ: o.name,
          วันที่: o.createdAt ? new Date(o.createdAt).toLocaleString('th-TH') : '',
          สถานะการชำระเงิน: o.displayFinancialStatus || '',
          สถานะการจัดส่ง: o.displayFulfillmentStatus || '',
          'ชื่อผู้ใช้ (ผู้ซื้อ)': customerName,
          อีเมล: o.customer?.email || o.email || '',
          เบอร์โทร: o.customer?.phone || '',
          ยอดรวม: o.currentTotalPriceSet?.shopMoney?.amount || '',
          ยอดสินค้า: o.currentSubtotalPriceSet?.shopMoney?.amount || '',
          ค่าส่ง: o.currentShippingPriceSet?.shopMoney?.amount || '',
          ภาษี: o.currentTotalTaxSet?.shopMoney?.amount || '',
          ส่วนลดรวม: o.currentTotalDiscountsSet?.shopMoney?.amount || '',
          ตัวเลือกการจัดส่ง: shippingOptionDisplay,
          วิธีการจัดส่ง: deliveryMethodText,
          หมายเลขติดตามพัสดุ: tracking.join(', '),
          ชื่อผู้รับ: shippingAddress?.name || '',
          เบอร์โทรผู้รับ: shippingAddress?.phone || '',
          ที่อยู่ผู้รับ: shippingAddress?.address1 || '',
          'ตำบล/แขวง': shippingAddress?.address2 || '',
          'อำเภอ/เขต': shippingAddress?.city || '',
          จังหวัด: shippingAddress?.province || '',
          ประเทศ: shippingAddress?.country || '',
          รหัสไปรษณีย์: shippingAddress?.zip || '',

          // Consolidated columns
          // One item per row as requested; will be set per push below
          รายการสินค้า: '',
          จำนวนสินค้า: 0,
          SKU: '',
          ราคาตั้งต้น: '',
          ราคาขาย: '',
          ราคาขายสุทธิ: '',
          ส่วนลด: discountSummary,
          ร้องขอใบกำกับภาษี: requestedTaxInvoice ? 'ขอใบกำกับภาษี' : 'ไม่ขอใบกำกับภาษี',

          // Tax invoice (TI) fields
          ประเภทใบกำกับภาษี: getMf(['custom.customer_type', 'custom.custom_customer_type']),
          'ชื่อ (ใบกำกับภาษี)': getMf(['custom.company_name', 'custom.custom_company_name']),
          'ประเภทสาขา (ใบกำกับภาษี)': getMf(['custom.branch_type', 'custom.custom_branch_type']),
          'รหัสสาขา (ใบกำกับภาษี)': getMf(['custom.branch_code', 'custom.custom_branch_code']),
          เลขผู้เสียภาษี: getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]),
          'โทรศัพท์ (ใบกำกับภาษี)': getMf(['custom.phone_number', 'custom.custom_phone_number']),
          'โทรศัพท์สำรอง (ใบกำกับภาษี)': getMf([
            'custom.alt_phone_number',
            'custom.custom_alt_phone_number',
          ]),
          'จังหวัด (ใบกำกับภาษี)': getMf(['custom.province', 'custom.custom_province']),
          'อำเภอ/เขต (ใบกำกับภาษี)': getMf(['custom.district', 'custom.custom_district']),
          'ตำบล/แขวง (ใบกำกับภาษี)': getMf(['custom.sub_district', 'custom.custom_sub_district']),
          'ไปรษณีย์ (ใบกำกับภาษี)': getMf(['custom.postal_code', 'custom.custom_postal_code']),
          'ที่อยู่ (ใบกำกับภาษี)': getMf(['custom.full_address', 'custom.custom_full_address']),
        }

        if (itemEdges.length > 0) {
          itemEdges.forEach((e: any) => {
            const it = e.node
            const qty = Number(it?.quantity ?? 0)
            const unit = parseFloat(it?.discountedUnitPriceSet?.shopMoney?.amount || '0')
            for (let i = 0; i < qty; i++) {
              ordersRows.push({
                ...baseRow,
                รายการสินค้า: formatItem(it),
                จำนวนสินค้า: 1,
                SKU: it?.sku || it?.variant?.sku || '',
                ราคาตั้งต้น: it?.originalUnitPriceSet?.shopMoney?.amount || '',
                ราคาขาย: it?.discountedUnitPriceSet?.shopMoney?.amount || '',
                ราคาขายสุทธิ: unit.toFixed(2),
              })
            }
          })
        } else {
          ordersRows.push({
            ...baseRow,
            รายการสินค้า: '-',
            จำนวนสินค้า: 0,
            SKU: '',
            ราคาตั้งต้น: '',
            ราคาขาย: '',
            ราคาขายสุทธิ: '',
          })
        }
      })
      const itemsRows: any[] = []
      orders.forEach((o) => {
        const items = (o.lineItems as any)?.edges || []
        items.forEach((edge: any) => {
          const it = edge.node
          const unitAfterDisc = parseFloat(it?.discountedUnitPriceSet?.shopMoney?.amount || '0')
          const qty = Number(it?.quantity ?? 0)
          const netPerItem = unitAfterDisc * qty
          itemsRows.push({
            หมายเลขคำสั่งซื้อ: o.name,
            ชื่อสินค้า: it?.name || '',
            'เลขอ้างอิง SKU (SKU Reference No.)': it?.sku || it?.variant?.sku || '',
            ชื่อตัวเลือก: it?.variant?.title || '',
            ราคาตั้งต้น: it?.originalUnitPriceSet?.shopMoney?.amount || '',
            ราคาขาย: it?.discountedUnitPriceSet?.shopMoney?.amount || '',
            จำนวน: qty,
            'ราคาขายสุทธิ (ต่อไอเท็ม)': netPerItem.toFixed(2),
            จำนวนที่คืนได้: it?.refundableQuantity ?? '',
            ส่วนลดรวม: it?.totalDiscountSet?.shopMoney?.amount || '',
          })
        })
      })
      const shippingRows: any[] = []
      orders.forEach((o) => {
        const lines = (o.shippingLines as any)?.edges || []
        lines.forEach((e: any) => {
          const s = e.node
          shippingRows.push({
            เลขที่ออเดอร์: o.name,
            ชื่อบริการ: s?.title || '',
            รหัส: s?.code || '',
            ราคาก่อนส่วนลด: s?.originalPriceSet?.shopMoney?.amount || '',
            ราคาหลังส่วนลด: s?.discountedPriceSet?.shopMoney?.amount || '',
          })
        })
      })
      const discountRows: any[] = []
      orders.forEach((o) => {
        const dapps = (o.discountApplications as any)?.edges || []
        dapps.forEach((e: any) => {
          const d = e.node
          discountRows.push({
            เลขที่ออเดอร์: o.name,
            ประเภทส่วนลด: d?.__typename || '',
            'โค้ด/ชื่อ': d?.code || d?.title || '',
            จำนวนเงิน: d?.value?.amount || '',
            เปอร์เซ็นต์: d?.value?.percentage ?? '',
          })
        })
      })
      const transactionRows: any[] = []
      orders.forEach((o) => {
        const txs = (o.transactions as any)?.edges || []
        txs.forEach((e: any) => {
          const t = e.node
          const feeSum = Array.isArray(t?.fees)
            ? t.fees.reduce((sum: number, f: any) => sum + parseFloat(f?.amount?.amount || '0'), 0)
            : 0
          transactionRows.push({
            เลขที่ออเดอร์: o.name,
            ช่องทางชำระเงิน: t?.gateway || '',
            ประเภท: t?.kind || '',
            สถานะ: t?.status || '',
            จำนวนเงิน: t?.amountSet?.shopMoney?.amount || '',
            ค่าธรรมเนียม: feeSum || '',
            เวลาทำรายการ: t?.processedAt ? new Date(t.processedAt).toLocaleString('th-TH') : '',
            'ผู้ออกบัตร/ธนาคาร': t?.paymentDetails?.company || '',
          })
        })
      })
      const refundRows: any[] = []
      orders.forEach((o) => {
        const refs = (o.refunds as any)?.edges || []
        refs.forEach((e: any) => {
          const r = e.node
          refundRows.push({
            เลขที่ออเดอร์: o.name,
            รหัสการคืน: r?.id || '',
            เวลาคืนเงิน: r?.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : '',
            จำนวนเงิน: r?.totalRefundedSet?.shopMoney?.amount || '',
            หมายเหตุ: r?.note || '',
          })
        })
      })
      const metafieldRows: any[] = []
      const customAttrRows: any[] = []
      orders.forEach((o) => {
        const mfs = (o.metafields as any)?.edges || []
        mfs.forEach((e: any) => {
          const m = e.node
          metafieldRows.push({
            เลขที่ออเดอร์: o.name,
            เนมสเปซ: m?.namespace || '',
            คีย์: m?.key || '',
            ค่า: m?.value || '',
          })
        })
        const cas = o.customAttributes || []
        cas.forEach((c: any) => {
          customAttrRows.push({ เลขที่ออเดอร์: o.name, คีย์: c?.key || '', ค่า: c?.value || '' })
        })
      })

      // Build structured tax invoice sheet from metafields (custom.*) for ALL export
      const taxInvoiceRows: any[] = []
      orders.forEach((o) => {
        const mlist = nodesFrom((o as any).metafields)
        const getMf = (candidates: string[]): string => {
          for (const cand of candidates) {
            const [ns, key] = String(cand).split('.')
            const found = (mlist as any[]).find(
              (m: any) => String(m?.namespace) === ns && String(m?.key) === key
            )
            if (found && typeof found.value !== 'undefined' && String(found.value).trim() !== '') {
              return String(found.value)
            }
          }
          return ''
        }
        taxInvoiceRows.push({
          เลขที่ออเดอร์: o.name,
          'ประเภท (นิติบุคคล/บุคคลธรรมดา)': getMf([
            'custom.customer_type',
            'custom.custom_customer_type',
          ]),
          ชื่อบริษัท: getMf(['custom.company_name', 'custom.custom_company_name']),
          สาขา: getMf(['custom.branch_type', 'custom.custom_branch_type']),
          รหัสสาขา: getMf(['custom.branch_code', 'custom.custom_branch_code']),
          หมายเลขประจำตัวผู้เสียภาษี: getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]),
          หมายเลขโทรศัพท์: getMf(['custom.phone_number', 'custom.custom_phone_number']),
          หมายเลขโทรศัพท์สำรอง: getMf(['custom.alt_phone_number', 'custom.custom_alt_phone_number']),
          จังหวัด: getMf(['custom.province', 'custom.custom_province']),
          'อำเภอ/เขต': getMf(['custom.district', 'custom.custom_district']),
          'ตำบล/แขวง': getMf(['custom.sub_district', 'custom.custom_sub_district']),
          ไปรษณีย์: getMf(['custom.postal_code', 'custom.custom_postal_code']),
          ที่อยู่: getMf(['custom.full_address', 'custom.custom_full_address']),
        })
      })

      const wb = new ExcelJS.Workbook()
      const addSheetFromRows = (
        name: string,
        rows: any[]
      ): { ws: any; headers: string[] } | null => {
        const ws = wb.addWorksheet(name)
        if (!rows || rows.length === 0) return { ws, headers: [] }
        const headers = Object.keys(rows[0])
        ws.columns = headers.map((h) => ({
          header: h,
          key: h,
          width: Math.min(40, Math.max(12, String(h).length + 2)),
        }))
        rows.forEach((r) => {
          ws.addRow(r)
        })
        return { ws, headers }
      }
      const main = addSheetFromRows('คำสั่งซื้อ', ordersRows)
      addSheetFromRows('รายการสินค้า', itemsRows)
      addSheetFromRows('การจัดส่ง', shippingRows)
      addSheetFromRows('ส่วนลด', discountRows)
      addSheetFromRows('ใบกำกับภาษี', taxInvoiceRows)

      // Style tax-invoice request column in main sheet
      if (main?.headers.length) {
        const colIdx = main.headers.indexOf('ร้องขอใบกำกับภาษี') + 1
        if (colIdx > 0) {
          const ws = main.ws
          for (let r = 2; r <= ws.rowCount; r++) {
            const cell = ws.getRow(r).getCell(colIdx)
            const val = String(cell.value ?? '')
            const isRequested = val === 'ขอใบกำกับภาษี'
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: isRequested ? 'FFC6F6D5' : 'FFFECACA' }, // green-200 / red-200
            }
          }
        }
      }

      const fileName = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed', err)
      alert('ไม่สามารถส่งออกไฟล์ได้ กรุณาติดตั้งแพ็กเกจ exceljs และลองใหม่')
    }
  }
  const exportAllFromShopify = async () => {
    try {
      setExportingAll(true)
      const ExcelJS: any = await import('exceljs')
      let after: string | null = null
      let allOrders: OrderNode[] = []
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))
      while (true) {
        const response = await fetch('/api/shopify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: ordersQuery, variables: { after } }),
        })
        const json: ShopifyGraphQLResponse<OrdersResponse> = await response.json()
        if (!response.ok) throw new Error(`API ${response.status}`)
        if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(' | '))
        const batch = json.data?.orders.edges.map((e) => e.node) ?? []
        allOrders = allOrders.concat(batch)
        const pi = json.data?.orders.pageInfo
        if (!pi?.hasNextPage) break
        after = pi.endCursor
        await delay(200)
      }
      const orders = allOrders
      const ordersRows: any[] = []
      orders.forEach((o) => {
        const customerName = o.customer?.displayName || o.customer?.email || ''
        const ship = (o.shippingLines as any)?.edges?.[0]?.node
        const tracking = Array.isArray(o.fulfillments)
          ? o.fulfillments.flatMap((f: any) =>
              Array.isArray(f?.trackingInfo)
                ? f.trackingInfo.map((t: any) => t?.number).filter(Boolean)
                : []
            )
          : []
        const shippingAddress = o.shippingAddress || {}
        const _billingAddress = o.billingAddress || {}
        // Consolidated summaries (Option A)
        const itemEdges: any[] = (o.lineItems as any)?.edges || []
        const formatItem = (it: any) => {
          const name = it?.name || ''
          // For per-unit rows, display only the product name (no SKU/qty summary)
          return `${name}`
        }
        const _itemsCount = itemEdges.reduce(
          (n: number, e: any) => n + Number(e?.node?.quantity ?? 0),
          0
        )
        const _itemsSkus = itemEdges
          .map((e: any) => e?.node?.sku || e?.node?.variant?.sku)
          .filter(Boolean)
          .join(' | ')

        const shipEdges: any[] = (o.shippingLines as any)?.edges || []
        const _shippingSummary = shipEdges
          .map((e: any) => {
            const s = e.node
            const title = s?.title || s?.source || ''
            const code = s?.code || ''
            const before = s?.originalPriceSet?.shopMoney?.amount || ''
            const after = s?.discountedPriceSet?.shopMoney?.amount || ''
            return `${title}${code ? ` (${code})` : ''} before:${before} after:${after}`
          })
          .join(' | ')

        const discEdges: any[] = (o.discountApplications as any)?.edges || []
        const discountSummary = discEdges
          .map((e: any) => {
            const d = e.node
            const type = d?.__typename || ''
            const codeOrTitle = d?.code || d?.title || ''
            const amount = d?.value?.amount || ''
            const pct =
              typeof d?.value?.percentage !== 'undefined' ? `${d?.value?.percentage}%` : ''
            return `${type}${codeOrTitle ? `:${codeOrTitle}` : ''}${amount ? ` amount:${amount}` : ''}${pct ? ` pct:${pct}` : ''}`
          })
          .join(' | ')

        const txEdges: any[] = (o.transactions as any)?.edges || []
        const _transactionsSummary = txEdges
          .map((e: any) => {
            const t = e.node
            const feeSum = Array.isArray(t?.fees)
              ? t.fees.reduce(
                  (sum: number, f: any) => sum + parseFloat(f?.amount?.amount || '0'),
                  0
                )
              : 0
            const when = t?.processedAt ? new Date(t.processedAt).toLocaleString('th-TH') : ''
            const bank = t?.paymentDetails?.company || ''
            return `${t?.gateway || ''}/${t?.kind || ''}/${t?.status || ''} amount:${t?.amountSet?.shopMoney?.amount || ''} fee:${feeSum} ${when}${bank ? ` ${bank}` : ''}`
          })
          .join(' | ')

        const refEdges: any[] = (o.refunds as any)?.edges || []
        const _refundsSummary = refEdges
          .map((e: any) => {
            const r = e.node
            const when = r?.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : ''
            return `${r?.id || ''} amount:${r?.totalRefundedSet?.shopMoney?.amount || ''}${when ? ` @ ${when}` : ''}${r?.note ? ` (${r.note})` : ''}`
          })
          .join(' | ')

        const caList: any[] = o.customAttributes || []
        const _customAttrSummary = caList
          .map((c: any) => `${c?.key || ''}:${c?.value || ''}`)
          .join(' | ')

        // Tax invoice fields
        const mlist = nodesFrom((o as any).metafields)
        const getMf = (candidates: string[]): string => {
          for (const cand of candidates) {
            const [ns, key] = String(cand).split('.')
            const found = (mlist as any[]).find(
              (m: any) => String(m?.namespace) === ns && String(m?.key) === key
            )
            if (found && typeof found.value !== 'undefined' && String(found.value).trim() !== '')
              return String(found.value)
          }
          return ''
        }

        // Determine shipping option display and delivery method per checkout mapping
        const shippingOptionRaw2 = String(ship?.title || ship?.source || '')
        const shippingOptionDisplay2 =
          shippingOptionRaw2 === 'Thailand Shipping'
            ? `${shippingOptionRaw2} (รับสินค้าเองที่ร้าน)`
            : shippingOptionRaw2
        const deliveryMethodText2 =
          shippingOptionDisplay2 === 'Thailand Shipping (รับสินค้าเองที่ร้าน)'
            ? 'รับสินค้าเองที่ร้าน'
            : 'จัดส่งตามที่อยู่'

        // Determine whether buyer requested a tax invoice based on presence of key TI metafields
        const requestedTaxInvoice2 = !!(
          getMf(['custom.customer_type', 'custom.custom_customer_type']) ||
          getMf(['custom.company_name', 'custom.custom_company_name']) ||
          getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]) ||
          getMf(['custom.full_address', 'custom.custom_full_address'])
        )

        const baseRow = {
          หมายเลขคำสั่งซื้อ: o.name,
          วันที่: o.createdAt ? new Date(o.createdAt).toLocaleString('th-TH') : '',
          สถานะการชำระเงิน: o.displayFinancialStatus || '',
          สถานะการจัดส่ง: o.displayFulfillmentStatus || '',
          'ชื่อผู้ใช้ (ผู้ซื้อ)': customerName,
          อีเมล: o.customer?.email || o.email || '',
          เบอร์โทร: o.customer?.phone || '',
          ยอดรวม: o.currentTotalPriceSet?.shopMoney?.amount || '',
          ยอดสินค้า: o.currentSubtotalPriceSet?.shopMoney?.amount || '',
          ค่าส่ง: o.currentShippingPriceSet?.shopMoney?.amount || '',
          ภาษี: o.currentTotalTaxSet?.shopMoney?.amount || '',
          ส่วนลดรวม: o.currentTotalDiscountsSet?.shopMoney?.amount || '',
          ตัวเลือกการจัดส่ง: shippingOptionDisplay2,
          วิธีการจัดส่ง: deliveryMethodText2,
          หมายเลขติดตามพัสดุ: tracking.join(', '),
          ชื่อผู้รับ: shippingAddress?.name || '',
          เบอร์โทรผู้รับ: shippingAddress?.phone || '',
          ที่อยู่ผู้รับ: shippingAddress?.address1 || '',
          'ตำบล/แขวง': shippingAddress?.address2 || '',
          'อำเภอ/เขต': shippingAddress?.city || '',
          จังหวัด: shippingAddress?.province || '',
          ประเทศ: shippingAddress?.country || '',
          รหัสไปรษณีย์: shippingAddress?.zip || '',

          // Consolidated columns (one item per row)
          รายการสินค้า: '',
          จำนวนสินค้า: 0,
          SKU: '',
          ราคาตั้งต้น: '',
          ราคาขาย: '',
          ราคาขายสุทธิ: '',
          ส่วนลด: discountSummary,
          ร้องขอใบกำกับภาษี: requestedTaxInvoice2 ? 'ขอใบกำกับภาษี' : 'ไม่ขอใบกำกับภาษี',

          // Tax invoice (TI) fields
          'TI: ประเภท': getMf(['custom.customer_type', 'custom.custom_customer_type']),
          'TI: ชื่อบริษัท': getMf(['custom.company_name', 'custom.custom_company_name']),
          'TI: สาขา': getMf(['custom.branch_type', 'custom.custom_branch_type']),
          'TI: รหัสสาขา': getMf(['custom.branch_code', 'custom.custom_branch_code']),
          'TI: เลขผู้เสียภาษี': getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]),
          'TI: โทรศัพท์': getMf(['custom.phone_number', 'custom.custom_phone_number']),
          'TI: โทรศัพท์สำรอง': getMf(['custom.alt_phone_number', 'custom.custom_alt_phone_number']),
          'TI: จังหวัด': getMf(['custom.province', 'custom.custom_province']),
          'TI: อำเภอ/เขต': getMf(['custom.district', 'custom.custom_district']),
          'TI: ตำบล/แขวง': getMf(['custom.sub_district', 'custom.custom_sub_district']),
          'TI: ไปรษณีย์': getMf(['custom.postal_code', 'custom.custom_postal_code']),
          'TI: ที่อยู่': getMf(['custom.full_address', 'custom.custom_full_address']),
        }

        if (itemEdges.length > 0) {
          itemEdges.forEach((e: any) => {
            const it = e.node
            const qty = Number(it?.quantity ?? 0)
            const unit = parseFloat(it?.discountedUnitPriceSet?.shopMoney?.amount || '0')
            for (let i = 0; i < qty; i++) {
              ordersRows.push({
                ...baseRow,
                รายการสินค้า: formatItem(it),
                จำนวนสินค้า: 1,
                SKU: it?.sku || it?.variant?.sku || '',
                ราคาตั้งต้น: it?.originalUnitPriceSet?.shopMoney?.amount || '',
                ราคาขาย: it?.discountedUnitPriceSet?.shopMoney?.amount || '',
                ราคาขายสุทธิ: unit.toFixed(2),
              })
            }
          })
        } else {
          ordersRows.push({
            ...baseRow,
            รายการสินค้า: '-',
            จำนวนสินค้า: 0,
            SKU: '',
            ราคาตั้งต้น: '',
            ราคาขาย: '',
            ราคาขายสุทธิ: '',
          })
        }
      })
      const itemsRows: any[] = []
      orders.forEach((o) => {
        const items = (o.lineItems as any)?.edges || []
        items.forEach((edge: any) => {
          const it = edge.node
          itemsRows.push({
            เลขที่ออเดอร์: o.name,
            สินค้า: it?.name || '',
            SKU: it?.sku || it?.variant?.sku || '',
            จำนวน: it?.quantity ?? '',
            จำนวนที่คืนได้: it?.refundableQuantity ?? '',
            'ราคาต่อหน่วย (เดิม)': it?.originalUnitPriceSet?.shopMoney?.amount || '',
            'ราคาต่อหน่วย (หลังส่วนลด)': it?.discountedUnitPriceSet?.shopMoney?.amount || '',
            ส่วนลดรวม: it?.totalDiscountSet?.shopMoney?.amount || '',
          })
        })
      })
      const shippingRows: any[] = []
      orders.forEach((o) => {
        const lines = (o.shippingLines as any)?.edges || []
        lines.forEach((e: any) => {
          const s = e.node
          shippingRows.push({
            เลขที่ออเดอร์: o.name,
            ชื่อบริการ: s?.title || '',
            รหัส: s?.code || '',
            ราคาก่อนส่วนลด: s?.originalPriceSet?.shopMoney?.amount || '',
            ราคาหลังส่วนลด: s?.discountedPriceSet?.shopMoney?.amount || '',
          })
        })
      })
      const discountRows: any[] = []
      orders.forEach((o) => {
        const dapps = (o.discountApplications as any)?.edges || []
        dapps.forEach((e: any) => {
          const d = e.node
          discountRows.push({
            เลขที่ออเดอร์: o.name,
            ประเภทส่วนลด: d?.__typename || '',
            'โค้ด/ชื่อ': d?.code || d?.title || '',
            จำนวนเงิน: d?.value?.amount || '',
            เปอร์เซ็นต์: d?.value?.percentage ?? '',
          })
        })
      })
      const transactionRows: any[] = []
      orders.forEach((o) => {
        const txs = (o.transactions as any)?.edges || []
        txs.forEach((e: any) => {
          const t = e.node
          const feeSum = Array.isArray(t?.fees)
            ? t.fees.reduce((sum: number, f: any) => sum + parseFloat(f?.amount?.amount || '0'), 0)
            : 0
          transactionRows.push({
            เลขที่ออเดอร์: o.name,
            ช่องทางชำระเงิน: t?.gateway || '',
            ประเภท: t?.kind || '',
            สถานะ: t?.status || '',
            จำนวนเงิน: t?.amountSet?.shopMoney?.amount || '',
            ค่าธรรมเนียม: feeSum || '',
            เวลาทำรายการ: t?.processedAt ? new Date(t.processedAt).toLocaleString('th-TH') : '',
            'ผู้ออกบัตร/ธนาคาร': t?.paymentDetails?.company || '',
          })
        })
      })
      const refundRows: any[] = []
      orders.forEach((o) => {
        const refs = (o.refunds as any)?.edges || []
        refs.forEach((e: any) => {
          const r = e.node
          refundRows.push({
            เลขที่ออเดอร์: o.name,
            รหัสการคืน: r?.id || '',
            เวลาคืนเงิน: r?.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : '',
            จำนวนเงิน: r?.totalRefundedSet?.shopMoney?.amount || '',
            หมายเหตุ: r?.note || '',
          })
        })
      })
      const metafieldRows: any[] = []
      const customAttrRows: any[] = []
      orders.forEach((o) => {
        const mfs = (o.metafields as any)?.edges || []
        mfs.forEach((e: any) => {
          const m = e.node
          metafieldRows.push({
            เลขที่ออเดอร์: o.name,
            เนมสเปซ: m?.namespace || '',
            คีย์: m?.key || '',
            ค่า: m?.value || '',
          })
        })
        const cas = o.customAttributes || []
        cas.forEach((c: any) => {
          customAttrRows.push({ เลขที่ออเดอร์: o.name, คีย์: c?.key || '', ค่า: c?.value || '' })
        })
      })
      // Build structured tax invoice sheet from metafields (custom.*) for ALL export
      const taxInvoiceRows: any[] = []
      orders.forEach((o) => {
        const mlist = nodesFrom((o as any).metafields)
        const getMf = (candidates: string[]): string => {
          for (const cand of candidates) {
            const [ns, key] = String(cand).split('.')
            const found = (mlist as any[]).find(
              (m: any) => String(m?.namespace) === ns && String(m?.key) === key
            )
            if (found && typeof found.value !== 'undefined' && String(found.value).trim() !== '') {
              return String(found.value)
            }
          }
          return ''
        }
        taxInvoiceRows.push({
          เลขที่ออเดอร์: o.name,
          'ประเภท (นิติบุคคล/บุคคลธรรมดา)': getMf([
            'custom.customer_type',
            'custom.custom_customer_type',
          ]),
          ชื่อบริษัท: getMf(['custom.company_name', 'custom.custom_company_name']),
          สาขา: getMf(['custom.branch_type', 'custom.custom_branch_type']),
          รหัสสาขา: getMf(['custom.branch_code', 'custom.custom_branch_code']),
          หมายเลขประจำตัวผู้เสียภาษี: getMf([
            'custom.tax_id',
            'custom.custom_tax_id',
            'custom.tax_id_formatted',
            'custom.custom_tax_id_formatted',
          ]),
          หมายเลขโทรศัพท์: getMf(['custom.phone_number', 'custom.custom_phone_number']),
          หมายเลขโทรศัพท์สำรอง: getMf(['custom.alt_phone_number', 'custom.custom_alt_phone_number']),
          จังหวัด: getMf(['custom.province', 'custom.custom_province']),
          'อำเภอ/เขต': getMf(['custom.district', 'custom.custom_district']),
          'ตำบล/แขวง': getMf(['custom.sub_district', 'custom.custom_sub_district']),
          ไปรษณีย์: getMf(['custom.postal_code', 'custom.custom_postal_code']),
          ที่อยู่: getMf(['custom.full_address', 'custom.custom_full_address']),
        })
      })
      const wb = new ExcelJS.Workbook()
      const addSheetFromRows = (
        name: string,
        rows: any[]
      ): { ws: any; headers: string[] } | null => {
        const ws = wb.addWorksheet(name)
        if (!rows || rows.length === 0) return { ws, headers: [] }
        const headers = Object.keys(rows[0])
        ws.columns = headers.map((h) => ({
          header: h,
          key: h,
          width: Math.min(40, Math.max(12, String(h).length + 2)),
        }))
        rows.forEach((r) => {
          ws.addRow(r)
        })
        return { ws, headers }
      }
      const main = addSheetFromRows('คำสั่งซื้อ', ordersRows)
      addSheetFromRows('รายการสินค้า', itemsRows)
      addSheetFromRows('การจัดส่ง', shippingRows)
      addSheetFromRows('ส่วนลด', discountRows)
      addSheetFromRows('ธุรกรรม', transactionRows)
      addSheetFromRows('การคืนเงิน', refundRows)
      addSheetFromRows('คุณสมบัติที่กำหนดเอง', customAttrRows)
      addSheetFromRows('ใบกำกับภาษี', taxInvoiceRows)

      if (main?.headers.length) {
        const colIdx = main.headers.indexOf('ร้องขอใบกำกับภาษี') + 1
        if (colIdx > 0) {
          const ws = main.ws
          for (let r = 2; r <= ws.rowCount; r++) {
            const cell = ws.getRow(r).getCell(colIdx)
            const val = String(cell.value ?? '')
            const isRequested = val === 'ขอใบกำกับภาษี'
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: isRequested ? 'FFC6F6D5' : 'FFFECACA' },
            }
          }
        }
      }

      const fileName = `orders_all_${new Date().toISOString().slice(0, 10)}.xlsx`
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export all failed', err)
      alert('ไม่สามารถส่งออกทั้งหมดได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setExportingAll(false)
    }
  }
  useEffect(() => {
    if (selectedId) {
      // wait for DOM to paint, then scroll
      requestAnimationFrame(() => {
        scrollToDetails()
      })
      // fallback in case content expands after images/fonts load
      const t = setTimeout(scrollToDetails, 250)
      return () => clearTimeout(t)
    }
  }, [selectedId, scrollToDetails])

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/order-report-auth', {
          method: 'GET',
          credentials: 'include', // Include cookies
        })

        if (response.ok) {
          const authData = (await response.json()) as { authenticated?: boolean }
          if (authData.authenticated) {
            setIsAuthenticated(true)
            setShowAuthPopup(false)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // If check fails, show popup
        setIsAuthenticated(false)
        setShowAuthPopup(true)
      }
    }

    checkAuth()
  }, [])

  const ordersQuery = `
    query Orders($after: String) {
      orders(first: 240, after: $after) {
        edges {
          node {
            id
            name
            createdAt
            processedAt
            updatedAt
            displayFinancialStatus
            displayFulfillmentStatus
            cancelReason
            cancelledAt
            confirmed
            email
            note
            tags
            sourceName
            sourceIdentifier
            customAttributes { key value }
            customer { id displayName firstName lastName phone email }
            shippingAddress { name phone address1 address2 city province country zip company }
            billingAddress { name phone address1 address2 city province country zip company }
            currentTotalPriceSet { shopMoney { amount currencyCode } }
            currentSubtotalPriceSet { shopMoney { amount currencyCode } }
            currentShippingPriceSet { shopMoney { amount currencyCode } }
            currentTotalTaxSet { shopMoney { amount currencyCode } }
            currentTotalDiscountsSet { shopMoney { amount currencyCode } }
            discountCode
            discountCodes
            discountApplications(first: 100) {
              edges {
                node {
                  ... on DiscountCodeApplication {
                    code
                    value { ... on MoneyV2 { amount currencyCode } ... on PricingPercentageValue { percentage } }
                  }
                  ... on AutomaticDiscountApplication {
                    title
                    value { ... on MoneyV2 { amount currencyCode } ... on PricingPercentageValue { percentage } }
                  }
                }
              }
            }
            lineItems(first: 250) {
              edges {
                node {
                  id
                  name
                  sku
                  quantity
                  refundableQuantity
                  originalUnitPriceSet { shopMoney { amount currencyCode } }
                  discountedUnitPriceSet { shopMoney { amount currencyCode } }
                  totalDiscountSet { shopMoney { amount currencyCode } }
                  variant { id sku title }
                  product { id title vendor }
                  customAttributes { key value }
                }
              }
            }
            shippingLines(first: 50) {
              edges {
                node {
                  title
                  code
                  source
                  originalPriceSet { shopMoney { amount currencyCode } }
                  discountedPriceSet { shopMoney { amount currencyCode } }
                }
              }
            }
            fulfillments(first: 50) {
              name
              status
              createdAt
              deliveredAt
              estimatedDeliveryAt
              trackingInfo(first: 50) { number company url }
              service { serviceName }
            }
            transactions(first: 100) {
              gateway
              kind
              status
              amountSet { shopMoney { amount currencyCode } }
              fees { amount { amount currencyCode } rate rateName type }
              processedAt
              paymentDetails { ... on CardPaymentDetails { company } }
            }
            refunds(first: 50) {
              id
              createdAt
              note
              totalRefundedSet { shopMoney { amount currencyCode } }
            }
            returns(first: 50) {
              edges { node { id name status totalQuantity } }
            }
            metafields(first: 100) { edges { node { namespace key value } } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `

  const fetchOrders = async (after: string | null = null) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: ordersQuery,
          variables: { after },
        }),
      })

      const json: unknown = await response.json()

      // Handle API errors returned by our /api/shopify route
      if (!response.ok) {
        const api = (json as { error?: string; code?: string; details?: unknown }) || {}
        const apiError = typeof api.error === 'string' ? api.error : 'Request failed'
        const details = api.details ? ` Details: ${JSON.stringify(api.details)}` : ''
        throw new Error(`API error ${response.status}: ${apiError}.${details}`)
      }

      const result = json as ShopifyGraphQLResponse<OrdersResponse>
      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(' | ')}`)
      }

      if (!result.data) {
        throw new Error('Empty response from Shopify (no data field)')
      }

      const responseData = result.data
      const orders = responseData.orders.edges.map((edge) => edge.node)

      // if after provided, append; else replace
      setData((prev) => (after ? [...prev, ...orders] : orders))
      setPageInfo(responseData.orders.pageInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(parseFloat(price))
  }

  const fmt = (s?: string | null) => {
    if (s == null) return '-'
    const t = String(s).trim()
    return t === '' ? '-' : t
  }

  const money = (ps?: PriceSet) => (ps?.shopMoney?.amount ? formatPrice(ps.shopMoney.amount) : '-')
  const findOrder = (id: string) => data.find((o) => o.id === id)
  const nodesFrom = (src: any): any[] => {
    if (!src) return []
    if (Array.isArray(src)) return src
    if (Array.isArray(src.edges)) return src.edges.map((e: any) => e?.node ?? e).filter(Boolean)
    return []
  }
  const fmtDateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('th-TH') : '-')
  const _fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('th-TH') : '-')
  const _formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH')
  }

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const _sortedData = [...data].sort((a, b) => {
    // sorting will be applied after filtering below
    if (sortConfig.key) {
      let aValue: any = a[sortConfig.key as keyof typeof a]
      let bValue: any = b[sortConfig.key as keyof typeof b]

      // Handle nested properties
      if (sortConfig.key === 'totalPrice') {
        aValue = parseFloat(a.currentTotalPriceSet?.shopMoney?.amount || '0')
        bValue = parseFloat(b.currentTotalPriceSet?.shopMoney?.amount || '0')
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (sortConfig.key === 'customerName') {
        aValue = (a.customer?.displayName || a.email || '').toLowerCase()
        bValue = (b.customer?.displayName || b.email || '').toLowerCase()
      }

      if (sortConfig.key === 'status') {
        aValue =
          `${a.displayFinancialStatus || ''} ${a.displayFulfillmentStatus || ''}`.toLowerCase()
        bValue =
          `${b.displayFinancialStatus || ''} ${b.displayFulfillmentStatus || ''}`.toLowerCase()
      }

      if (sortConfig.key === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Default string comparison
      aValue = String(aValue || '').toLowerCase()
      bValue = String(bValue || '').toLowerCase()

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
    }
    return 0
  })

  // Filtered data for current view
  const filteredData = getFilteredOrders()
  // Apply sorting on filtered data
  const sortedFiltered = [...filteredData].sort((a, b) => {
    if (sortConfig.key) {
      let aValue: any = a[sortConfig.key as keyof typeof a]
      let bValue: any = b[sortConfig.key as keyof typeof b]
      if (sortConfig.key === 'totalPrice') {
        aValue = parseFloat(a.currentTotalPriceSet?.shopMoney?.amount || '0')
        bValue = parseFloat(b.currentTotalPriceSet?.shopMoney?.amount || '0')
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }
      if (sortConfig.key === 'customerName') {
        aValue = (a.customer?.displayName || a.email || '').toLowerCase()
        bValue = (b.customer?.displayName || b.email || '').toLowerCase()
      }
      if (sortConfig.key === 'status') {
        aValue =
          `${a.displayFinancialStatus || ''} ${a.displayFulfillmentStatus || ''}`.toLowerCase()
        bValue =
          `${b.displayFinancialStatus || ''} ${b.displayFulfillmentStatus || ''}`.toLowerCase()
      }
      if (sortConfig.key === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }
      aValue = String(aValue || '').toLowerCase()
      bValue = String(bValue || '').toLowerCase()
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    }
    return 0
  })

  // Pagination (derived from sorted & filtered data)
  const totalItems = sortedFiltered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pageData = sortedFiltered.slice(startIndex, endIndex)

  useEffect(() => {
    // Reset to first page when incoming data size or page size changes
    setPage(1)
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [])

  // Handle authentication
  const handleAuth = async () => {
    if (!authCode.trim()) {
      setAuthError('กรุณาใส่รหัสเข้าใช้งาน')
      return
    }

    try {
      const response = await fetch('/api/order-report-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ code: authCode }),
      })

      const responseData = (await response.json()) as { success?: boolean; message?: string }

      if (response.ok && responseData.success) {
        // Authentication successful
        setIsAuthenticated(true)
        setShowAuthPopup(false)
        setAuthError('')
        setAuthCode('')
        setAuthAttempts(0)
      } else {
        // Authentication failed
        setAuthAttempts((prev) => prev + 1)
        setAuthError(responseData.message || 'รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
        setAuthCode('')

        // Lock after 3 failed attempts
        if (authAttempts >= 2) {
          setAuthError('คุณใส่รหัสผิดเกินกำหนด กรุณารอ 5 นาทีแล้วลองใหม่')
          setTimeout(
            () => {
              setAuthAttempts(0)
              setAuthError('')
            },
            5 * 60 * 1000
          ) // 5 minutes
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setAuthError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/order-report-auth', {
        method: 'DELETE',
        credentials: 'include', // Include cookies
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always reset state regardless of API call result
      setIsAuthenticated(false)
      setShowAuthPopup(true)
      setAuthCode('')
      setAuthError('')
      setAuthAttempts(0)
    }
  }

  const handleSelectOrder = (id: string, orderName: string) => {
    setSelectedId(id)
    setShowRaw(false)
    // Store the current scroll position
    sessionStorage.setItem('scrollPosition', window.scrollY.toString())
    // Store the order name for scrolling back
    sessionStorage.setItem('lastSelectedOrder', orderName)
  }

  const handleCloseDetails = () => {
    // Get the last selected order name before resetting
    const lastOrderName = sessionStorage.getItem('lastSelectedOrder')
    const scrollPosition = sessionStorage.getItem('scrollPosition')

    // Reset the selected ID
    setSelectedId(null)

    // Scroll back to the order row after a short delay
    setTimeout(() => {
      if (lastOrderName && orderRowRefs.current[lastOrderName]) {
        orderRowRefs.current[lastOrderName]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      } else if (scrollPosition) {
        // Fallback to saved scroll position
        window.scrollTo({ top: parseInt(scrollPosition, 10), behavior: 'smooth' })
      }

      // Clear stored values
      sessionStorage.removeItem('scrollPosition')
      sessionStorage.removeItem('lastSelectedOrder')
    }, 100)
  }

  // Show authentication popup if not authenticated
  if (!isAuthenticated || showAuthPopup) {
    return (
      <AuthPopup
        authCode={authCode}
        setAuthCode={setAuthCode}
        handleAuth={handleAuth}
        authError={authError}
        authAttempts={authAttempts}
      />
    )
  }

  return (
    <div className={'min-h-screen bg-white p-4 sm:p-6 lg:p-8'}>
      <div className="max-w-[1920px] mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 lg:p-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">
                รายงานคำสั่งซื้อ LCDTV Thailand
              </h1>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                เข้าสู่ระบบแล้ว
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="ออกจากระบบ"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                ออกจากระบบ
              </button>
              <button
                type="button"
                onClick={() => fetchOrders(null)}
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-300 disabled:to-red-300 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    ดึงคำสั่งซื้อ
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => exportToXlsx()}
                disabled={loading || data.length === 0}
                className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:from-red-300 disabled:to-red-300 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
                title={data.length === 0 ? 'ยังไม่มีข้อมูลให้ส่งออก' : 'ส่งออกข้อมูลเป็น Excel'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                ส่งออก XLSX
              </button>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => exportAllFromShopify()}
              disabled={loading || exportingAll}
              className="bg-white hover:bg-red-50 disabled:bg-gray-100 text-red-700 border-2 border-red-300 hover:border-red-400 disabled:border-gray-300 disabled:text-gray-400 font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
              title="ส่งออกทั้งหมด (จะดึงทุกหน้าให้ครบก่อน)"
              style={{ display: 'none' }}
            >
              {exportingAll ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  กำลังส่งออกทั้งหมด…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  ส่งออกทั้งหมด
                </>
              )}
            </button>
            {pageInfo?.hasNextPage && (
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-700 font-medium">มีข้อมูลเพิ่มเติม</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchOrders(pageInfo?.endCursor ?? null)}
                  disabled={loading}
                  className="bg-red-100 hover:bg-red-200 disabled:bg-gray-100 text-red-800 font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      โหลดเพิ่ม
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-red-800 font-semibold mb-2 text-lg">เกิดข้อผิดพลาด</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {data.length > 0 && (
            <div className="space-y-8">
              <PaginationControls
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
                pageSize={pageSize}
                setPageSize={(n: number) => setPageSize(n)}
                safePage={safePage}
                totalPages={totalPages}
                setPage={(updater) => setPage(updater)}
                monthFilter={monthFilter}
                setMonthFilter={(v) => setMonthFilter(v)}
                yearFilter={yearFilter}
                setYearFilter={(v) => setYearFilter(v)}
                thaiMonths={thaiMonths}
                years={Array.from(new Set(data.map((o) => new Date(o.createdAt).getFullYear())))}
                dateQuickFilter={dateQuickFilter}
                setDateQuickFilter={(v) => setDateQuickFilter(v)}
              />
              <div className="overflow-x-auto">
                <div className="bg-white border border-red-200 rounded-xl shadow-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-red-50 to-red-100">
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                              />
                            </svg>
                            Order
                            <span className="text-lg">{getSortIcon('name')}</span>
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Date
                            <span className="text-lg">{getSortIcon('createdAt')}</span>
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                          onClick={() => handleSort('customerName')}
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Customer
                            <span className="text-lg">{getSortIcon('customerName')}</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-red-800 uppercase tracking-wider">
                          Shipping
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-red-800 uppercase tracking-wider">
                          Items
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Status
                            <span className="text-lg">{getSortIcon('status')}</span>
                          </div>
                        </th>
                        <th
                          className="px-6 py-4 text-right text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                          onClick={() => handleSort('totalPrice')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                            Total
                            <span className="text-lg">{getSortIcon('totalPrice')}</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-red-800 uppercase tracking-wider">
                          <div className="flex items-center justify-end gap-2">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                            Actions
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {pageData.map((order, index) => {
                        const customerName =
                          order.customer?.displayName || order.customer?.email || '-'
                        const _total = order.currentTotalPriceSet?.shopMoney?.amount || '0'
                        const _lineCount = order.lineItems?.edges?.length || 0
                        const shippingAddress: any = (order as any).shippingAddress || {}
                        const shipLine: any =
                          ((order as any).shippingLines?.edges || [])[0]?.node || {}
                        const shippingMethod: string = shipLine?.title || shipLine?.source || ''
                        const shippingOptionRaw2_list = String(shippingMethod || '')
                        const shippingOptionDisplay2_list =
                          shippingOptionRaw2_list === 'Thailand Shipping'
                            ? `${shippingOptionRaw2_list} (รับสินค้าเองที่ร้าน)`
                            : shippingOptionRaw2_list
                        const tracking: string[] = Array.isArray((order as any).fulfillments)
                          ? ((order as any).fulfillments as any[]).flatMap((f: any) =>
                              Array.isArray(f?.trackingInfo)
                                ? f.trackingInfo.map((t: any) => t?.number).filter(Boolean)
                                : []
                            )
                          : []
                        const clean = (s?: string | null) => {
                          if (!s) return ''
                          // Remove tax-invoice request markers and extra spaces
                          return String(s)
                            .replace(/(ต้องการใบกำกับภาษี|ใบกำกับภาษี|ตีแดง)/g, '')
                            .replace(/\s{2,}/g, ' ')
                            .trim()
                        }
                        const addressParts = [
                          shippingAddress?.address1,
                          shippingAddress?.address2,
                          shippingAddress?.city,
                          shippingAddress?.province,
                          shippingAddress?.country,
                          shippingAddress?.zip,
                        ]
                          .map(clean)
                          .filter(Boolean)
                          .join(' ')
                        const _shippingSummary =
                          `${shippingAddress?.name || ''}${shippingAddress?.phone ? ` | ${shippingAddress.phone}` : ''}${addressParts ? ` | ${addressParts}` : ''}${shippingMethod ? ` | ${shippingMethod}` : ''}${tracking.length ? ` | ${tracking.join(', ')}` : ''}`.trim()
                        const allItems: any[] = ((order as any).lineItems?.edges || [])
                          .map((e: any) => e?.node)
                          .filter(Boolean)
                        const mfList: any[] = nodesFrom((order as any).metafields)
                        const tiKeys = new Set([
                          'customer_type',
                          'custom_customer_type',
                          'company_name',
                          'custom_company_name',
                          'branch_type',
                          'custom_branch_type',
                          'branch_code',
                          'custom_branch_code',
                          'tax_id',
                          'custom_tax_id',
                          'tax_id_formatted',
                          'custom_tax_id_formatted',
                          'phone_number',
                          'custom_phone_number',
                          'alt_phone_number',
                          'custom_alt_phone_number',
                          'province',
                          'custom_province',
                          'district',
                          'custom_district',
                          'sub_district',
                          'custom_sub_district',
                          'postal_code',
                          'custom_postal_code',
                          'full_address',
                          'custom_full_address',
                        ])
                        const hasTaxInvoice = mfList.some(
                          (m: any) =>
                            String(m?.namespace) === 'custom' &&
                            tiKeys.has(String(m?.key)) &&
                            String(m?.value ?? '').trim() !== ''
                        )

                        return (
                          <tr
                            key={order.id}
                            ref={(el: HTMLTableRowElement | null) => {
                              if (el) {
                                orderRowRefs.current[order.name] = el
                              }
                            }}
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-white'} ${selectedId === order.id ? 'ring-2 ring-red-500 bg-white' : ''} hover:bg-white transition-colors duration-200`}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                {order.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                              {fmtDateTime(order.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                  <svg
                                    className="h-4 w-4 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>
                                </div>
                                <span className="font-medium truncate inline-block max-w-[240px]">
                                  {customerName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-700">
                              <div className="space-y-1 leading-5">
                                <div>
                                  <span className="text-[11px] text-gray-500">ผู้รับ</span>
                                  <span className="mx-1 text-gray-400">:</span>
                                  <span className="font-medium text-gray-900">
                                    {shippingAddress?.name || '-'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[11px] text-gray-500">โทร</span>
                                  <span className="mx-1 text-gray-400">:</span>
                                  <span className="font-medium">
                                    {shippingAddress?.phone || '-'}
                                  </span>
                                </div>
                                <div className="break-words space-y-0.5">
                                  <div>
                                    <span className="text-[11px] text-gray-500">จังหวัด</span>
                                    <span className="mx-1 text-gray-400">:</span>
                                    <span>{shippingAddress?.province || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-gray-500">อำเภอ/เขต</span>
                                    <span className="mx-1 text-gray-400">:</span>
                                    <span>{shippingAddress?.city || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-gray-500">ตำบล/แขวง</span>
                                    <span className="mx-1 text-gray-400">:</span>
                                    <span>{shippingAddress?.address2 || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-gray-500">รหัสไปรษณีย์</span>
                                    <span className="mx-1 text-gray-400">:</span>
                                    <span>{shippingAddress?.zip || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[11px] text-gray-500">ที่อยู่</span>
                                    <span className="mx-1 text-gray-400">:</span>
                                    <span>{shippingAddress?.address1 || '-'}</span>
                                  </div>
                                </div>
                                {shippingOptionDisplay2_list && (
                                  <div>
                                    <span className="text-[11px] text-gray-500">วิธี/บริการ</span>
                                    <span className="mx-1 text-gray-400">:</span>
                                    <span className="font-medium">
                                      {shippingOptionDisplay2_list}
                                    </span>
                                  </div>
                                )}
                                {tracking.length > 0 && (
                                  <div className="break-words">
                                    <span className="text-[11px] text-gray-500">ติดตาม</span>
                                    <span className="mx-1 text-gray-400">:</span>
                                    <span>{tracking.join(', ')}</span>
                                  </div>
                                )}
                                <div className="pt-2">
                                  <Badge tone={hasTaxInvoice ? 'green' : 'red'}>
                                    {hasTaxInvoice ? 'ขอใบกำกับภาษี' : 'ไม่ขอใบกำกับภาษี'}
                                  </Badge>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-700">
                              <div className="space-y-3 leading-5">
                                {allItems.length === 0 && <div className="text-gray-400">-</div>}
                                {allItems.map((it: any, idx: number) => {
                                  const nm: string = it?.name || '-'
                                  const sku: string = it?.sku || it?.variant?.sku || '-'
                                  const qty: number = Number(it?.quantity ?? 0)
                                  const refundableQty: any = (it as any)?.refundableQuantity
                                  const orig = it?.originalUnitPriceSet?.shopMoney?.amount
                                  const sale = it?.discountedUnitPriceSet?.shopMoney?.amount
                                  return (
                                    <div
                                      key={`item-${it?.id || idx}`}
                                      className="border-b last:border-b-0 border-red-100 pb-2"
                                    >
                                      <div className="font-medium text-gray-900">{nm}</div>
                                      <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                                        <span>
                                          SKU<span className="mx-1 text-gray-400">:</span>
                                          <span className="text-gray-700">{sku}</span>
                                        </span>
                                        <span>
                                          จำนวน<span className="mx-1 text-gray-400">:</span>
                                          <span className="text-gray-700">{qty}</span>
                                        </span>
                                        {typeof refundableQty !== 'undefined' && (
                                          <span>
                                            คืนได้<span className="mx-1 text-gray-400">:</span>
                                            <span className="text-gray-700">{refundableQty}</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs mt-1">
                                        {sale && orig && sale !== orig ? (
                                          <>
                                            <span className="line-through text-gray-400 mr-2">
                                              {orig}
                                            </span>
                                            <span className="font-semibold text-red-700">
                                              {sale}
                                            </span>
                                          </>
                                        ) : (
                                          <span className="font-semibold text-red-700">
                                            {sale || orig || '-'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <div className="flex flex-col space-y-2">
                                <Badge
                                  tone={
                                    order.displayFinancialStatus === 'PAID' ? 'green' : 'yellow'
                                  }
                                >
                                  {order.displayFinancialStatus || '-'}
                                </Badge>
                                <Badge
                                  tone={
                                    order.displayFulfillmentStatus === 'FULFILLED'
                                      ? 'green'
                                      : 'gray'
                                  }
                                >
                                  {order.displayFulfillmentStatus || 'UNFULFILLED'}
                                </Badge>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                              <span className="font-semibold text-lg text-red-700">
                                {money(order.currentTotalPriceSet)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                              <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleSelectOrder(order.id, order.name)
                                }}
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                ดูรายละเอียด
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <PaginationControls
                startIndex={startIndex}
                endIndex={endIndex}
                totalItems={totalItems}
                pageSize={pageSize}
                setPageSize={(n: number) => setPageSize(n)}
                safePage={safePage}
                totalPages={totalPages}
                setPage={(updater) => setPage(updater)}
                variant="bottom"
              />
              {selectedId &&
                (() => {
                  const o = findOrder(selectedId)
                  if (!o) return null
                  const items = nodesFrom(o.lineItems)
                  const discounts = nodesFrom(o.discountApplications)
                  const shipLines = nodesFrom(o.shippingLines)
                  const refunds = nodesFrom(o.refunds)
                  const returns = nodesFrom(o.returns)
                  const metafields = nodesFrom(o.metafields)
                  const txs = nodesFrom(o.transactions)
                  const fulfillments = Array.isArray(o.fulfillments) ? o.fulfillments : []
                  const trackings = fulfillments.flatMap((f: any) =>
                    Array.isArray(f?.trackingInfo) ? f.trackingInfo : []
                  )
                  return (
                    <div
                      ref={detailsRef}
                      className="mt-8 bg-white border border-red-200 rounded-2xl p-8 shadow-2xl"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg">
                            <svg
                              className="h-6 w-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-red-800">รายละเอียดคำสั่งซื้อ</h3>
                            <p className="text-red-600/70 font-medium">{o.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            style={{ display: 'none' }}
                            onClick={() => setShowRaw((v) => !v)}
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                              />
                            </svg>
                            {showRaw ? 'ซ่อน JSON' : 'แสดง JSON'}
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                            onClick={(e) => {
                              e.preventDefault()
                              handleCloseDetails()
                            }}
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            ปิด
                          </button>
                        </div>
                      </div>
                      {showRaw ? (
                        <div className="bg-gray-50 border border-red-200 rounded-xl p-6 shadow-inner">
                          <div className="flex items-center gap-2 mb-4">
                            <svg
                              className="h-5 w-5 text-red-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                              />
                            </svg>
                            <h4 className="font-semibold text-red-800">Raw JSON Data</h4>
                          </div>
                          <pre className="text-xs bg-white p-4 rounded-lg border overflow-x-auto font-mono leading-relaxed">
                            {JSON.stringify(o, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-red-500 rounded-lg">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-red-900 text-lg">ข้อมูลคำสั่งซื้อหลัก</h4>
                            </div>
                            <div className="text-sm text-gray-700">
                              หมายเลขคำสั่งซื้อ: {fmt(o.name)}
                            </div>
                            <div className="text-sm text-gray-700 space-x-2">
                              <span>สถานะการสั่งซื้อ:</span>
                              <Badge
                                tone={
                                  o.displayFinancialStatus === 'PAID'
                                    ? 'green'
                                    : o.displayFinancialStatus === 'PENDING'
                                      ? 'yellow'
                                      : 'gray'
                                }
                              >
                                {fmt(o.displayFinancialStatus)}
                              </Badge>
                              <Badge
                                tone={
                                  o.displayFulfillmentStatus === 'FULFILLED'
                                    ? 'green'
                                    : o.displayFulfillmentStatus === 'UNFULFILLED'
                                      ? 'yellow'
                                      : 'gray'
                                }
                              >
                                {fmt(o.displayFulfillmentStatus)}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-700">
                              สถานะการคืน/ยกเลิก: {fmt(o.cancelReason)}
                            </div>
                            <div className="text-sm text-gray-700">
                              วันที่ทำการสั่งซื้อ: {fmtDateTime(o.createdAt)}
                            </div>
                            <div className="text-sm text-gray-700">
                              เวลาการชำระสินค้า: {fmtDateTime(o.processedAt)}
                            </div>
                            <div className="text-sm text-gray-700">
                              เวลาที่คำสั่งซื้อสำเร็จ: {fmtDateTime(o.updatedAt)}
                            </div>
                            <div className="text-sm text-gray-700">
                              หมายเหตุจากผู้ซื้อ: {fmt(o.note)}
                            </div>
                            <div className="text-sm text-gray-700">
                              {/* Removed tags and sales channel display */}
                            </div>
                          </section>

                          <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-red-500 rounded-lg">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-red-900 text-lg">ข้อมูลผู้ซื้อ</h4>
                            </div>
                            <div className="text-sm text-gray-700">
                              ชื่อผู้ใช้: {fmt(o.customer?.displayName)}
                            </div>
                            <div className="text-sm text-gray-700">
                              อีเมล: {fmt(o.email || o.customer?.email)}
                            </div>
                            <div className="text-sm text-gray-700">
                              เบอร์โทร: {fmt(o.customer?.phone)}
                            </div>
                          </section>

                          <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-red-500 rounded-lg">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-red-900 text-lg">ข้อมูลการจัดส่ง</h4>
                            </div>
                            <div className="text-sm text-gray-700">
                              ชื่อผู้รับ: {fmt(o.shippingAddress?.name)}
                            </div>
                            <div className="text-sm text-gray-700">
                              โทรศัพท์: {fmt(o.shippingAddress?.phone)}
                            </div>
                            <div className="text-sm text-gray-700">
                              ประเทศ: {fmt(o.shippingAddress?.country)}
                            </div>
                            <div className="text-sm text-gray-700">
                              จังหวัด: {fmt(o.shippingAddress?.province)}
                            </div>
                            <div className="text-sm text-gray-700">
                              อำเภอ/เขต: {fmt(o.shippingAddress?.city)}
                            </div>
                            <div className="text-sm text-gray-700">
                              ตำบล/แขวง: {fmt(o.shippingAddress?.address2)}
                            </div>
                            <div className="text-sm text-gray-700">
                              รหัสไปรษณีย์: {fmt(o.shippingAddress?.zip)}
                            </div>
                            <div className="text-sm text-gray-700">
                              ที่อยู่: {fmt(o.shippingAddress?.address1)}
                            </div>
                            <div className="text-sm text-gray-700">
                              หมายเลขติดตามพัสดุ:{' '}
                              {trackings.length
                                ? trackings
                                    .map((t: any) => t?.number)
                                    .filter(Boolean)
                                    .join(', ')
                                : '-'}
                            </div>
                            {(() => {
                              const shippingOptionRaw2_details = String(
                                (shipLines[0]?.title || shipLines[0]?.source || '') as string
                              )
                              const shippingOptionDisplay2_details =
                                shippingOptionRaw2_details === 'Thailand Shipping'
                                  ? `${shippingOptionRaw2_details} (รับสินค้าเองที่ร้าน)`
                                  : shippingOptionRaw2_details
                              const deliveryMethodText_details =
                                shippingOptionDisplay2_details ===
                                'Thailand Shipping (รับสินค้าเองที่ร้าน)'
                                  ? 'รับสินค้าเองที่ร้าน'
                                  : 'จัดส่งตามที่อยู่'
                              return (
                                <>
                                  <div className="text-sm text-gray-700">
                                    วิธีการจัดส่ง: {deliveryMethodText_details || '-'}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    บริการจัดส่ง: {shippingOptionDisplay2_details || '-'}
                                  </div>
                                </>
                              )
                            })()}
                          </section>

                          <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-red-500 rounded-lg">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-red-900 text-lg">ข้อมูลสินค้า</h4>
                            </div>
                            <div className="text-sm text-gray-700">
                              {items.length === 0 ? (
                                '-'
                              ) : (
                                <div className="overflow-x-auto border border-red-200 rounded-md">
                                  <table className="min-w-full text-xs">
                                    <thead className="bg-red-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-medium text-red-700">
                                          สินค้า
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium text-red-700">
                                          SKU
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-red-700">
                                          จำนวน
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-red-700">
                                          คืนได้
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-red-700">
                                          ราคาตั้งต้น
                                        </th>
                                        <th className="px-3 py-2 text-right font-medium text-red-700">
                                          ราคาขาย
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-100">
                                      {items.map((it: any) => (
                                        <tr key={it.id}>
                                          <td className="px-3 py-2">{fmt(it.name)}</td>
                                          <td className="px-3 py-2">{fmt(it.sku)}</td>
                                          <td className="px-3 py-2 text-right">
                                            {it.quantity ?? '-'}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            {it.refundableQuantity ?? '-'}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            {money(it.originalUnitPriceSet)}
                                          </td>
                                          <td className="px-3 py-2 text-right">
                                            {money(it.discountedUnitPriceSet)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </section>

                          <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-red-500 rounded-lg">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                  />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-red-900 text-lg">ข้อมูลการเงิน</h4>
                            </div>
                            <div className="text-sm text-gray-700">
                              ราคาขายสุทธิ: {money(o.currentTotalPriceSet)}
                            </div>
                            <div className="text-sm text-gray-700">
                              ส่วนลดรวม: {money(o.currentTotalDiscountsSet)}
                            </div>
                            <div className="text-sm text-gray-700">
                              ค่าจัดส่ง: {money(o.currentShippingPriceSet)}
                            </div>
                            <div className="text-sm text-gray-700">
                              ภาษี: {money(o.currentTotalTaxSet)}
                            </div>
                            <div className="text-sm text-gray-700">
                              ช่องทางการชำระเงิน:{' '}
                              {txs.length
                                ? txs
                                    .map((t: any) => t?.gateway)
                                    .filter(Boolean)
                                    .join(', ')
                                : '-'}
                            </div>
                            <div className="text-sm text-gray-700">
                              ค่าธรรมเนียม/ค่าคอมมิชชั่น:{' '}
                              {txs.length
                                ? txs
                                    .flatMap((t: any) => (Array.isArray(t?.fees) ? t.fees : []))
                                    .map((f: any) => f?.rateName || f?.type)
                                    .filter(Boolean)
                                    .join(', ')
                                : '-'}
                            </div>
                          </section>

                          <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-red-500 rounded-lg">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
                                  />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-red-900 text-lg">
                                การคืนเงิน/คืนสินค้า
                              </h4>
                            </div>
                            <div className="text-sm text-gray-700">
                              Refunds:{' '}
                              {refunds.length
                                ? refunds
                                    .map(
                                      (r: any) =>
                                        `${new Date(r.createdAt).toLocaleDateString('th-TH')} ${money(r.totalRefundedSet)}`
                                    )
                                    .join(' , ')
                                : '-'}
                            </div>
                            <div className="text-sm text-gray-700">
                              Returns:{' '}
                              {returns.length
                                ? returns
                                    .map(
                                      (r: any) =>
                                        `${r.name || r.id} (${r.status || '-'}) x${r.totalQuantity ?? '-'}`
                                    )
                                    .join(' , ')
                                : '-'}
                            </div>
                          </section>

                          <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-red-500 rounded-lg">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                  />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-red-900 text-lg">ส่วนลด/โปรโมชัน</h4>
                            </div>
                            <div className="text-sm text-gray-700">
                              โค้ดส่วนลด: {fmt(o.discountCode)}
                            </div>
                            <div className="text-sm text-gray-700">
                              โค้ดส่วนลดทั้งหมด:{' '}
                              {o.discountCodes?.length ? o.discountCodes.join(', ') : '-'}
                            </div>
                            <div className="text-sm text-gray-700">
                              Discount Applications:
                              {discounts.length === 0 ? (
                                ' -'
                              ) : (
                                <ul className="list-disc pl-5 space-y-1">
                                  {discounts.map((d: any, i: number) => (
                                    <li key={`discount-${d?.code || d?.title || i}`}>
                                      {[
                                        d?.code,
                                        d?.title,
                                        d?.value?.amount &&
                                          `${d.value.amount} ${d.value.currencyCode}`,
                                        d?.value?.percentage && `${d.value.percentage}%`,
                                      ]
                                        .filter(Boolean)
                                        .join(' | ')}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </section>

                          <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4 lg:col-start-2">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-red-500 rounded-lg">
                                <svg
                                  className="h-5 w-5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>
                              <h4 className="font-semibold text-red-800 text-lg">ใบกำกับภาษี</h4>
                            </div>
                            {(() => {
                              // Helper to get metafield by namespace.key with fallbacks
                              const getMf = (candidates: string[]): string => {
                                for (const cand of candidates) {
                                  const [ns, key] = cand.split('.')
                                  const found = metafields.find(
                                    (m: any) =>
                                      String(m?.namespace) === ns && String(m?.key) === key
                                  )
                                  if (
                                    found &&
                                    typeof found.value !== 'undefined' &&
                                    String(found.value).trim() !== ''
                                  ) {
                                    return String(found.value)
                                  }
                                }
                                return '-'
                              }
                              const items = [
                                {
                                  k: 'ประเภท (นิติบุคคล/บุคคลธรรมดา)',
                                  v: getMf(['custom.customer_type', 'custom.custom_customer_type']),
                                },
                                {
                                  k: 'ชื่อบริษัท',
                                  v: getMf(['custom.company_name', 'custom.custom_company_name']),
                                },
                                {
                                  k: 'สาขา',
                                  v: getMf(['custom.branch_type', 'custom.custom_branch_type']),
                                },
                                {
                                  k: 'รหัสสาขา',
                                  v: getMf(['custom.branch_code', 'custom.custom_branch_code']),
                                },
                                {
                                  k: 'หมายเลขประจำตัวผู้เสียภาษี',
                                  v: getMf([
                                    'custom.tax_id',
                                    'custom.custom_tax_id',
                                    'custom.tax_id_formatted',
                                    'custom.custom_tax_id_formatted',
                                  ]),
                                },
                                {
                                  k: 'หมายเลขโทรศัพท์',
                                  v: getMf(['custom.phone_number', 'custom.custom_phone_number']),
                                },
                                {
                                  k: 'หมายเลขโทรศัพท์สำรอง',
                                  v: getMf([
                                    'custom.alt_phone_number',
                                    'custom.custom_alt_phone_number',
                                  ]),
                                },
                                {
                                  k: 'จังหวัด',
                                  v: getMf(['custom.province', 'custom.custom_province']),
                                },
                                {
                                  k: 'อำเภอ/เขต',
                                  v: getMf(['custom.district', 'custom.custom_district']),
                                },
                                {
                                  k: 'ตำบล/แขวง',
                                  v: getMf(['custom.sub_district', 'custom.custom_sub_district']),
                                },
                                {
                                  k: 'ไปรษณีย์',
                                  v: getMf(['custom.postal_code', 'custom.custom_postal_code']),
                                },
                                {
                                  k: 'ที่อยู่',
                                  v: getMf(['custom.full_address', 'custom.custom_full_address']),
                                },
                              ]
                              return (
                                <div className="space-y-4">
                                  <div className="text-sm font-semibold text-gray-800 flex items-center gap-2"></div>
                                  <div className="border border-red-200 rounded-xl p-4 bg-white shadow-inner">
                                    <table className="w-full text-sm">
                                      <tbody className="divide-y divide-gray-200">
                                        {items.map((p, idx) => (
                                          <tr key={`${p.k}-${idx}`} className="hover:bg-gray-50">
                                            <td className="align-top py-3 pr-6 w-64 text-xs font-semibold text-gray-700">
                                              {p.k}
                                            </td>
                                            <td className="align-top py-3 text-sm text-gray-900 break-words">
                                              <span className="bg-gray-100 px-2 py-1 rounded-md font-medium">
                                                {p.v}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )
                            })()}
                          </section>
                        </div>
                      )}
                    </div>
                  )
                })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
