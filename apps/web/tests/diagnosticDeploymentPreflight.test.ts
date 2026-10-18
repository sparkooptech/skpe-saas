import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = new URL('../../../supabase/', import.meta.url)
const preflight = readFileSync(fileURLToPath(new URL('verification/skda_deployment_preflight_readonly.sql', root)), 'utf8')
const gate = readFileSync(fileURLToPath(new URL('verification/SKDA_DEPLOYMENT_GATE.md', root)), 'utf8')
const migrationFiles = [
  '20261018052000_create_sparks_checklist_execution_foundation.sql',
  '20261018053000_create_governed_checklist_execution_rpc.sql',
  '20261018054000_govern_sparks_checklist_items_and_evidence.sql',
  '20261018055000_govern_sparks_checklist_lifecycle.sql',
  '20261018131000_read_sparks_checklist_execution.sql',
  '20261018133000_create_skda_journey_foundation.sql',
  '20261018134500_create_governed_skda_journey_opening.sql',
  '20261018135500_read_governed_skda_journey.sql',
]

test('DA deployment gate lists all migrations in canonical order', () => {
  let previous = -1
  for (const filename of migrationFiles) {
    assert.ok(readFileSync(fileURLToPath(new URL(`migrations/${filename}`, root)), 'utf8').length > 0)
    const position = gate.indexOf(filename)
    assert.ok(position > previous, `Missing or out-of-order migration: ${filename}`)
    previous = position
  }
})

test('DA preflight is read-only and inspects prerequisites', () => {
  assert.doesNotMatch(preflight.replace(/--[^\n]*/g, ''), /\b(insert|update|delete|alter|drop|create|truncate|grant|revoke|execute|call)\b/i)
  for (const prerequisite of ['sparks_checklist_executions','skda_journeys','INITIATIVE_CATEGORY','operational','is_organization_admin','create_sparks_initiative']) {
    assert.ok(preflight.includes(prerequisite), `Missing prerequisite: ${prerequisite}`)
  }
})

test('DA preflight reconciles all eight versions against migration ledger', () => {
  const expectedVersions = migrationFiles.map(filename => filename.slice(0, 14))
  for (const version of expectedVersions) {
    assert.match(preflight, new RegExp(`'${version}'`))
  }
  assert.match(preflight, /supabase_migrations\.schema_migrations/)
  assert.match(preflight, /'not_applied'/)
  assert.match(preflight, /'recorded'/)
  assert.match(preflight, /latest_recorded_version/)
})

test('DA deployment remains gated by tested recovery and environment identity', () => {
  assert.match(gate, /RESTAURACAO TESTADA/)
  assert.match(gate, /Hostinger HOMOL/)
  assert.match(gate, /MIGRATIONS_FAILED/)
})
