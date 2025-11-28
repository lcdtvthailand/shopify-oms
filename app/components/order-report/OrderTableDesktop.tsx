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
    <div className="hidden xl:block overflow-x-auto">
      <div className="bg-white border border-red-200 rounded-xl shadow-lg overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gradient-to-r from-red-50 to-red-100">
            <tr>
              <th
                className="w-[6%] px-3 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  <span>#</span>
                  <span className="text-sm">{getSortIcon('name')}</span>
                </div>
              </th>
              <th
                className="w-[10%] px-3 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Date
                  <span className="text-sm">{getSortIcon('createdAt')}</span>
                </div>
              </th>
              <th
                className="w-[10%] px-3 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('customerName')}
              >
                <div className="flex items-center gap-1">
                  Customer
                  <span className="text-sm">{getSortIcon('customerName')}</span>
                </div>
              </th>
              <th className="w-[18%] px-3 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                Shipping
              </th>
              <th className="w-[18%] px-3 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                Items
              </th>
              <th
                className="w-[9%] px-3 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <span className="text-sm">{getSortIcon('status')}</span>
                </div>
              </th>
              <th className="w-[8%] px-3 py-4 text-left text-xs font-semibold text-red-800 uppercase tracking-wider">
                Packing
              </th>
              <th
                className="w-[10%] px-3 py-4 text-right text-xs font-semibold text-red-800 uppercase tracking-wider cursor-pointer hover:bg-red-200/50 transition-colors duration-200"
                onClick={() => handleSort('totalPrice')}
              >
                <div className="flex items-center justify-end gap-1">
                  Total
                  <span className="text-sm">{getSortIcon('totalPrice')}</span>
                </div>
              </th>
              <th className="w-[11%] px-3 py-4 text-center text-xs font-semibold text-red-800 uppercase tracking-wider">
                Actions
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
                  <td className="px-3 py-3 text-xs font-medium text-gray-900">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span className="truncate">{order.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    <span className="whitespace-nowrap">{fmtDateTime(order.createdAt)}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg
                          className="h-3 w-3 text-red-600"
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
                      <span className="font-medium truncate">{customerName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-700">
                    <div className="space-y-0.5 leading-4">
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
                  <td className="px-3 py-3 text-xs text-gray-700">
                    <div className="space-y-2 leading-4">
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
                  <td className="px-3 py-3 text-xs text-gray-700">
                    <div className="flex flex-col space-y-1">
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
                  <td className="px-3 py-3 text-xs text-gray-700">
                    {(() => {
                      const tags = (order.tags || []).map((t: string) => t.toLowerCase().trim())
                      const isPacked = tags.includes('packed')
                      return (
                        <Badge tone={isPacked ? 'green' : 'yellow'}>
                          {isPacked ? 'PACKED' : 'UNPACKED'}
                        </Badge>
                      )
                    })()}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-900 text-right">
                    <span className="font-semibold text-base text-red-700">
                      {money(order.currentTotalPriceSet)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-900 text-center">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={(e) => {
                        e.preventDefault()
                        handleSelectOrder(order.id, order.name)
                      }}
                    >
                      <svg
                        className="h-3 w-3"
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
