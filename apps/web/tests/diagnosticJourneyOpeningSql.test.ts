import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
const sql = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018134500_create_governed_skda_journey_opening.sql', import.meta.url)), 'utf8')
test('DA opening is server-governed and module-gated', () => {
  assert.match(sql, /security definer set search_path = ''/)
  assert.match(sql, /public\.is_organization_admin\(target_organization_id\)/)
  assert.match(sql, /m\.code = 'SK-DA' and m\.status = 'active'/)
  assert.match(sql, /grant execute on function public\.create_skda_journey/)
})
test('DA opening is atomic and idempotent with canonical initiative', () => {
  assert.match(sql, /pg_advisory_xact_lock/)
  assert.match(sql, /v_existing\.command_fingerprint <> v_fingerprint/)
  assert.match(sql, /public\.create_sparks_initiative\(/)
  assert.match(sql, /target_category_code => 'operational'/)
  assert.match(sql, /insert into public\.skda_journeys/)
  assert.match(sql, /insert into public\.skda_journey_audit/)
})
