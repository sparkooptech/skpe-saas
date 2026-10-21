import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const workspace = readFileSync(new URL('../src/modules/skda/SkdaWorkspace.tsx', import.meta.url), 'utf8')
const workspaceCss = readFileSync(new URL('../src/modules/skda/SkdaWorkspace.css', import.meta.url), 'utf8')
const migration = readFileSync(
  new URL('../../../supabase/migrations/20261020202549_create_skda_operational_mvp.sql', import.meta.url),
  'utf8',
)
const tacticalMigration = readFileSync(
  new URL('../../../supabase/migrations/20261021001833_govern_skda_tactical_conversion.sql', import.meta.url),
  'utf8',
)
const findingValidationMigration = readFileSync(
  new URL('../../../supabase/migrations/20261021002224_govern_skda_finding_validation.sql', import.meta.url),
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

test('DA-01 reuses transversal evidence and stores only contextual correlation', () => {
  assert.match(workspace, /\.from\('sparks_evidence_assets'/)
  assert.match(workspace, /\.from\('skda_evidence_correlations'/)
  assert.match(workspace, /target_type:'diagnosis'/)
  assert.match(workspace, /evidence_asset_id:asset\.id/)
  assert.doesNotMatch(workspace, /insert\([\s\S]*?sparks_evidence_assets/)
})

test('DA-00 configures the journey with canonical fields and transversal organization users', () => {
  assert.match(workspace, /get_organization_user_access/)
  assert.match(workspace, /reference_year:openingForm\.referenceYear/)
  assert.match(workspace, /started_on:openingForm\.startedOn/)
  assert.match(workspace, /planned_end_on:openingForm\.plannedEndOn/)
  assert.match(workspace, /lead_user_id:openingForm\.leadUserId/)
  assert.match(workspace, /scope_statement:openingForm\.scopeStatement/)
  assert.match(workspace, /methodology_notes:openingForm\.methodologyNotes/)
  assert.match(workspace, /Salvar abertura da jornada/)
})

test('DA-00 and DA-03 govern catalog assignment and question assessment', () => {
  assert.match(workspace, /\.from\('skda_catalog_versions'/)
  assert.match(workspace, /\.from\('skda_questions'/)
  assert.match(workspace, /\.from\('skda_responses'/)
  assert.match(workspace, /onConflict:'diagnosis_id,question_id'/)
  assert.match(workspace, /catalogLocked = metrics\.responses > 0/)
  assert.match(workspace, /canEditAssessment = \['administrator','coordinator','diagnostician'\]/)
  assert.match(workspace, /canValidateAssessment = \['administrator','coordinator','reviewer'\]/)
  assert.match(workspace, /score < 0 \|\| score > 100/)
  assert.match(workspace, /response_status:'draft'/)
  assert.match(workspace, /response_status:'validated'/)
  assert.match(workspace, /A escala de maturidade não está publicada no catálogo atual/)
  assert.match(workspace, /canEditInterviews = \['administrator','coordinator','interviewer'\]/)
  assert.match(migration, /unique\(diagnosis_id,question_id\)/)
  assert.match(migration, /score numeric\(6,2\) check \(score is null or score between 0 and 100\)/)
})

test('DA-04 and DA-05 keep findings and recommendations in the DA domain', () => {
  assert.match(workspace, /\.from\('skda_findings'/)
  assert.match(workspace, /finding_type:findingForm\.findingType/)
  assert.match(workspace, /recommendation:findingForm\.recommendation/)
  assert.match(workspace, /canEditFindings = \['administrator','coordinator','diagnostician','reviewer'\]/)
  assert.match(migration, /finding_type text not null check \(finding_type in \('strength','gap','opportunity','risk','observation'\)\)/)
  assert.match(migration, /recommendation text/)
})

test('DA-06 tactical conversion is atomic and preserves the generator fact', () => {
  for (const initiativeClass of ['initiative','program','project','structuring_action','process','sprint','task','work']) {
    assert.match(tacticalMigration, new RegExp(`'${initiativeClass}'`))
  }
  assert.match(tacticalMigration, /'initiatives\.manage'/)
  assert.match(tacticalMigration, /\('administrator', 'initiatives\.manage'\)/)
  assert.match(tacticalMigration, /\('coordinator', 'initiatives\.manage'\)/)
  assert.match(tacticalMigration, /create or replace function public\.create_skda_tactical_initiative/)
  assert.match(tacticalMigration, /v_initiative_id := public\.create_sparks_initiative/)
  assert.match(tacticalMigration, /insert into public\.sparks_initiative_origins/)
  assert.match(tacticalMigration, /source_entity_type[\s\S]*?'skda_finding'/)
  assert.match(tacticalMigration, /'diagnostic_recommendation'/)
  assert.match(tacticalMigration, /insert into public\.sparks_initiative_execution_profiles/)
  assert.match(tacticalMigration, /status = 'in_action'/)
  assert.match(tacticalMigration, /revoke all[\s\S]*create_skda_tactical_initiative[\s\S]*from public, anon/)
})

test('DA-05 validation separates recommendation approval from editing', () => {
  assert.match(workspace, /accept_skda_finding_recommendation/)
  assert.match(workspace, /canValidateFindings = \['administrator','coordinator','reviewer'\]/)
  assert.match(findingValidationMigration, /'findings\.validate'/)
  assert.match(findingValidationMigration, /\('reviewer', 'findings\.validate'\)/)
  assert.match(findingValidationMigration, /trg_skda_findings_validation_transition/)
  assert.match(findingValidationMigration, /create or replace function public\.accept_skda_finding_recommendation/)
  assert.match(findingValidationMigration, /from public, anon/)
})

test('DA-06 UI uses the atomic tactical conversion contract', () => {
  assert.match(workspace, /create_skda_tactical_initiative/)
  assert.match(workspace, /canCreateTactical = \['administrator','coordinator'\]/)
  assert.match(workspace, /TACTICAL_CAPABILITIES/)
  assert.match(workspace, /tacticalDefaults/)
  assert.match(workspace, /target_contribution_weight:contributionWeight/)
  assert.match(workspace, /target_enabled_capabilities:tacticalForm\.enabledCapabilities/)
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

test('SK-DA uses the transversal application shell and full-width executive dashboard', () => {
  assert.match(workspace, /import \{ ApplicationShell \}/)
  assert.match(workspace, /<ApplicationShell/)
  assert.match(workspace, /skda-dashboard-page/)
  assert.match(workspace, /skda-executive-grid/)
  assert.match(workspace, /Radar por eixo/)
  assert.match(workspace, /Jornadas de Diagnóstico Assistido/)
  assert.doesNotMatch(workspace, /primary=\{primary\} secondary=\{secondary\}/)
})

test('SK-DA modal primary actions remain visibly primary', () => {
  assert.match(workspaceCss, /\.skda-modal-actions \.skda-primary[\s\S]*?background:/)
  assert.match(workspaceCss, /\.skda-modal-actions \.skda-primary[\s\S]*?color:\s*#fff/)
})

test('SK-DA does not fabricate maturity values when no validated score exists', () => {
  assert.match(workspace, /response\?\.score == null/)
  assert.match(workspace, /Nenhuma pontuação de maturidade validada ainda/)
})

test('technical runtime tenant is excluded from administrative module counts', () => {
  assert.match(migration, /o\.code <> 'SKPE-V1-RUNTIME'/)
})
