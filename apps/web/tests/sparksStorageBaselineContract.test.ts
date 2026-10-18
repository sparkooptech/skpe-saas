import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

type Bucket = { id: string; public: boolean; maxBytes: number; objects: number }
type Policy = { name: string; cmd: string; role: string; using: boolean; check: boolean }
const baseline = JSON.parse(readFileSync(new URL('./sparksStorageDevBaseline.json', import.meta.url), 'utf8')) as {
  source: string; buckets: Bucket[]; policies: Policy[]
}
const commands = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

test('G3 fixture: all four source buckets are private and have explicit size limits', () => {
  assert.equal(baseline.buckets.length, 4)
  assert.equal(new Set(baseline.buckets.map(b => b.id)).size, 4)
  for (const bucket of baseline.buckets) {
    assert.equal(bucket.public, false, bucket.id)
    assert.ok(bucket.maxBytes > 0, bucket.id)
  }
})

test('G3 fixture: empty methodology bucket must not be discarded', () => {
  const methodology = baseline.buckets.find(b => b.id === 'methodology-artifacts')
  assert.ok(methodology)
  assert.equal(methodology.objects, 0)
  assert.equal(baseline.buckets.reduce((n, b) => n + b.objects, 0), 15)
})

test('G3 fixture: all 24 storage policies are authenticated-only', () => {
  assert.equal(baseline.policies.length, 24)
  assert.equal(new Set(baseline.policies.map(p => p.name)).size, 24)
  for (const policy of baseline.policies) {
    assert.equal(policy.role, 'authenticated', policy.name)
    assert.ok(commands.includes(policy.cmd), policy.name)
  }
})

test('G3 fixture: every bucket policy family covers CRUD operations', () => {
  for (const family of ['organization_branding', 'p_methodology_storage', 'sparks_evidence_storage']) {
    const policies = baseline.policies.filter(p => p.name.startsWith(family + '_'))
    assert.deepEqual(policies.map(p => p.cmd).sort(), [...commands].sort(), family)
  }
  for (const role of ['own', 'organization_admin', 'super_admin']) {
    const policies = baseline.policies.filter(p => p.name.startsWith('user_avatars_') && p.name.endsWith('_' + role))
    assert.deepEqual(policies.map(p => p.cmd).sort(), [...commands].sort(), role)
  }
})

test('G3 fixture: write policies include WITH CHECK and reads/deletes include USING', () => {
  for (const p of baseline.policies) {
    assert.equal(p.using, p.cmd !== 'INSERT', p.name)
    assert.equal(p.check, p.cmd === 'INSERT' || p.cmd === 'UPDATE', p.name)
  }
})
