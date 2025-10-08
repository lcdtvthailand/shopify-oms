'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
// Import UI components
import { AuthPopup } from '@/app/components/order-report/AuthPopup'
import { OrderCardView } from '@/app/components/order-report/OrderCardView'
import { OrderDetailsComplete } from '@/app/components/order-report/OrderDetailsComplete'
import { OrderTableDesktop } from '@/app/components/order-report/OrderTableDesktop'
import { PaginationControls } from '@/app/components/order-report/PaginationControls'
import OrbitalLoader from '@/app/components/ui/OrbitalLoader'
import { useAuth } from '@/app/contexts/AuthContext'
// Import custom hooks
import { useOrderData } from '@/app/hooks/useOrderData'
import { useOrderExport } from '@/app/hooks/useOrderExport'
import { useOrderFiltering } from '@/app/hooks/useOrderFiltering'
import { useOrderPagination } from '@/app/hooks/useOrderPagination'
import { useOrderSorting } from '@/app/hooks/useOrderSorting'

export default function OrderReportPage() {
  // Authentication
  const {
    isAuthenticated,
    showAuthPopup,
    authCode,
    authError,
    authAttempts,
    setAuthCode,
    handleAuth,
  } = useAuth()

  // Order data
  const { data, loading, error, pageInfo, fetchOrders, setData } = useOrderData()

  // Filtering
  const {
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
  } = useOrderFiltering(data)

  // Sorting
  const { handleSort, getSortIcon, getSortedOrders } = useOrderSorting()

  // Export
  const { exportToXlsx } = useOrderExport()

  // Pagination
  const { pageSize, setPage, setPageSize, getPaginatedData } = useOrderPagination()

  // Order details state
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Refs for scrolling
  const detailsRef = useRef<HTMLDivElement>(null)
  const orderRowRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  // Get processed data
  const filteredData = getFilteredOrders(data)
  const sortedData = getSortedOrders(filteredData)
  const { pageData, totalItems, totalPages, safePage, startIndex, endIndex } =
    getPaginatedData(sortedData)

  // Helper functions
  const findOrder = (id: string) => data.find((o) => o.id === id)

  const scrollToDetails = useCallback(() => {
    if (!detailsRef.current) return
    const rect = detailsRef.current.getBoundingClientRect()
    const absoluteY = window.scrollY + rect.top
    const offset = 80 // keep title visible
    window.scrollTo({ top: Math.max(absoluteY - offset, 0), behavior: 'smooth' })
  }, [])

  const handleSelectOrder = (id: string, orderName: string) => {
    setSelectedId(id)
    // Store the current scroll position
    sessionStorage.setItem('scrollPosition', window.scrollY.toString())
    // Store the order name for scrolling back
    sessionStorage.setItem('lastSelectedOrder', orderName)
  }
  const handleCloseDetails = () => {
    // Get the last selected order name before resetting
    const lastOrderName = sessionStorage.getItem('lastSelectedOrder')
    const scrollPosition = sessionStorage.getItem('scrollPosition')
    // Reset the selected ID
    setSelectedId(null)

    // Scroll back to the order row after a short delay
    setTimeout(() => {
      if (lastOrderName && orderRowRefs.current[lastOrderName]) {
        orderRowRefs.current[lastOrderName]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      } else if (scrollPosition) {
        // Fallback to saved scroll position
        window.scrollTo({ top: parseInt(scrollPosition, 10), behavior: 'smooth' })
      }

      // Clear stored values
      sessionStorage.removeItem('scrollPosition')
      sessionStorage.removeItem('lastSelectedOrder')
    }, 100)
  }

  // Effects
  // 1) เมื่อออกจากระบบ ให้ล้างข้อมูลออเดอร์และรีเซ็ตเพจ เพื่อให้หลังล็อกอินดึงข้อมูลใหม่
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedId(null)
      setData([])
      setPage(() => 1)
    }
  }, [isAuthenticated, setData, setPage])

  useEffect(() => {
    if (selectedId) {
      // wait for DOM to paint, then scroll
      requestAnimationFrame(() => {
        scrollToDetails()
      })
      // fallback in case content expands after images/fonts load
      const t = setTimeout(scrollToDetails, 250)
      return () => clearTimeout(t)
    }
  }, [selectedId, scrollToDetails])

  // Auto-fetch on first load when already authenticated
  useEffect(() => {
    if (isAuthenticated && !showAuthPopup && !loading && data.length === 0) {
      fetchOrders(null)
    }
  }, [isAuthenticated, showAuthPopup, loading, data.length, fetchOrders])

  // Auto-fetch subsequent pages while there are more pages
  useEffect(() => {
    if (!isAuthenticated || showAuthPopup) return
    if (loading) return
    if (pageInfo?.hasNextPage) {
      // Keep fetching next pages until exhausted
      fetchOrders(pageInfo.endCursor)
    }
  }, [
    isAuthenticated,
    showAuthPopup,
    pageInfo?.hasNextPage,
    loading,
    pageInfo?.endCursor,
    fetchOrders,
  ])

  // Show authentication popup if not authenticated
  if (!isAuthenticated || showAuthPopup) {
    return (
      <AuthPopup
        authCode={authCode}
        setAuthCode={setAuthCode}
        handleAuth={handleAuth}
        authError={authError}
        authAttempts={authAttempts}
      />
    )
  }

  return (
    <div className={'min-h-screen bg-white p-4 sm:p-6 lg:p-8'}>
      {/* Main Loading Overlay */}
      {loading && data.length === 0 && (
        <OrbitalLoader
          size="xl"
          text="กำลังดึงข้อมูลคำสั่งซื้อ..."
          showText={true}
          overlay={true}
          variant="twoArcs"
        />
      )}

      <div className="max-w-[1920px] mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">
                  รายงานคำสั่งซื้อ LCDTV Thailand
                </h1>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  เข้าสู่ระบบแล้ว
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => exportToXlsx(filteredData)}
                  disabled={loading || data.length === 0}
                  className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 disabled:from-red-300 disabled:to-red-300 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2 text-sm"
                  title={data.length === 0 ? 'ยังไม่มีข้อมูลให้ส่งออก' : 'ส่งออกข้อมูลเป็น Excel'}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">ส่งออก XLSX</span>
                  <span className="sm:hidden">ส่งออก</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pagination Controls */}
          <PaginationControls
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
            pageSize={pageSize}
            setPageSize={setPageSize}
            safePage={safePage}
            totalPages={totalPages}
            setPage={setPage}
            variant="top"
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            yearFilter={yearFilter}
            setYearFilter={setYearFilter}
            thaiMonths={thaiMonths}
            years={years}
            dateQuickFilter={dateQuickFilter}
            setDateQuickFilter={setDateQuickFilter}
            fulfillmentFilter={fulfillmentFilter}
            setFulfillmentFilter={setFulfillmentFilter}
            fromDate={fromDate}
            toDate={toDate}
            setDateRange={(from, to) => {
              setFromDate(from)
              setToDate(to)
              // Reset to first page when range changes for better UX
              setPage(() => 1)
            }}
          />

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-700">Error: {error}</p>
              </div>
            </div>
          )}

          {/* Orders Display */}
          {pageData.length > 0 ? (
            <div className="space-y-8">
              {/* Desktop Table View */}
              <OrderTableDesktop
                pageData={pageData}
                selectedId={selectedId}
                orderRowRefs={orderRowRefs}
                handleSelectOrder={handleSelectOrder}
                handleSort={handleSort}
                getSortIcon={getSortIcon}
              />

              {/* Card View for smaller screens */}
              <OrderCardView
                pageData={pageData}
                selectedId={selectedId}
                orderRowRefs={orderRowRefs}
                handleSelectOrder={handleSelectOrder}
              />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-12 border border-red-200 shadow-lg">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-red-800 mb-2">ยังไม่มีข้อมูลคำสั่งซื้อ</h3>
                    <p className="text-red-600 mb-6 max-w-md">
                      ระบบจะดึงข้อมูลคำสั่งซื้อโดยอัตโนมัติเมื่อเข้าสู่ระบบ หรือคุณสามารถดึงข้อมูลด้วยตนเองได้
                    </p>
                    <button
                      type="button"
                      onClick={() => fetchOrders(null)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      ดึงข้อมูลคำสั่งซื้อ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Pagination */}
          {pageData.length > 0 && (
            <PaginationControls
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              pageSize={pageSize}
              setPageSize={setPageSize}
              safePage={safePage}
              totalPages={totalPages}
              setPage={setPage}
              variant="bottom"
            />
          )}

          {/* Order Details Modal */}
          {selectedId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              {/* Backdrop with dark background + blur to match original */}
              <button
                type="button"
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                aria-label="Close details overlay"
                onClick={() => handleCloseDetails()}
              />
              {/* Modal content */}
              <div
                ref={detailsRef}
                className="relative z-10 w-full max-w-6xl max-h-[85vh] overflow-y-auto bg-white border border-red-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl overscroll-contain"
                style={{
                  // Prevent scroll chaining
                  overscrollBehavior: 'contain',
                  // Smooth scrolling
                  scrollBehavior: 'smooth',
                  // Prevent content shift when scrollbar appears/disappears
                  scrollbarGutter: 'stable both-edges',
                }}
              >
                {/* Top-right close button */}
                <button
                  type="button"
                  aria-label="Close"
                  className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white/80 hover:bg-gray-100 border border-gray-200 text-gray-600 shadow-sm"
                  onClick={(e) => {
                    e.preventDefault()
                    handleCloseDetails()
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-red-800">รายละเอียดคำสั่งซื้อ</h3>
                    <p className="text-sm sm:text-base text-red-600/70 font-medium">
                      {(() => {
                        const order = findOrder(selectedId)
                        return order?.name || 'N/A'
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3"></div>
                </div>
                {(() => {
                  const order = findOrder(selectedId)
                  if (!order) return <p>Order not found</p>
                  return <OrderDetailsComplete order={order} showRaw={false} />
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
