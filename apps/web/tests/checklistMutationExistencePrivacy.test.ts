import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const sql = (name: string) => readFileSync(fileURLToPath(new URL(`../../../supabase/migrations/${name}`, import.meta.url)), 'utf8')
const itemSql = sql('20261018054000_govern_sparks_checklist_items_and_evidence.sql')
const lifecycleSql = sql('20261018055000_govern_sparks_checklist_lifecycle.sql')

function assertSameUnavailableResponse(body: string, resource: 'Checklist' | 'Item') {
  const message = `${resource} indisponivel ou acesso nao autorizado.`
  const matches = [...body.matchAll(/raise exception '([^']+)' using errcode = '42501';/g)].map(match => match[1])
  assert.equal(matches.filter(value => value === message).length, 2, `Missing consistent not-found and unauthorized responses for ${resource}`)
}

test('checklist item assessment hides existence from unauthorized callers', () => {
  const body = itemSql.split('create or replace function public.attach_sparks_checklist_evidence')[0]
  assertSameUnavailableResponse(body, 'Checklist')
  assert.match(body, /public\.is_organization_admin\(v_execution\.organization_id\)/)
})

test('evidence attachment hides execution item existence from unauthorized callers', () => {
  const body = itemSql.split('create or replace function public.attach_sparks_checklist_evidence')[1]
  assertSameUnavailableResponse(body, 'Item')
  assert.match(body, /public\.can_manage_sparks_evidence\(v_execution\.organization_id\)/)
})

test('checklist lifecycle hides execution existence from unauthorized callers', () => {
  assertSameUnavailableResponse(lifecycleSql, 'Checklist')
  assert.match(lifecycleSql, /public\.is_organization_admin\(v_execution\.organization_id\)/)
})
