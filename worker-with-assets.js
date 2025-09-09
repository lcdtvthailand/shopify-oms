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
      url.pathname === '/favicon.ico'
    ) {
      // Try Workers Sites KV binding
      if (env.__STATIC_CONTENT) {
        try {
          // Remove leading slash for KV lookup
          const pathKey = url.pathname.substring(1)
          const asset = await env.__STATIC_CONTENT.get(pathKey, {
            type: 'stream',
            cacheTtl: 3600,
          })

          if (asset) {
            // Set appropriate content type
            const headers = new Headers()
            if (url.pathname.endsWith('.css')) {
              headers.set('Content-Type', 'text/css; charset=utf-8')
            } else if (url.pathname.endsWith('.js')) {
              headers.set('Content-Type', 'application/javascript; charset=utf-8')
            } else if (url.pathname.endsWith('.ico')) {
              headers.set('Content-Type', 'image/x-icon')
            }

            // Add cache headers
            headers.set('Cache-Control', 'public, max-age=31536000, immutable')

            return new Response(asset, {
              status: 200,
              headers,
            })
          }
        } catch (e) {
          console.error('Error serving static asset:', e)
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
