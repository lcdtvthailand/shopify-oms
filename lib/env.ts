import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // Shopify (required)
    SHOPIFY_STORE_DOMAIN: z.string().min(1),
    SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().min(1),

    // OMS link security
    OMS_TOKEN_SECRET: z.string().optional(),
    OMS_LINK_TTL_HOURS: z.coerce.number().int().positive().default(72),

    // Order report auth
    ORDER_REPORT_PASSWORD: z.string().optional(),

    // Resend email provider (optional — auto-detected)
    RESEND_API_KEY: z.string().optional(),
    RESEND_SENDER_EMAIL: z.email().optional(),
    RESEND_SENDER_NAME: z.string().optional(),
    RESEND_ADMIN_EMAIL: z.email().optional(),

    // Gmail email provider (optional — only valid when all three creds are present)
    GMAIL_CLIENT_ID: z.string().optional(),
    GMAIL_CLIENT_SECRET: z.string().optional(),
    GMAIL_REFRESH_TOKEN: z.string().optional(),
    GMAIL_SENDER_EMAIL: z.email().optional(),
    GMAIL_ADMIN_EMAIL: z.email().optional(),

    // Dev/test overrides
    TEST_EMAIL_OVERRIDE: z.email().optional(),

    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  },

  client: {
    NEXT_PUBLIC_ALLOWED_ORIGINS: z.string().optional(),
    NEXT_PUBLIC_ADMIN_EMAIL: z.email().optional(),
    NEXT_PUBLIC_ADMIN_PHONE: z.string().optional(),
    NEXT_PUBLIC_ADMIN_LINE_ID: z.string().optional(),
    NEXT_PUBLIC_ADMIN_OFFICE_HOURS: z.string().optional(),
    NEXT_PUBLIC_OMS_ALLOW_INVALID: z.string().optional(),
  },

  runtimeEnv: {
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
    SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    OMS_TOKEN_SECRET: process.env.OMS_TOKEN_SECRET,
    OMS_LINK_TTL_HOURS: process.env.OMS_LINK_TTL_HOURS,
    ORDER_REPORT_PASSWORD: process.env.ORDER_REPORT_PASSWORD,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_SENDER_EMAIL: process.env.RESEND_SENDER_EMAIL,
    RESEND_SENDER_NAME: process.env.RESEND_SENDER_NAME,
    RESEND_ADMIN_EMAIL: process.env.RESEND_ADMIN_EMAIL,
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
    GMAIL_SENDER_EMAIL: process.env.GMAIL_SENDER_EMAIL,
    GMAIL_ADMIN_EMAIL: process.env.GMAIL_ADMIN_EMAIL,
    TEST_EMAIL_OVERRIDE: process.env.TEST_EMAIL_OVERRIDE,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ALLOWED_ORIGINS: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS,
    NEXT_PUBLIC_ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    NEXT_PUBLIC_ADMIN_PHONE: process.env.NEXT_PUBLIC_ADMIN_PHONE,
    NEXT_PUBLIC_ADMIN_LINE_ID: process.env.NEXT_PUBLIC_ADMIN_LINE_ID,
    NEXT_PUBLIC_ADMIN_OFFICE_HOURS: process.env.NEXT_PUBLIC_ADMIN_OFFICE_HOURS,
    NEXT_PUBLIC_OMS_ALLOW_INVALID: process.env.NEXT_PUBLIC_OMS_ALLOW_INVALID,
  },

  skipValidation: process.env.NEXT_PHASE === 'phase-production-build',
})

// clientEnv alias for code that accesses NEXT_PUBLIC_ vars from server-side files
export const clientEnv = env
