'use client'

import { createContext, type ReactNode, useContext } from 'react'
import { useOrderAuthentication } from '@/app/hooks/useOrderAuthentication'

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useOrderAuthentication()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
