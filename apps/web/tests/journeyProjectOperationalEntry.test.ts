import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const projectPlan = readFileSync(new URL('../src/modules/skpe/features/journey/JourneyProjectPlan.tsx', import.meta.url), 'utf8')

test('Journey Project Plan provides operational entry for scope, team, schedule and resources', () => {
  assert.match(projectPlan, /update_sparks_initiative_5w2h/)
  assert.match(projectPlan, /Salvar escopo do Projeto/)
  assert.match(projectPlan, /assign_skpe_responsibility/)
  assert.match(projectPlan, /end_skpe_responsibility/)
  assert.match(projectPlan, /Adicionar à equipe/)
  assert.match(projectPlan, /<JourneySchedulePlanner/)
  assert.match(projectPlan, /<PersonCapacityManagementDialog/)
  assert.match(projectPlan, /Registrar ou editar capacidade/)
})

test('Journey Project Plan reuses canonical contracts instead of creating parallel data sources', () => {
  assert.match(projectPlan, /target_object_type: 'strategic_project'/)
  assert.match(projectPlan, /target_object_id: projectId/)
  assert.match(projectPlan, /can_manage_sparks_initiatives/)
  assert.match(projectPlan, /can_manage_sparks_people/)
  assert.doesNotMatch(projectPlan, /A edição operacional permanece na iniciativa vinculada/)
})