import { type NextRequest, NextResponse } from 'next/server'

interface UserCredentials {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown
      password?: unknown
    }

    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    // Get the credentials from environment variable (required)
    const credentialsJson = process.env.ORDER_REPORT_PASSWORD
    if (!credentialsJson) {
      return NextResponse.json(
        { success: false, message: 'Server not configured: ORDER_REPORT_PASSWORD is missing' },
        { status: 500 }
      )
    }

    // Parse the credentials
    let validCredentials: UserCredentials[] = []
    try {
      validCredentials = JSON.parse(credentialsJson) as UserCredentials[]
      if (!Array.isArray(validCredentials)) {
        throw new Error('Invalid credentials format')
      }
    } catch (error) {
      console.error('Failed to parse ORDER_REPORT_PASSWORD:', error)
      return NextResponse.json({ success: false, message: 'การตั้งค่าระบบไม่ถูกต้อง' }, { status: 500 })
    }

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' },
        { status: 400 }
      )
    }

    // Check if credentials match
    const isValid = validCredentials.some(
      (cred) => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
    )

    if (isValid) {
      const response = NextResponse.json(
        { success: true, message: 'เข้าสู่ระบบสำเร็จ' },
        { status: 200 }
      )

      // Set HttpOnly cookie that expires in 24 hours
      response.cookies.set('order-report-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: '/',
      })

      return response
    } else {
      return NextResponse.json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }
  } catch (error) {
    console.error('Auth error:', error)
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
      secure: process.env.NODE_ENV === 'production',
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
