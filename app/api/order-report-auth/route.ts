import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

interface UserCredentials {
  email: string
  password: string
}

// Server-side rate limiting for auth attempts
const authRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const AUTH_RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes
const AUTH_RATE_LIMIT_MAX = 5 // 5 attempts per 5 minutes

function checkAuthRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = authRateLimitMap.get(identifier)
  if (!limit || now > limit.resetTime) {
    authRateLimitMap.set(identifier, { count: 1, resetTime: now + AUTH_RATE_LIMIT_WINDOW })
    return true
  }
  if (limit.count >= AUTH_RATE_LIMIT_MAX) return false
  limit.count++
  return true
}

/** Constant-time string comparison to prevent timing attacks */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to avoid timing leak on length difference
    crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(a, 'utf8'))
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
}

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (!checkAuthRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, message: 'คุณใส่ข้อมูลไม่ถูกต้องเกินกำหนด กรุณารอ 5 นาทีแล้วลองใหม่' },
        { status: 429 }
      )
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown
      password?: unknown
    }

    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    // Get the credentials from environment variable (required)
    const credentialsJson = env.ORDER_REPORT_PASSWORD
    if (!credentialsJson) {
      return NextResponse.json({ success: false, message: 'การตั้งค่าระบบไม่ถูกต้อง' }, { status: 500 })
    }

    // Parse the credentials
    let validCredentials: UserCredentials[] = []
    try {
      validCredentials = JSON.parse(credentialsJson) as UserCredentials[]
      if (!Array.isArray(validCredentials)) {
        throw new Error('Invalid credentials format')
      }
    } catch {
      return NextResponse.json({ success: false, message: 'การตั้งค่าระบบไม่ถูกต้อง' }, { status: 500 })
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      )
    }

    // Check credentials using constant-time comparison to prevent timing attacks
    const isValid = validCredentials.some(
      (cred) =>
        safeCompare(cred.email.toLowerCase(), email.toLowerCase()) &&
        safeCompare(cred.password, password)
    )

    if (isValid) {
      const response = NextResponse.json(
        { success: true, message: 'เข้าสู่ระบบสำเร็จ' },
        { status: 200 }
      )

      // Set HttpOnly cookie that expires in 24 hours
      response.cookies.set('order-report-auth', 'authenticated', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/',
      })

      return response
    } else {
      return NextResponse.json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }
  } catch (error) {
    console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในระบบ' }, { status: 500 })
  }
}

export function GET(request: NextRequest) {
  try {
    // Check if user is authenticated via cookie
    const authCookie = request.cookies.get('order-report-auth')

    if (authCookie && authCookie.value === 'authenticated') {
      return NextResponse.json({ success: true, authenticated: true }, { status: 200 })
    } else {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ success: false, authenticated: false }, { status: 500 })
  }
}

export function DELETE() {
  try {
    // Logout - clear the cookie
    const response = NextResponse.json(
      { success: true, message: 'ออกจากระบบสำเร็จ' },
      { status: 200 }
    )

    // Clear the auth cookie
    response.cookies.set('order-report-auth', '', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการออกจากระบบ' },
      { status: 500 }
    )
  }
}
