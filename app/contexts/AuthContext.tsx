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

const defaultAuth: AuthContextType = {
  isAuthenticated: false,
  showAuthPopup: false,
  email: '',
  password: '',
  authError: '',
  authAttempts: 0,
  setEmail: () => {},
  setPassword: () => {},
  handleAuth: async () => {},
  handleLogout: async () => {},
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  return context ?? defaultAuth
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useOrderAuthentication()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
