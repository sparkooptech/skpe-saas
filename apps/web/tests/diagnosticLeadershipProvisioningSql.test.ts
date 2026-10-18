import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const migration = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018134000_seed_skda_leadership_roles.sql', import.meta.url)), 'utf8')
const opening = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018134500_create_governed_skda_journey_opening.sql', import.meta.url)), 'utf8')

test('SK-DA creates separate SPARKOOP and organizational leadership roles', () => {
  assert.match(migration, /'sparkoop_lead'/)
  assert.match(migration, /'organization_lead'/)
  assert.match(migration, /'journeys.open'/)
  assert.match(migration, /'initiatives.manage'/)
  assert.match(migration, /'journeys.read'/)
})

test('Ricardo provisioning uses verified identity and never activates a tenant', () => {
  assert.match(migration, /lower\(p.email\) = 'ricardo.rodrigues@sparkoop.com'/)
  assert.match(migration, /membership\.status = 'active'/)
  assert.match(migration, /om\.enabled = true and om\.status in \('trial','active'\)/)
  assert.match(migration, /m\.status = 'active'/)
  assert.doesNotMatch(migration, /update\s+public\.modules\s+set\s+status/i)
  assert.doesNotMatch(migration, /insert into public\.organization_modules/i)
  assert.doesNotMatch(migration, /super_admin/i)
})

test('DA opening requires tenant-scoped SPARKOOP leader and authorized operator', () => {
  assert.match(opening, /public\.has_module_permission\(target_organization_id,'SK-DA','journeys.open'\)/)
  assert.match(opening, /mr\.code = 'sparkoop_lead'/)
  assert.match(opening, /umr\.user_id = target_consultant_user_id and umr\.status = 'active'/)
  assert.match(opening, /target_provisional_representative_user_id <> target_consultant_user_id/)
})
