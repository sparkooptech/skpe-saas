import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const workspace = readFileSync(new URL('../src/modules/platform-workspace/PlatformPersonalWorkspace.tsx', import.meta.url), 'utf8')
const branchDisplay = readFileSync(new URL('../src/lib/cooperativeBranchDisplay.ts', import.meta.url), 'utf8')
const migration = readFileSync(new URL('../../../supabase/migrations/20261102124000_normalize_cooperative_branch_short_names.sql', import.meta.url), 'utf8')

test('Meu Espaco is a SPARKs platform workspace and preserves organization context', () => {
  assert.match(app, /PlatformPersonalWorkspace/)
  assert.match(app, /currentRoute\.kind === 'workspace'/)
  assert.match(app, /setOpenedModule\(null\)/)
  assert.doesNotMatch(app, /currentRoute\.kind === 'workspace'[\s\S]{0,220}setSelectedOrganization\(null\)/)
  assert.match(app, /navigate\(platformRoutes\.workspace\(\)\)/)
})

test('Platform workspace aggregates transversal agenda and module attention', () => {
  assert.match(workspace, /Meu Espaço de Trabalho · SPARKs/)
  assert.match(workspace, /get_my_sparks_agenda/)
  assert.match(workspace, /Pulso dos módulos/)
  assert.match(workspace, /Agenda SPARKs/)
  assert.match(workspace, /Uma experiência, vários módulos/)
  assert.match(workspace, /modules\.map/)
})

test('TPBS is both a presentation rule and a persisted cooperative branch short name', () => {
  assert.match(branchDisplay, /return 'TPBS'/)
  assert.match(migration, /TRABALHO_PRODUCAO_BENS_SERVICOS'[\s\S]*?'TPBS'/)
  assert.match(migration, /sync_organization_cooperative_branch_short_name/)
  assert.match(migration, /new\.cooperative_branch := branch_short_name/)
  assert.match(migration, /else name/)
})
