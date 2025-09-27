'use client'

import { useMemo, useState } from 'react'
import type { OrderNode } from './useOrderData'

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface UseOrderSortingReturn {
  sortConfig: SortConfig
  handleSort: (key: string) => void
  getSortIcon: (key: string) => string
  getSortedOrders: (orders: OrderNode[]) => OrderNode[]
}

export const useOrderSorting = (): UseOrderSortingReturn => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  })

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return '↕️'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const getSortedOrders = useMemo(() => {
    return (orders: OrderNode[]): OrderNode[] => {
      return [...orders].sort((a, b) => {
        if (sortConfig.key) {
          let aValue: any = a[sortConfig.key as keyof typeof a]
          let bValue: any = b[sortConfig.key as keyof typeof b]

          // Handle nested properties
          if (sortConfig.key === 'totalPrice') {
            aValue = parseFloat(a.currentTotalPriceSet?.shopMoney?.amount || '0')
            bValue = parseFloat(b.currentTotalPriceSet?.shopMoney?.amount || '0')
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
          }

          if (sortConfig.key === 'customerName') {
            aValue = (a.customer?.displayName || a.email || '').toLowerCase()
            bValue = (b.customer?.displayName || b.email || '').toLowerCase()
          }

          if (sortConfig.key === 'status') {
            aValue =
              `${a.displayFinancialStatus || ''} ${a.displayFulfillmentStatus || ''}`.toLowerCase()
            bValue =
              `${b.displayFinancialStatus || ''} ${b.displayFulfillmentStatus || ''}`.toLowerCase()
          }

          if (sortConfig.key === 'createdAt') {
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
          }

          // Default string comparison
          aValue = String(aValue || '').toLowerCase()
          bValue = String(bValue || '').toLowerCase()

          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1
          }
        }
        return 0
      })
    }
  }, [sortConfig])

  return {
    sortConfig,
    handleSort,
    getSortIcon,
    getSortedOrders,
  }
}
