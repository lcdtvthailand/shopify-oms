'use client'

interface AuthPopupProps {
  authCode: string
  setAuthCode: (code: string) => void
  handleAuth: () => void
  authError: string
  authAttempts: number
}

export const AuthPopup: React.FC<AuthPopupProps> = ({
  authCode,
  setAuthCode,
  handleAuth,
  authError,
  authAttempts,
}) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-gradient-to-b from-red-50/70 to-white/90 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl border border-red-200 p-8 max-w-md w-full mx-4">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">เข้าสู่ระบบรายงาน</h2>
        <p className="text-gray-600">กรุณาใส่รหัสเพื่อเข้าถึงหน้ารายงานคำสั่งซื้อ</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รหัสเข้าใช้งาน</label>
          <input
            type="password"
            value={authCode}
            onChange={(e) => setAuthCode(e.target.value)}
            onKeyPress={(e) =>
              e.key === 'Enter' && authAttempts < 3 && authCode.trim() && handleAuth()
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
            placeholder="ใส่รหัสที่นี่"
            disabled={authAttempts >= 3}
          />
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
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
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleAuth}
          disabled={!authCode.trim() || authAttempts >= 3}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
        >
          {authAttempts >= 3 ? 'ถูกล็อค กรุณารอ...' : 'เข้าสู่ระบบ'}
        </button>

        <div className="text-right text-xs text-gray-500 mt-4">ความพยายาม: {authAttempts}/3</div>
      </div>
    </div>
  </div>
)
