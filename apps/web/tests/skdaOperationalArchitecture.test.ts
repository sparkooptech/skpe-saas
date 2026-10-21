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
const journeyExecutionMigration = readFileSync(
  new URL('../../../supabase/migrations/20261021132000_govern_skda_project_interviews_action_cycles.sql', import.meta.url),
  'utf8',
)
const externalParticipantFixMigration = readFileSync(
  new URL('../../../supabase/migrations/20261021141000_fix_sparks_external_event_participant_uuid_aggregate.sql', import.meta.url),
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

test('DA-02 interview workspace uses the canonical interview domain and transversal Agenda', () => {
  assert.match(workspace, /\.from\('skda_interviews'/)
  assert.match(workspace, /create_skda_interview_with_event/)
  assert.match(workspace, /get_skda_interview_event_management/)
  assert.doesNotMatch(workspace, /\.from\('sparks_events'/)
  assert.match(workspace, /JourneyEventManageDialog/)
  assert.match(workspace, /AgendaSection/)
  assert.match(workspace, /scheduled_start,scheduled_end,actual_start,actual_end,event_id/)
  assert.match(migration, /create table public\.skda_interviews/)
  assert.match(migration, /foreign key\(diagnosis_id,organization_id\) references public\.skda_diagnoses/)
  assert.match(journeyExecutionMigration, /add column event_id uuid/)
  assert.match(journeyExecutionMigration, /add column actual_start timestamptz/)
  assert.match(journeyExecutionMigration, /add column actual_end timestamptz/)
  assert.match(journeyExecutionMigration, /create or replace function public\.create_skda_interview_with_event/)
  assert.match(journeyExecutionMigration, /source_entity_type[\s\S]*?'skda_interview'/)
  assert.doesNotMatch(journeyExecutionMigration, /create table public\.skda_interview_participants/)
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
  assert.match(workspace, /canEditAssessment = hasAdministrativeOverride \|\| \['administrator','coordinator','diagnostician'\]\.includes/)
  assert.match(workspace, /canValidateAssessment = hasAdministrativeOverride \|\| \['administrator','coordinator','reviewer'\]\.includes/)
  assert.match(workspace, /score < 0 \|\| score > 100/)
  assert.match(workspace, /response_status:'draft'/)
  assert.match(workspace, /response_status:'validated'/)
  assert.match(workspace, /A escala de maturidade não está publicada no catálogo atual/)
  assert.match(workspace, /canEditInterviews = hasAdministrativeOverride \|\| \['administrator','coordinator','interviewer'\]\.includes/)
  assert.match(migration, /unique\(diagnosis_id,question_id\)/)
  assert.match(migration, /score numeric\(6,2\) check \(score is null or score between 0 and 100\)/)
})

test('DA-04 and DA-05 keep findings and recommendations in the DA domain', () => {
  assert.match(workspace, /\.from\('skda_findings'/)
  assert.match(workspace, /finding_type:findingForm\.findingType/)
  assert.match(workspace, /recommendation:findingForm\.recommendation/)
  assert.match(workspace, /interview_id:findingForm\.interviewId/)
  assert.match(workspace, /owner_user_id:findingForm\.ownerUserId/)
  assert.match(workspace, /due_date:findingForm\.dueDate/)
  assert.match(workspace, /canEditFindings = hasAdministrativeOverride \|\| \['administrator','coordinator','diagnostician','reviewer'\]\.includes/)
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
  assert.match(workspace, /canValidateFindings = hasAdministrativeOverride \|\| \['administrator','coordinator','reviewer'\]\.includes/)
  assert.match(findingValidationMigration, /'findings\.validate'/)
  assert.match(findingValidationMigration, /\('reviewer', 'findings\.validate'\)/)
  assert.match(findingValidationMigration, /trg_skda_findings_validation_transition/)
  assert.match(findingValidationMigration, /create or replace function public\.accept_skda_finding_recommendation/)
  assert.match(findingValidationMigration, /from public, anon/)
})

test('DA-06 UI uses the atomic tactical conversion contract', () => {
  assert.match(workspace, /create_skda_tactical_initiative/)
  assert.match(workspace, /canCreateTactical = hasAdministrativeOverride \|\| \['administrator','coordinator'\]\.includes/)
  assert.match(workspace, /TACTICAL_CAPABILITIES/)
  assert.match(workspace, /tacticalDefaults/)
  assert.match(workspace, /target_contribution_weight:contributionWeight/)
  assert.match(workspace, /target_enabled_capabilities:tacticalForm\.enabledCapabilities/)
  assert.match(workspace, /\.from\('sparks_initiative_origins'/)
  assert.match(workspace, /\.from\('sparks_initiatives'/)
  assert.match(workspace, /source_entity_type', 'skda_finding'/)
  assert.match(workspace, /Iniciativa transversal já vinculada|Iniciativa transversal/)
  assert.match(workspace, /Fato gerador rastreado|Origem: SK-DA/)
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

test('SK-DA modals follow the shell keyboard convention and close on Escape', () => {
  assert.match(workspace, /event\.key !== 'Escape'/)
  assert.match(workspace, /setShowInterviewCreate\(false\)/)
  assert.match(workspace, /setShowFindingCreate\(false\)/)
  assert.match(workspace, /setShowTacticalCreate\(false\)/)
  assert.match(workspace, /window\.addEventListener\('keydown', handleEscape\)/)
})

test('platform and organization administrators inherit SK-DA administrative UI capabilities', () => {
  assert.match(app, /isOrganizationAdmin=\{selectedOrganization\.is_organization_admin\}/)
  assert.match(app, /isPlatformSuperAdmin=\{isPlatformSuperAdmin\}/)
  assert.match(workspace, /const hasAdministrativeOverride = props\.isPlatformSuperAdmin \|\| props\.isOrganizationAdmin/)
  assert.match(workspace, /const canEditInterviews = hasAdministrativeOverride \|\|/)
  assert.match(workspace, /Nova entrevista/)
})

test('SK-DA header uses the canonical vector calendar icon', () => {
  assert.match(workspace, /function CalendarIcon\(\)/)
  assert.match(workspace, /<CalendarIcon \/>/)
  assert.doesNotMatch(workspace, /<span aria-hidden="true">▣<\/span>/)
})

test('each DA journey is methodologically distinct from its transversal Project', () => {
  assert.match(journeyExecutionMigration, /add column execution_initiative_id uuid/)
  assert.match(journeyExecutionMigration, /create or replace function public\.ensure_skda_diagnosis_project/)
  assert.match(journeyExecutionMigration, /create or replace function public\.create_skda_diagnosis_with_project/)
  assert.match(journeyExecutionMigration, /'project'/)
  assert.match(journeyExecutionMigration, /'transformation'/)
  assert.match(journeyExecutionMigration, /'skda_diagnosis'/)
  assert.match(journeyExecutionMigration, /'project_management'/)
  assert.match(workspace, /create_skda_diagnosis_with_project/)
  assert.match(workspace, /ensure_skda_diagnosis_project/)
})

test('DA interviews allow organization members without granting SK-DA access', () => {
  assert.match(journeyExecutionMigration, /v_is_skda_interview/)
  assert.match(journeyExecutionMigration, /membership\.organization_id=v_event\.organization_id/)
  assert.match(journeyExecutionMigration, /or v_is_skda_interview/)
  assert.match(journeyExecutionMigration, /not v_is_skda_interview[\s\S]*?organization_modules/)
  assert.match(journeyExecutionMigration, /can_manage_sparks_event_source/)
  assert.match(journeyExecutionMigration, /'interview\.edit'/)
})

test('transversal external participants resolve UUIDs without unsupported UUID aggregation', () => {
  assert.match(externalParticipantFixMigration, /create or replace function public\.set_sparks_external_event_participant/)
  assert.match(externalParticipantFixMigration, /min\(person\.id::text\)::uuid/)
  assert.doesNotMatch(externalParticipantFixMigration, /min\(person\.id\)(?!::text)/)
})

test('DA-06 is a methodological Action Plan in three cycles over transversal initiatives', () => {
  assert.match(workspace, /title:'Plano de Ação'/)
  assert.match(workspace, /Ciclo 1 · Prioridades 80\/20 e sustentação/)
  assert.match(workspace, /Ciclo 2 · Consolidação, expansão e transformação/)
  assert.match(workspace, /Ciclo 3 · Excelência/)
  assert.match(workspace, /set_skda_action_plan_cycle/)
  assert.match(workspace, /Gestão Tática\/Operacional transversal/)
  assert.match(journeyExecutionMigration, /create table public\.skda_action_plan_allocations/)
  assert.match(journeyExecutionMigration, /cycle_number smallint not null/)
  assert.match(journeyExecutionMigration, /references public\.sparks_initiatives/)
  assert.doesNotMatch(journeyExecutionMigration, /create table public\.skda_(initiatives|projects)/)
})

test('SK-DA overview exposes PDCL and modules return is a sidebar action, not a methodology item', () => {
  assert.match(workspace, /const PDCL_STAGES/)
  assert.match(workspace, /title:'Planejar'/)
  assert.match(workspace, /title:'Fazer'/)
  assert.match(workspace, /title:'Verificar'/)
  assert.match(workspace, /title:'Aprender'/)
  assert.match(workspace, /label:'Visão Geral'/)
  assert.match(workspace, /label:'Jornada DA'/)
  assert.match(workspace, /label:'Plano de Ação'/)
  assert.doesNotMatch(workspace, /\.\.\.PHASES\.map\(\(phase\) => \(\{/)
  for (const [code, title] of [
    ['MF0','Constituição e abertura'],
    ['MF1','Intake e inventário'],
    ['MF2','Canonização documental'],
    ['MF3','Histórico e pré-diagnóstico'],
    ['MF4','Entrevistas Governança'],
    ['MF5','Entrevistas Gestão'],
    ['MF6','Evidências, PDCL e maturidade'],
    ['MF7','Diagnóstico integrado'],
    ['MF8','Priorização 80/20'],
    ['MF9','Plano por ciclos'],
    ['MF10','Devolutiva e integração'],
  ]) {
    assert.match(workspace, new RegExp(`code:'${code}'[\\s\\S]*?title:'${title}'`))
  }
  assert.match(workspace, /current_megaphase_code/)
  assert.match(journeyExecutionMigration, /add column current_megaphase_code text not null default 'MF0'/)
  assert.match(workspace, /Voltar aos módulos/)
  assert.doesNotMatch(workspace, /id:'modules',[\s\S]*?label:'Módulos'/)
})

test('technical runtime tenant is excluded from administrative module counts', () => {
  assert.match(migration, /o\.code <> 'SKPE-V1-RUNTIME'/)
})
