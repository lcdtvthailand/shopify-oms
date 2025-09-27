import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { money, nodesFrom } from '@/app/utils/orderUtils'

interface OrderRefundsReturnsProps {
  order: OrderNode
}

export const OrderRefundsReturns: React.FC<OrderRefundsReturnsProps> = ({ order }) => {
  const refunds = nodesFrom(order.refunds)
  const returns = nodesFrom(order.returns)

  return (
    <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500 rounded-lg">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"
            />
          </svg>
        </div>
        <h4 className="font-semibold text-red-900 text-lg">การคืนเงิน/คืนสินค้า</h4>
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
              .map((r: any) => `${r.name || r.id} (${r.status || '-'}) x${r.totalQuantity ?? '-'}`)
              .join(' , ')
          : '-'}
      </div>
    </section>
  )
}
