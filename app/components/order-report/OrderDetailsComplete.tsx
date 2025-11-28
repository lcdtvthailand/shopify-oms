import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { OrderBasicInfo } from './OrderBasicInfo'
import { OrderCustomerInfo } from './OrderCustomerInfo'
import { OrderDiscountsPromo } from './OrderDiscountsPromo'
import { OrderFinancialInfo } from './OrderFinancialInfo'
import { OrderItemsInfo } from './OrderItemsInfo'
import { OrderPackingInfo } from './OrderPackingInfo'
import { OrderRefundsReturns } from './OrderRefundsReturns'
import { OrderShippingInfo } from './OrderShippingInfo'
import { OrderTaxInvoiceInfo } from './OrderTaxInvoiceInfo'

interface OrderDetailsCompleteProps {
  order: OrderNode
  showRaw: boolean
}

export const OrderDetailsComplete: React.FC<OrderDetailsCompleteProps> = ({ order, showRaw }) => {
  if (showRaw) {
    return (
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
          {JSON.stringify(order, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <OrderBasicInfo order={order} />
      <OrderCustomerInfo order={order} />
      <OrderShippingInfo order={order} />
      <OrderItemsInfo order={order} />
      <OrderFinancialInfo order={order} />
      <OrderRefundsReturns order={order} />
      <OrderDiscountsPromo order={order} />
      <OrderTaxInvoiceInfo order={order} />
      <OrderPackingInfo order={order} />
    </div>
  )
}
