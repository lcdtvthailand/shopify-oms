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

export interface ShopifyGraphQLError {
  message: string
  extensions?: {
    code: string
    [key: string]: unknown
  }
  locations?: Array<{
    line: number
    column: number
  }>
  path?: Array<string | number>
}

export interface ShopifyGraphQLResponse<T = unknown> {
  data?: T
  errors?: ShopifyGraphQLError[]
  extensions?: {
    cost?: {
      requestedQueryCost: number
      actualQueryCost: number
      throttleStatus: {
        maximumAvailable: number
        currentlyAvailable: number
        restoreRate: number
      }
    }
  }
}
