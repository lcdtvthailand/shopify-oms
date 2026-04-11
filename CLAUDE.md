# CLAUDE.md

## Commands

```bash
pnpm dev                # Start dev server at http://localhost:3000
pnpm build              # Build production bundle
pnpm lint               # Biome check
pnpm lint:fix           # Biome auto-fix
pnpm format             # Biome format
pnpm type-check         # TypeScript type check (tsc --noEmit)
pnpm deploy:production  # Build + deploy to Cloudflare Workers (production)
pnpm deploy:staging     # Build + deploy to Cloudflare Workers (staging)
pnpm test:e2e           # Playwright end-to-end tests
```

Package manager: **pnpm**. Linter/formatter: **Biome**. Pre-commit: **Husky + lint-staged**.

## Architecture

Shopify OMS Thai Tax Invoice app — Next.js 15 App Router, React 19, TypeScript, deployed on Cloudflare Workers via OpenNext.

### Key Paths

- `app/page.tsx` — Tax invoice form entry (expects `?order=xxx&email=xxx`)
- `app/invoice/[token]/` — Token-based invoice view
- `app/order-report/` — Admin order report dashboard
- `app/api/shopify/route.ts` — Shopify GraphQL proxy (keeps credentials server-side)
- `app/api/send-email/route.ts` — Gmail OAuth2 email sending
- `app/api/invoice-token/route.ts` — Invoice token generation
- `app/api/order-report-auth/route.ts` — Report authentication
- `app/components/forms/` — Form field components (geography cascade, tax ID, etc.)
- `app/components/order-report/` — Order report UI components
- `app/hooks/` — Custom hooks (form validation, geography, order data, pagination, etc.)
- `lib/geography/thailand.ts` — Thai provinces/districts/subdistricts dataset

### Patterns

- **All UI text in Thai** — phone format `xxx-xxx-xxxx`, tax ID format `x-xxxx-xxxxx-xx-x`
- **Geography cascade**: Province → District → Subdistrict → auto-fill postal code
- **Two form modes**: individual (บุคคลธรรมดา) and juristic person (นิติบุคคล)
- **Shopify data** stored in order metafields under namespace `custom`, all via GraphQL
- **Order status validation**: blocks tax invoice for cancelled/fulfilled/refunded orders, shows admin contact

### Environment Variables

See `.env.example` for all variables. Key ones:

- `SHOPIFY_STORE_DOMAIN` / `SHOPIFY_ADMIN_ACCESS_TOKEN` — Shopify API
- `GMAIL_*` — Gmail OAuth2 for sending emails
- `CLOUDFLARE_API_TOKEN` — Cloudflare Workers deployment
- `NEXT_PUBLIC_ADMIN_*` — Public admin contact info

### Styling

Tailwind CSS v4 — custom Thai font (Anuphan), red brand colors (#FF0000, #CC0000), mobile-responsive.
