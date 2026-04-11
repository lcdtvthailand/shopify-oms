import { z } from 'zod'

export { clientEnv, env } from '@/lib/env'

// GraphQL Query validation schema
export const graphqlQuerySchema = z.object({
  query: z.string().min(1).max(5000),
  variables: z.record(z.string(), z.any()).optional(),
  expectedEmail: z.email().optional(),
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

// Type exports
export type GraphQLQuery = z.infer<typeof graphqlQuerySchema>
export type TaxInvoiceData = z.infer<typeof taxInvoiceSchema>
