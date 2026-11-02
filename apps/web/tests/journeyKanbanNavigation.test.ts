import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const journey = readFileSync(new URL('../src/modules/skpe/features/journey/JourneySection.tsx', import.meta.url), 'utf8')
const kanban = readFileSync(new URL('../src/modules/skpe/features/journey/JourneyKanban.tsx', import.meta.url), 'utf8')

test('Journey KANBAN stays inside Jornada instead of navigating to initiatives', () => {
  assert.match(journey, /onClick=\{\(\) => setJourneyView\('kanban'\)\}/)
  assert.match(journey, /journeyView === 'kanban' \? \(/)
  assert.match(journey, /<JourneyKanban\s+organizationId=\{organizationId\}\s+projectId=\{project\.project_id\}/)
  assert.doesNotMatch(journey, /aria-pressed="false" onClick=\{onOpenInitiatives\}>\s*KANBAN/)
})

test('Journey KANBAN resolves the linked strategic project and embeds the canonical operational board', () => {
  assert.match(kanban, /skpe_project_initiative_bindings/)
  assert.match(kanban, /binding_type', 'strategic_plan_implementation'/)
  assert.match(kanban, /can_manage_sparks_initiatives/)
  assert.match(kanban, /<InitiativeKanbanBoard/)
  assert.match(kanban, /initiativeId=\{initiativeId\}/)
  assert.doesNotMatch(kanban, /row\.item_status === status/)
  assert.doesNotMatch(kanban, /item\.item_code/)
})