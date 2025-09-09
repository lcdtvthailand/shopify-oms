# Cloudflare Deployment Guide

This guide explains how to deploy the Shopify OMS Thai Tax Invoice application to Cloudflare Workers using OpenNext.

## Prerequisites

1. Cloudflare account with Workers enabled
2. Wrangler CLI configured with your Cloudflare credentials
3. Node.js 18+ and pnpm installed

## Setup Instructions

### 1. Configure Cloudflare Account

First, ensure you have the necessary Cloudflare resources:

```bash
# Login to Cloudflare
wrangler login

# Create a KV namespace for caching (optional)
wrangler kv:namespace create "NEXT_CACHE_WORKERS_KV"
```

### 2. Update wrangler.toml

Edit `wrangler.toml` with your specific configuration:

```toml
name = "your-worker-name"
routes = [
  { pattern = "your-domain.com/*", zone_name = "your-domain.com" }
]

[[kv_namespaces]]
binding = "NEXT_CACHE_WORKERS_KV"
id = "your-kv-namespace-id" # Replace with actual ID from step 1
```

### 3. Set Environment Variables

Configure your secrets using Wrangler:

```bash
# Set Shopify credentials
wrangler secret put SHOPIFY_STORE_DOMAIN
wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN

# Set admin contact info (optional)
wrangler secret put NEXT_PUBLIC_ADMIN_EMAIL
wrangler secret put NEXT_PUBLIC_ADMIN_PHONE
wrangler secret put NEXT_PUBLIC_ADMIN_LINE_ID
wrangler secret put NEXT_PUBLIC_ADMIN_OFFICE_HOURS
```

## Build and Deploy

### Local Development

Test your application locally with Cloudflare's runtime:

```bash
# Build for Cloudflare
pnpm build:cloudflare

# Run locally with Wrangler
pnpm preview
```

### Staging Deployment

Deploy to staging environment:

```bash
pnpm deploy:staging
```

### Production Deployment

Deploy to production:

```bash
pnpm deploy:production
```

## Available Scripts

- `pnpm build:cloudflare` - Build the application for Cloudflare Workers
- `pnpm deploy` - Deploy to default environment
- `pnpm deploy:staging` - Deploy to staging environment
- `pnpm deploy:production` - Deploy to production environment
- `pnpm preview` - Build and preview locally with Wrangler
- `pnpm cf:dev` - Run Wrangler in local development mode
- `pnpm cf:tail` - Tail production logs

## Configuration Details

### OpenNext Configuration

The `open-next.config.ts` file configures how Next.js is adapted for Cloudflare:

- **Edge Runtime**: Configured for API routes to ensure compatibility
- **Caching**: KV namespace binding for Next.js cache
- **ISR**: Disabled (not supported on Cloudflare Workers)

### Wrangler Configuration

The `wrangler.toml` file configures the Cloudflare Worker:

- **Compatibility**: Set to `2024-09-23` with `nodejs_compat` flag
- **Routes**: Configure your domain routing
- **KV Namespaces**: Optional caching layer
- **Environments**: Separate staging and production configs

## Limitations and Considerations

### Cloudflare Workers Limitations

1. **CPU Time**: 50ms limit per request (can be increased)
2. **Memory**: 128MB limit
3. **Request Size**: 100MB limit
4. **No File System**: Static files must be served from R2 or external CDN

### Next.js Feature Support

- ✅ App Router
- ✅ API Routes
- ✅ Server Components
- ✅ Client Components
- ✅ Dynamic Routes
- ❌ Image Optimization (use Cloudflare Images)
- ❌ ISR/On-Demand Revalidation
- ❌ File uploads (use R2)

### Performance Tips

1. **Use Edge Runtime**: Configure API routes to use edge runtime for better performance
2. **Cache Strategically**: Utilize KV namespaces for frequently accessed data
3. **Optimize Bundle**: Keep worker bundle under 10MB for faster cold starts

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .next .worker-next
   pnpm build:cloudflare
   ```

2. **Environment Variables Not Working**
   - Ensure secrets are set with `wrangler secret put`
   - Check that variable names match in code and wrangler.toml

3. **Route Not Working**
   - Verify domain is proxied through Cloudflare (orange cloud)
   - Check route patterns in wrangler.toml

4. **Memory Limits**
   - Optimize imports to reduce bundle size
   - Use dynamic imports for large libraries

### Debug Commands

```bash
# View real-time logs
pnpm cf:tail

# Check deployment status
wrangler deployments list

# View environment variables (non-secret)
wrangler vars list
```

## Monitoring

### Cloudflare Dashboard

Monitor your application through the Cloudflare dashboard:

1. Workers & Pages > Your Worker
2. View metrics, logs, and errors
3. Set up alerts for errors or usage limits

### Custom Logging

The application uses structured logging. View logs with:

```bash
wrangler tail --format pretty
```

## Cost Considerations

Cloudflare Workers pricing:

- **Free Tier**: 100,000 requests/day
- **Paid Tier**: $5/month for 10 million requests
- **Additional**: $0.50 per million requests

Consider costs for:
- Worker requests
- KV operations
- R2 storage (if used)
- Bandwidth

## Security Best Practices

1. **API Keys**: Always use `wrangler secret` for sensitive data
2. **CORS**: Configure appropriate CORS headers in middleware
3. **Rate Limiting**: Implement rate limiting for API routes
4. **Input Validation**: Validate all user inputs server-side

## Support

For deployment issues:
- [OpenNext Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers)
- [Project Issues](https://github.com/lcdtvthailand/shopify-oms/issues)