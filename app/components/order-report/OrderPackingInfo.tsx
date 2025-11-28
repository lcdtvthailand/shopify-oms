import type React from 'react'
import type { OrderNode } from '@/app/hooks/useOrderData'
import { Badge } from './Badge'

interface OrderPackingInfoProps {
  order: OrderNode
}

export const OrderPackingInfo: React.FC<OrderPackingInfoProps> = ({ order }) => {
  // Check if order has 'packed' tag
  const tags = (order.tags || []).map((t: string) => t.toLowerCase().trim())
  const isPacked = tags.includes('packed')

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg
            className="h-5 w-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h4 className="font-semibold text-purple-800 text-lg">สถานะการแพ็คสินค้า</h4>
      </div>

      <div className="space-y-4">
        {/* Packing Status */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${isPacked ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`}
            ></div>
            <span className="text-gray-700 font-medium">สถานะ</span>
          </div>
          <Badge tone={isPacked ? 'green' : 'yellow'}>{isPacked ? 'PACKED' : 'UNPACKED'}</Badge>
        </div>

        {/* Status Description */}
        <div className="p-4 bg-white rounded-lg border border-purple-100">
          <div className="flex items-start gap-3">
            <svg
              className={`h-5 w-5 mt-0.5 ${isPacked ? 'text-green-500' : 'text-orange-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isPacked ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <div>
              <p className="text-gray-700 font-medium">
                {isPacked ? 'สินค้าถูกแพ็คเรียบร้อยแล้ว' : 'รอการแพ็คสินค้า'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isPacked
                  ? 'คำสั่งซื้อนี้ได้รับการแพ็คสินค้าเรียบร้อยแล้ว พร้อมสำหรับการจัดส่ง'
                  : 'คำสั่งซื้อนี้ยังไม่ได้รับการแพ็คสินค้า กรุณาดำเนินการแพ็คสินค้า'}
              </p>
            </div>
          </div>
        </div>

        {/* Tags Display */}
        {order.tags && order.tags.length > 0 && (
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="text-sm text-gray-500 mb-2">Tags ทั้งหมด:</div>
            <div className="flex flex-wrap gap-2">
              {order.tags.map((tag) => (
                <span
                  key={`tag-${tag}`}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tag.toLowerCase().trim() === 'packed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
