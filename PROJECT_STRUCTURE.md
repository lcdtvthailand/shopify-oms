# Project Structure

This project follows Next.js App Router best practices with a clean, organized folder structure.

## Directory Structure

```text
shopify-oms/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── shopify/         
│   │       └── route.ts      # Shopify GraphQL API endpoint
│   ├── components/           # React components
│   │   ├── forms/           # Form components
│   │   │   └── TaxInvoiceForm.tsx
│   │   ├── layout/          # Layout components
│   │   │   ├── TopBar.tsx
│   │   │   └── TopMenu.tsx
│   │   ├── modals/          # Modal components
│   │   │   └── AdminContactModal.tsx
│   │   └── ui/              # UI components
│   │       ├── ErrorBoundary.tsx
│   │       └── OrderStatusAlert.tsx
│   ├── test-status/         # Test pages
│   │   └── page.tsx
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── not-found.tsx        # 404 page
│   └── page.tsx             # Home page
├── constants/               # Application constants
│   ├── api.ts              # API-related constants
│   ├── ui.ts               # UI messages
│   ├── validation.ts       # Validation rules
│   └── index.ts            # Barrel export
├── lib/                     # Library code
│   ├── geography/          # Geography data
│   │   └── thailand.ts     # Thai provinces data
│   ├── services/           # Business logic services
│   │   └── order-status.ts # Order validation service
│   ├── utils/              # Utility functions
│   │   ├── errors.ts       # Error handling
│   │   ├── formatters.ts   # Data formatters
│   │   └── validation.ts   # Validation schemas
│   └── hooks/              # Custom React hooks (future)
├── types/                   # TypeScript type definitions
│   ├── admin.ts            # Admin types
│   ├── form.ts             # Form types
│   ├── geography.ts        # Geography types
│   ├── order.ts            # Order types
│   ├── shopify.ts          # Shopify API types
│   └── index.ts            # Barrel export
├── __tests__/              # Test files
│   ├── integration/        # Integration tests
│   ├── unit/              # Unit tests
│   ├── test-browser.html  # Browser test links
│   └── test-order-status.md # Test documentation
├── CLAUDE/                 # Claude AI documentation
│   ├── CLAUDE.md          # Development guide
│   └── test-results.md    # Test results
├── public/                 # Static assets
│   └── *.png              # Images
├── .env.local             # Environment variables
├── middleware.ts          # Next.js middleware
├── next.config.js         # Next.js config
├── tailwind.config.js     # Tailwind CSS config
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies
```

## Key Architectural Decisions

### 1. Component Organization

- **forms/**: Complex form components with business logic
- **layout/**: Page layout components (headers, footers)
- **modals/**: Modal dialog components
- **ui/**: Reusable UI components (alerts, buttons, etc.)

### 2. Business Logic Separation

- **lib/services/**: Core business logic and domain services
- **lib/utils/**: Pure utility functions
- **lib/hooks/**: Custom React hooks for shared state logic

### 3. Type Safety

- All types centralized in `/types` directory
- Barrel exports for easy importing
- Shared types between frontend and API

### 4. Constants Management

- All constants in `/constants` directory
- Separated by concern (API, UI, validation)
- Type-safe constant definitions

### 5. Testing Structure

- Unit tests for utilities and services
- Integration tests for API routes
- Test documentation and browser testing tools

## Import Guidelines

```typescript
// Types
import { OrderStatus, FormData } from '@/types'

// Services
import { validateOrderStatus } from '@/lib/services/order-status'

// Utils
import { formatThaiPhone } from '@/lib/utils/formatters'
import { AppError } from '@/lib/utils/errors'

// Components
import { TaxInvoiceForm } from '@/app/components/forms/TaxInvoiceForm'
import { ErrorBoundary } from '@/app/components/ui/ErrorBoundary'

// Constants
import { API_ROUTES, UI_MESSAGES } from '@/constants'
```

## Benefits of This Structure

1. **Maintainability**: Clear separation of concerns
2. **Scalability**: Easy to add new features
3. **Type Safety**: Centralized type definitions
4. **Testing**: Organized test structure
5. **Developer Experience**: Intuitive file locations
