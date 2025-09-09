#!/bin/bash

# Start Local Testing Script for Shopify OMS

echo "🚀 Starting Shopify OMS Thai Tax Invoice - Local Testing"
echo ""

# Check if .dev.vars exists
if [ ! -f ".dev.vars" ]; then
    echo "❌ Error: .dev.vars file not found!"
    echo "Please copy .dev.vars.example to .dev.vars and add your Shopify credentials."
    exit 1
fi

# Check if build exists
if [ ! -f ".open-next/worker.js" ]; then
    echo "📦 Building for Cloudflare..."
    pnpm build:cloudflare
fi

echo "✅ Starting Wrangler dev server..."
echo ""
echo "The application will be available at:"
echo "👉 http://localhost:8787"
echo ""
echo "Test URLs:"
echo "- Home: http://localhost:8787/"
echo "- With params: http://localhost:8787/?order=YOUR_ORDER_ID&email=YOUR_EMAIL"
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"
echo ""

# Start wrangler with local vars
npx wrangler dev --local --persist --var-file .dev.vars