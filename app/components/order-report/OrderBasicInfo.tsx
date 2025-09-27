import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { fmt, fmtDateTime } from '@/app/utils/orderUtils'
import { Badge } from './Badge'

interface OrderBasicInfoProps {
  order: OrderNode
}

export const OrderBasicInfo: React.FC<OrderBasicInfoProps> = ({ order }) => {
  return (
    <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500 rounded-lg">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="text-sm text-gray-700">หมายเลขคำสั่งซื้อ: {fmt(order.name)}</div>
      <div className="text-sm text-gray-700 space-x-2">
        <span>สถานะการสั่งซื้อ:</span>
        <Badge
          tone={
            order.displayFinancialStatus === 'PAID'
              ? 'green'
              : order.displayFinancialStatus === 'PENDING'
                ? 'yellow'
                : 'gray'
          }
        >
          {fmt(order.displayFinancialStatus)}
        </Badge>
        <Badge
          tone={
            order.displayFulfillmentStatus === 'FULFILLED'
              ? 'green'
              : order.displayFulfillmentStatus === 'UNFULFILLED'
                ? 'yellow'
                : 'gray'
          }
        >
          {fmt(order.displayFulfillmentStatus)}
        </Badge>
      </div>
      <div className="text-sm text-gray-700">สถานะการคืน/ยกเลิก: {fmt(order.cancelReason)}</div>
      <div className="text-sm text-gray-700">วันที่ทำการสั่งซื้อ: {fmtDateTime(order.createdAt)}</div>
      <div className="text-sm text-gray-700">เวลาการชำระสินค้า: {fmtDateTime(order.processedAt)}</div>
      <div className="text-sm text-gray-700">เวลาที่คำสั่งซื้อสำเร็จ: {fmtDateTime(order.updatedAt)}</div>
      <div className="text-sm text-gray-700">หมายเหตุจากผู้ซื้อ: {fmt(order.note)}</div>
    </section>
  )
}
