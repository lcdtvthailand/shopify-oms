import { type NextRequest, NextResponse } from 'next/server'
import {
  buildAdminEmail,
  buildCustomerEmail,
  type TaxInvoiceEmailData,
} from '@/lib/services/email-templates'
import { sendTaxInvoiceEmails } from '@/lib/services/gmail'
import { AppError, ErrorCodes, handleApiError, logger } from '@/lib/utils/errors'

export function OPTIONS() {
  return new Response(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TaxInvoiceEmailData

    // Basic validation
    if (!body.orderName || !body.customerEmail || !body.taxId) {
      throw new AppError('Missing required email data', ErrorCodes.VALIDATION_ERROR, 400)
    }

    // Check Gmail credentials are configured
    if (
      !process.env.GMAIL_CLIENT_ID ||
      !process.env.GMAIL_CLIENT_SECRET ||
      !process.env.GMAIL_REFRESH_TOKEN
    ) {
      logger.warn('Gmail credentials not configured, skipping email send')
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
