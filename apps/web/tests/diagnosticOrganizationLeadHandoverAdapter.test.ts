import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const source = readFileSync(fileURLToPath(new URL('../src/modules/skda/data/diagnosticJourneyData.ts', import.meta.url)), 'utf8')
const handover = source.split('export async function assignDiagnosticOrganizationLead')[1]

test('DA client handover uses only governed RPC with organization scope', () => {
  assert.ok(handover)
  assert.match(handover, /supabase\.rpc\('assign_skda_organization_lead'/)
  assert.match(handover, /target_organization_id: command\.organizationId/)
  assert.match(handover, /target_journey_id: command\.journeyId/)
  assert.match(handover, /target_representative_user_id: command\.representativeUserId/)
  assert.doesNotMatch(handover, /\.from\('skda_journeys'\)/)
})

test('DA client handover validates UUIDs, reason and returned journey identity', () => {
  assert.match(handover, /\.every\(value => uuid\.test\(value\)\)/)
  assert.match(handover, /command\.changeReason\.trim\(\)\.length < 10/)
  assert.match(handover, /if \(data !== command\.journeyId\)/)
})
