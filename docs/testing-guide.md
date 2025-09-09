# Testing Guide for Cloudflare Deployment

## Local Testing Steps

### 1. Environment Setup

First, ensure you have the necessary environment variables set:

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your actual values
```

### 2. Build the Application

```bash
# Build for Cloudflare
pnpm build:cloudflare
```

### 3. Run Locally with Wrangler

```bash
# Start local development server
pnpm preview
```

This will start the application at http://localhost:8787

### 4. Test Endpoints

#### Home Page
```bash
curl http://localhost:8787/
```

#### API Endpoint (requires proper environment variables)
```bash
curl -X POST http://localhost:8787/api/shopify \
  -H "Content-Type: application/json" \
  -d '{"query": "{ shop { name } }"}'
```

### 5. Test with URL Parameters

Open in browser:
```
http://localhost:8787/?order=12345&email=test@example.com
```

## Common Issues and Solutions

### Issue: Environment Variables Not Loading

**Solution**: For local testing with Wrangler, you need to set environment variables in one of these ways:

1. **Using .dev.vars file** (Recommended for local development):
```bash
# Create .dev.vars file
cat > .dev.vars << EOF
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
EOF
```

2. **Using wrangler.toml** (for non-sensitive vars only):
```toml
[vars]
NODE_ENV = "development"
```

3. **Using wrangler secrets** (for production):
```bash
wrangler secret put SHOPIFY_ADMIN_ACCESS_TOKEN
```

### Issue: Module Not Found Errors

**Solution**: Ensure you've built the project before running:
```bash
pnpm build:cloudflare
```

### Issue: CORS Errors

**Solution**: The API routes already include CORS headers. If you still get CORS errors, check that your request origin is allowed.

### Issue: Static Files Not Loading

**Solution**: Cloudflare Workers don't serve static files by default. For production, you'll need to:
1. Use Cloudflare R2 for static assets
2. Or serve them from a CDN
3. Or use Cloudflare Pages instead of Workers

## Production Testing

### Deploy to Staging
```bash
pnpm deploy:staging
```

### Test Production Build
```bash
# Deploy to production (be careful!)
pnpm deploy:production

# Tail logs
pnpm cf:tail
```

## Debugging Tips

1. **Enable Debug Mode**: Set `debug: true` in `open-next.config.ts`

2. **Check Logs**: 
```bash
wrangler tail
```

3. **Inspect Build Output**:
```bash
ls -la .open-next/
cat .open-next/worker.js
```

4. **Test API Directly**:
```bash
# Test health check
curl http://localhost:8787/api/health

# Test Shopify API proxy
curl -X POST http://localhost:8787/api/shopify \
  -H "Content-Type: application/json" \
  -d '{"query": "query { shop { name } }", "variables": {}}'
```

## Performance Testing

1. **Check Bundle Size**:
```bash
du -sh .open-next/worker.js
```

2. **Test Cold Start**:
```bash
# Restart wrangler and time first request
time curl http://localhost:8787/
```

3. **Load Test** (use with caution):
```bash
# Install autocannon
npm install -g autocannon

# Run load test
autocannon -c 10 -d 30 http://localhost:8787/
```

## Next Steps

After successful local testing:

1. Configure your Cloudflare account
2. Update wrangler.toml with your domain
3. Set up KV namespaces if needed
4. Deploy to staging environment
5. Run integration tests
6. Deploy to production