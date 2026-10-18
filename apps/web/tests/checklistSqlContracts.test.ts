import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../../../supabase/migrations/', import.meta.url)
const read = (file: string) => readFileSync(new URL(file, root), 'utf8')
const foundation = read('20261018052000_create_sparks_checklist_execution_foundation.sql')
const creation = read('20261018053000_create_governed_checklist_execution_rpc.sql')
const item = read('20261018054000_govern_sparks_checklist_items_and_evidence.sql')
const lifecycle = read('20261018055000_govern_sparks_checklist_lifecycle.sql')

test('all checklist storage tables enable RLS and deny direct authenticated access', () => {
  for (const name of ['sparks_checklist_executions', 'sparks_checklist_execution_items', 'sparks_checklist_item_evidence', 'sparks_checklist_audit']) {
    assert.match(foundation, new RegExp('alter table public\\.' + name + ' enable row level security;', 'i'))
    assert.match(foundation, new RegExp('revoke all on public\\.' + name + ' from public,anon,authenticated;', 'i'))
  }
})

test('all governed RPCs use definer with fixed search path and authenticated grant', () => {
  for (const [sql, name] of [
    [creation, 'create_sparks_checklist_execution'],
    [item, 'assess_sparks_checklist_item'],
    [item, 'attach_sparks_checklist_evidence'],
    [lifecycle, 'transition_sparks_checklist_execution'],
  ]) {
    assert.match(sql, new RegExp('create or replace function public\\.' + name + '\\(', 'i'))
    assert.match(sql, /security definer\s+set search_path = ''/i)
    assert.match(sql, new RegExp('grant execute on function public\\.' + name + '\\(', 'i'))
  }
})

test('execution creation validates module, template and destination scope', () => {
  assert.match(creation, /m\.code = v_module and m\.status = 'active'/)
  assert.match(creation, /v\.status = 'published' and t\.active = true and t\.module_code = v_module/)
  assert.match(creation, /i\.organization_id = target_organization_id/)
  assert.match(creation, /i\.source_module_code = v_module/)
  assert.match(creation, /v_previous_fingerprint is distinct from v_fingerprint/)
})

test('item and evidence commands validate organization scope and audit', () => {
  assert.match(item, /membership\.organization_id = v_execution\.organization_id/)
  assert.match(item, /evidence\.organization_id = v_execution\.organization_id/)
  assert.match(item, /public\.can_manage_sparks_evidence\(v_execution\.organization_id\)/)
  assert.match(item, /'item_assessed'/)
  assert.match(item, /'evidence_attached'/)
})

test('lifecycle blocks unresolved required items and audits transitions', () => {
  assert.match(lifecycle, /template_item\.is_required = true/)
  assert.match(lifecycle, /item\.status = 'not_applicable'/)
  assert.match(lifecycle, /'status_transition'/)
})
