import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const sql = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018055000_govern_sparks_checklist_lifecycle.sql', import.meta.url)), 'utf8')

test('empty checklist cannot enter review or completed state', () => {
  assert.match(sql, /target_status in \('under_review','completed'\) and not exists/)
  assert.match(sql, /from public\.sparks_checklist_execution_items item\s+where item\.execution_id = target_execution_id/)
  assert.match(sql, /Checklist sem itens nao pode ser revisado ou concluido/)
  assert.ok(sql.indexOf('Checklist sem itens nao pode ser revisado ou concluido') < sql.indexOf("if target_status = 'under_review'"))
})

test('completion continues requiring mandatory evidence justification', () => {
  assert.match(sql, /template_item\.is_required = true/)
  assert.match(sql, /item\.status = 'not_applicable' and length\(trim\(coalesce\(item\.justification,''\)\)\) < 10/)
  assert.match(sql, /insert into public\.sparks_checklist_audit/)
})
