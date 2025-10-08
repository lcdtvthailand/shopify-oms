'use client'

import { useAuth } from '@/app/contexts/AuthContext'

export default function TopMenu() {
  const { isAuthenticated, handleLogout } = useAuth()

  return (
    <nav className="w-full bg-red-600 text-white shadow z-40 sticky top-0 left-0 border-b border-red-700/60">
      <div className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        {/* Red bar with logout button if authenticated */}
        <div className="py-3 lg:py-2 min-h-[44px] lg:min-h-[40px] flex items-center justify-between">
          {/* Left side - empty for consistency with export button layout */}
          <div className="flex-1"></div>
          {/* Right side - logout button */}
          <div className="flex items-center pr-6 lg:pr-8">
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2 text-sm"
                title="ออกจากระบบ"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">ออกจากระบบ</span>
                <span className="sm:hidden">ออก</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </nav>
  )
}
