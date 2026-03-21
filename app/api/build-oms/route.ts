import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'

function hmacToken(input: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(input, 'utf8').digest('hex')
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 20

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(identifier)
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (limit.count >= RATE_LIMIT_MAX) return false
  limit.count++
  return true
}

export function GET(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 })
    }

    const urlObj = new URL(req.url)
    const sp = urlObj.searchParams
    const order = (sp.get('order') || '').trim()
    const email = (sp.get('email') || '').trim().toLowerCase()
    const key = (sp.get('key') || process.env.SHOPIFY_STORE_DOMAIN || '').trim()
    const tsParam = sp.get('ts')
    if (!order || !email || !key) {
      return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 })
    }

    const secret = process.env.OMS_TOKEN_SECRET || key
    const ts = tsParam ? parseInt(tsParam, 10) : Math.floor(Date.now() / 1000)
    const rawOms = `#${order}|${email}`
    const tokenSource = `${rawOms}|${ts}|${key}`
    const token = hmacToken(tokenSource, secret)

    const payload = { key, oms: rawOms, ts, token }
    const code = Buffer.from(JSON.stringify(payload), 'utf8')
      .toString('base64')
      .replace(/=+$/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    const url = new URL(`/?code=${encodeURIComponent(code)}`, urlObj.origin)

    // If accessed in browser, redirect to the new format unless format=json
    const format = (sp.get('format') || '').toLowerCase()
    if (format !== 'json') {
      return NextResponse.redirect(url, 302)
    }

    return NextResponse.json({ ok: true, key, oms: rawOms, ts, token, code, url: url.toString() })
  } catch (_e) {
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 })
  }
}
