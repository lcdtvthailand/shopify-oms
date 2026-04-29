import { env } from '@/lib/env'
import { logger } from '@/lib/utils/errors'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

/** Strip CRLF and other control characters to prevent email header injection */
function sanitizeHeaderValue(value: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional security sanitization of control chars
  return value.replace(/[\r\n\x00-\x1f]/g, '')
}

function sanitizeOptions(options: EmailOptions): EmailOptions {
  return {
    to: sanitizeHeaderValue(options.to),
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo ? sanitizeHeaderValue(options.replyTo) : undefined,
  }
}

// ─── Provider detection ──────────────────────────────────────────────

type EmailProvider = 'resend' | 'gmail' | 'none'

function detectProvider(): EmailProvider {
  // Resend takes priority (simpler setup, good for interim)
  if (env.RESEND_API_KEY) return 'resend'
  // Gmail as fallback
  if (env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN) return 'gmail'
  return 'none'
}

// ─── Resend provider ─────────────────────────────────────────────────

async function sendViaResend(options: EmailOptions): Promise<boolean> {
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) return false

  const senderEmail = sanitizeHeaderValue(
    env.RESEND_SENDER_EMAIL || env.GMAIL_SENDER_EMAIL || 'sales@lcdtvthailand.com'
  )
  const senderName = env.RESEND_SENDER_NAME || 'LCDTVTHAILAND SHOP'

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        ...(options.replyTo ? { reply_to: [options.replyTo] } : {}),
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Resend send failed', { status: response.status, error })
      return false
    }

    logger.info('Email sent via Resend', { to: options.to, subject: options.subject })
    return true
  } catch (error) {
    logger.error('Resend sending error', error)
    return false
  }
}

// ─── Gmail provider ──────────────────────────────────────────────────

interface GmailTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getGmailAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const clientId = env.GMAIL_CLIENT_ID
  const clientSecret = env.GMAIL_CLIENT_SECRET
  const refreshToken = env.GMAIL_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Gmail OAuth2 credentials')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    logger.error('Gmail token refresh failed', { status: response.status, error })
    throw new Error(`Failed to refresh Gmail token: ${response.status}`)
  }

  const data = (await response.json()) as GmailTokenResponse

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return data.access_token
}

function buildRawGmailEmail(options: EmailOptions): string {
  const senderEmail = sanitizeHeaderValue(env.GMAIL_SENDER_EMAIL || 'sales@lcdtvthailand.com')
  const senderName = 'LCDTVTHAILAND SHOP'

  const boundary = `boundary_${Date.now()}_${crypto.randomUUID()}`

  const headers = [
    `From: =?UTF-8?B?${btoa(unescape(encodeURIComponent(senderName)))}?= <${senderEmail}>`,
    `To: ${options.to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`,
    ...(options.replyTo ? [`Reply-To: ${options.replyTo}`] : []),
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
  ].join('\r\n')

  const body = [
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(options.html))),
    `--${boundary}--`,
  ].join('\r\n')

  const raw = `${headers}\r\n${body}`

  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function sendViaGmail(options: EmailOptions): Promise<boolean> {
  try {
    const accessToken = await getGmailAccessToken()
    const senderEmail = env.GMAIL_SENDER_EMAIL || 'sales@lcdtvthailand.com'
    const raw = buildRawGmailEmail(options)

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(senderEmail)}/messages/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      logger.error('Gmail send failed', { status: response.status, error })
      return false
    }

    logger.info('Email sent via Gmail', { to: options.to, subject: options.subject })
    return true
  } catch (error) {
    logger.error('Gmail sending error', error)
    return false
  }
}

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Send an email using the configured provider (Resend or Gmail).
 * Automatically detects which provider to use based on env vars.
 * Priority: RESEND_API_KEY > GMAIL_CLIENT_ID
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const safe = sanitizeOptions(options)
  const provider = detectProvider()

  switch (provider) {
    case 'resend':
      return await sendViaResend(safe)
    case 'gmail':
      return await sendViaGmail(safe)
    default:
      logger.warn('No email provider configured (set RESEND_API_KEY or GMAIL_* env vars)')
      return false
  }
}

/**
 * Send emails to both customer and admin.
 */
export async function sendTaxInvoiceEmails(params: {
  customerEmail: string
  customerHtml: string
  customerSubject: string
  adminHtml: string
  adminSubject: string
}): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const testOverride = env.TEST_EMAIL_OVERRIDE
  const customerTo = testOverride || params.customerEmail
  const adminEmail =
    testOverride || env.RESEND_ADMIN_EMAIL || env.GMAIL_ADMIN_EMAIL || 'sales@lcdtvthailand.com'

  const [customerSent, adminSent] = await Promise.all([
    sendEmail({
      to: customerTo,
      subject: params.customerSubject,
      html: params.customerHtml,
    }),
    sendEmail({
      to: adminEmail,
      subject: params.adminSubject,
      html: params.adminHtml,
      replyTo: params.customerEmail,
    }),
  ])

  return { customerSent, adminSent }
}

/**
 * Get the currently active email provider name (for diagnostics).
 */
export function getEmailProvider(): EmailProvider {
  return detectProvider()
}
