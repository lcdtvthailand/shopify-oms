'use client'

import Link from 'next/link'
import { useState } from 'react'

// Responsive top red menu bar optimized for mobile and tablet
export default function TopMenu() {
  const [brandOpen, setBrandOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const itemCls =
    'px-3 py-2 rounded-md transition-colors whitespace-nowrap border-b-2 border-transparent hover:bg-red-700/70 active:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70'

  const mobileItemCls =
    'block px-4 py-3 text-white hover:bg-red-700/70 active:bg-red-700 transition-colors border-b border-red-700/30'

  return (
    <nav className="w-full bg-red-600 text-white shadow z-40 sticky top-0 left-0 border-b border-red-700/60">
      <div className="mx-auto max-w-screen-xl px-2 sm:px-4 md:px-6">
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center justify-start pl-6 gap-2 py-2 overflow-visible text-[15px] font-medium tracking-wide">
          {/* Hamburger / All products */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md px-3 py-2 hover:bg-red-700/70 active:bg-red-700 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="เมนูทั้งหมด"
            title="เมนูทั้งหมด"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12zm.75 4.5a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold text-sm">สินค้าทั้งหมด</span>
          </button>

          {/* Desktop menu items */}
          <Link href="https://lcdtvthailand.myshopify.com/" className={itemCls}>
            หน้าแรก
          </Link>

          {/* Brands dropdown */}
          <div className="relative">
            <Link
              href="https://lcdtvthailand.myshopify.com/collections/all-products"
              className={itemCls}
            >
              แบรนด์สินค้า
            </Link>
            <button
              type="button"
              onClick={() => setBrandOpen((s) => !s)}
              className="ml-1 px-2 py-2 rounded-md hover:bg-red-700/70 active:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 align-middle"
              aria-expanded={brandOpen}
              aria-haspopup="menu"
              aria-label="เปิดเมนูแบรนด์"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 opacity-90"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {brandOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-1 w-60 rounded-lg bg-white text-gray-800 shadow-xl ring-1 ring-black/5 overflow-hidden z-50"
              >
                <div className="py-1 text-sm">
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-50">
                    Samsung
                  </Link>
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-50">
                    LG
                  </Link>
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-50">
                    Sony
                  </Link>
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-50">
                    TCL
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="https://lcdtvthailand.myshopify.com/collections/promotion"
            className={itemCls}
          >
            สินค้าโปรโมชั่น
          </Link>
          <Link
            href="https://lcdtvthailand.myshopify.com/blogs/%E0%B8%82%E0%B9%88%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%94%E0%B9%88%E0%B8%99"
            className={itemCls}
          >
            ข่าว
          </Link>
          <Link href="https://lcdtvthailand.myshopify.com/blogs/news" className={itemCls}>
            รีวิว
          </Link>
          <Link
            href="https://lcdtvthailand.myshopify.com/blogs/blog"
            className={`hidden lg:block ${itemCls}`}
          >
            บทความ
          </Link>
          <Link
            href="https://lcdtvthailand.myshopify.com/blogs/award"
            className={`hidden xl:block ${itemCls}`}
          >
            ตัดสินรางวัล
          </Link>
          <Link
            href="https://lcdtvthailand.myshopify.com/blogs/information-page/about-us"
            className={`hidden xl:block ${itemCls}`}
          >
            เกี่ยวกับเรา
          </Link>
          <Link
            href="https://lcdtvthailand.myshopify.com/pages/contact-us"
            className={`hidden xl:block ${itemCls}`}
          >
            ติดต่อเรา
          </Link>
        </div>

        {/* Mobile and Tablet Menu */}
        <div className="lg:hidden">
          {/* Mobile/Tablet header */}
          <div className="flex items-center justify-between py-3 px-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-red-700/70 active:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="เมนูทั้งหมด"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12zm.75 4.5a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-sm">เมนูทั้งหมด</span>
            </button>

            {/* Quick access buttons for mobile/tablet */}
            <div className="flex items-center gap-1">
              <Link
                href="https://lcdtvthailand.myshopify.com/"
                className="px-2 py-2 rounded-md hover:bg-red-700/70 transition-colors text-sm"
              >
                หน้าแรก
              </Link>
            </div>
          </div>

          {/* All menu items dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-red-700/30 bg-red-600">
              <div className="py-2">
                <Link
                  href="https://lcdtvthailand.myshopify.com/collections/all-products"
                  className={mobileItemCls}
                >
                  สินค้าทั้งหมด
                </Link>
                <Link
                  href="https://lcdtvthailand.myshopify.com/collections/promotion"
                  className={mobileItemCls}
                >
                  สินค้าโปรโมชั่น
                </Link>
                <button
                  type="button"
                  onClick={() => setBrandOpen(!brandOpen)}
                  className="w-full text-left px-4 py-3 text-white hover:bg-red-700/70 active:bg-red-700 transition-colors border-b border-red-700/30 flex items-center justify-between"
                >
                  แบรนด์สินค้า
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 transition-transform ${brandOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {brandOpen && (
                  <div className="bg-red-700/30">
                    <Link
                      href="https://lcdtvthailand.myshopify.com/collections/all-products"
                      className="block px-8 py-2 text-white hover:bg-red-700/50 transition-colors text-sm"
                    >
                      ดูทั้งหมด
                    </Link>
                    <Link
                      href="#"
                      className="block px-8 py-2 text-white hover:bg-red-700/50 transition-colors text-sm"
                    >
                      Samsung
                    </Link>
                    <Link
                      href="#"
                      className="block px-8 py-2 text-white hover:bg-red-700/50 transition-colors text-sm"
                    >
                      LG
                    </Link>
                    <Link
                      href="#"
                      className="block px-8 py-2 text-white hover:bg-red-700/50 transition-colors text-sm"
                    >
                      Sony
                    </Link>
                    <Link
                      href="#"
                      className="block px-8 py-2 text-white hover:bg-red-700/50 transition-colors text-sm"
                    >
                      TCL
                    </Link>
                  </div>
                )}
                <Link
                  href="https://lcdtvthailand.myshopify.com/blogs/%E0%B8%82%E0%B9%88%E0%B8%B2%E0%B8%A7%E0%B9%80%E0%B8%94%E0%B9%88%E0%B8%99"
                  className={mobileItemCls}
                >
                  ข่าว
                </Link>
                <Link
                  href="https://lcdtvthailand.myshopify.com/blogs/news"
                  className={mobileItemCls}
                >
                  รีวิว
                </Link>
                <Link
                  href="https://lcdtvthailand.myshopify.com/blogs/blog"
                  className={mobileItemCls}
                >
                  บทความ
                </Link>
                <Link
                  href="https://lcdtvthailand.myshopify.com/blogs/award"
                  className={mobileItemCls}
                >
                  ตัดสินรางวัล
                </Link>
                <Link
                  href="https://lcdtvthailand.myshopify.com/blogs/information-page/about-us"
                  className={mobileItemCls}
                >
                  เกี่ยวกับเรา
                </Link>
                <Link
                  href="https://lcdtvthailand.myshopify.com/pages/contact-us"
                  className="block px-4 py-3 text-white hover:bg-red-700/70 active:bg-red-700 transition-colors"
                >
                  ติดต่อเรา
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </nav>
  )
}
