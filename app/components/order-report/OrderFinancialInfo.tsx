import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { money, nodesFrom } from '@/app/utils/orderUtils'

interface OrderFinancialInfoProps {
  order: OrderNode
}

export const OrderFinancialInfo: React.FC<OrderFinancialInfoProps> = ({ order }) => {
  const txs = nodesFrom(order.transactions)

  return (
    <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500 rounded-lg">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="text-sm text-gray-700">ราคาขายสุทธิ: {money(order.currentTotalPriceSet)}</div>
      <div className="text-sm text-gray-700">ส่วนลดรวม: {money(order.currentTotalDiscountsSet)}</div>
      <div className="text-sm text-gray-700">ค่าจัดส่ง: {money(order.currentShippingPriceSet)}</div>
      <div className="text-sm text-gray-700">ภาษี: {money(order.currentTotalTaxSet)}</div>
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
  )
}
