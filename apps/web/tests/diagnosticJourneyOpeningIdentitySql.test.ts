import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const sql = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018134500_create_governed_skda_journey_opening.sql', import.meta.url)), 'utf8')

test('DA opening only accepts active consultant and representative profiles', () => {
  assert.match(sql, /p\.id = target_consultant_user_id and p\.active = true/)
  assert.match(sql, /p\.id = target_provisional_representative_user_id and p\.active = true/)
})

test('DA opening requires active organization membership for a distinct provisional representative', () => {
  assert.match(sql, /target_provisional_representative_user_id <> target_consultant_user_id/)
  assert.match(sql, /membership\.organization_id = target_organization_id/)
  assert.match(sql, /membership\.user_id = target_provisional_representative_user_id/)
  assert.match(sql, /membership\.status = 'active'/)
  assert.match(sql, /membership\.valid_from <= timezone\('utc',now\(\)\)/)
  assert.match(sql, /membership\.valid_until is null or membership\.valid_until >= timezone\('utc',now\(\)\)/)
})

test('DA opening keeps provisional consultant exception and idempotent canonical initiative', () => {
  assert.match(sql, /-- A provisional representative may be the SPARKOOP consultant before kickoff/)
  assert.match(sql, /target_provisional_representative_user_id <> target_consultant_user_id/)
  assert.match(sql, /perform pg_catalog\.pg_advisory_xact_lock/)
  assert.match(sql, /public\.create_sparks_initiative/)
  assert.match(sql, /'provisional_representative',true/)
})
