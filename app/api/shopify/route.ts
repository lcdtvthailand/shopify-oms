import { type NextRequest, NextResponse } from 'next/server'
import { AppError, ErrorCodes, handleApiError, logger } from '@/lib/utils/errors'
import { env, graphqlQuerySchema } from '@/lib/utils/validation'

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': env.NEXT_PUBLIC_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Rate limiting map (simple in-memory implementation)
// In production, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 30 // 30 requests per minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(identifier)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return true
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return false
  }

  limit.count++
  return true
}

export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(request: NextRequest) {
  try {
    // Get client identifier for rate limiting
    const clientIp =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      throw new AppError(
        'Too many requests. Please try again later.',
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        429
      )
    }

    // Validate environment variables
    if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
      logger.error('Missing Shopify configuration', {
        hasStoreDomain: Boolean(env.SHOPIFY_STORE_DOMAIN),
        hasAccessToken: Boolean(env.SHOPIFY_ADMIN_ACCESS_TOKEN),
      })

      throw new AppError('Server configuration error', ErrorCodes.INTERNAL_SERVER_ERROR, 500)
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = graphqlQuerySchema.safeParse(body)

    if (!validationResult.success) {
      throw new AppError('Invalid request format', ErrorCodes.VALIDATION_ERROR, 400)
    }

    const { query, variables } = validationResult.data

    // Log the incoming request (without sensitive data)
    logger.info('Shopify API request', {
      clientIp,
      queryLength: query.length,
      hasVariables: Boolean(variables),
    })

    // Create Shopify GraphQL endpoint URL
    const shopifyUrl = `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-07/graphql.json`

    // Call Shopify Admin API
    const shopifyRequest = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!shopifyRequest.ok) {
      const errorText = await shopifyRequest.text()
      logger.error('Shopify API Error', {
        status: shopifyRequest.status,
        statusText: shopifyRequest.statusText,
        error: errorText,
      })

      throw new AppError(
        'Failed to communicate with Shopify',
        ErrorCodes.BAD_REQUEST,
        shopifyRequest.status
      )
    }

    const shopifyData = await shopifyRequest.json()

    // Check for GraphQL errors
    if (shopifyData.errors) {
      logger.warn('Shopify GraphQL Errors', {
        errors: shopifyData.errors,
      })

      return NextResponse.json(
        {
          error: 'GraphQL errors occurred',
          code: ErrorCodes.BAD_REQUEST,
          details: shopifyData.errors,
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      )
    }

    // Return successful response
    return NextResponse.json(shopifyData, {
      headers: corsHeaders,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// Only allow POST and OPTIONS methods
export function GET() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed. Use POST instead.',
      code: ErrorCodes.BAD_REQUEST,
    },
    { status: 405 }
  )
}
