import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const panel = readFileSync(new URL('../src/modules/evidence/EvidenceIntakePanel.tsx', import.meta.url), 'utf8')
const workspace = readFileSync(new URL('../src/modules/evidence/EvidenceManagementWorkspace.tsx', import.meta.url), 'utf8')
const migration = readFileSync(new URL('../../../supabase/migrations/20261102010323_create_transversal_evidence_intake_sources.sql', import.meta.url), 'utf8')
const edge = readFileSync(new URL('../../../supabase/functions/evidence-intake-scan/index.ts', import.meta.url), 'utf8')

test('Evidence workspace exposes governed document-source intake', () => {
  assert.match(workspace, /<EvidenceIntakePanel/)
  assert.match(panel, /Varrer fonte documental/)
  assert.match(panel, /SharePoint/)
  assert.match(panel, /Intake inteligente · SK-DOC → SK-PE/)
  assert.match(panel, /Nenhum critério é considerado atendido até validação humana/)
  assert.match(panel, /Potencial de atendimento/)
  assert.match(panel, /Validar e incorporar/)
})

test('Intake persists canonical source and candidate review before governed effects', () => {
  assert.match(migration, /sparks_evidence_intake_sources/)
  assert.match(migration, /sparks_evidence_intake_candidates/)
  assert.match(migration, /custodian_module_code text not null default 'SK-DOC'/)
  assert.match(migration, /suggested_compliance_level integer/)
  assert.match(migration, /reviewed_compliance_level integer/)
  assert.match(migration, /accept_sparks_evidence_intake_candidate/)
  assert.match(migration, /assess_skpe_evidence_checklist_item/)
  assert.match(migration, /source_locator/)
  assert.match(migration, /source_external_key/)
})

test('SharePoint scanner uses Microsoft Graph and only proposes candidates', () => {
  assert.match(edge, /MS_GRAPH_TENANT_ID/)
  assert.match(edge, /MS_GRAPH_CLIENT_ID/)
  assert.match(edge, /MS_GRAPH_CLIENT_SECRET/)
  assert.match(edge, /graph.microsoft.com\/v1.0\/shares/)
  assert.match(edge, /suggested_axis_codes/)
  assert.match(edge, /suggested_compliance_level/)
  assert.match(edge, /human_validation_required: true/)
  assert.doesNotMatch(edge, /accept_sparks_evidence_intake_candidate/)
})
