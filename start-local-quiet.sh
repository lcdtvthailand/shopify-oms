#!/bin/bash

# Start Local Testing Script (Quiet Mode)

echo "🚀 Starting Shopify OMS - Local Testing (Quiet Mode)"
echo ""
echo "The application is available at:"
echo "👉 http://localhost:8787"
echo ""
echo "Note: Static asset 404 errors are normal in local development."
echo "The application will still work correctly."
echo ""
echo "Test URLs:"
echo "- Home: http://localhost:8787/"
echo "- With params: http://localhost:8787/?order=YOUR_ORDER_ID&email=YOUR_EMAIL"
echo ""
echo "Press Ctrl+C to stop"
echo "----------------------------------------"

# Start wrangler with minimal logging
npx wrangler dev --local --persist --var-file .dev.vars --log-level warn 2>&1 | grep -v "404 Not Found" | grep -v "_next/static"