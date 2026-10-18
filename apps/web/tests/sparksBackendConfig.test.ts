import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSparksBackendConfig } from '../src/lib/sparksBackendConfig.ts'

const base = { VITE_SUPABASE_URL: 'https://api.example.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-test-key' }
test('keeps managed backend as the default', () => {
  const config = resolveSparksBackendConfig(base)
  assert.equal(config.target, 'supabase-managed')
  assert.equal(config.apiUrl, 'https://api.example.test/')
})
test('allows explicitly selected compatible Hostinger endpoint', () => {
  assert.equal(resolveSparksBackendConfig({ ...base, VITE_SPARKS_BACKEND_TARGET: 'hostinger-compatible' }).target, 'hostinger-compatible')
})
test('rejects unknown backend target', () => {
  assert.throws(() => resolveSparksBackendConfig({ ...base, VITE_SPARKS_BACKEND_TARGET: 'unknown' }))
})
test('rejects missing endpoint and key', () => {
  assert.throws(() => resolveSparksBackendConfig({ ...base, VITE_SUPABASE_URL: '' }))
  assert.throws(() => resolveSparksBackendConfig({ ...base, VITE_SUPABASE_PUBLISHABLE_KEY: '' }))
})
test('rejects non-HTTPS remote Hostinger endpoints', () => {
  assert.throws(() => resolveSparksBackendConfig({ ...base, VITE_SPARKS_BACKEND_TARGET: 'hostinger-compatible', VITE_SUPABASE_URL: 'http://hostinger.example.test' }))
})
test('rejects embedded URL credentials', () => {
  assert.throws(() => resolveSparksBackendConfig({ ...base, VITE_SUPABASE_URL: 'https://user:pass@api.example.test' }))
})
