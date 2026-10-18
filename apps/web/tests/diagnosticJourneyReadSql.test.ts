import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
const sql = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018135500_read_governed_skda_journey.sql', import.meta.url)), 'utf8')
test('DA read denies direct anonymous access and scopes tenant identity', () => {
  assert.match(sql, /security definer set search_path = ''/)
  assert.match(sql, /public\.is_organization_admin\(target_organization_id\)/)
  assert.match(sql, /id = target_journey_id and organization_id = target_organization_id/)
  assert.match(sql, /revoke all on function public\.get_skda_journey\(uuid,uuid\) from public,anon/)
})
test('DA read returns canonical initiative and provisional role separately', () => {
  for (const key of ['initiativeId','instrumentId','assessmentCycleId','consultantUserId','organizationRepresentativeUserId','representativeIsProvisional']) assert.ok(sql.includes(`'${key}'`))
})
