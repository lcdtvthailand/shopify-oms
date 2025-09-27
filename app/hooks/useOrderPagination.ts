'use client'

import { useMemo, useState } from 'react'
import type { OrderNode } from './useOrderData'

interface UseOrderPaginationReturn {
  page: number
  pageSize: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  setPageSize: (size: number) => void
  getPaginatedData: (orders: OrderNode[]) => {
    pageData: OrderNode[]
    totalItems: number
    totalPages: number
    safePage: number
    startIndex: number
    endIndex: number
  }
}

export const useOrderPagination = (): UseOrderPaginationReturn => {
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const setPageSizeAndResetPage = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const getPaginatedData = useMemo(() => {
    return (orders: OrderNode[]) => {
      const totalItems = orders.length
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
      const safePage = Math.min(Math.max(1, page), totalPages)
      const startIndex = (safePage - 1) * pageSize
      const endIndex = Math.min(startIndex + pageSize, totalItems)
      const pageData = orders.slice(startIndex, endIndex)

      return {
        pageData,
        totalItems,
        totalPages,
        safePage,
        startIndex,
        endIndex,
      }
    }
  }, [page, pageSize])

  return {
    page,
    pageSize,
    setPage,
    setPageSize: setPageSizeAndResetPage,
    getPaginatedData,
  }
}
