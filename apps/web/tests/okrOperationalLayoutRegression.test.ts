import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const decomposition = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicOkrDecompositionSection.tsx', import.meta.url), 'utf8')
const workspace = readFileSync(new URL('../src/modules/skpe/features/strategy/StrategicOkrWorkspace.tsx', import.meta.url), 'utf8')

test('OKR readiness remains calculated but does not occupy the operational tab', () => {
  assert.match(decomposition, /get_skpe_okr_deployment_readiness/)
  assert.match(decomposition, /const showReadinessPanel = false/)
  assert.match(decomposition, /showReadinessPanel && readiness/)
  assert.doesNotMatch(decomposition, /\{readiness \? \(/)
})

test('methodological guide is collapsed by default and available on demand', () => {
  assert.match(decomposition, /<details className="skpe-okr-methodology-guide">/)
  assert.match(decomposition, /<summary>Como ler o desdobramento<\/summary>/)
  assert.doesNotMatch(decomposition, /<details className="skpe-okr-methodology-guide" open/)
})

test('readiness error does not suppress operational data', () => {
  const block = decomposition.split('const responses = [')[1]?.split('const firstError')[0] ?? ''
  assert.doesNotMatch(block, /readinessResponse,/)
  assert.match(decomposition, /setReadiness/)
})

test('OKR workspace does not restore a redundant area-of-work header', () => {
  assert.doesNotMatch(workspace, /<header><div><span>Área de trabalho<\/span>/)
})
