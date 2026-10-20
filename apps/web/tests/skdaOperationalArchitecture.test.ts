import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const workspace = readFileSync(new URL('../src/modules/skda/SkdaWorkspace.tsx', import.meta.url), 'utf8')
const migration = readFileSync(
  new URL('../../../supabase/migrations/20261020202549_create_skda_operational_mvp.sql', import.meta.url),
  'utf8',
)

test('SK-DA is wired as an operational module without replacing SK-PE', () => {
  assert.match(app, /import \{ SkdaWorkspace \}/)
  assert.match(app, /\['SK-PE', 'SK-DA'\]\.includes\(module\.module_code\)/)
  assert.match(app, /openedModule\?\.module_code === 'SK-DA'/)
  assert.match(app, /openedModule\?\.module_code === 'SK-PE'/)
})

test('SK-DA workspace uses the diagnosis domain on the shared platform', () => {
  assert.match(workspace, /\.from\('skda_diagnoses'/)
  assert.match(workspace, /\.from\('skda_evidence_correlations'/)
  assert.match(workspace, /\.from\('skda_interviews'/)
  assert.match(workspace, /\.from\('skda_findings'/)
})

test('DA-02 interview workspace uses the canonical interview domain', () => {
  assert.match(workspace, /\.from\('skda_interviews'/)
  assert.match(workspace, /diagnosis_id:selected\.id/)
  assert.match(workspace, /status:'planned'/)
  assert.match(migration, /create table public\.skda_interviews/)
  assert.match(migration, /foreign key\(diagnosis_id,organization_id\) references public\.skda_diagnoses/)
})

test('canonical SK-DA schema models diagnosis, not project', () => {
  assert.match(migration, /create table public\.skda_diagnoses/)
  assert.doesNotMatch(migration, /create table public\.skda_projects/)
  assert.doesNotMatch(migration, /\bproject_id\b/)
  assert.match(migration, /'diagnosis\.view'/)
  assert.match(migration, /'diagnosis\.manage'/)
})

test('tactical management preserves generator facts and execution profiles', () => {
  assert.match(migration, /create table public\.sparks_initiative_origins/)
  assert.match(migration, /contribution_weight/)
  assert.match(migration, /impact_level/)
  assert.match(migration, /create table public\.sparks_initiative_execution_profiles/)
  assert.match(migration, /project_management/)
  assert.match(migration, /sipoc/)
  assert.match(migration, /sprint/)
})

test('evidence asset stays transversal while DA owns its correlation', () => {
  assert.match(migration, /create table public\.skda_evidence_correlations/)
  assert.match(migration, /references public\.sparks_evidence_assets/)
  assert.match(migration, /analyst_interpretation/)
  assert.match(migration, /adequacy_score/)
  assert.match(migration, /sufficiency_score/)
  assert.match(migration, /reliability_score/)
})

test('technical runtime tenant is excluded from administrative module counts', () => {
  assert.match(migration, /o\.code <> 'SKPE-V1-RUNTIME'/)
})
