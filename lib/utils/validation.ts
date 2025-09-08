import { z } from 'zod'

// GraphQL Query validation schema
export const graphqlQuerySchema = z.object({
  query: z.string().min(1).max(5000),
  variables: z.record(z.string(), z.any()).optional(),
})

// Tax Invoice form data validation
export const taxInvoiceSchema = z.object({
  type: z.enum(['individual', 'juristic']),
  name: z.string().min(1).max(200),
  taxId: z.string().regex(/^\d{13}$/, 'Tax ID must be 13 digits'),
  phone1: z.string().regex(/^\d{9,10}$/, 'Phone number must be 9-10 digits'),
  phone2: z
    .string()
    .regex(/^\d{9,10}$/)
    .optional()
    .or(z.literal('')),
  branchName: z.string().optional(),
  branchNumber: z.string().optional(),
  address: z.string().min(1).max(500),
  province: z.string().min(1),
  district: z.string().min(1),
  subdistrict: z.string().min(1),
  postal: z.string().regex(/^\d{5}$/, 'Postal code must be 5 digits'),
})

// Environment variables validation
export const envSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z.string().min(1),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_ALLOWED_ORIGINS: z.string().optional(),
})

// Validate environment variables on module load
export const env = envSchema.parse({
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
  SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_ALLOWED_ORIGINS: process.env.NEXT_PUBLIC_ALLOWED_ORIGINS,
})

// Type exports
export type GraphQLQuery = z.infer<typeof graphqlQuerySchema>
export type TaxInvoiceData = z.infer<typeof taxInvoiceSchema>
export type Env = z.infer<typeof envSchema>
