# Shopify OMS Thai Tax Invoice

A Next.js application that enables Thai customers to request tax invoices for their Shopify orders. Built with Next.js 15, React 19, and TypeScript, featuring Thai localization and seamless Shopify integration.

## Features

- **Thai Tax Invoice Form**: Complete form interface for individual and juristic person tax invoices
- **Order Validation**: Automatic order lookup and validation via order number and email
- **Thai Geography Data**: Complete provinces, districts, and sub-districts with postal codes
- **Auto-detection**: Automatically detects latest order when only email is provided
- **Order Status Validation**: Prevents tax invoice creation for cancelled or fulfilled orders
- **Thai Formatting**: Phone numbers (xxx-xxx-xxxx) and tax IDs (x-xxxx-xxxxx-xx-x) auto-formatting
- **Shopify Integration**: Stores all tax invoice data as order metafields

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Shopify store with Admin API access
- Shopify Admin API access token

## Installation

1. Clone the repository:

```bash
git clone https://github.com/lcdtvthailand/shopify-oms.git
cd shopify-oms
```

2. Install dependencies:

```bash
pnpm install
```

3. Create `.env.local` file:

```bash
cp .env.example .env.local
```

4. Configure environment variables:

```env
# Required
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx

# Optional - Admin Contact Info
NEXT_PUBLIC_ADMIN_EMAIL=admin@lcdtvthailand.com
NEXT_PUBLIC_ADMIN_PHONE=02-xxx-xxxx
NEXT_PUBLIC_ADMIN_LINE_ID=@lcdtvthailand
NEXT_PUBLIC_ADMIN_OFFICE_HOURS=Mon-Fri 9:00-18:00
```

## Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

### Key Development Commands

```bash
pnpm dev      # Start development server
pnpm build    # Build production bundle
pnpm start    # Start production server
pnpm lint     # Run Biome linter
```

## Usage

### Customer Flow

1. Customer receives a link with URL parameters:

   ```
   https://your-domain.com/?order=12345&email=customer@example.com
   ```

2. System automatically validates the order and email

3. If valid, customer can fill out the tax invoice form with:
   - Personal/Company information
   - Tax ID (13 digits)
   - Phone numbers
   - Complete Thai address with cascading selections

4. Data is saved to Shopify as order metafields

### URL Parameters

- `order` - Shopify order number (without #)
- `email` - Customer email address

If only email is provided, the system will attempt to find the latest order automatically.

## Architecture

### Tech Stack

- **Frontend**: Next.js 15 App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **Security**: DOMPurify, rate limiting
- **Code Quality**: Biome, Husky, lint-staged

### Project Structure

```
├── app/
│   ├── api/          # API routes
│   ├── components/   # React components
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── lib/
│   ├── geography/    # Thai geography data
│   ├── services/     # Business logic
│   └── utils/        # Utility functions
├── constants/        # App constants
├── types/           # TypeScript types
└── docs/            # Documentation
```

### Key Components

- **TaxInvoiceForm**: Main form component with validation and Shopify integration
- **OrderStatusAlert**: Displays order eligibility warnings
- **AdminContactModal**: Contact information for customer support
- **TopBar**: Application header with branding

## API Integration

### Shopify GraphQL API

All Shopify API calls go through `/api/shopify/route.ts` which handles:

- Authentication with access token
- Rate limiting
- Error handling
- CORS headers

### Metafields Storage

Tax invoice data is stored in Shopify order metafields under the `custom` namespace:

- `customer_type`: บุคคลธรรมดา or นิติบุคคล
- `company_name`: Name or company name
- `tax_id`: 13-digit tax ID (formatted)
- `phone_number`: Primary phone
- `alt_phone_number`: Alternative phone
- `province`, `district`, `sub_district`: Address components
- `postal_code`: 5-digit postal code
- `full_address`: Complete address
- `branch_type`: สำนักงานใหญ่ or สาขาย่อย (juristic only)
- `branch_code`: Branch code (if applicable)

## Security

- Environment variables for sensitive data
- Rate limiting on API endpoints
- Input sanitization with DOMPurify
- CORS configuration
- Security headers via middleware

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
docker build -t shopify-oms .
docker run -p 3000:3000 --env-file .env.local shopify-oms
```

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `SHOPIFY_STORE_DOMAIN` | Your Shopify store domain (e.g., store.myshopify.com) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Shopify Admin API access token |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin contact email |
| `NEXT_PUBLIC_ADMIN_PHONE` | Admin contact phone |
| `NEXT_PUBLIC_ADMIN_LINE_ID` | LINE Official Account ID |
| `NEXT_PUBLIC_ADMIN_OFFICE_HOURS` | Office hours for support |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact:

- Email: <admin@lcdtvthailand.com>
- Phone: 02-xxx-xxxx
- LINE: @lcdtvthailand

## Troubleshooting

### Common Issues

1. **"ไม่พบออเดอร์ตามเลขที่ระบุ"**
   - Verify order number is correct
   - Check if order exists in Shopify
   - Ensure API token has correct permissions

2. **Rate Limiting**
   - Default: 10 requests per minute per IP
   - Implement Redis for production scaling

3. **Geography Data Not Loading**
   - Check browser console for errors
   - Verify `/lib/geography/thailand.ts` is properly imported

4. **Metafields Not Saving**
   - Verify API token has write permissions
   - Check Shopify API version compatibility
   - Review error logs in browser console

## Roadmap

See [docs/improvement-suggestions.md](docs/improvement-suggestions.md) for planned improvements including:

- Testing framework setup
- Redis integration
- API authentication
- Performance monitoring
- CI/CD pipeline
