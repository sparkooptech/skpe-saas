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

export const supabase = createClient(
  backend.apiUrl,
  backend.publishableKey,
)