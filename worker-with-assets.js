// Worker that properly handles static assets for OpenNext
import baseWorker from './.open-next/worker.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Check if this is a request for a static asset
    if (
      url.pathname.startsWith('/_next/static/') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname === '/favicon.ico' ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg')
    ) {
      // Try modern ASSETS binding first
      if (env.ASSETS) {
        try {
          // ASSETS binding handles the request directly
          const assetResponse = await env.ASSETS.fetch(request)

          if (assetResponse.status === 200) {
            // Clone response to add cache headers
            const response = new Response(assetResponse.body, assetResponse)
            response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
            return response
          }
        } catch (e) {
          console.error('Error serving static asset from ASSETS:', e)
        }
      }

      // Asset not found
      console.log('Static asset not found:', url.pathname)
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    // For all other requests, use the OpenNext worker
    return baseWorker.fetch(request, env, ctx)
  },
}
