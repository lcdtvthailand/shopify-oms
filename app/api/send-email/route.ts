import { type NextRequest, NextResponse } from 'next/server'
import { getEmailProvider, sendTaxInvoiceEmails } from '@/lib/services/email'
import {
  buildAdminEmail,
  buildCustomerEmail,
  type TaxInvoiceEmailData,
} from '@/lib/services/email-templates'
import { AppError, ErrorCodes, handleApiError, logger } from '@/lib/utils/errors'

// Rate limiting for email sending
const emailRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const EMAIL_RATE_LIMIT_WINDOW = 60 * 1000
const EMAIL_RATE_LIMIT_MAX = 5

function checkEmailRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = emailRateLimitMap.get(identifier)
  if (!limit || now > limit.resetTime) {
    emailRateLimitMap.set(identifier, { count: 1, resetTime: now + EMAIL_RATE_LIMIT_WINDOW })
    return true
  }
  if (limit.count >= EMAIL_RATE_LIMIT_MAX) return false
  limit.count++
  return true
}

export function OPTIONS() {
  return new Response(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkEmailRateLimit(clientIp)) {
      throw new AppError(
        'Too many requests. Please try again later.',
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        429
      )
    }

    const body = (await request.json()) as TaxInvoiceEmailData

    // Basic validation
    if (!body.orderName || !body.customerEmail || !body.taxId) {
      throw new AppError('Missing required email data', ErrorCodes.VALIDATION_ERROR, 400)
    }

    // Check if any email provider is configured
    const provider = getEmailProvider()
    if (provider === 'none') {
      logger.warn('No email provider configured, skipping email send')
      return NextResponse.json({
        success: false,
        message: 'Email service not configured',
        customerSent: false,
        adminSent: false,
      })
    }

    logger.info('Sending tax invoice emails', {
      orderName: body.orderName,
      customerEmail: body.customerEmail,
    })

    const customerEmail = buildCustomerEmail(body)
    const adminEmail = buildAdminEmail(body)

    const result = await sendTaxInvoiceEmails({
      customerEmail: body.customerEmail,
      customerSubject: customerEmail.subject,
      customerHtml: customerEmail.html,
      adminSubject: adminEmail.subject,
      adminHtml: adminEmail.html,
    })

    logger.info('Email send results', {
      orderName: body.orderName,
      customerSent: result.customerSent,
      adminSent: result.adminSent,
    })

    return NextResponse.json({
      success: result.customerSent || result.adminSent,
      customerSent: result.customerSent,
      adminSent: result.adminSent,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
