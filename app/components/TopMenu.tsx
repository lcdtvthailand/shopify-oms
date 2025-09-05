"use client";

import Link from "next/link";
import { useState } from "react";

// Simple top red menu bar inspired by the provided image
export default function TopMenu() {
  const [brandOpen, setBrandOpen] = useState(false);
  const itemCls =
    "px-3 py-2 rounded-md transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

  return (
    <nav className="w-full bg-red-600 text-white shadow z-40 sticky top-0 left-0 border-b border-red-700/60">
      <div className="mx-auto max-w-screen-xl px-2 sm:px-4">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 py-2 overflow-visible text-[13px] sm:text-sm md:text-[15px] font-medium tracking-wide">
          {/* Hamburger / All products */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-red-700/70 active:bg-red-700 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
            <span className="font-semibold">สินค้าทั้งหมด</span>
          </button>

          {/* Top level items */}
          <Link href="/" className={itemCls}>
            หน้าแรก
          </Link>

          {/* Brands dropdown */}
          <div className="relative" onMouseLeave={() => setBrandOpen(false)}>
            <button
              type="button"
              onClick={() => setBrandOpen((s) => !s)}
              className={`flex items-center gap-1 ${itemCls}`}
              aria-expanded={brandOpen}
              aria-haspopup="menu"
            >
              แบรนด์สินค้า
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="ml-1 w-4 h-4 opacity-90"
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
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-50">Samsung</Link>
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-50">LG</Link>
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-50">Sony</Link>
                  <Link href="#" className="block px-4 py-2 hover:bg-gray-50">TCL</Link>
                </div>
              </div>
            )}
          </div>

          <Link href="#" className={itemCls}>
            สินค้าโปรโมชั่น
          </Link>
          <Link href="#" className={itemCls}>
            ข่าว
          </Link>
          <Link href="#" className={itemCls}>
            รีวิว
          </Link>
          <Link href="#" className={itemCls}>
            บทความ
          </Link>
          <Link href="#" className={itemCls}>
            ดีลพิเศษ
          </Link>
          <Link href="#" className={itemCls}>
            เกี่ยวกับเรา
          </Link>
          <Link href="#" className={itemCls}>
            ติดต่อเรา
          </Link>
        </div>
      </div>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </nav>
  );
}
