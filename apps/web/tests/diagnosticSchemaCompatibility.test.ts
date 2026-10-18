import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = new URL('../../../supabase/migrations/', import.meta.url)
const read = (name: string) => readFileSync(fileURLToPath(new URL(name, root)), 'utf8')
const foundation = read('20261018133000_create_skda_journey_foundation.sql')
const opening = read('20261018134500_create_governed_skda_journey_opening.sql')
const reading = read('20261018135500_read_governed_skda_journey.sql')
const checklist = read('20261018052000_create_sparks_checklist_execution_foundation.sql')

test('journey read RPC only references columns declared by its foundation', () => {
  const fields = [...reading.matchAll(/v_journey\.([a-z_]+)/g)].map((match) => match[1])
  assert.ok(fields.length >= 10)
  for (const field of fields) assert.match(foundation, new RegExp(`\\b${field}\\s+(uuid|text|boolean|timestamptz)\\b`), `Undeclared column ${field}`)
})

test('journey opening writes only columns declared by its foundation', () => {
  const match = opening.match(/insert into public\.skda_journeys\s*\(([\s\S]*?)\)\s*values\s*\(/i)
  assert.ok(match)
  for (const column of match[1].split(',').map((part) => part.trim())) {
    assert.match(foundation, new RegExp(`\\b${column}\\s+(uuid|text|boolean|timestamptz)\\b`), `Undeclared insert column ${column}`)
  }
})

test('journey checklist FK has its parent in the earlier CORE migration', () => {
  assert.match(foundation, /references public\.sparks_checklist_executions\(id\)/)
  assert.match(checklist, /create table if not exists public\.sparks_checklist_executions/)
})

test('read and write RPCs enforce authenticated organization scope', () => {
  for (const sql of [opening, reading]) {
    assert.match(sql, /auth\.uid\(\) is null/)
    assert.match(sql, /is_organization_admin\(target_organization_id\)/)
    assert.match(sql, /security definer/i)
    assert.match(sql, /grant execute .* to authenticated/i)
  }
  assert.match(opening, /m\.code = 'SK-DA' and m\.status = 'active'/)
  assert.match(opening, /om\.enabled/)
})
