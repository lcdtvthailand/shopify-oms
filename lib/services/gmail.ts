import { logger } from '@/lib/utils/errors'

interface GmailTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get a fresh Gmail access token using the refresh token.
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN

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

/**
 * Build a RFC 2822 MIME message and Base64url-encode it for the Gmail API.
 */
/** Strip CRLF and other control characters to prevent email header injection */
function sanitizeHeaderValue(value: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional security sanitization of control chars
  return value.replace(/[\r\n\x00-\x1f]/g, '')
}

function buildRawEmail(options: EmailOptions): string {
  const senderEmail = sanitizeHeaderValue(
    process.env.GMAIL_SENDER_EMAIL || 'sales@lcdtvthailand.com'
  )
  const senderName = 'LCDTVTHAILAND SHOP'

  const boundary = `boundary_${Date.now()}_${crypto.randomUUID()}`

  const sanitizedTo = sanitizeHeaderValue(options.to)
  const sanitizedReplyTo = options.replyTo ? sanitizeHeaderValue(options.replyTo) : undefined

  const headers = [
    `From: =?UTF-8?B?${btoa(unescape(encodeURIComponent(senderName)))}?= <${senderEmail}>`,
    `To: ${sanitizedTo}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`,
    ...(sanitizedReplyTo ? [`Reply-To: ${sanitizedReplyTo}`] : []),
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

  // Base64url encode
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Send an email via Gmail API.
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const accessToken = await getAccessToken()
    const senderEmail = process.env.GMAIL_SENDER_EMAIL || 'sales@lcdtvthailand.com'
    const raw = buildRawEmail(options)

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

    logger.info('Email sent successfully', { to: options.to, subject: options.subject })
    return true
  } catch (error) {
    logger.error('Email sending error', error)
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
  const adminEmail = process.env.GMAIL_ADMIN_EMAIL || 'sales@lcdtvthailand.com'

  const [customerSent, adminSent] = await Promise.all([
    sendEmail({
      to: params.customerEmail,
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
