import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { fmt, money, nodesFrom } from '@/app/utils/orderUtils'

interface OrderItemsInfoProps {
  order: OrderNode
}

export const OrderItemsInfo: React.FC<OrderItemsInfoProps> = ({ order }) => {
  const items = nodesFrom(order.lineItems)

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
        <h4 className="font-semibold text-red-900 text-lg">ข้อมูลสินค้า</h4>
      </div>
      <div className="text-sm text-gray-700">
        {items.length === 0 ? (
          '-'
        ) : (
          <div className="overflow-x-auto border border-red-200 rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-red-700">สินค้า</th>
                  <th className="px-3 py-2 text-left font-medium text-red-700">SKU</th>
                  <th className="px-3 py-2 text-right font-medium text-red-700">จำนวน</th>
                  <th className="px-3 py-2 text-right font-medium text-red-700">คืนได้</th>
                  <th className="px-3 py-2 text-right font-medium text-red-700">ราคาตั้งต้น</th>
                  <th className="px-3 py-2 text-right font-medium text-red-700">ราคาขาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {items.map((it: any) => (
                  <tr key={it.id}>
                    <td className="px-3 py-2">{fmt(it.name)}</td>
                    <td className="px-3 py-2">{fmt(it.sku)}</td>
                    <td className="px-3 py-2 text-right">{it.quantity ?? '-'}</td>
                    <td className="px-3 py-2 text-right">{it.refundableQuantity ?? '-'}</td>
                    <td className="px-3 py-2 text-right">{money(it.originalUnitPriceSet)}</td>
                    <td className="px-3 py-2 text-right">{money(it.discountedUnitPriceSet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
