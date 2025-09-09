/**
 * OpenNext Configuration for Cloudflare Workers
 *
 * Note: Incremental cache and tag cache are intentionally disabled.
 * This app doesn't use ISR/SSG or cache revalidation features.
 * The warnings during build are expected and can be ignored.
 */
const config = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },

  edgeExternals: ['node:crypto'],

  middleware: {
    external: true,
    override: {
      wrapper: 'cloudflare-edge',
      converter: 'edge',
      proxyExternalRequest: 'fetch',
      incrementalCache: 'dummy',
      tagCache: 'dummy',
      queue: 'dummy',
    },
  },

  // Build output directory
  outputDir: '.worker-next',

  // Enable debug mode for troubleshooting
  debug: false,

  // Dangerous options - use with caution
  dangerous: {
    // Disable tag cache if not needed
    disableTagCache: true,
    // Disable incremental cache for Cloudflare
    disableIncrementalCache: true,
  },
}

export default config
