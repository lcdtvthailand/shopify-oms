import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Clone the request headers
  const headers = new Headers(request.headers)

  // Add security headers
  headers.set('X-DNS-Prefetch-Control', 'on')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('X-Frame-Options', 'SAMEORIGIN')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  // CSP header - removed unsafe-eval, kept unsafe-inline for Next.js/Tailwind compatibility
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ')

  headers.set('Content-Security-Policy', cspHeader)

  return NextResponse.next({
    request: {
      headers,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
