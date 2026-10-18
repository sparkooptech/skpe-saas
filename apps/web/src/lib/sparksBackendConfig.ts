/** Backend transition contract. No automatic cutover. */
export type SparksBackendTarget = 'supabase-managed' | 'hostinger-compatible'
export function resolveSparksBackendConfig(env: Record<string, string | undefined>) {
  const target = env.VITE_SPARKS_BACKEND_TARGET ?? 'supabase-managed'
  if (target !== 'supabase-managed' && target !== 'hostinger-compatible') throw new Error('Invalid SPARKs backend target')
  const apiUrl = env.VITE_SUPABASE_URL?.trim() ?? ''
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''
  if (!apiUrl || !publishableKey) throw new Error('Incomplete SPARKs backend configuration')
  let parsed: URL
  try { parsed = new URL(apiUrl) } catch { throw new Error('Invalid SPARKs API URL') }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Invalid SPARKs API scheme or credentials')
  if (target === 'hostinger-compatible' && parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) throw new Error('Hostinger API requires HTTPS')
  return { target: target as SparksBackendTarget, apiUrl: parsed.toString(), publishableKey }
}
