import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveChecklistEvidenceTarget, validateChecklistExecutionCommand } from '../src/modules/checklists/contracts/checklistEngine.ts'

const ID = '11111111-1111-4111-8111-111111111111'
const valid = {
  organizationId: ID,
  moduleCode: 'SK-DA',
  templateVersionId: ID,
  targetType: 'skda_journey' as const,
  targetId: ID,
  idempotencyKey: 'journey-opening-2026',
  changeReason: 'Abertura da jornada assistida',
}

test('accepts a DA journey with scoped identity', () => {
  assert.deepEqual(validateChecklistExecutionCommand(valid), [])
  assert.deepEqual(resolveChecklistEvidenceTarget(valid), {
    moduleCode: 'SK-DA', targetType: 'skda_journey', targetId: ID,
  })
})

test('rejects invalid organization, target and idempotency key', () => {
  const errors = validateChecklistExecutionCommand({
    ...valid, organizationId: 'wrong', targetId: 'wrong', idempotencyKey: ' ',
  })
  assert.ok(errors.includes('organizationId must be a UUID'))
  assert.ok(errors.includes('targetId must be a UUID'))
  assert.ok(errors.includes('idempotencyKey is invalid'))
})

test('rejects unsupported module codes and short change reason', () => {
  const errors = validateChecklistExecutionCommand({
    ...valid, moduleCode: '../SK-DA', changeReason: 'short',
  })
  assert.ok(errors.includes('moduleCode is invalid'))
  assert.ok(errors.includes('changeReason must have at least 10 characters'))
})
