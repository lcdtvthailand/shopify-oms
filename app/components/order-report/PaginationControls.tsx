'use client'

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
}) => {
  if (variant === 'bottom') {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 text-sm px-4 py-2 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-red-200 transition-all duration-200 font-medium text-red-700"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            ก่อนหน้า
          </button>
          <button
            type="button"
            className="flex items-center gap-2 text-sm px-4 py-2 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-red-200 transition-all duration-200 font-medium text-red-700"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ถัดไป
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-red-200 rounded-xl px-5 sm:px-7 py-5 shadow-lg mb-4 sm:mb-6 2xl:mb-8">
      {/* Mobile-first layout; on xl+ keep header and controls in one row (iPad Pro = stacked) */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
        {/* Stats row - always visible */}
        <div className="flex items-center gap-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg
              className="h-4 w-4 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
          </div>
          <div className="text-sm text-red-700 font-medium">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span>
                แสดง{' '}
                <span className="font-bold">
                  {startIndex + 1}-{endIndex}
                </span>{' '}
                จากทั้งหมด <span className="font-bold">{totalItems}</span> รายการ
              </span>
              <span className="text-xs text-red-600/70 font-normal">
                หน้า {safePage} จาก {totalPages}
              </span>
            </div>
          </div>
        </div>

        {/* Controls row - responsive layout */}
        <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between xl:flex-nowrap xl:justify-start xl:items-center xl:gap-4">
          {/* Date filters - mobile responsive */}
          {typeof dateQuickFilter !== 'undefined' && typeof setDateQuickFilter !== 'undefined' && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:flex-1 xl:items-center">
              <label className="text-sm text-red-700 font-medium whitespace-nowrap sm:min-w-[68px] xl:hidden">
                ช่วงวันที่
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:flex gap-3 xl:gap-3 w-full sm:max-w-[560px] xl:max-w-none">
                <button
                  type="button"
                  onClick={() => setDateQuickFilter('today')}
                  className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-12 text-sm sm:text-base rounded-lg border transition-colors ${dateQuickFilter === 'today' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => setDateQuickFilter('yesterday')}
                  className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-12 text-sm sm:text-base rounded-lg border transition-colors ${dateQuickFilter === 'yesterday' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                >
                  เมื่อวาน
                </button>
                <button
                  type="button"
                  onClick={() => setDateQuickFilter('last7')}
                  className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-12 text-sm sm:text-base rounded-lg border transition-colors ${dateQuickFilter === 'last7' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                >
                  7 วันล่าสุด
                </button>
                <button
                  type="button"
                  onClick={() => setDateQuickFilter('all')}
                  className={`w-full sm:w-auto text-center whitespace-nowrap px-3 h-12 text-sm sm:text-base rounded-lg border transition-colors ${dateQuickFilter === 'all' ? 'bg-red-600 text-white border-red-700' : 'bg-white text-red-700 border-red-200 hover:bg-red-50'}`}
                  title="ล้างตัวกรองวันที่แบบด่วน"
                >
                  ทั้งหมด
                </button>
              </div>
            </div>
          )}
          {/* Month/Year/PageSize - mobile responsive (tablet: 3 columns, xl+: inline) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:flex xl:flex-none xl:items-center gap-4 xl:gap-4 w-full sm:items-end">
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
            {typeof yearFilter !== 'undefined' && typeof setYearFilter !== 'undefined' && years && (
              <div className="flex flex-col items-stretch gap-2 w-full sm:flex-row sm:items-center sm:gap-3 sm:w-auto">
                <label className="text-sm text-red-700 font-medium sm:whitespace-nowrap sm:min-w-[28px] xl:min-w-0">
                  ปี
                </label>
                <select
                  className="w-full sm:w-auto flex-1 text-sm sm:text-base h-12 border-2 border-red-200 rounded-lg px-3 sm:px-3 bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                  value={yearFilter}
                  onChange={(e) => {
                    setDateQuickFilter?.('all')
                    setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))
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
            {/* Page size selector - moved into same grid row */}
            <div className="flex flex-col items-stretch gap-2 w-full sm:flex-row sm:items-center sm:gap-3 sm:w-auto">
              <label className="text-sm text-red-700 font-medium sm:whitespace-nowrap sm:min-w-[92px] xl:min-w-0">
                แสดงต่อหน้า
              </label>
              <select
                className="w-full sm:w-auto flex-1 text-sm sm:text-base h-12 border-2 border-red-200 rounded-lg px-3 sm:px-3 bg-white hover:border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-200"
                value={pageSize}
                onChange={(e) => {
                  setPage(() => 1)
                  setPageSize(parseInt(e.target.value, 10))
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
