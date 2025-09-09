# Project Structure

```
shopify-oms/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── shopify/              # Shopify API proxy endpoint
│   ├── components/               # React components
│   │   ├── forms/                # Form components
│   │   ├── layout/               # Layout components
│   │   ├── modals/               # Modal components
│   │   └── ui/                   # UI components
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── lib/                          # Utility libraries
│   ├── geography/                # Thai geography data
│   ├── services/                 # Business logic services
│   └── utils/                    # Utility functions
│
├── types/                        # TypeScript type definitions
│   └── shopify.ts                # Shopify API types
│
├── public/                       # Static assets
│   └── (empty)                   
│
├── docs/                         # Documentation
│   ├── cloudflare-deployment.md  # Cloudflare deployment guide
│   ├── improvement-suggestions.md # Future improvements
│   ├── PROJECT_STRUCTURE.md      # This file
│   └── testing-guide.md          # Testing instructions
│
├── constants/                    # Application constants
│   └── index.ts                  # Shared constants
│
├── Configuration Files
├── .biomeignore                  # Biome ignore patterns
├── .dev.vars.example             # Cloudflare dev vars example
├── .gitignore                    # Git ignore patterns
├── biome.json                    # Biome linter/formatter config
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── open-next.config.ts           # OpenNext configuration
├── package.json                  # Package dependencies
├── pnpm-lock.yaml               # PNPM lock file
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── wrangler.toml                # Cloudflare Workers config
└── worker-with-assets.js        # Custom worker for static assets

├── Documentation Files
├── CLAUDE.md                    # Claude AI instructions
├── CLOUDFLARE-DEPLOYMENT.md     # Deployment instructions
├── README.md                    # Project overview
├── CHANGELOG.md                 # Version history
└── LOCAL_TESTING.md             # Local testing guide
```

## Key Directories

### `/app`
Next.js 15 App Router structure with server components by default.

### `/lib`
- `geography/` - Complete Thai provinces, districts, sub-districts data
- `services/` - Order status validation, business logic
- `utils/` - Error handling, validation, formatting utilities

### `/types`
TypeScript interfaces for Shopify GraphQL responses and application data.

### `/docs`
Project documentation including deployment guides and improvement suggestions.

## Configuration Files

- **biome.json** - Code quality and formatting rules
- **wrangler.toml** - Cloudflare Workers deployment configuration
- **open-next.config.ts** - OpenNext adapter configuration for Cloudflare
- **.dev.vars.example** - Template for local Cloudflare environment variables

## Build Outputs (git-ignored)

- `.next/` - Next.js build output
- `.open-next/` - OpenNext build for Cloudflare
- `node_modules/` - Dependencies
- `.wrangler/` - Wrangler cache

## Scripts

See `package.json` for available scripts:
- `pnpm dev` - Local development
- `pnpm build` - Production build
- `pnpm deploy:cf` - Deploy to Cloudflare Workers
- `pnpm lint` - Run Biome checks