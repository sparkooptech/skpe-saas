import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const cockpit = readFileSync(new URL('../src/modules/skpe/SkpeCockpit.tsx', import.meta.url), 'utf8')
const tabs = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicFormulationStatusTabs.tsx', import.meta.url), 'utf8')
const pending = readFileSync(new URL('../src/modules/skpe/workspace/MyPendingItemsPanel.tsx', import.meta.url), 'utf8')
const notifications = readFileSync(new URL('../src/modules/skpe/workspace/MyNotificationsPanel.tsx', import.meta.url), 'utf8')
const i18n = readFileSync(new URL('../src/shared/i18n/ptBR.ts', import.meta.url), 'utf8')

test('Formulação keeps all operational tabs visible independently of internal methodology stage', () => {
  assert.match(tabs, /label: 'Mapa Estratégico'/)
  assert.match(tabs, /label: 'Desdobramento em OKRs'/)
  assert.match(tabs, /label: 'Indicadores e Metas'/)
  assert.match(tabs, /label: 'Plano de Iniciativas'/)
  assert.match(tabs, /label: 'Governança da Execução'/)
  assert.match(tabs, /return allTabs/)
  assert.doesNotMatch(tabs, /return allTabs\.slice/)
  assert.doesNotMatch(tabs, /Ativação e Iniciativas/)
})

test('Acompanhamento e Evolução Contínua exposes execution, monitoring, meetings and evolution cycles', () => {
  assert.match(cockpit, /Acompanhamento e Evolução Contínua/)
  assert.match(cockpit, /Execução Estratégica/)
  assert.match(cockpit, /Monitoramento Estratégico/)
  assert.match(cockpit, /Reuniões e Agenda/)
  assert.match(cockpit, /Ciclos de Evolução/)
  assert.match(cockpit, /activeSection === 'meetings'/)
  assert.match(cockpit, /<MyMeetingsPanel/)
  assert.match(cockpit, /<AgendaSection/)
})

test('personal workspace does not expose internal journey codes', () => {
  assert.doesNotMatch(pending, /\{item\.source_code && <span>\{item\.source_code\}<\/span>\}/)
  assert.doesNotMatch(notifications, /\{item\.source_code && <span>\{item\.source_code\}<\/span>\}/)
  assert.match(pending, /Há uma etapa anterior que precisa ser concluída antes deste item/)
})

test('backend methodology codes are translated before reaching the user', () => {
  assert.match(i18n, /containsInternalMethodologyCode/)
  assert.match(i18n, /PEM-/)
  assert.match(i18n, /dependência anterior ou uma regra de validação ainda não atendida/)
})