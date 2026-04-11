import crypto from 'node:crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { clientEnv, env } from '@/lib/env'

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
    const { searchParams } = urlObj
    const codeParam = searchParams.get('code') || ''
    let key = searchParams.get('key') || ''
    let oms = searchParams.get('oms') || ''
    let ts = searchParams.get('ts') || ''
    let token = (searchParams.get('token') || '').toLowerCase()
    const format = (searchParams.get('format') || '').toLowerCase()

    // Decode combined code (base64url(JSON.stringify({key, oms, ts, token})))
    if (codeParam && (!key || !oms || !ts || !token)) {
      try {
        const b64 = codeParam
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(Math.ceil(codeParam.length / 4) * 4, '=')
        const json = Buffer.from(b64, 'base64').toString('utf8')
        const obj = JSON.parse(json) as Partial<{
          key: string
          oms: string
          ts: string | number
          token: string
        }>
        key = String(obj.key || '')
        oms = String(obj.oms || '')
        ts = String(obj.ts ?? '')
        token = String(obj.token || '').toLowerCase()
      } catch {
        // fallthrough; handled by missing_params below
      }
    }

    if (!key || !oms || !ts || !token) {
      return NextResponse.json({ ok: false, reason: 'missing_params' }, { status: 400 })
    }

    // Decode components
    const keyDec = decodeURIComponent(key)
    const omsDec = decodeURIComponent(oms)
    const tsDec = decodeURIComponent(ts)
    const tokenDec = decodeURIComponent(token).toLowerCase()

    // Expect oms format: "#12345|email@example.com"
    const parts = omsDec.split('|')
    if (parts.length !== 2) {
      return NextResponse.json({ ok: false, reason: 'bad_oms' }, { status: 400 })
    }
    const orderName = parts[0]
    const email = (parts[1] || '').trim().toLowerCase()

    // Validate token using HMAC-SHA256 with constant-time comparison
    const secret = env.OMS_TOKEN_SECRET || keyDec
    const tokenSource = `${omsDec}|${tsDec}|${keyDec}`
    const expectedToken = hmacToken(tokenSource, secret)

    let valid = false
    try {
      valid = crypto.timingSafeEqual(
        Buffer.from(tokenDec, 'utf8'),
        Buffer.from(expectedToken, 'utf8')
      )
    } catch {
      valid = false
    }

    // Check link expiration
    if (valid) {
      const ttlHours = env.OMS_LINK_TTL_HOURS
      const tsSeconds = Number(tsDec)
      const nowSeconds = Math.floor(Date.now() / 1000)
      const ageSeconds = nowSeconds - tsSeconds
      if (!Number.isNaN(tsSeconds) && ageSeconds > ttlHours * 3600) {
        return NextResponse.json(
          { ok: false, valid: false, reason: 'link_expired' },
          { status: 410 }
        )
      }
    }

    const allowBypass =
      clientEnv.NEXT_PUBLIC_OMS_ALLOW_INVALID === 'true' || env.NODE_ENV !== 'production'
    if (!valid && allowBypass) {
      valid = true
    }

    const canonicalOrder = orderName.replace(/^#/, '')
    if (valid && format !== 'json') {
      const dest = new URL(
        codeParam
          ? `/?code=${encodeURIComponent(codeParam)}`
          : `/?key=${encodeURIComponent(keyDec)}&oms=${encodeURIComponent(`${orderName}|${email}`)}&ts=${encodeURIComponent(tsDec)}&token=${encodeURIComponent(tokenDec)}`,
        urlObj.origin
      )
      return NextResponse.redirect(dest, 302)
    }

    // Never expose debug data (digests, candidates) in responses
    return NextResponse.json({
      ok: true,
      valid,
      order: canonicalOrder,
      email,
      key: keyDec,
      ts: tsDec,
    })
  } catch (_e) {
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 })
  }
}
