#!/usr/bin/env node

/**
 * Gmail OAuth2 Token Generator
 *
 * Starts a local server, opens the Google OAuth2 consent flow,
 * and prints the refresh token for use with Cloudflare Workers.
 *
 * Usage:
 *   GMAIL_CLIENT_ID=xxx GMAIL_CLIENT_SECRET=yyy node scripts/get-gmail-token.mjs
 *
 * Or via pnpm:
 *   pnpm gmail:token
 */

import http from 'node:http'
import { URL } from 'node:url'

const CLIENT_ID = process.env.GMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000'
const SCOPES = 'https://www.googleapis.com/auth/gmail.send'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing required environment variables:')
  if (!CLIENT_ID) console.error('  - GMAIL_CLIENT_ID')
  if (!CLIENT_SECRET) console.error('  - GMAIL_CLIENT_SECRET')
  console.error('\nUsage:')
  console.error('  GMAIL_CLIENT_ID=xxx GMAIL_CLIENT_SECRET=yyy node scripts/get-gmail-token.mjs')
  process.exit(1)
}

// Step 1: Print auth URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', SCOPES)
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent')

console.log('\nGmail OAuth2 Token Generator\n')
console.log('Open this URL in your browser:\n')
console.log(authUrl.toString())
console.log(`\nWaiting for callback on ${REDIRECT_URI} ...\n`)

// Step 2: Start server to catch the redirect
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI)
  const code = url.searchParams.get('code')

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/html' })
    res.end('<h1>No code received</h1>')
    return
  }

  // Step 3: Exchange code for tokens
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (tokens.refresh_token) {
      console.log('Success! Your refresh token:\n')
      console.log(tokens.refresh_token)
      console.log('\nSave it to Cloudflare:\n')
      console.log(`echo "${tokens.refresh_token}" | npx wrangler secret put GMAIL_REFRESH_TOKEN\n`)

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(
        '<h1>Success!</h1><p>Refresh token is shown in the terminal. You can close this page.</p>'
      )
    } else {
      console.error('No refresh_token in response:', tokens)
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end(`<h1>Error</h1><pre>${JSON.stringify(tokens, null, 2)}</pre>`)
    }
  } catch (err) {
    console.error('Token exchange failed:', err)
    res.writeHead(500, { 'Content-Type': 'text/html' })
    res.end(`<h1>Error</h1><pre>${err.message}</pre>`)
  }

  server.close()
})

const port = new URL(REDIRECT_URI).port || 3000
server.listen(port)
