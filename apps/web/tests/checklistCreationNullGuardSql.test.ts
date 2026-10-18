import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const sql = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018053000_create_governed_checklist_execution_rpc.sql', import.meta.url)), 'utf8')

test('CORE checklist creation rejects missing required identifiers explicitly', () => {
  assert.match(sql, /target_organization_id is null or target_template_version_id is null or target_id is null/)
  assert.match(sql, /target_type is null/)
  assert.ok(sql.indexOf('target_organization_id is null') < sql.indexOf('public.is_organization_admin(target_organization_id)'))
})

test('CORE checklist creation retains tenant/module/template gates and atomic item copy', () => {
  assert.match(sql, /m\.code = v_module and m\.status = 'active'/)
  assert.match(sql, /v\.status = 'published' and t\.active = true/)
  assert.match(sql, /on conflict \(organization_id, module_code, idempotency_key\) do nothing/)
  assert.match(sql, /insert into public\.sparks_checklist_execution_items/)
  assert.match(sql, /insert into public\.sparks_checklist_audit/)
})
