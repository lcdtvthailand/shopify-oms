export const API_ROUTES = {
  SHOPIFY: '/api/shopify',
} as const

export const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 10,
} as const

export const CACHE_DURATION = {
  ORDER_DATA: 5 * 60 * 1000, // 5 minutes
} as const