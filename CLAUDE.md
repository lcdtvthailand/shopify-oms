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

   ```text
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

## Feature: Order Status Validation & Admin Contact

### Overview

Prevent tax invoice creation for cancelled or fulfilled orders, and provide administrator contact information for customers who need assistance.

### Implementation Plan

#### 1. Order Status Validation

- **GraphQL Query Updates**: Include fulfillment status, financial status, and cancellation details in order queries
- **Eligible Statuses**: Only allow tax invoice creation for:
  - Orders with financial status: `paid`, `partially_paid`
  - Orders with fulfillment status: `null` (unfulfilled), `partial`
  - Orders that are NOT cancelled
- **Ineligible Statuses**: Block tax invoice creation for:
  - Cancelled orders
  - Fully fulfilled orders (fulfillment status: `fulfilled`)
  - Refunded orders (financial status: `refunded`, `partially_refunded`)

#### 2. Administrator Contact Information

- **Environment Variables**:

  ```
  NEXT_PUBLIC_ADMIN_EMAIL=admin@lcdtvthailand.com
  NEXT_PUBLIC_ADMIN_PHONE=02-xxx-xxxx
  NEXT_PUBLIC_ADMIN_LINE_ID=@lcdtvthailand
  NEXT_PUBLIC_ADMIN_OFFICE_HOURS=Mon-Fri 9:00-18:00
  ```

- **Contact Methods**: Email, Phone, LINE Official Account
- **Pre-filled Templates**: Include order number, status, and customer information

#### 3. UI Components

- **OrderStatusAlert**: Component to display order status warnings
- **AdminContactModal**: Modal with administrator contact information
- **StatusBadge**: Visual indicator for order status

#### 4. User Flow

```
1. Customer enters order details
2. System validates order status
3. If eligible → Show tax invoice form
4. If ineligible → Show status message + admin contact
5. Log attempt for admin review
```

#### 5. Status Messages (Thai)

- **Cancelled**: "คำสั่งซื้อนี้ถูกยกเลิกแล้ว กรุณาติดต่อเจ้าหน้าที่เพื่อขอความช่วยเหลือ"
- **Already Fulfilled**: "คำสั่งซื้อนี้ได้ออกใบกำกับภาษีแล้ว หากต้องการสำเนา กรุณาติดต่อเจ้าหน้าที่"
- **Refunded**: "คำสั่งซื้อนี้ได้รับการคืนเงินแล้ว ไม่สามารถออกใบกำกับภาษีได้"

#### 6. Technical Implementation

1. Update GraphQL queries to fetch order status fields
2. Create status validation utility functions
3. Implement OrderStatusAlert component
4. Create AdminContactModal component  
5. Integrate status checks into TaxInvoiceForm
6. Add environment variables for admin contact
7. Update form logic to handle ineligible orders
8. Add logging for blocked attempts
