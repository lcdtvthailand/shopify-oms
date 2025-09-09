# Fixing 404 Errors on Cloudflare Deployment

## Problem
Static assets (CSS, JS files) return 404 errors after deployment.

## Root Cause
The deployment method matters for OpenNext with Cloudflare:
- Cloudflare Pages deployment doesn't properly handle Workers Sites
- Need to use `wrangler deploy` directly for proper static asset handling

## Solution

### Option 1: Deploy using Wrangler CLI (Recommended)

1. **Set environment variables locally** (for deployment only):
   ```bash
   export CLOUDFLARE_API_TOKEN=your_api_token
   ```

2. **Run deployment**:
   ```bash
   pnpm deploy:production
   ```

   Or use the deploy script:
   ```bash
   ./deploy.sh
   ```

### Option 2: Use Cloudflare Workers (not Pages)

1. Go to Cloudflare Dashboard → Workers & Pages
2. Create a new **Worker** (not Pages project)
3. Deploy using:
   ```bash
   npx wrangler deploy
   ```

### Option 3: Use a Different Deployment Method

If you must use Cloudflare Pages, consider:
1. Using a static export (`next export`)
2. Using a different adapter
3. Hosting static assets on a CDN separately

## Verification

After successful deployment with `wrangler deploy`, you should see:
- All static assets loading correctly
- No 404 errors in the browser console
- The application functioning properly

## Important Notes

- The `[site]` configuration in wrangler.toml is required
- The worker expects an `ASSETS` binding for static files
- Cloudflare Pages UI deployment doesn't handle this properly for OpenNext