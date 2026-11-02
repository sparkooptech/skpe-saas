import test from 'node:test'
import assert from 'node:assert/strict'
import { cooperativeBranchCardLabel } from '../src/lib/cooperativeBranchDisplay.ts'

test('card uses TPBS without modifying the canonical name', () => {
  assert.equal(cooperativeBranchCardLabel('Trabalho, Produção de Bens e Serviços'), 'TPBS')
  assert.equal(cooperativeBranchCardLabel('TRABALHO_PRODUCAO_BENS_SERVICOS'), 'TPBS')
  assert.equal(cooperativeBranchCardLabel('Trabalho, Produção de Bens e Serviços'), 'TPBS')
})

test('other official branches and system labels are preserved', () => {
  assert.equal(cooperativeBranchCardLabel('Agropecuário'), 'Agropecuário')
  assert.equal(cooperativeBranchCardLabel('Infraestrutura'), 'Infraestrutura')
  assert.equal(cooperativeBranchCardLabel('Todos os Ramos'), 'Todos os Ramos')
  assert.equal(cooperativeBranchCardLabel(null), 'Ramo não informado')
})
