'use client'

import { getOrderStatusDisplay, type OrderStatus } from '@/lib/services/order-status'

interface OrderStatusAlertProps {
  status: OrderStatus
  message: string
  orderNumber: string
}

export function OrderStatusAlert({ status, message, orderNumber }: OrderStatusAlertProps) {
  const statusDisplay = getOrderStatusDisplay(status)

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-400 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">ไม่สามารถออกใบกำกับภาษีได้</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          <div className="mt-3 text-sm">
            <div className="space-y-1">
              <p className="text-gray-600">
                <span className="font-medium">หมายเลขคำสั่งซื้อ:</span> #{orderNumber}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">สถานะ:</span> {statusDisplay.overall}
              </p>
              {status.cancelledAt && (
                <p className="text-gray-600">
                  <span className="font-medium">วันที่ยกเลิก:</span>{' '}
                  {new Date(status.cancelledAt).toLocaleDateString('th-TH')}
                </p>
              )}
              {status.refundedAt && (
                <p className="text-gray-600">
                  <span className="font-medium">วันที่คืนเงิน:</span>{' '}
                  {new Date(status.refundedAt).toLocaleDateString('th-TH')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
