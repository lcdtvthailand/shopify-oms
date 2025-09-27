import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { fmtDateTime, money, nodesFrom } from '@/app/utils/orderUtils'
import { Badge } from './Badge'

interface OrderTableDesktopProps {
  pageData: OrderNode[]
  selectedId: string | null
  orderRowRefs: React.MutableRefObject<{ [key: string]: HTMLElement | null }>
  handleSelectOrder: (id: string, orderName: string) => void
  handleSort: (field: string) => void
  getSortIcon: (field: string) => string
}

export const OrderTableDesktop: React.FC<OrderTableDesktopProps> = ({
  pageData,
  selectedId,
  orderRowRefs,
  handleSelectOrder,
  handleSort,
  getSortIcon,
}) => {
  return (
    <div className="hidden 2xl:block overflow-x-auto">
      <div className="bg-white border border-red-200 rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-red-50 to-red-100">
            <tr>
              <th
                className="px-7 py-5 text-left text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="px-7 py-5 text-left text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="px-7 py-5 text-left text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('customerName')}
              >
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <th className="px-7 py-5 text-left text-sm font-semibold text-red-800 uppercase tracking-wider">
                Shipping
              </th>
              <th className="px-7 py-5 text-left text-sm font-semibold text-red-800 uppercase tracking-wider">
                Items
              </th>
              <th
                className="px-7 py-5 text-left text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="px-7 py-5 text-right text-sm font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('totalPrice')}
              >
                <div className="flex items-center justify-end gap-3">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <th className="px-7 py-5 text-right text-sm font-semibold text-red-800 uppercase tracking-wider">
                <div className="flex items-center justify-end gap-3">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {pageData.map((order, _index) => {
              const customerName = order.customer?.displayName || order.customer?.email || '-'
              const shippingAddress: any = (order as any).shippingAddress || {}
              const shipLine: any = ((order as any).shippingLines?.edges || [])[0]?.node || {}
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
                <tr
                  key={order.id}
                  ref={(el: HTMLTableRowElement | null) => {
                    if (el) {
                      orderRowRefs.current[order.name] = el
                    }
                  }}
                  className={`${_index % 2 === 0 ? 'bg-white' : 'bg-white'} ${selectedId === order.id ? 'ring-2 ring-red-500 bg-white' : ''} hover:bg-white transition-colors duration-200`}
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
                        <span className="font-medium">{shippingAddress?.phone || '-'}</span>
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
                          <span className="font-medium">{shippingOptionDisplay2_list}</span>
                        </div>
                      )}
                      <div className="pt-1">
                        <Badge tone={hasTaxInvoice ? 'green' : 'red'}>
                          {hasTaxInvoice ? 'ขอใบกำกับภาษี' : 'ไม่ขอใบกำกับภาษี'}
                        </Badge>
                      </div>
                      {tracking.length > 0 && (
                        <div className="break-words">
                          <span className="text-[11px] text-gray-500">ติดตาม</span>
                          <span className="mx-1 text-gray-400">:</span>
                          <span>{tracking.join(', ')}</span>
                        </div>
                      )}
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
                                  <span className="line-through text-gray-400 mr-2">{orig}</span>
                                  <span className="font-semibold text-red-700">{sale}</span>
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
                      <Badge tone={order.displayFinancialStatus === 'PAID' ? 'green' : 'yellow'}>
                        {order.displayFinancialStatus || '-'}
                      </Badge>
                      <Badge
                        tone={order.displayFulfillmentStatus === 'FULFILLED' ? 'green' : 'gray'}
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
  )
}
