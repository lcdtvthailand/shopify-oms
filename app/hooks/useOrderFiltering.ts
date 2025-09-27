'use client'

import { useMemo, useState } from 'react'
import type { OrderNode } from './useOrderData'

type DateQuickFilter = 'all' | 'today' | 'yesterday' | 'last7'

interface UseOrderFilteringReturn {
  monthFilter: number | 'all'
  yearFilter: number | 'all'
  dateQuickFilter: DateQuickFilter
  setMonthFilter: (filter: number | 'all') => void
  setYearFilter: (filter: number | 'all') => void
  setDateQuickFilter: (filter: DateQuickFilter) => void
  getFilteredOrders: (orders: OrderNode[]) => OrderNode[]
  thaiMonths: string[]
  years: number[]
}

export const useOrderFiltering = (orders: OrderNode[]): UseOrderFilteringReturn => {
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [dateQuickFilter, setDateQuickFilter] = useState<DateQuickFilter>('all')

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

      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const okMonth = monthFilter === 'all' ? true : m === monthFilter
      const okYear = yearFilter === 'all' ? true : y === yearFilter
      return okMonth && okYear
    })
  }

  return {
    monthFilter,
    yearFilter,
    dateQuickFilter,
    setMonthFilter,
    setYearFilter,
    setDateQuickFilter,
    getFilteredOrders,
    thaiMonths,
    years,
  }
}
