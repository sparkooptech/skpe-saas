import assert from 'node:assert/strict'
import test from 'node:test'
import { parseDiagnosticJourney } from '../src/modules/skda/contracts/diagnosticJourneyRead.ts'

const id = '123e4567-e89b-42d3-a456-426614174000'
const valid = () => ({
  id, organizationId: id, instrumentId: id, assessmentCycleId: id,
  kind: 'assisted_diagnosis', status: 'draft', initiativeId: id,
  checklistExecutionId: null, consultantUserId: id,
  organizationRepresentativeUserId: null, representativeIsProvisional: true,
})

test('DA read adapter accepts a complete governed journey with provisional representative', () => {
  assert.deepEqual(parseDiagnosticJourney(valid()), valid())
})

test('DA read adapter rejects malformed or missing identifiers', () => {
  for (const field of ['id','organizationId','instrumentId','assessmentCycleId','initiativeId','consultantUserId']) {
    assert.throws(() => parseDiagnosticJourney({ ...valid(), [field]: 'wrong' }), /Campo DA invalido/)
    const missing = { ...valid() } as Record<string, unknown>
    delete missing[field]
    assert.throws(() => parseDiagnosticJourney(missing), /Campo DA invalido/)
  }
})

test('DA read adapter rejects invalid optional identity and checklist references', () => {
  assert.throws(() => parseDiagnosticJourney({ ...valid(), checklistExecutionId: 'wrong' }), /Campo DA invalido/)
  assert.throws(() => parseDiagnosticJourney({ ...valid(), organizationRepresentativeUserId: 'wrong' }), /Campo DA invalido/)
  assert.equal(parseDiagnosticJourney({ ...valid(), checklistExecutionId: id, organizationRepresentativeUserId: id }).checklistExecutionId, id)
})

test('DA read adapter rejects unknown journey types, statuses and provisional flags', () => {
  assert.throws(() => parseDiagnosticJourney({ ...valid(), kind: 'other' }), /Modalidade DA invalida/)
  assert.throws(() => parseDiagnosticJourney({ ...valid(), status: 'other' }), /Situacao DA invalida/)
  assert.throws(() => parseDiagnosticJourney({ ...valid(), representativeIsProvisional: 'false' }), /Papel organizacional DA invalido/)
})

test('DA read adapter rejects null, arrays and primitive RPC responses', () => {
  for (const input of [null, [], 'text', 12, false]) {
    assert.throws(() => parseDiagnosticJourney(input), /Resposta DA invalida/)
  }
})
