# Cloudflare Deployment Guide

## Deployment Successful! 🎉

Your application has been deployed to Cloudflare Workers. Here's what you need to do next:

## 1. Access Your Deployed Application

Your app is now available at:
- **Workers URL**: `https://shopify-oms.YOUR-SUBDOMAIN.workers.dev`

To find your exact URL:
1. Go to Cloudflare Dashboard → Workers & Pages
2. Find your `shopify-oms` project
3. The URL will be shown there

## 2. Configure Custom Domain (Optional)

To use a custom domain:

1. Update `wrangler.toml`:
```toml
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

2. Redeploy:
```bash
pnpm deploy:production
```

## 3. Set Environment Variables

In Cloudflare Dashboard:
1. Go to Workers & Pages → your project → Settings → Variables
2. Add these production variables:
   - `SHOPIFY_STORE_DOMAIN`
   - `SHOPIFY_ADMIN_ACCESS_TOKEN`
   - `NEXT_PUBLIC_ADMIN_EMAIL` (optional)
   - `NEXT_PUBLIC_ADMIN_PHONE` (optional)
   - `NEXT_PUBLIC_ADMIN_LINE_ID` (optional)
   - `NEXT_PUBLIC_ADMIN_OFFICE_HOURS` (optional)

## 4. Test Your Deployment

1. Visit your Workers URL
2. Test with a real Shopify order:
   ```
   https://your-worker.workers.dev/?order=ORDER_NUMBER&email=customer@email.com
   ```

## 5. Monitor Your Application

- **Logs**: `pnpm cf:tail` (view real-time logs)
- **Analytics**: Check Cloudflare Dashboard → Workers → Analytics
- **Errors**: Check Cloudflare Dashboard → Workers → Logs

## Deployment Commands

- **Default/Dev**: `pnpm deploy`
- **Staging**: `pnpm deploy:staging`
- **Production**: `pnpm deploy:production`

## Troubleshooting

### If you see "Server configuration error"
- Make sure environment variables are set in Cloudflare Dashboard
- Check that variables are added to the correct environment (production/staging)

### If static assets don't load
- This is normal in local dev (`pnpm preview`)
- Works correctly in production on Cloudflare

### Domain not working
- Ensure your domain is added to Cloudflare
- Update routes in wrangler.toml
- Redeploy after changes