import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSparksBackendConfig } from '../src/lib/sparksBackendConfig.ts'

const base = {
  VITE_SUPABASE_URL: 'https://api.example.test',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'synthetic-public-key',
}

test('G3: managed Supabase remains the default without opt-in', () => {
  const config = resolveSparksBackendConfig(base)
  assert.equal(config.target, 'supabase-managed')
  assert.equal(config.apiUrl, 'https://api.example.test/')
})

test('G3: Hostinger-compatible endpoint requires explicit opt-in', () => {
  const config = resolveSparksBackendConfig({
    ...base,
    VITE_SPARKS_BACKEND_TARGET: 'hostinger-compatible',
    VITE_SUPABASE_URL: 'https://hostinger.example.test',
  })
  assert.equal(config.target, 'hostinger-compatible')
  assert.equal(config.apiUrl, 'https://hostinger.example.test/')
})

test('G3: incompatible backend target is rejected', () => {
  assert.throws(() => resolveSparksBackendConfig({ ...base, VITE_SPARKS_BACKEND_TARGET: 'other' }))
})

test('G3: Hostinger-compatible backend rejects plaintext HTTP', () => {
  assert.throws(() => resolveSparksBackendConfig({
    ...base,
    VITE_SPARKS_BACKEND_TARGET: 'hostinger-compatible',
    VITE_SUPABASE_URL: 'http://hostinger.example.test',
  }))
})

test('G3: local loopback HTTP is allowed for isolated fixtures', () => {
  const config = resolveSparksBackendConfig({
    ...base,
    VITE_SPARKS_BACKEND_TARGET: 'hostinger-compatible',
    VITE_SUPABASE_URL: 'http://127.0.0.1:9876',
  })
  assert.equal(config.apiUrl, 'http://127.0.0.1:9876/')
})

test('G3: credentials in URL are rejected', () => {
  assert.throws(() => resolveSparksBackendConfig({
    ...base,
    VITE_SUPABASE_URL: 'https://user:pass@api.example.test',
  }))
})

test('G3: incomplete endpoint or key is rejected', () => {
  assert.throws(() => resolveSparksBackendConfig({ ...base, VITE_SUPABASE_URL: '' }))
  assert.throws(() => resolveSparksBackendConfig({ ...base, VITE_SUPABASE_PUBLISHABLE_KEY: '' }))
})
