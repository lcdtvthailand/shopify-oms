# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev      # Start development server at http://localhost:3000
pnpm build    # Build production bundle
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

### Package Management
This project uses **pnpm** as the package manager. Always use pnpm commands for installing dependencies and running scripts.

## Architecture Overview

This is a **Shopify OMS Thai Tax Invoice** application built with Next.js 15 App Router, React 19, and TypeScript. The application provides a form interface for Thai customers to request tax invoices for their Shopify orders.

### Core Architecture Patterns

1. **Next.js App Router Structure**: Uses server components by default with selective client-side interactivity via `'use client'` directive.

2. **API Proxy Pattern**: All Shopify API calls go through `/api/shopify/route.ts` to keep credentials server-side. The API handles:
   - Order search by number or email
   - Reading/writing tax invoice metafields
   - Automatic order detection via email polling

3. **State Management**: Uses local React state with URL parameters for initial values. No global state management needed for this focused application.

4. **Data Flow**:
   ```
   URL Parameters → Auto-validation → Shopify API → Form Pre-fill → User Input → Save to Shopify
   ```

### Key Components

- **TaxInvoiceForm.tsx**: Main form component with Thai localization, cascading geography selects, and real-time formatting
- **TopBar.tsx**: Application header with branding
- **TopMenu.tsx**: Placeholder navigation (currently commented out)
- **lib/geography/thailand.ts**: Complete Thai geography dataset with provinces, districts, and subdistricts

### Important Patterns

1. **Thai Localization**: All UI text in Thai, phone numbers format as `xxx-xxx-xxxx`, tax IDs as `x-xxxx-xxxxx-xx-x`

2. **Geography Cascade**: Province → District → Subdistrict selections with automatic postal code population

3. **Validation Flow**: Forms remain disabled until order validation completes. Uses modal popups for user feedback.

4. **Prefill Protection**: Uses `isPrefilling` ref to prevent cascading resets during data loading.

### Environment Variables

Required for Shopify integration:
- `SHOPIFY_API_ACCESS_TOKEN`
- `SHOPIFY_DOMAIN`

### Styling

Uses Tailwind CSS v4 with:
- Custom Thai font (Anuphan)
- Red brand colors (#FF0000, #CC0000)
- Mobile-responsive design
- Consistent spacing tokens

### Development Notes

- The application expects URL parameters `?order=xxx&email=xxx` for order validation
- Form has two modes: individual (บุคคลธรรมดา) and juristic person (นิติบุคคล)
- All Shopify data stored in order metafields under namespace `custom`
- Uses GraphQL for all Shopify API operations