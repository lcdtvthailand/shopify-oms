'use client'

import { useEffect, useState } from 'react'

interface UseOrderAuthenticationReturn {
  isAuthenticated: boolean
  showAuthPopup: boolean
  authCode: string
  authError: string
  authAttempts: number
  setAuthCode: (code: string) => void
  handleAuth: () => Promise<void>
  handleLogout: () => Promise<void>
}

export const useOrderAuthentication = (): UseOrderAuthenticationReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthPopup, setShowAuthPopup] = useState(true)
  const [authCode, setAuthCode] = useState('')
  const [authError, setAuthError] = useState('')
  const [authAttempts, setAuthAttempts] = useState(0)

  // Check for existing authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/order-report-auth', {
          method: 'GET',
          credentials: 'include', // Include cookies
        })

        if (response.ok) {
          const authData = (await response.json()) as { authenticated?: boolean }
          if (authData.authenticated) {
            setIsAuthenticated(true)
            setShowAuthPopup(false)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // If check fails, show popup
        setIsAuthenticated(false)
        setShowAuthPopup(true)
      }
    }

    checkAuth()
  }, [])

  // Handle authentication
  const handleAuth = async () => {
    if (!authCode.trim()) {
      setAuthError('กรุณาใส่รหัสเข้าใช้งาน')
      return
    }

    try {
      const response = await fetch('/api/order-report-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ code: authCode }),
      })

      const responseData = (await response.json()) as { success?: boolean; message?: string }

      if (response.ok && responseData.success) {
        // Authentication successful
        setIsAuthenticated(true)
        setShowAuthPopup(false)
        setAuthError('')
        setAuthCode('')
        setAuthAttempts(0)
      } else {
        // Authentication failed
        setAuthAttempts((prev) => prev + 1)
        setAuthError(responseData.message || 'รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง')
        setAuthCode('')

        // Lock after 3 failed attempts
        if (authAttempts >= 2) {
          setAuthError('คุณใส่รหัสผิดเกินกำหนด กรุณารอ 5 นาทีแล้วลองใหม่')
          setTimeout(
            () => {
              setAuthAttempts(0)
              setAuthError('')
            },
            5 * 60 * 1000
          ) // 5 minutes
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setAuthError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง')
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/order-report-auth', {
        method: 'DELETE',
        credentials: 'include', // Include cookies
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always reset state regardless of API call result
      setIsAuthenticated(false)
      setShowAuthPopup(true)
      setAuthCode('')
      setAuthError('')
      setAuthAttempts(0)
    }
  }

  return {
    isAuthenticated,
    showAuthPopup,
    authCode,
    authError,
    authAttempts,
    setAuthCode,
    handleAuth,
    handleLogout,
  }
}
