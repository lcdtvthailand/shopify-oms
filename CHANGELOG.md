# Changelog

## [2025-09-08] - Fixed Shopify GraphQL Error

### Fixed

- Removed `refundedAt` field from GraphQL query as it doesn't exist in Shopify's Order type
- The refund status is now determined solely from `displayFinancialStatus` field which contains values like "refunded" or "partially_refunded"

### Changed

- Updated `TaxInvoiceForm.tsx` to remove the non-existent `refundedAt` field from the GraphQL query
- The order status validation still works correctly by checking the `financialStatus` field

## [2025-09-08] - Project Restructuring

### Added

- Organized folder structure following Next.js best practices
- Created centralized type definitions in `/types` directory
- Added constants directory for shared values
- Created comprehensive documentation

### Changed

- Components reorganized into subdirectories: `ui/`, `forms/`, `modals/`, `layout/`
- Utilities moved to `lib/utils/` and services to `lib/services/`
- All import paths updated throughout the codebase

### Documentation

- `PROJECT_STRUCTURE.md` - Complete directory guide
- `RESTRUCTURE_SUMMARY.md` - Summary of changes
- `TEST_REPORT.md` - Testing documentation
