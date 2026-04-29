import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

/**
 * Generates a signed token for viewing a tax invoice.
 * Reuses the same HMAC pattern as build-oms/resolve-oms.
 *
 * GET /api/invoice-token?order=12345&email=foo@bar.com
 * Returns: { token: "base64url-encoded-payload" }
 */

function hmacToken(input: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(input, 'utf8').digest('hex')
}

export function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams
    const order = (sp.get('order') || '').trim()
    const email = (sp.get('email') || '').trim().toLowerCase()

    if (!order || !email) {
      return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 })
    }

    const key = env.SHOPIFY_STORE_DOMAIN
    const secret = env.OMS_TOKEN_SECRET || key
    const ts = Math.floor(Date.now() / 1000)
    const payload = `invoice|${order}|${email}|${ts}|${key}`
    const token = hmacToken(payload, secret)

    const code = Buffer.from(JSON.stringify({ order, email, ts, token }), 'utf8')
      .toString('base64')
      .replace(/=+$/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    return NextResponse.json({ ok: true, token: code })
  } catch {
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 })
  }
}
