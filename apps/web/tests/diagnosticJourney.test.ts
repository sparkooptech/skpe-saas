import assert from 'node:assert/strict'
import test from 'node:test'
import { mayApproveAsOrganizationRepresentative, validateDiagnosticJourneyOpening, type DiagnosticJourney } from '../src/modules/skda/contracts/diagnosticJourney.ts'

const uuid = '123e4567-e89b-42d3-a456-426614174000'

test('DA opening requires scoped references and audit reason', () => {
  assert.deepEqual(validateDiagnosticJourneyOpening({ organizationId: uuid, instrumentId: uuid, assessmentCycleId: uuid, kind: 'assisted_diagnosis', consultantUserId: uuid, provisionalRepresentativeUserId: uuid, idempotencyKey: 'da-opening-1', changeReason: 'Abertura autorizada' }), [])
  assert.ok(validateDiagnosticJourneyOpening({ organizationId: '', instrumentId: uuid, assessmentCycleId: uuid, kind: 'assisted_diagnosis', consultantUserId: uuid, provisionalRepresentativeUserId: uuid, idempotencyKey: '', changeReason: 'curta' }).length >= 3)
})

test('provisional organizational representative cannot sign off', () => {
  const journey: DiagnosticJourney = { id: uuid, organizationId: uuid, instrumentId: uuid, assessmentCycleId: uuid, kind: 'assisted_diagnosis', status: 'preparation', initiativeId: uuid, checklistExecutionId: null, consultantUserId: uuid, organizationRepresentativeUserId: uuid, representativeIsProvisional: true }
  assert.equal(mayApproveAsOrganizationRepresentative(journey, uuid), false)
  assert.equal(mayApproveAsOrganizationRepresentative({ ...journey, representativeIsProvisional: false }, uuid), true)
})
