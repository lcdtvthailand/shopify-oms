# Local Testing Setup Guide

## 🚀 Quick Start

We've set up everything for local testing. Here's how to start:

```bash
./start-local.sh
```

This will start the application at **http://localhost:8787**

## 📋 What's Been Set Up

1. **✅ Environment Variables**
   - `.dev.vars` has been created with your Shopify credentials
   - Values copied from your existing `.env.local` file

2. **✅ Build Output**
   - OpenNext build completed successfully
   - Worker file ready at `.open-next/worker.js`

3. **✅ Configuration**
   - `wrangler.toml` configured for local development
   - `open-next.config.ts` optimized for Cloudflare

## 🧪 Testing Steps

### 1. Start the Server

```bash
# Option 1: Use the helper script
./start-local.sh

# Option 2: Use npm script
pnpm preview

# Option 3: Direct wrangler command
wrangler dev --local --persist --var-file .dev.vars
```

### 2. Test the Home Page

Open your browser and go to:
```
http://localhost:8787/
```

You should see the Thai Tax Invoice form interface.

### 3. Test with Order Parameters

Replace with your actual Shopify order data:
```
http://localhost:8787/?order=1234&email=customer@example.com
```

### 4. Test API Endpoints

Test the Shopify API proxy:

```bash
# Test with a simple query
curl -X POST http://localhost:8787/api/shopify \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ shop { name currencyCode } }",
    "variables": {}
  }'
```

### 5. Test Order Lookup

```bash
# Test order query (replace ORDER_NUMBER with actual order)
curl -X POST http://localhost:8787/api/shopify \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { orders(first: 1, query: \"name:#ORDER_NUMBER\") { edges { node { id name } } } }",
    "variables": {}
  }'
```

## 🔍 Debugging

### View Logs

While the server is running, logs will appear in the terminal. You can also use:

```bash
# In another terminal
wrangler tail
```

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill the process using port 8787
   lsof -ti:8787 | xargs kill -9
   ```

2. **Environment Variables Not Loading**
   - Check `.dev.vars` file exists and has correct values
   - Restart wrangler after changing `.dev.vars`

3. **CORS Errors**
   - The API includes CORS headers by default
   - Check browser console for specific error messages

4. **Build Issues**
   ```bash
   # Rebuild the worker
   rm -rf .open-next
   pnpm build:cloudflare
   ```

## 📊 Performance Testing

Check response times:
```bash
# Time the home page load
time curl -s http://localhost:8787/ > /dev/null

# Time API response
time curl -s -X POST http://localhost:8787/api/shopify \
  -H "Content-Type: application/json" \
  -d '{"query": "{ shop { name } }", "variables": {}}' > /dev/null
```

## 🎯 Next Steps

After successful local testing:

1. **Deploy to Staging**
   ```bash
   pnpm deploy:staging
   ```

2. **Production Deployment**
   - Update `wrangler.toml` with your domain
   - Set production secrets with `wrangler secret put`
   - Run `pnpm deploy:production`

## 📝 Notes

- Local development uses `.dev.vars` for environment variables
- Production uses Wrangler secrets (more secure)
- The application runs in Cloudflare's edge runtime
- Static assets are embedded in the worker bundle

## 🆘 Need Help?

- Check `docs/cloudflare-deployment.md` for detailed deployment guide
- Check `docs/testing-guide.md` for comprehensive testing instructions
- Review build output in `.open-next/` directory
- Enable debug mode in `open-next.config.ts` for more verbose logging