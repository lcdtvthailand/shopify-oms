import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { fmt } from '@/app/utils/orderUtils'

interface OrderCustomerInfoProps {
  order: OrderNode
}

export const OrderCustomerInfo: React.FC<OrderCustomerInfoProps> = ({ order }) => {
  return (
    <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500 rounded-lg">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="text-sm text-gray-700">ชื่อผู้ใช้: {fmt(order.customer?.displayName)}</div>
      <div className="text-sm text-gray-700">อีเมล: {fmt(order.email || order.customer?.email)}</div>
      <div className="text-sm text-gray-700">เบอร์โทร: {fmt(order.customer?.phone)}</div>
    </section>
  )
}
