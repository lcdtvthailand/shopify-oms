export interface ShopifyAddress {
  address1?: string
  address2?: string
  city?: string
  zip?: string
  province?: string
  country?: string
}

export interface ShopifyCustomer {
  firstName?: string
  lastName?: string
  email?: string
  defaultAddress?: ShopifyAddress
}

export interface ShopifyOrder {
  id: string
  name: string
  customer?: ShopifyCustomer
  displayFinancialStatus?: string
  displayFulfillmentStatus?: string
  cancelledAt?: string | null
  refundedAt?: string | null
}
