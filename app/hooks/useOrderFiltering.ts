'use client'

import { useMemo, useState } from 'react'
import type { OrderNode } from './useOrderData'

type DateQuickFilter = 'all' | 'today' | 'yesterday' | 'last7'
type FulfillmentFilter = 'all' | 'fulfilled' | 'unfulfilled'

interface UseOrderFilteringReturn {
  monthFilter: number | 'all'
  yearFilter: number | 'all'
  dateQuickFilter: DateQuickFilter
  fulfillmentFilter: FulfillmentFilter
  setMonthFilter: (filter: number | 'all') => void
  setYearFilter: (filter: number | 'all') => void
  setDateQuickFilter: (filter: DateQuickFilter) => void
  setFulfillmentFilter: (filter: FulfillmentFilter) => void
  getFilteredOrders: (orders: OrderNode[]) => OrderNode[]
  thaiMonths: string[]
  years: number[]
  // Optional date range filtering
  fromDate: string | null
  toDate: string | null
  setFromDate: (v: string | null) => void
  setToDate: (v: string | null) => void
}

export const useOrderFiltering = (orders: OrderNode[]): UseOrderFilteringReturn => {
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [dateQuickFilter, setDateQuickFilter] = useState<DateQuickFilter>('all')
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>('all')
  const [fromDate, setFromDate] = useState<string | null>(null)
  const [toDate, setToDate] = useState<string | null>(null)

  const thaiMonths: string[] = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ]

  // Get unique years from orders data
  const years = useMemo(() => {
    const yearSet = new Set<number>()
    orders.forEach((order) => {
      const year = new Date(order.createdAt).getFullYear()
      if (!Number.isNaN(year)) {
        yearSet.add(year)
      }
    })
    return Array.from(yearSet).sort((a, b) => b - a)
  }, [orders])

  const getFilteredOrders = (ordersData: OrderNode[]): OrderNode[] => {
    const startOfDay = (dt: Date) =>
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0)
    const endOfDay = (dt: Date) =>
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999)
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStart = startOfDay(yesterday)
    const yesterdayEnd = endOfDay(yesterday)
    const last7Start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)) // รวมวันนี้ = 7 วันย้อนหลัง

    return ordersData.filter((o: OrderNode) => {
      const d = new Date(o.createdAt)

      // Quick date filters take precedence over month/year filters
      if (dateQuickFilter === 'today') {
        return d >= todayStart && d <= todayEnd
      }
      if (dateQuickFilter === 'yesterday') {
        return d >= yesterdayStart && d <= yesterdayEnd
      }
      if (dateQuickFilter === 'last7') {
        return d >= last7Start && d <= todayEnd
      }

      // If custom date range provided, use it instead of month/year
      if (fromDate || toDate) {
        const start = fromDate ? startOfDay(new Date(fromDate)) : new Date(-8640000000000000)
        const end = toDate ? endOfDay(new Date(toDate)) : new Date(8640000000000000)
        if (!(d >= start && d <= end)) return false
      }

      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const okMonth = monthFilter === 'all' ? true : m === monthFilter
      const okYear = yearFilter === 'all' ? true : y === yearFilter
      if (!(okMonth && okYear)) return false

      // Fulfillment status filter
      if (fulfillmentFilter === 'all') return true
      const raw = (o.displayFulfillmentStatus || '').toUpperCase().trim()
      if (fulfillmentFilter === 'fulfilled') {
        return raw === 'FULFILLED'
      }
      if (fulfillmentFilter === 'unfulfilled') {
        return raw === 'UNFULFILLED' || raw === ''
      }
      return true
    })
  }

  return {
    monthFilter,
    yearFilter,
    dateQuickFilter,
    fulfillmentFilter,
    setMonthFilter,
    setYearFilter,
    setDateQuickFilter,
    setFulfillmentFilter,
    getFilteredOrders,
    thaiMonths,
    years,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
  }
}
