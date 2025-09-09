#!/bin/bash

# Deployment script for Cloudflare Workers with OpenNext

echo "🚀 Starting deployment to Cloudflare Workers..."

# Build the application
echo "📦 Building application..."
pnpm build:cloudflare

# Deploy to Cloudflare Workers
echo "☁️  Deploying to Cloudflare..."
npx wrangler deploy --compatibility-date 2024-09-23

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at: https://shopify-oms.lcdtv.workers.dev"