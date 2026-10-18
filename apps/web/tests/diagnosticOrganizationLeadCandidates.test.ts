import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const sql = readFileSync(fileURLToPath(new URL('../../../supabase/migrations/20261018135200_read_skda_organization_lead_candidates.sql', import.meta.url)), 'utf8')
const data = readFileSync(fileURLToPath(new URL('../src/modules/skda/data/diagnosticJourneyData.ts', import.meta.url)), 'utf8')
const panel = readFileSync(fileURLToPath(new URL('../src/modules/skda/features/DiagnosticOrganizationLeadHandover.tsx', import.meta.url)), 'utf8')

test('candidate directory is organization scoped and requires admin and enabled module', () => {
  assert.match(sql, /public\.is_organization_admin\(target_organization_id\)/)
  assert.match(sql, /membership\.organization_id = target_organization_id/)
  assert.match(sql, /membership\.status = 'active' and p\.active = true/)
  assert.match(sql, /m\.status = 'active' and om\.enabled = true/)
  assert.match(sql, /revoke all on function public\.list_skda_organization_lead_candidates/)
})

test('candidate adapter uses governed RPC and validates response', () => {
  assert.match(data, /supabase\.rpc\('list_skda_organization_lead_candidates'/)
  assert.match(data, /if \(!Array\.isArray\(data\)\)/)
  assert.match(data, /candidate\.user_id/)
})

test('handover panel uses scoped member picker instead of raw UUID entry', () => {
  assert.match(panel, /listDiagnosticOrganizationLeadCandidates\(journey\.organizationId\)/)
  assert.match(panel, /<select id="skda-new-lead"/)
  assert.match(panel, /candidates\.some\(row => row\.userId === representativeUserId\.trim\(\)\)/)
  assert.doesNotMatch(panel, /<input id="skda-new-lead" type="text"/)
})
