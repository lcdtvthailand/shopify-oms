'use client'

import { useState } from 'react'
import { OrderStatus, validateOrderStatus, getOrderStatusDisplay } from '@/lib/services/order-status'
import { OrderStatusAlert } from '@/app/components/ui/OrderStatusAlert'
import { AdminContactModal } from '@/app/components/modals/AdminContactModal'

export default function TestStatusPage() {
  const [showModal, setShowModal] = useState(false)
  
  // Test different order statuses
  const testCases: { name: string; status: OrderStatus }[] = [
    {
      name: 'Cancelled Order',
      status: {
        financialStatus: 'paid',
        fulfillmentStatus: null,
        cancelledAt: '2024-01-01T10:00:00Z',
        displayFinancialStatus: 'Paid',
        displayFulfillmentStatus: 'Unfulfilled'
      }
    },
    {
      name: 'Fulfilled Order',
      status: {
        financialStatus: 'paid',
        fulfillmentStatus: 'fulfilled',
        cancelledAt: null,
        displayFinancialStatus: 'Paid',
        displayFulfillmentStatus: 'Fulfilled'
      }
    },
    {
      name: 'Refunded Order',
      status: {
        financialStatus: 'refunded',
        fulfillmentStatus: 'fulfilled',
        cancelledAt: null,
        refundedAt: '2024-01-02T10:00:00Z',
        displayFinancialStatus: 'Refunded',
        displayFulfillmentStatus: 'Fulfilled'
      }
    },
    {
      name: 'Valid Order (Paid, Unfulfilled)',
      status: {
        financialStatus: 'paid',
        fulfillmentStatus: null,
        cancelledAt: null,
        displayFinancialStatus: 'Paid',
        displayFulfillmentStatus: 'Unfulfilled'
      }
    }
  ]
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Order Status Test Page</h1>
      
      <div className="space-y-6">
        {testCases.map((testCase, index) => {
          const validation = validateOrderStatus(testCase.status)
          const display = getOrderStatusDisplay(testCase.status)
          
          return (
            <div key={index} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">{testCase.name}</h2>
              
              <div className="mb-4 space-y-1 text-sm">
                <p><strong>Financial Status:</strong> {display.financial}</p>
                <p><strong>Fulfillment Status:</strong> {display.fulfillment}</p>
                <p><strong>Overall Status:</strong> {display.overall}</p>
                <p><strong>Is Eligible:</strong> {validation.isEligible ? '✅ Yes' : '❌ No'}</p>
                {validation.reason && <p><strong>Reason:</strong> {validation.reason}</p>}
              </div>
              
              {!validation.isEligible && (
                <OrderStatusAlert
                  status={testCase.status}
                  message={validation.message}
                  orderNumber="TEST-001"
                />
              )}
            </div>
          )
        })}
      </div>
      
      <div className="mt-8">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Admin Contact Modal
        </button>
      </div>
      
      {showModal && (
        <AdminContactModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          orderNumber="TEST-001"
          orderStatus={testCases[0].status}
          customerEmail="test@example.com"
        />
      )}
    </div>
  )
}