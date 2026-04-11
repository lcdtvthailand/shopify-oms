# Shopify OMS - Thai Tax Invoice

Tax invoice request system for LCDTVTHAILAND SHOP. Customers receive a secure link to submit their tax invoice information, which is stored in Shopify order metafields and confirmed via email.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Hosting**: Cloudflare Workers (via OpenNext)
- **API**: Shopify Admin GraphQL API
- **Email**: Gmail API (OAuth2)
- **Styling**: Tailwind CSS v4 + Anuphan (Thai font)
- **Code Quality**: Biome, Husky, lint-staged

## Getting Started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build production bundle |
| `pnpm lint` | Run Biome linter |
| `pnpm deploy` | Build and deploy to Cloudflare Workers |
| `pnpm deploy:production` | Deploy to production environment |

## Environment Variables

Copy `.env.local` and configure:

### Required

| Variable | Description |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | e.g. `lcdtvthailand.myshopify.com` |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify Admin API token (`shpat_...`) |

### Gmail (Email sending)

| Variable | Description |
|---|---|
| `GMAIL_CLIENT_ID` | Google OAuth2 client ID |
| `GMAIL_CLIENT_SECRET` | Google OAuth2 client secret |
| `GMAIL_REFRESH_TOKEN` | OAuth2 refresh token (scope: `gmail.send`) |
| `GMAIL_SENDER_EMAIL` | Sender email address |
| `GMAIL_ADMIN_EMAIL` | Admin notification email |

### Optional

| Variable | Description |
|---|---|
| `OMS_TOKEN_SECRET` | HMAC secret for OMS links |
| `OMS_LINK_TTL_HOURS` | OMS link expiry (default: 72) |
| `TEST_EMAIL_OVERRIDE` | Redirect all emails to this address (testing) |
| `ORDER_REPORT_PASSWORD` | Password for order report page |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | CORS allowed origins |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin contact email (public) |
| `NEXT_PUBLIC_ADMIN_PHONE` | Admin contact phone (public) |
| `NEXT_PUBLIC_ADMIN_LINE_ID` | LINE official account ID (public) |
| `NEXT_PUBLIC_ADMIN_OFFICE_HOURS` | Office hours (public) |

## Gmail Setup

Generate a refresh token with `gmail.send` scope:

```bash
node scripts/get-gmail-token.mjs
```

Then set it in `.env.local` and Cloudflare:

```bash
echo "YOUR_REFRESH_TOKEN" | npx wrangler secret put GMAIL_REFRESH_TOKEN
```

## Features

- **Secure OMS Links**: HMAC-signed URLs with configurable TTL
- **Tax Invoice Form**: Thai-localized with cascading geography (province/district/subdistrict)
- **Email Notifications**: Branded HTML emails in Thai and English (individual/company x TH/EN)
- **Invoice View Page**: `/invoice/[token]` — shareable page with print/save PDF
- **Order Status Validation**: Blocks cancelled/refunded/fulfilled orders
- **Rate Limiting**: Per-IP rate limiting on all API routes

## Architecture

### Customer Flow

```
OMS Link → Token Validation → Order Lookup → Tax Invoice Form
                                                ├→ Save to Shopify Metafields
                                                ├→ Send Email (with invoice view link)
                                                └→ Save Customer Profile
```

### URL Parameters

Customers access the form via secure OMS links:

```
https://shopify-oms.lcdtv.workers.dev/?code=<signed-token>
```

Links are generated via `/api/build-oms?order=1234&email=customer@example.com`

### Project Structure

```
app/
├── api/
│   ├── shopify/          # Shopify GraphQL proxy
│   ├── build-oms/        # Generate OMS links
│   ├── resolve-oms/      # Validate OMS links
│   ├── send-email/       # Email dispatch
│   └── invoice-token/    # Generate invoice view tokens
├── invoice/[token]/      # Invoice view page (print/PDF)
├── order-report/         # Order report page
├── components/           # React components
├── hooks/                # Custom React hooks
└── contexts/             # Auth & Language providers
lib/
├── geography/            # Thai geography dataset
├── services/             # Email templates, order status
└── utils/                # Validation, error handling
```

### Metafields Storage

Tax invoice data is stored in Shopify order metafields under the `custom` namespace:

| Key | Description |
|---|---|
| `customer_type` | บุคคลธรรมดา or นิติบุคคล |
| `title_name` | Thai title prefix |
| `full_name` | Individual name |
| `custom_company_name` | Company name |
| `tax_id` / `tax_id_formatted` | 13-digit tax ID |
| `phone_number` | Contact phone |
| `branch_type` | สำนักงานใหญ่ or สาขาย่อย |
| `branch_code` | Branch code |
| `province` / `district` / `sub_district` | Address |
| `postal_code` | 5-digit postal code |
| `full_address` | Street address |

## Deployment

### Cloudflare Workers

```bash
# Set secrets (one-time)
npx wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN
npx wrangler secret put GMAIL_CLIENT_ID
npx wrangler secret put GMAIL_CLIENT_SECRET
npx wrangler secret put GMAIL_REFRESH_TOKEN
npx wrangler secret put GMAIL_SENDER_EMAIL
npx wrangler secret put GMAIL_ADMIN_EMAIL

# Deploy
pnpm deploy
```

### Testing Email

Set `TEST_EMAIL_OVERRIDE` to redirect all emails to a test address:

```bash
echo "test@example.com" | npx wrangler secret put TEST_EMAIL_OVERRIDE
```

Remove when done:

```bash
npx wrangler secret delete TEST_EMAIL_OVERRIDE
```

## Security

- HMAC-signed OMS links with TTL expiry
- Constant-time token comparison
- Rate limiting on all API endpoints
- CSP and security headers via middleware
- Input sanitization
- CORS configuration
- Secrets stored in Cloudflare Workers (never in code)

## Support

- Email: sales@lcdtvthailand.com
- Phone: 091-901-7000 / 091-901-8000
- LINE: @LCDTVTHAILAND

## License

Proprietary software. All rights reserved.
