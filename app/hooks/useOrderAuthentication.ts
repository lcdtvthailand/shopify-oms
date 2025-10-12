'use client'

import { useEffect, useState } from 'react'

interface UseOrderAuthenticationReturn {
  isAuthenticated: boolean
  showAuthPopup: boolean
  email: string
  password: string
  authError: string
  authAttempts: number
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  handleAuth: () => Promise<void>
  handleLogout: () => Promise<void>
}

export const useOrderAuthentication = (): UseOrderAuthenticationReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthPopup, setShowAuthPopup] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    // Reset previous errors
    setAuthError('')

    // Validate inputs
    if (!email.trim()) {
      setAuthError('กรุณากรอกอีเมล')
      return
    }
    if (!password) {
      setAuthError('กรุณากรอกรหัสผ่าน')
      return
    }

    try {
      const response = await fetch('/api/order-report-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const responseData = (await response.json()) as { success?: boolean; message?: string }

      if (response.ok && responseData.success) {
        // Authentication successful
        setIsAuthenticated(true)
        setShowAuthPopup(false)
        setEmail('')
        setPassword('')
        setAuthAttempts(0)
      } else {
        // Authentication failed
        const newAttempts = authAttempts + 1
        setAuthAttempts(newAttempts)
        setAuthError(responseData.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        setPassword('')

        // Lock after 3 failed attempts
        if (newAttempts >= 3) {
          setAuthError('คุณใส่ข้อมูลไม่ถูกต้องเกินกำหนด กรุณารอ 5 นาทีแล้วลองใหม่')
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
        credentials: 'include',
      })
      setIsAuthenticated(false)
      setShowAuthPopup(true)
      setEmail('')
      setPassword('')
      setAuthError('')
      setAuthAttempts(0)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always reset state regardless of API call result
      setIsAuthenticated(false)
      setShowAuthPopup(true)
      setAuthError('')
      setAuthAttempts(0)
    }
  }

  return {
    isAuthenticated,
    showAuthPopup,
    email,
    password,
    authError,
    authAttempts,
    setEmail,
    setPassword,
    handleAuth,
    handleLogout,
  }
}
