import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { fmt, nodesFrom } from '@/app/utils/orderUtils'

interface OrderDiscountsPromoProps {
  order: OrderNode
}

export const OrderDiscountsPromo: React.FC<OrderDiscountsPromoProps> = ({ order }) => {
  const discounts = nodesFrom(order.discountApplications)

  return (
    <section className="bg-white border border-red-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500 rounded-lg">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="text-sm text-gray-700">โค้ดส่วนลด: {fmt(order.discountCode)}</div>
      <div className="text-sm text-gray-700">
        โค้ดส่วนลดทั้งหมด: {order.discountCodes?.length ? order.discountCodes.join(', ') : '-'}
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
                  d?.value?.amount && `${d.value.amount} ${d.value.currencyCode}`,
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
  )
}
