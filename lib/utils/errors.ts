import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export const handleApiError = (error: unknown): NextResponse => {
  console.error('[API Error]:', error)

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: ErrorCodes.INTERNAL_SERVER_ERROR,
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      error: 'Unknown error occurred',
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
    },
    { status: 500 }
  )
}

export const logger = {
  error: (message: string, error?: unknown, metadata?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()
    console.error(`[ERROR] ${timestamp} - ${message}`, {
      error,
      metadata,
      stack: error instanceof Error ? error.stack : undefined,
    })
  },

  info: (message: string, metadata?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()
    // Using console.info is allowed in Next.js
    // eslint-disable-next-line no-console
    console.info(`[INFO] ${timestamp} - ${message}`, metadata)
  },

  warn: (message: string, metadata?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString()
    console.warn(`[WARN] ${timestamp} - ${message}`, metadata)
  },
}
