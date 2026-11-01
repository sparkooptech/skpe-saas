import { createClient } from '@supabase/supabase-js'

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

const normalizedSupabaseUrl = supabaseUrl.replace(/\/+$/, '')
const cloudRestPrefix = `${normalizedSupabaseUrl}/rest/v1`

const routedFetch: typeof fetch = (input, init) => {
  const originalUrl =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.toString()
        : input

  if (
    typeof window === 'undefined' ||
    !originalUrl.startsWith(cloudRestPrefix)
  ) {
    return fetch(input, init)
  }

  const routedUrl =
    `${window.location.origin}/rest/v1` +
    originalUrl.slice(cloudRestPrefix.length)

  if (input instanceof Request) {
    return fetch(new Request(routedUrl, input), init)
  }

  return fetch(routedUrl, init)
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    global: {
      fetch: routedFetch,
    },
  },
)
