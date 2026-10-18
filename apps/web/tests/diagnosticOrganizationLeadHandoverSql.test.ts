import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const sql = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018135000_govern_skda_organization_lead_handover.sql', import.meta.url)), 'utf8')

test('organization leader transfer checks auth and tenant scope before journey lookup', () => {
  assert.match(sql, /auth\.uid\(\) is null/)
  assert.match(sql, /public\.is_organization_admin\(target_organization_id\)/)
  assert.ok(sql.indexOf('public.is_organization_admin(target_organization_id)') < sql.indexOf('select * into v_journey'))
  assert.match(sql, /id = target_journey_id and organization_id = target_organization_id for update/)
})

test('organization leader must be active member distinct from consultant', () => {
  assert.match(sql, /target_representative_user_id = v_journey\.consultant_user_id/)
  assert.match(sql, /membership\.organization_id = target_organization_id/)
  assert.match(sql, /membership\.status = 'active'/)
  assert.match(sql, /membership\.valid_until is null or membership\.valid_until >= timezone\('utc',now\(\)\)/)
})

test('handover is audited and removes provisional status without platform role changes', () => {
  assert.match(sql, /representative_is_provisional = false/)
  assert.match(sql, /'organization_lead\.assigned'/)
  assert.match(sql, /v_journey\.representative_is_provisional/)
  assert.doesNotMatch(sql, /update public\.user_platform_roles/i)
  assert.doesNotMatch(sql, /insert into public\.organization_memberships/i)
})
