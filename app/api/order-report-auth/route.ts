import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { code?: unknown }
    const code = typeof body.code === 'string' ? body.code : undefined

    // Get the password from environment variable (required)
    const validPassword = process.env.ORDER_REPORT_PASSWORD
    if (!validPassword) {
      return NextResponse.json(
        { success: false, message: 'Server not configured: ORDER_REPORT_PASSWORD is missing' },
        { status: 500 }
      )
    }

    // Validate the code
    if (!code) {
      return NextResponse.json({ success: false, message: 'รหัสไม่ถูกต้อง' }, { status: 400 })
    }

    // Check if code matches (case insensitive)
    if (code.toUpperCase() === validPassword.toUpperCase()) {
      // Create response with success
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
      return NextResponse.json(
        { success: false, message: 'รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' },
        { status: 401 }
      )
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
