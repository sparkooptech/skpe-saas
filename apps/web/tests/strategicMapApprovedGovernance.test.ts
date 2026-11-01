import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicFormulationSection.tsx', import.meta.url), 'utf8')

test('approved strategic map opens directly on the map without governance overlays', () => {
  assert.match(source, /<StrategicBscMap/)
  assert.doesNotMatch(source, /<StrategicArchitectureSummary/)
  assert.doesNotMatch(source, /<StrategicMapLifecyclePanel/)
  assert.doesNotMatch(source, /Iniciar revisão preservando versão oficial/)
})
