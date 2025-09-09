# Fixing Cloudflare Static Assets 404 Errors

## Problem
When running `pnpm preview`, you may see:
- 404 errors for static assets (`/_next/static/...`)
- TypeError: Incorrect type for Promise: the Promise did not resolve to 'Response'

## Solution

The issue is that OpenNext's Cloudflare adapter has known issues with serving static assets in development mode. Here are the workarounds:

### Option 1: Use Next.js Dev Server (Recommended for Development)
```bash
pnpm dev
```
This runs the standard Next.js development server without Cloudflare Workers simulation.

### Option 2: Deploy to Cloudflare Pages (Recommended for Testing)
```bash
# Deploy to staging
pnpm deploy:staging

# Or deploy to production  
pnpm deploy:production
```

### Option 3: Use Wrangler Pages Dev (Alternative)
```bash
# Build the app
pnpm build

# Run with wrangler pages dev
npx wrangler pages dev .next
```

### Option 4: Serve Static Assets Separately
1. Build the app: `pnpm build:cloudflare`
2. In one terminal, serve static assets:
   ```bash
   npx serve .open-next/assets -p 3001
   ```
3. In another terminal, run the worker:
   ```bash
   wrangler dev --port 8787
   ```

## Root Cause
OpenNext's Cloudflare adapter is still in development and has limitations:
- Static asset serving in dev mode doesn't work properly
- The worker expects assets to be served by Cloudflare's edge network
- Local development doesn't perfectly simulate the production environment

## Production Deployment
In production on Cloudflare Workers/Pages, static assets are automatically handled by Cloudflare's CDN, so these errors won't occur.