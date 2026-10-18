import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const read = (path: string) => readFileSync(fileURLToPath(new URL(`../../../supabase/migrations/${path}`, import.meta.url)), 'utf8')
const checklist = read('20261018131000_read_sparks_checklist_execution.sql')
const journey = read('20261018135500_read_governed_skda_journey.sql')

test('CORE checklist read authorizes tenant before revealing record existence', () => {
  const authentication = checklist.indexOf('auth.uid() is null')
  const permission = checklist.indexOf('public.is_organization_admin(target_organization_id)')
  const lookup = checklist.indexOf('from public.sparks_checklist_executions')
  assert.ok(authentication >= 0 && authentication < permission)
  assert.ok(permission < lookup, 'Checklist existence lookup must follow tenant authorization')
  assert.match(checklist, /target_execution_id is null or target_organization_id is null/)
  assert.match(checklist, /where id = target_execution_id and organization_id = target_organization_id/)
})

test('SK-DA read uses the same deny-before-lookup policy', () => {
  const authentication = journey.indexOf('auth.uid() is null')
  const permission = journey.indexOf('public.is_organization_admin(target_organization_id)')
  const lookup = journey.indexOf('from public.skda_journeys')
  assert.ok(authentication >= 0 && authentication < permission)
  assert.ok(permission < lookup)
  assert.match(journey, /target_organization_id is null or target_journey_id is null/)
})
