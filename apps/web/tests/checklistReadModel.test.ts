import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateChecklistProgress, checklistStatusLabels, type ChecklistExecutionItemView } from '../src/modules/checklists/contracts/checklistReadModel.ts'

function item(status: ChecklistExecutionItemView['status'], required = false, justification: string | null = null): ChecklistExecutionItemView {
  return { id: crypto.randomUUID(), templateItemId: crypto.randomUUID(), code: 'R1', name: 'Requisito', description: null, required, displayOrder: 1, status, assignedUserId: null, dueDate: null, justification, evidenceCount: 0 }
}

test('empty checklist never reports full progress', () => {
  assert.deepEqual(calculateChecklistProgress([]), { total: 0, resolved: 0, pending: 0, blocked: 0, requiredPending: 0, percent: 0 })
})

test('progress and completion gate are independent', () => {
  assert.deepEqual(calculateChecklistProgress([item('fulfilled', true), item('partially_fulfilled', true), item('blocked')]), {
    total: 3, resolved: 2, pending: 1, blocked: 1, requiredPending: 1, percent: 67,
  })
})

test('mandatory non-applicability requires justification', () => {
  assert.equal(calculateChecklistProgress([item('not_applicable', true)]).requiredPending, 1)
  assert.equal(calculateChecklistProgress([item('not_applicable', true, 'Justificativa documentada')]).requiredPending, 0)
})

test('all execution states have Portuguese labels', () => {
  assert.equal(Object.keys(checklistStatusLabels).length, 5)
  assert.equal(checklistStatusLabels.under_review, 'Em revisão')
})
