'use client'

import { useCallback, useState } from 'react'
import type { ShopifyGraphQLResponse } from '@/types/shopify'

// Order types (copied from original file)
interface MoneyV2 {
  amount: string
  currencyCode: string
}

interface PriceSet {
  shopMoney: MoneyV2
}

interface OrderLineItem {
  id: string
  name: string
  sku?: string | null
  quantity: number
  originalUnitPriceSet?: PriceSet
  discountedUnitPriceSet?: PriceSet
  totalDiscountSet?: PriceSet
  variant?: { id: string; sku?: string | null; title?: string | null } | null
  product?: { id: string; title?: string | null; vendor?: string | null } | null
}

interface OrderNode {
  id: string
  name: string
  createdAt: string
  processedAt?: string | null
  updatedAt?: string | null
  displayFinancialStatus?: string | null
  displayFulfillmentStatus?: string | null
  email?: string | null
  customer?: {
    id: string
    displayName?: string | null
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
    email?: string | null
  } | null
  currentTotalPriceSet?: PriceSet
  currentSubtotalPriceSet?: PriceSet
  currentShippingPriceSet?: PriceSet
  currentTotalTaxSet?: PriceSet
  currentTotalDiscountsSet?: PriceSet
  lineItems?: { edges: Array<{ node: OrderLineItem }> }
  shippingAddress?: {
    name?: string | null
    phone?: string | null
    address1?: string | null
    address2?: string | null
    city?: string | null
    province?: string | null
    country?: string | null
    zip?: string | null
    company?: string | null
  } | null
  billingAddress?: {
    name?: string | null
    phone?: string | null
    address1?: string | null
    address2?: string | null
    city?: string | null
    province?: string | null
    country?: string | null
    zip?: string | null
    company?: string | null
  } | null
  shippingLines?: {
    edges: Array<{
      node: {
        title?: string | null
        code?: string | null
        source?: string | null
        originalPriceSet?: PriceSet
        discountedPriceSet?: PriceSet
      }
    }>
  }
  fulfillments?: Array<{
    name?: string | null
    status?: string | null
    createdAt?: string | null
    deliveredAt?: string | null
    estimatedDeliveryAt?: string | null
    trackingInfo?: Array<{ number?: string | null; company?: string | null; url?: string | null }>
    service?: { serviceName?: string | null } | null
  }>
  transactions?: {
    edges?: Array<{
      node: {
        gateway?: string | null
        kind?: string | null
        status?: string | null
        amountSet?: { shopMoney: MoneyV2 }
        fees?: Array<{
          amount?: { amount: string; currencyCode: string }
          rate?: number | null
          rateName?: string | null
          type?: string | null
        }>
        processedAt?: string | null
        paymentDetails?: { company?: string | null }
      }
    }>
  }
  refunds?: {
    edges?: Array<{
      node: {
        id: string
        createdAt?: string | null
        note?: string | null
        totalRefundedSet?: { shopMoney: MoneyV2 }
      }
    }>
  }
  returns?: {
    edges?: Array<{
      node: {
        id: string
        name?: string | null
        status?: string | null
        totalQuantity?: number | null
      }
    }>
  }
  customAttributes?: Array<{ key: string; value: string }>
  metafields?: { edges?: Array<{ node: { namespace: string; key: string; value: string } }> }
  cancelReason?: string | null
  cancelledAt?: string | null
  confirmed?: boolean | null
  note?: string | null
  tags?: string[]
  sourceName?: string | null
  sourceIdentifier?: string | null
  discountCode?: string | null
  discountCodes?: string[] | null
  discountApplications?: {
    edges: Array<{
      node: {
        __typename?: string
        code?: string | null
        title?: string | null
        value?: { amount?: string; currencyCode?: string; percentage?: number }
      }
    }>
  }
}

interface OrdersResponse {
  orders: {
    edges: Array<{ node: OrderNode }>
    pageInfo: { hasNextPage: boolean; endCursor: string }
  }
}

interface UseOrderDataReturn {
  data: OrderNode[]
  loading: boolean
  error: string | null
  pageInfo: { hasNextPage: boolean; endCursor: string } | null
  fetchOrders: (after?: string | null) => Promise<void>
  setData: React.Dispatch<React.SetStateAction<OrderNode[]>>
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
}

