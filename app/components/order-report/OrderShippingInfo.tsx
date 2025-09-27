import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { fmt, nodesFrom } from '@/app/utils/orderUtils'

interface OrderShippingInfoProps {
  order: OrderNode
}

export const OrderShippingInfo: React.FC<OrderShippingInfoProps> = ({ order }) => {
  // Get shipping lines and fulfillments
  const shipLines = nodesFrom(order.shippingLines)
  const fulfillments = nodesFrom(order.fulfillments)
  const trackings = fulfillments.flatMap((f: any) => nodesFrom(f.trackingInfo))

  return (
    <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500 rounded-lg">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="text-sm text-gray-700">ชื่อผู้รับ: {fmt(order.shippingAddress?.name)}</div>
      <div className="text-sm text-gray-700">โทรศัพท์: {fmt(order.shippingAddress?.phone)}</div>
      <div className="text-sm text-gray-700">ประเทศ: {fmt(order.shippingAddress?.country)}</div>
      <div className="text-sm text-gray-700">จังหวัด: {fmt(order.shippingAddress?.province)}</div>
      <div className="text-sm text-gray-700">อำเภอ/เขต: {fmt(order.shippingAddress?.city)}</div>
      <div className="text-sm text-gray-700">ตำบล/แขวง: {fmt(order.shippingAddress?.address2)}</div>
      <div className="text-sm text-gray-700">รหัสไปรษณีย์: {fmt(order.shippingAddress?.zip)}</div>
      <div className="text-sm text-gray-700">ที่อยู่: {fmt(order.shippingAddress?.address1)}</div>
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
          shippingOptionDisplay2_details === 'Thailand Shipping (รับสินค้าเองที่ร้าน)'
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
  )
}
