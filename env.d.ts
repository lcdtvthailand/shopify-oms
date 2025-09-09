/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    // Environment variables
    SHOPIFY_STORE_DOMAIN: string
    SHOPIFY_ADMIN_ACCESS_TOKEN: string
    NEXT_PUBLIC_ADMIN_EMAIL?: string
    NEXT_PUBLIC_ADMIN_PHONE?: string
    NEXT_PUBLIC_ADMIN_LINE_ID?: string
    NEXT_PUBLIC_ADMIN_OFFICE_HOURS?: string

    // KV Namespaces
    NEXT_CACHE_WORKERS_KV?: KVNamespace

    // Other bindings
    NODE_ENV: string
  }
}

// Make TypeScript recognize the module
export {}
