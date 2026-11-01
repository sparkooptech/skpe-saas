import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const cockpit = readFileSync(new URL('../src/modules/skpe/SkpeCockpit.tsx', import.meta.url), 'utf8')
const formulation = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicFormulationSection.tsx', import.meta.url), 'utf8')
const indicators = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicIndicatorWorkspace.tsx', import.meta.url), 'utf8')
const initiatives = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicInitiativePlanSection.tsx', import.meta.url), 'utf8')
const governance = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicExecutionGovernanceWorkspace.tsx', import.meta.url), 'utf8')
const tabs = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicFormulationStatusTabs.tsx', import.meta.url), 'utf8')

test('Formulação Estratégica opens on Mapa Estratégico by default', () => {
  assert.match(cockpit, /initialTab="architecture"/)
})

test('Mapa Estratégico opens directly on the map without readiness or lifecycle overlays', () => {
  const architecture = formulation.split("activeTab === 'architecture'")[1]?.split("activeTab === 'performance'")[0] ?? ''
  assert.match(architecture, /<StrategicBscMap/)
  assert.doesNotMatch(architecture, /Prévia do Modelo Estratégico Futuro/)
  assert.doesNotMatch(architecture, /StrategicArchitectureSummary/)
  assert.doesNotMatch(architecture, /StrategicMapLifecyclePanel/)
})

test('operational formulation tabs do not mount readiness components', () => {
  for (const name of [
    'StrategicIndicatorsReadinessSection',
    'StrategicImplementationActivationReadinessSection',
    'StrategicExecutionGovernanceReadinessSection',
    'StrategicCommunicationMobilizationReadinessSection',
    'StrategicCapabilitiesChangeReadinessSection',
    'StrategicImplementationRiskReadinessSection',
  ]) {
    assert.doesNotMatch(formulation, new RegExp(name))
  }
})

test('technical readiness remains hidden from initiative portfolio', () => {
  assert.match(initiatives, /const showReadinessPanel = false/)
  assert.match(initiatives, /showReadinessPanel && readiness/)
})

test('operational workspaces do not restore Area de trabalho headings', () => {
  assert.doesNotMatch(indicators, /Área de trabalho/)
  assert.doesNotMatch(governance, /Área de trabalho/)
})
test('Governança da Execução keeps its canonical label and exposes meetings', () => {
  assert.match(tabs, /label: 'Governança da Execução'/)
  assert.doesNotMatch(tabs, /'Implementação e Mobilização'/)
  const plan = formulation.split("activeTab === 'plan'")[1] ?? ''
  assert.match(plan, /<StrategicExecutionGovernanceWorkspace/)
  assert.match(plan, /<MyMeetingsPanel/)
})