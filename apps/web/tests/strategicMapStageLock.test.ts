import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const formulation = readFileSync(
  new URL('../src/modules/skpe/features/strategy/StrategicFormulationSection.tsx', import.meta.url),
  'utf8',
)
const cockpit = readFileSync(
  new URL('../src/modules/skpe/SkpeCockpit.tsx', import.meta.url),
  'utf8',
)

test('strategic map stays read-only before PEM-02.05 without adding a preview overlay', () => {
  assert.match(formulation, /strategicMapStageUnlocked: boolean/)
  assert.doesNotMatch(formulation, /Prévia do Modelo Estratégico Futuro/)
  assert.match(formulation, /canAdjustLayout=\{canAdjustStrategicMap && strategicMapStageUnlocked\}/)
  assert.match(cockpit, /current_stage_code === 'PEM-02\.05'/)
})
