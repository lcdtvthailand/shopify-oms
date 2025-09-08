export type OrderFinancialStatus = 
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'refunded'
  | 'partially_refunded'
  | 'voided'

export type OrderFulfillmentStatus = 
  | 'fulfilled'
  | 'partial'
  | 'unfulfilled'
  | null

export interface OrderStatus {
  financialStatus: OrderFinancialStatus
  fulfillmentStatus: OrderFulfillmentStatus
  cancelledAt: string | null
  refundedAt?: string | null
  displayFinancialStatus?: string
  displayFulfillmentStatus?: string
}

export interface OrderStatusValidation {
  isEligible: boolean
  reason?: 'cancelled' | 'fulfilled' | 'refunded' | 'unpaid'
  message: string
}

export interface OrderStatusDisplay {
  financial: string
  fulfillment: string
  overall: string
}