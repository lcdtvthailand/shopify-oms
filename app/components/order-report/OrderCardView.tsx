import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { fmtDateTime, money, nodesFrom } from '@/app/utils/orderUtils'
import { Badge } from './Badge'

interface OrderCardViewProps {
  pageData: OrderNode[]
  selectedId: string | null
  orderRowRefs: React.MutableRefObject<{ [key: string]: HTMLElement | null }>
  handleSelectOrder: (id: string, orderName: string) => void
}

export const OrderCardView: React.FC<OrderCardViewProps> = ({
  pageData,
  selectedId,
  orderRowRefs,
  handleSelectOrder,
}) => {
  return (
    <div className="xl:hidden space-y-4 md:space-y-6">
      {pageData.map((order, _index) => {
        const customerName = order.customer?.displayName || order.customer?.email || '-'
        const shippingAddress: any = (order as any).shippingAddress || {}
        const shipLine: any = ((order as any).shippingLines?.edges || [])[0]?.node || {}
        const shippingMethod: string = shipLine?.title || shipLine?.source || ''
        const shippingOptionRaw = String(shippingMethod || '')
        const shippingOptionDisplay =
          shippingOptionRaw === 'Thailand Shipping'
            ? `${shippingOptionRaw} (รับสินค้าเองที่ร้าน)`
            : shippingOptionRaw
        const tracking: string[] = Array.isArray((order as any).fulfillments)
          ? ((order as any).fulfillments as any[]).flatMap((f: any) =>
              Array.isArray(f?.trackingInfo)
                ? f.trackingInfo.map((t: any) => t?.number).filter(Boolean)
                : []
            )
          : []
        const allItems: any[] = ((order as any).lineItems?.edges || [])
          .map((e: any) => e?.node)
          .filter(Boolean)
        const mfList: any[] = nodesFrom((order as any).metafields)
        const tiKeys = new Set([
          'customer_type',
          'custom_customer_type',
          'title_name',
          'custom_title_name',
          'full_name',
          'custom_full_name',
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
          <div
            key={order.id}
            ref={(el: HTMLDivElement | null) => {
              if (el) {
                orderRowRefs.current[order.name] = el
              }
            }}
            className={`bg-white border border-red-200 rounded-xl shadow-lg p-6 ${selectedId === order.id ? 'ring-2 ring-red-500' : ''}`}
          >
            {/* Header with Order Number and Status */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl">{order.name}</h3>
                  <p className="text-sm text-gray-600">{fmtDateTime(order.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge
                  tone={
                    order.displayFinancialStatus === 'PAID'
                      ? 'green'
                      : order.displayFinancialStatus === 'PENDING'
                        ? 'yellow'
                        : 'gray'
                  }
                >
                  {order.displayFinancialStatus || '-'}
                </Badge>
                <Badge tone={order.displayFulfillmentStatus === 'FULFILLED' ? 'green' : 'gray'}>
                  {order.displayFulfillmentStatus || 'UNFULFILLED'}
                </Badge>
                {(() => {
                  const tags = (order.tags || []).map((t: string) => t.toLowerCase().trim())
                  const isPacked = tags.includes('packed')
                  return (
                    <Badge tone={isPacked ? 'green' : 'yellow'}>
                      {isPacked ? 'PACKED' : 'UNPACKED'}
                    </Badge>
                  )
                })()}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  ข้อมูลลูกค้า
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="text-gray-500">ชื่อ:</span>
                    <span className="ml-2 font-medium">{customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">อีเมล:</span>
                    <span className="ml-2">{order.email || order.customer?.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">โทร:</span>
                    <span className="ml-2">{order.customer?.phone || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  ข้อมูลการจัดส่ง
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>
                    <span className="text-gray-500">ผู้รับ:</span>
                    <span className="ml-2 font-medium">{shippingAddress?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">โทร:</span>
                    <span className="ml-2">{shippingAddress?.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">จังหวัด:</span>
                    <span className="ml-2">{shippingAddress?.province || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">อำเภอ/เขต:</span>
                    <span className="ml-2">{shippingAddress?.city || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ตำบล/แขวง:</span>
                    <span className="ml-2">{shippingAddress?.address2 || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">รหัสไปรษณีย์:</span>
                    <span className="ml-2">{shippingAddress?.zip || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ที่อยู่:</span>
                    <span className="ml-2">{shippingAddress?.address1 || '-'}</span>
                  </div>
                  {shippingOptionDisplay && (
                    <div>
                      <span className="text-gray-500">วิธี/บริการ:</span>
                      <span className="ml-2 font-medium">{shippingOptionDisplay}</span>
                    </div>
                  )}
                  {tracking.length > 0 && (
                    <div>
                      <span className="text-gray-500">ติดตาม:</span>
                      <span className="ml-2">{tracking.join(', ')}</span>
                    </div>
                  )}
                </div>
                <div className="pt-2">
                  <Badge tone={hasTaxInvoice ? 'green' : 'red'}>
                    {hasTaxInvoice ? 'ขอใบกำกับภาษี' : 'ไม่ขอใบกำกับภาษี'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-800 mb-3">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                สินค้า ({allItems.length} รายการ)
              </div>
              <div className="space-y-3">
                {allItems.length === 0 && <div className="text-gray-400 text-sm">-</div>}
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
                      className="border border-red-100 rounded-lg p-3 bg-red-50/30"
                    >
                      <div className="font-medium text-gray-900 mb-2">{nm}</div>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">SKU:</span>
                          <span className="ml-1">{sku}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">จำนวน:</span>
                          <span className="ml-1 font-medium">{qty}</span>
                        </div>
                        {typeof refundableQty !== 'undefined' && (
                          <div>
                            <span className="text-gray-500">คืนได้:</span>
                            <span className="ml-1">{refundableQty}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">ราคา:</span>
                          <span className="ml-1 font-semibold text-red-700">
                            {sale && orig && sale !== orig ? (
                              <>
                                <span className="line-through text-gray-400 mr-1 text-xs">
                                  {orig}
                                </span>
                                {sale}
                              </>
                            ) : (
                              sale || orig || '-'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer with Total and Action */}
            <div className="flex items-center justify-between pt-4 border-t border-red-100">
              <div className="text-left">
                <div className="text-sm text-gray-500">ยอดรวม</div>
                <div className="text-xl font-bold text-red-700">
                  {money(order.currentTotalPriceSet)}
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                onClick={(e) => {
                  e.preventDefault()
                  handleSelectOrder(order.id, order.name)
                }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div>
          </div>
        )
      })}
    </div>
  )
}