export const useOrderData = (): UseOrderDataReturn => {
  const [data, setData] = useState<OrderNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageInfo, setPageInfo] = useState<{ hasNextPage: boolean; endCursor: string } | null>(null)

  const ordersQuery = `
    query Orders($after: String) {
      orders(first: 240, after: $after) {
        edges {
          node {
            id
            name
            createdAt
            processedAt
            updatedAt
            displayFinancialStatus
            displayFulfillmentStatus
            cancelReason
            cancelledAt
            confirmed
            email
            note
            tags
            sourceName
            sourceIdentifier
            customAttributes { key value }
            customer { id displayName firstName lastName phone email }
            shippingAddress { name phone address1 address2 city province country zip company }
            billingAddress { name phone address1 address2 city province country zip company }
            currentTotalPriceSet { shopMoney { amount currencyCode } }
            currentSubtotalPriceSet { shopMoney { amount currencyCode } }
            currentShippingPriceSet { shopMoney { amount currencyCode } }
            currentTotalTaxSet { shopMoney { amount currencyCode } }
            currentTotalDiscountsSet { shopMoney { amount currencyCode } }
            discountCode
            discountCodes
            discountApplications(first: 100) {
              edges {
                node {
                  ... on DiscountCodeApplication {
                    code
                    value { ... on MoneyV2 { amount currencyCode } ... on PricingPercentageValue { percentage } }
                  }
                  ... on AutomaticDiscountApplication {
                    title
                    value { ... on MoneyV2 { amount currencyCode } ... on PricingPercentageValue { percentage } }
                  }
                }
              }
            }
            lineItems(first: 250) {
              edges {
                node {
                  id
                  name
                  sku
                  quantity
                  refundableQuantity
                  originalUnitPriceSet { shopMoney { amount currencyCode } }
                  discountedUnitPriceSet { shopMoney { amount currencyCode } }
                  totalDiscountSet { shopMoney { amount currencyCode } }
                  variant { id sku title }
                  product { id title vendor }
                  customAttributes { key value }
                }
              }
            }
            shippingLines(first: 50) {
              edges {
                node {
                  title
                  code
                  source
                  originalPriceSet { shopMoney { amount currencyCode } }
                  discountedPriceSet { shopMoney { amount currencyCode } }
                }
              }
            }
            fulfillments(first: 50) {
              name
              status
              createdAt
              deliveredAt
              estimatedDeliveryAt
              trackingInfo(first: 50) { number company url }
              service { serviceName }
            }
            transactions(first: 100) {
              gateway
              kind
              status
              amountSet { shopMoney { amount currencyCode } }
              fees { amount { amount currencyCode } rate rateName type }
              processedAt
              paymentDetails { ... on CardPaymentDetails { company } }
            }
            refunds(first: 50) {
              id
              createdAt
              note
              totalRefundedSet { shopMoney { amount currencyCode } }
            }
            returns(first: 50) {
              edges { node { id name status totalQuantity } }
            }
            metafields(first: 100) { edges { node { namespace key value } } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `

  const fetchOrders = useCallback(async (after: string | null = null) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/shopify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: ordersQuery,
          variables: { after },
        }),
      })

      const json: unknown = await response.json()

      // Handle API errors returned by our /api/shopify route
      if (!response.ok) {
        const api = (json as { error?: string; code?: string; details?: unknown }) || {}
        const apiError = typeof api.error === 'string' ? api.error : 'Request failed'
        const details = api.details ? ` Details: ${JSON.stringify(api.details)}` : ''
        throw new Error(`API error ${response.status}: ${apiError}.${details}`)
      }

      const result = json as ShopifyGraphQLResponse<OrdersResponse>
      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(' | ')}`)
      }

      if (!result.data) {
        throw new Error('Empty response from Shopify (no data field)')
      }

      const responseData = result.data
      const orders = responseData.orders.edges.map((edge) => edge.node)

      // if after provided, append; else replace
      setData((prev) => (after ? [...prev, ...orders] : orders))
      setPageInfo(responseData.orders.pageInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    data,
    loading,
    error,
    pageInfo,
    fetchOrders,
    setData,
    setLoading,
    setError,
  }
}

export type { OrderNode, OrderLineItem, PriceSet, MoneyV2 }
