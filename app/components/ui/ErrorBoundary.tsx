'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }

    // In production, you would send this to a monitoring service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <div className="mx-auto max-w-md px-4 py-8 text-center">
            <h1 className="mb-4 text-6xl font-bold text-red-600">เกิดข้อผิดพลาด</h1>
            <p className="mb-4 text-lg text-gray-600">ขออภัย เกิดข้อผิดพลาดในการแสดงผลหน้านี้</p>
            <p className="mb-8 text-sm text-gray-500">กรุณารีเฟรชหน้าเว็บ หรือลองใหม่อีกครั้ง</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-red-600 px-6 py-3 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              รีเฟรชหน้าเว็บ
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  รายละเอียดข้อผิดพลาด (Development Only)
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
