import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const sql = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018133000_create_skda_journey_foundation.sql', import.meta.url)), 'utf8')

test('DA journey belongs to canonical organization and initiative', () => {
  assert.match(sql, /organization_id uuid not null references public\.organizations\(id\)/)
  assert.match(sql, /initiative_id uuid not null references public\.sparks_initiatives\(id\)/)
  assert.match(sql, /unique \(initiative_id\)/)
})

test('DA journey preserves instrument, cycle, consultant and provisional organization representative', () => {
  for (const field of ['instrument_id', 'assessment_cycle_id', 'consultant_user_id', 'organization_representative_user_id', 'representative_is_provisional', 'checklist_execution_id']) assert.ok(sql.includes(field))
})

test('DA storage defaults to deny, with unique opening key and audit', () => {
  assert.match(sql, /unique \(organization_id,idempotency_key\)/)
  assert.match(sql, /enable row level security/g)
  assert.match(sql, /revoke all on public\.skda_journeys,public\.skda_journey_audit from public,anon,authenticated/)
  assert.match(sql, /create table if not exists public\.skda_journey_audit/)
})
