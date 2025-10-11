'use client'
import { useEffect, useRef, useState } from 'react'

interface PaginationControlsProps {
  startIndex: number
  endIndex: number
  totalItems: number
  pageSize: number
  setPageSize: (n: number) => void
  safePage: number
  totalPages: number
  setPage: (updater: (p: number) => number) => void
  variant?: 'top' | 'bottom'
  monthFilter?: number | 'all'
  setMonthFilter?: (v: number | 'all') => void
  yearFilter?: number | 'all'
  setYearFilter?: (v: number | 'all') => void
  thaiMonths?: string[]
  years?: number[]
  dateQuickFilter?: 'all' | 'today' | 'yesterday' | 'last7'
  setDateQuickFilter?: (v: 'all' | 'today' | 'yesterday' | 'last7') => void
  fulfillmentFilter?: 'all' | 'fulfilled' | 'unfulfilled'
  setFulfillmentFilter?: (v: 'all' | 'fulfilled' | 'unfulfilled') => void
  // Optional: if provided, show a Date Range Picker instead of Month/Year
  fromDate?: string | null // ISO yyyy-MM-dd
  toDate?: string | null // ISO yyyy-MM-dd
  setDateRange?: (from: string | null, to: string | null) => void
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  startIndex,
  endIndex,
  totalItems,
  pageSize,
  setPageSize,
  safePage,
  totalPages,
  setPage,
  variant = 'top',
  monthFilter,
  setMonthFilter,
  yearFilter,
  setYearFilter,
  thaiMonths,
  years,
  dateQuickFilter,
  setDateQuickFilter,
  fulfillmentFilter,
  setFulfillmentFilter,
  fromDate,
  toDate,
  setDateRange,
}) => {
  // Helpers for custom calendar popover (Thai locale, Mon-Sun)
  const thaiMonthsFull = [
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
  const thaiWeekdaysShort = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']

  const pad2 = (n: number) => String(n).padStart(2, '0')
  const toISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  const toDisplay = (iso?: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
  }
  const buildMonthMatrix = (year: number, monthIndex: number) => {
    // monthIndex: 0-11
    const first = new Date(year, monthIndex, 1)
    // Convert JS Sunday=0.. to Mon=0..Sun=6
    const jsFirst = first.getDay() // 0..6 with 0=Sun
    const firstCol = jsFirst === 0 ? 6 : jsFirst - 1 // Mon=0
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < firstCol; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndex, d))
    while (cells.length % 7 !== 0) cells.push(null)
    const weeks: (Date | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
    return weeks
  }

  // Popover states for start/end calendars
  const [showFromCal, setShowFromCal] = useState(false)
  const [_showToCal, setShowToCal] = useState(false)
  const now = new Date()
  const [fromYM, setFromYM] = useState<{ y: number; m: number }>({
    y: now.getFullYear(),
    m: now.getMonth(),
  })
  const [_toYM, _setToYM] = useState<{ y: number; m: number }>({
    y: now.getFullYear(),
    m: now.getMonth(),
  })

  // Temporary selection state for single range picker
  const [tempFromDate, setTempFromDate] = useState<string | null>(null)
  const [tempToDate, setTempToDate] = useState<string | null>(null)

  // Refs for calendar popover containers
  const calendarRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowFromCal(false)
        setTempFromDate(null)
        setTempToDate(null)
      }
    }

    if (showFromCal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFromCal])

  const selectDate = (d: Date) => {
    const iso = toISO(d)
    if (!tempFromDate) {
      // First selection - set both from and to to same date (single day)
      setTempFromDate(iso)
      setTempToDate(iso)
      setDateQuickFilter?.('all')
      setMonthFilter?.('all')
      setYearFilter?.('all')
      setDateRange?.(iso, iso)
    } else if (tempFromDate === iso && tempToDate === iso) {
      // Clicking the same single date - clear selection
      setTempFromDate(null)
      setTempToDate(null)
      setDateRange?.(null, null)
    } else if (tempFromDate === iso) {
      // Clicking the from date - clear selection
      setTempFromDate(null)
      setTempToDate(null)
      setDateRange?.(null, null)
    } else if (tempToDate === iso) {
      // Clicking the to date - clear selection
      setTempFromDate(null)
      setTempToDate(null)
      setDateRange?.(null, null)
    } else if (new Date(iso) >= new Date(tempFromDate)) {
      // Second selection or changing existing selection - selected date is after or same as current from date
      setTempToDate(iso)
      setDateRange?.(tempFromDate, iso)
    } else {
      // Selected date is before current from date, make it the new from date
      setTempFromDate(iso)
      setTempToDate(tempFromDate)
      setDateRange?.(iso, tempFromDate)
    }
  }

  // Function to handle page change
  const handlePageChange = (newPage: number) => {
    setPage(() => newPage)
    // Scroll to top of the page when pagination changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (variant === 'bottom') {
    // For mobile: show first page, ellipsis, and current page (if not first page)
    // For desktop: show first 3 pages, then ellipsis, then last page
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768 // 768px is Tailwind's 'md' breakpoint

    let pageNumbers: number[] = []
    let showEllipsis = false

    if (isMobile) {
      // Mobile view: Show [1, ..., currentPage] if not on first page, otherwise just [1]
      pageNumbers = safePage > 1 ? [1, safePage] : [1]
      showEllipsis = safePage > 2
    } else {
      // Desktop view: Original behavior
      pageNumbers = [1, 2, 3].filter((page) => page <= totalPages)
      showEllipsis = totalPages > 3
    }

    return (
      <div className="mt-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
          <div className="order-2 md:order-1 w-full md:w-auto flex justify-center md:justify-start">
            <div className="text-sm text-gray-600 text-center md:text-left">
              แสดง {startIndex + 1}-{Math.min(endIndex, totalItems)} จากทั้งหมด{' '}
              {totalItems.toLocaleString()} รายการ หน้า {safePage} จาก {totalPages}
            </div>
          </div>
          <div className="order-1 md:order-2 flex items-center space-x-2 w-full md:w-auto justify-center">
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-red-200 transition-all duration-200"
              disabled={safePage <= 1}
              onClick={() => handlePageChange(Math.max(1, safePage - 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`w-10 h-10 text-sm font-medium ${
                  pageNum === safePage ? 'bg-red-600 text-white' : 'text-red-700 hover:bg-red-50'
                } border-2 border-red-200 rounded-lg transition-all duration-200`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            {showEllipsis && (
              <>
                <span className="text-gray-500">...</span>
                {totalPages > 3 && (
                  <button
                    type="button"
                    className={`w-10 h-10 text-sm font-medium ${
                      totalPages === safePage
                        ? 'bg-red-600 text-white'
                        : 'text-red-700 hover:bg-red-50'
                    } border-2 border-red-200 rounded-lg transition-all duration-200`}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 text-sm font-medium text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-red-200 transition-all duration-200"
              disabled={safePage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-red-200 rounded-xl px-5 sm:px-7 py-5 shadow-lg mb-4 sm:mb-6 2xl:mb-8">
      {/* Mobile-first layout; on xl+ keep header and controls in one row (iPad Pro = stacked) */}
      <div className="flex flex-col gap-5">
        {/* Controls row - responsive layout */}
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-start xl:flex-wrap xl:justify-start xl:items-stretch xl:gap-4 2xl:flex-nowrap 2xl:items-center">
          {/* Fulfillment status filter (moved to front) */}
          {typeof fulfillmentFilter !== 'undefined' &&
            typeof setFulfillmentFilter !== 'undefined' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
                <label className="text-sm text-red-700 font-medium whitespace-nowrap sm:min-w-[80px]">
                  สถานะจัดส่ง
                </label>
                <div className="grid grid-cols-2 sm:flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setFulfillmentFilter('fulfilled')}
                    className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-10 text-sm rounded-lg border transition-colors ${fulfillmentFilter === 'fulfilled' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                  >
                    Fulfilled
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentFilter('unfulfilled')}
                    className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-10 text-sm rounded-lg border transition-colors ${fulfillmentFilter === 'unfulfilled' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                  >
                    Unfulfilled
                  </button>
                </div>
              </div>
            )}
          {/* Divider between fulfillment and date filters */}
          <div className="hidden xl:block w-px bg-red-200 h-8 mx-2"></div>
          {/* Date filters - mobile responsive */}
          {typeof dateQuickFilter !== 'undefined' && typeof setDateQuickFilter !== 'undefined' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:flex-1 xl:items-center">
              <label className="text-sm text-red-700 font-medium whitespace-nowrap sm:min-w-[68px] xl:hidden">
                ช่วงวันที่
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 2xl:flex gap-3 w-full sm:max-w-[560px]">
                <button
                  type="button"
                  onClick={() => setDateQuickFilter('today')}
                  className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-10 text-sm sm:text-base rounded-lg border transition-colors ${dateQuickFilter === 'today' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => setDateQuickFilter('yesterday')}
                  className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-10 text-sm sm:text-base rounded-lg border transition-colors ${dateQuickFilter === 'yesterday' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                >
                  เมื่อวาน
                </button>
                <button
                  type="button"
                  onClick={() => setDateQuickFilter('last7')}
                  className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-10 text-sm sm:text-base rounded-lg border transition-colors ${dateQuickFilter === 'last7' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                >
                  7 วันล่าสุด
                </button>
                <button
                  type="button"
                  onClick={() => setDateQuickFilter('all')}
                  className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-10 text-sm sm:text-base rounded-lg border transition-colors ${dateQuickFilter === 'all' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                  title="ล้างตัวกรองวันที่แบบด่วน"
                >
                  ทั้งหมด
                </button>
              </div>
            </div>
          )}
          {/* Divider between date filters and month/year/pageSize */}
          <div className="hidden xl:block w-px bg-red-200 h-8 mx-2"></div>
          {/* Month/Year replaced by Date Range Picker when setDateRange is provided */}
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 2xl:flex xl:flex-none xl:items-center gap-4 xl:gap-1 w-auto sm:items-end">
            {typeof setDateRange === 'function' ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                <label className="text-sm text-red-700 font-semibold sm:whitespace-nowrap sm:min-w-[88px] flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  ช่วงวันที่
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Single range input */}
                  <div className="relative">
                    <button
                      type="button"
                      ref={buttonRef}
                      className="h-10 w-full sm:w-64 border-2 border-red-200 rounded-xl px-4 pr-9 bg-white hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200/50 text-left text-sm shadow-sm flex items-center gap-2"
                      onClick={() => {
                        setShowFromCal((s) => !s)
                        setShowToCal(false)
                      }}
                      title="เลือกช่วงวันที่"
                    >
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span
                        className={
                          toDisplay(fromDate) || toDisplay(toDate) || tempFromDate || tempToDate
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }
                      >
                        {toDisplay(fromDate) && toDisplay(toDate)
                          ? `${toDisplay(fromDate)} - ${toDisplay(toDate)}`
                          : tempFromDate && tempToDate
                            ? `${toDisplay(tempFromDate)} - ${toDisplay(tempToDate)}${tempFromDate === tempToDate ? ' (1 วัน)' : ''}`
                            : tempFromDate
                              ? `${toDisplay(tempFromDate)} (เลือกช่วง 1 วัน)`
                              : 'เลือกช่วงวันที่'}
                      </span>
                      <svg
                        className="absolute right-3 w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6h10M4 12h16M4 18h16"
                        />
                      </svg>
                    </button>
                    {showFromCal && (
                      <div
                        ref={calendarRef}
                        className="absolute z-50 mt-2 w-80 bg-white border border-red-200 rounded-xl shadow-xl p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <button
                            type="button"
                            className="p-1 rounded-lg hover:bg-red-50 text-red-600"
                            onClick={() =>
                              setFromYM(({ y, m }) =>
                                m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }
                              )
                            }
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <div className="flex items-center gap-2">
                            <select
                              className="border border-red-200 rounded-lg px-2 py-1 text-sm"
                              value={fromYM.m}
                              onChange={(e) =>
                                setFromYM((s) => ({ ...s, m: parseInt(e.target.value, 10) }))
                              }
                            >
                              {thaiMonthsFull.map((m, i) => (
                                <option value={i} key={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                            <select
                              className="border border-red-200 rounded-lg px-2 py-1 text-sm"
                              value={fromYM.y}
                              onChange={(e) =>
                                setFromYM((s) => ({ ...s, y: parseInt(e.target.value, 10) }))
                              }
                            >
                              {Array.from({ length: 11 }).map((_, idx) => {
                                const y = now.getFullYear() - 5 + idx
                                return (
                                  <option key={y} value={y}>
                                    {y + 543}
                                  </option>
                                )
                              })}
                            </select>
                          </div>
                          <button
                            type="button"
                            className="p-1 rounded-lg hover:bg-red-50 text-red-600"
                            onClick={() =>
                              setFromYM(({ y, m }) =>
                                m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }
                              )
                            }
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-7 text-center text-xs text-red-700 font-medium">
                          {thaiWeekdaysShort.map((w) => (
                            <div key={w} className="py-1">
                              {w}
                            </div>
                          ))}
                        </div>
                        <div className="mt-1 space-y-1">
                          {buildMonthMatrix(fromYM.y, fromYM.m).map((week, wi) => (
                            <div
                              className="grid grid-cols-7 gap-1"
                              key={week.map((d) => (d ? toISO(d) : 'null')).join('-')}
                            >
                              {week.map((d, di) => {
                                const active =
                                  d &&
                                  (toISO(d) === (typeof fromDate === 'string' ? fromDate : '') ||
                                    toISO(d) === (typeof toDate === 'string' ? toDate : ''))
                                const inRange =
                                  d &&
                                  fromDate &&
                                  toDate &&
                                  new Date(d) >= new Date(fromDate) &&
                                  new Date(d) <= new Date(toDate)
                                const tempInRange =
                                  d &&
                                  tempFromDate &&
                                  tempToDate &&
                                  new Date(d) >= new Date(tempFromDate) &&
                                  new Date(d) <= new Date(tempToDate)
                                const tempActive =
                                  d && (toISO(d) === tempFromDate || toISO(d) === tempToDate)
                                return (
                                  <button
                                    type="button"
                                    key={d ? toISO(d) : `empty-${wi}-${di}`}
                                    disabled={!d}
                                    onClick={() => d && selectDate(d)}
                                    className={`h-8 rounded-lg text-sm ${d ? (active ? 'bg-red-600 text-white' : tempActive ? 'bg-red-500 text-white' : tempInRange ? 'bg-red-200 text-red-800' : inRange ? 'bg-red-100 text-red-800' : 'hover:bg-red-50 text-red-800 border border-transparent') : 'opacity-20 cursor-default'} `}
                                  >
                                    {d ? d.getDate() : ''}
                                  </button>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-between text-xs">
                          <button
                            className="text-red-600 hover:underline"
                            type="button"
                            onClick={() => {
                              const d = new Date()
                              selectDate(d)
                            }}
                          >
                            วันนี้
                          </button>
                          <div className="flex gap-2">
                            {tempFromDate && tempToDate && (
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                                type="button"
                                onClick={() => {
                                  setShowFromCal(false)
                                  setTempFromDate(null)
                                  setTempToDate(null)
                                }}
                              >
                                ตกลง
                              </button>
                            )}
                            <button
                              className="text-gray-500 hover:underline"
                              type="button"
                              onClick={() => {
                                setShowFromCal(false)
                                setTempFromDate(null)
                                setTempToDate(null)
                              }}
                            >
                              ปิด
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="px-4 h-10 text-sm rounded-xl border-2 bg-gradient-to-r from-gray-50 to-gray-100 text-red-700 border-red-200 hover:from-red-50 hover:to-red-100 hover:border-red-300 transition-all duration-200 font-medium shadow-sm flex items-center gap-2"
                    onClick={() => {
                      setDateQuickFilter?.('all')
                      setMonthFilter?.('all')
                      setYearFilter?.('all')
                      setFulfillmentFilter?.('all')
                      setDateRange?.(null, null)
                      setShowFromCal(false)
                      setShowToCal(false)
                    }}
                    title="ล้างตัวกรองทั้งหมด"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    ล้าง
                  </button>
                </div>
              </div>
            ) : (
              <>
                {typeof monthFilter !== 'undefined' &&
                  typeof setMonthFilter !== 'undefined' &&
                  thaiMonths && (
                    <div className="flex flex-col items-stretch gap-2 w-full sm:flex-row sm:items-center sm:gap-3 sm:w-auto">
                      <label className="text-sm text-red-700 font-medium sm:whitespace-nowrap sm:min-w-[48px]">
                        เดือน
                      </label>
                      <select
                        className="w-full sm:w-auto flex-1 text-sm sm:text-base h-12 border-2 border-red-200 rounded-lg px-3 sm:px-3 bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200 min-w-[8rem]"
                        value={monthFilter}
                        onChange={(e) => {
                          setDateQuickFilter?.('all')
                          setMonthFilter(
                            e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                          )
                        }}
                      >
                        <option value="all">ทั้งหมด</option>
                        {thaiMonths.map((m, idx) => (
                          <option key={`month-${m}`} value={idx + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                {typeof yearFilter !== 'undefined' &&
                  typeof setYearFilter !== 'undefined' &&
                  years && (
                    <div className="flex flex-col items-stretch gap-2 w-full sm:flex-row sm:items-center sm:gap-3 sm:w-auto">
                      <label className="text-sm text-red-700 font-medium sm:whitespace-nowrap sm:min-w-[28px] xl:min-w-0">
                        ปี
                      </label>
                      <select
                        className="w-full sm:w-auto flex-1 text-sm sm:text-base h-12 border-2 border-red-200 rounded-lg px-3 sm:px-3 bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                        value={yearFilter}
                        onChange={(e) => {
                          setDateQuickFilter?.('all')
                          setYearFilter(
                            e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10)
                          )
                        }}
                      >
                        <option value="all">ทั้งหมด</option>
                        {years
                          .sort((a, b) => b - a)
                          .map((y) => (
                            <option key={y} value={y}>
                              {y + 543}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
              </>
            )}
            {/* Page size selector - on its own row on tablet, inline on larger screens */}
            <div className="col-span-full sm:col-span-3 xl:col-span-full 2xl:col-auto xl:flex xl:flex-col xl:items-start xl:gap-2 2xl:flex-row 2xl:items-center 2xl:gap-3 xl:mt-2 2xl:mt-0">
              <div className="flex flex-col items-start gap-2 w-auto sm:flex-row sm:items-center sm:gap-3">
                <label className="text-sm text-red-700 font-medium whitespace-nowrap min-w-[92px]">
                  แสดงต่อหน้า
                </label>
                <select
                  className="w-24 text-sm sm:text-base h-10 border-2 border-red-200 rounded-lg px-3 bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  value={pageSize}
                  onChange={(e) => {
                    setPage(() => 1)
                    setPageSize(parseInt(e.target.value, 10))
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
