import { createClient } from '@supabase/supabase-js'
import { resolveSparksBackendConfig } from './sparksBackendConfig'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL não foi configurada.')
}

if (!supabasePublishableKey) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY não foi configurada.',
  )
}

const backend = resolveSparksBackendConfig({
  VITE_SPARKS_BACKEND_TARGET: import.meta.env.VITE_SPARKS_BACKEND_TARGET,
  VITE_SUPABASE_URL: supabaseUrl,
  VITE_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
})

const normalizedApiUrl = backend.apiUrl.replace(/\/+$/, '')
const businessRestPrefix = `${normalizedApiUrl}/rest/v1`

const routedFetch: typeof fetch = (input, init) => {
  const originalUrl =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.toString()
        : input

  if (
    backend.target !== 'hostinger-compatible' ||
    typeof window === 'undefined' ||
    !originalUrl.startsWith(businessRestPrefix)
  ) {
    return fetch(input, init)
  }

  const routedUrl =
    `${window.location.origin}/rest/v1` +
    originalUrl.slice(businessRestPrefix.length)

  if (input instanceof Request) {
    return fetch(new Request(routedUrl, input), init)
  }

  return fetch(routedUrl, init)
}

export const supabase = createClient(
  backend.apiUrl,
  backend.publishableKey,
  {
    global: {
      fetch: routedFetch,
    },
  },
)