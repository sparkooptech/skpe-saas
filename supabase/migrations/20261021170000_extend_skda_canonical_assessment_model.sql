begin;

-- ============================================================
-- SK-DA | Nucleo metodologico canonico do Modelo de Avaliacao
-- Compatibilidade forward: preserva o MVP operacional existente.
-- ============================================================

create table if not exists public.skda_catalog_models (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  framework_code text not null default 'CUSTOM',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  check (length(trim(code)) > 0),
  check (length(trim(name)) > 0)
);

alter table public.skda_catalog_versions
  add column if not exists catalog_model_id uuid
    references public.skda_catalog_models(id) on delete restrict;

create index if not exists idx_skda_catalog_versions_model
  on public.skda_catalog_versions(catalog_model_id,status);

create table if not exists public.skda_maturity_levels (
  id uuid primary key default gen_random_uuid(),
  catalog_version_id uuid not null
    references public.skda_catalog_versions(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(catalog_version_id,code),
  check (length(trim(code)) > 0),
  check (length(trim(name)) > 0)
);

create table if not exists public.skda_model_blocks (
  id uuid primary key default gen_random_uuid(),
  catalog_version_id uuid not null
    references public.skda_catalog_versions(id) on delete cascade,
  maturity_level_id uuid
    references public.skda_maturity_levels(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(catalog_version_id,code),
  check (length(trim(code)) > 0),
  check (length(trim(name)) > 0)
);

create table if not exists public.skda_model_criteria (
  id uuid primary key default gen_random_uuid(),
  catalog_version_id uuid not null
    references public.skda_catalog_versions(id) on delete cascade,
  block_id uuid references public.skda_model_blocks(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(catalog_version_id,code),
  check (length(trim(code)) > 0),
  check (length(trim(name)) > 0)
);

alter table public.skda_questions
  add column if not exists maturity_level_id uuid
    references public.skda_maturity_levels(id) on delete set null,
  add column if not exists block_id uuid
    references public.skda_model_blocks(id) on delete set null,
  add column if not exists criterion_id uuid
    references public.skda_model_criteria(id) on delete set null;

create index if not exists idx_skda_questions_hierarchy
  on public.skda_questions(catalog_version_id,maturity_level_id,block_id,criterion_id,display_order);

create table if not exists public.skda_question_alternatives (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.skda_questions(id) on delete cascade,
  code text not null,
  alternative_text text not null,
  progression_order integer not null default 0,
  score_value numeric(10,4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(question_id,code),
  check (length(trim(code)) > 0),
  check (length(trim(alternative_text)) > 0)
);

create table if not exists public.skda_evaluation_requirements (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.skda_questions(id) on delete cascade,
  code text not null,
  requirement_text text not null,
  requirement_type text not null default 'practice'
    check (requirement_type in ('practice','evidence','measurement','control','learning','other')),
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(question_id,code),
  check (length(trim(code)) > 0),
  check (length(trim(requirement_text)) > 0)
);

create table if not exists public.skda_alternative_requirements (
  alternative_id uuid not null references public.skda_question_alternatives(id) on delete cascade,
  requirement_id uuid not null references public.skda_evaluation_requirements(id) on delete cascade,
  is_mandatory boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  primary key(alternative_id,requirement_id)
);

create table if not exists public.skda_self_assessment_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnosis_id uuid not null references public.skda_diagnoses(id) on delete cascade,
  source_evidence_asset_id uuid references public.sparks_evidence_assets(id) on delete set null,
  source_label text,
  source_date date,
  captured_at timestamptz not null default timezone('utc',now()),
  captured_by uuid references public.profiles(id) on delete set null,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  unique(diagnosis_id,content_hash)
);

create table if not exists public.skda_self_assessment_answers (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.skda_self_assessment_snapshots(id) on delete cascade,
  question_id uuid not null references public.skda_questions(id) on delete restrict,
  declared_alternative_id uuid references public.skda_question_alternatives(id) on delete set null,
  declared_code text,
  declared_text text,
  rationale text,
  metadata jsonb not null default '{}'::jsonb,
  unique(snapshot_id,question_id)
);

alter table public.skda_responses
  add column if not exists declared_alternative_id uuid
    references public.skda_question_alternatives(id) on delete set null,
  add column if not exists evidenced_alternative_id uuid
    references public.skda_question_alternatives(id) on delete set null,
  add column if not exists validated_alternative_id uuid
    references public.skda_question_alternatives(id) on delete set null;

create table if not exists public.skda_practices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnosis_id uuid not null references public.skda_diagnoses(id) on delete cascade,
  question_id uuid references public.skda_questions(id) on delete set null,
  title text not null,
  narrative text not null,
  what_text text,
  why_text text,
  who_text text,
  when_text text,
  where_text text,
  how_text text,
  how_much_text text,
  status text not null default 'draft'
    check (status in ('draft','reported','evidenced','validated','superseded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  check (length(trim(title)) > 0),
  check (length(trim(narrative)) > 0)
);

create index if not exists idx_skda_practices_diagnosis_question
  on public.skda_practices(diagnosis_id,question_id,status);

create table if not exists public.skda_work_patterns (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.skda_practices(id) on delete cascade,
  method_text text,
  responsible_text text,
  periodicity_text text,
  controls_text text,
  scope_text text,
  criteria_text text,
  communication_text text,
  measurement_text text,
  verification_text text,
  evaluation_text text,
  improvement_text text,
  institutionalization_status text not null default 'not_assessed'
    check (institutionalization_status in ('not_assessed','informal','formalized','implemented','measured','improved')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(practice_id)
);

create table if not exists public.skda_practice_requirement_assessments (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.skda_practices(id) on delete cascade,
  requirement_id uuid not null references public.skda_evaluation_requirements(id) on delete cascade,
  assessment_status text not null default 'not_assessed'
    check (assessment_status in ('not_assessed','confirmed','partial','not_confirmed','not_applicable')),
  rationale text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(practice_id,requirement_id)
);

create table if not exists public.skda_question_history_links (
  id uuid primary key default gen_random_uuid(),
  source_question_id uuid not null references public.skda_questions(id) on delete cascade,
  target_question_id uuid not null references public.skda_questions(id) on delete cascade,
  relation_type text not null
    check (relation_type in ('maintained','revised','renumbered','split','merged','replaced','excluded','new','partially_comparable','not_comparable')),
  comparability_score numeric(5,2) check (comparability_score is null or comparability_score between 0 and 100),
  rationale text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  unique(source_question_id,target_question_id),
  check (source_question_id <> target_question_id)
);

create table if not exists public.skda_reference_practices (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  capability_text text,
  framework_code text,
  maturity_level_code text,
  branch_context text,
  size_context text,
  process_context text,
  complexity_level text,
  effort_level text,
  suggested_work_pattern jsonb not null default '{}'::jsonb,
  expected_evidence jsonb not null default '[]'::jsonb,
  indicators jsonb not null default '[]'::jsonb,
  dependencies jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  check (length(trim(code)) > 0),
  check (length(trim(title)) > 0),
  check (length(trim(description)) > 0)
);

create table if not exists public.skda_reference_practice_links (
  id uuid primary key default gen_random_uuid(),
  reference_practice_id uuid not null references public.skda_reference_practices(id) on delete cascade,
  question_id uuid references public.skda_questions(id) on delete cascade,
  requirement_id uuid references public.skda_evaluation_requirements(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  check (question_id is not null or requirement_id is not null)
);

create unique index if not exists uq_skda_reference_practice_question
  on public.skda_reference_practice_links(reference_practice_id,question_id)
  where question_id is not null and requirement_id is null;

create unique index if not exists uq_skda_reference_practice_requirement
  on public.skda_reference_practice_links(reference_practice_id,requirement_id)
  where requirement_id is not null and question_id is null;

create unique index if not exists uq_skda_reference_practice_question_requirement
  on public.skda_reference_practice_links(reference_practice_id,question_id,requirement_id)
  where question_id is not null and requirement_id is not null;

-- RLS: segue o mesmo isolamento organizacional do MVP para entidades de ciclo.
alter table public.skda_self_assessment_snapshots enable row level security;
alter table public.skda_self_assessment_answers enable row level security;
alter table public.skda_practices enable row level security;
alter table public.skda_work_patterns enable row level security;
alter table public.skda_practice_requirement_assessments enable row level security;

commit;

begin;

-- Catalogo global: leitura governada por publicacao do instrumento.
alter table public.skda_catalog_models enable row level security;
alter table public.skda_maturity_levels enable row level security;
alter table public.skda_model_blocks enable row level security;
alter table public.skda_model_criteria enable row level security;
alter table public.skda_question_alternatives enable row level security;
alter table public.skda_evaluation_requirements enable row level security;
alter table public.skda_alternative_requirements enable row level security;
alter table public.skda_question_history_links enable row level security;
alter table public.skda_reference_practices enable row level security;
alter table public.skda_reference_practice_links enable row level security;

create policy skda_catalog_models_select on public.skda_catalog_models
for select to authenticated using (active=true);

create policy skda_maturity_levels_select on public.skda_maturity_levels
for select to authenticated using (
  exists (
    select 1 from public.skda_catalog_versions cv
    where cv.id=skda_maturity_levels.catalog_version_id
      and cv.status='published'
  )
);

create policy skda_model_blocks_select on public.skda_model_blocks
for select to authenticated using (
  exists (
    select 1 from public.skda_catalog_versions cv
    where cv.id=skda_model_blocks.catalog_version_id
      and cv.status='published'
  )
);

create policy skda_model_criteria_select on public.skda_model_criteria
for select to authenticated using (
  exists (
    select 1 from public.skda_catalog_versions cv
    where cv.id=skda_model_criteria.catalog_version_id
      and cv.status='published'
  )
);

create policy skda_question_alternatives_select on public.skda_question_alternatives
for select to authenticated using (
  exists (
    select 1
    from public.skda_questions q
    join public.skda_catalog_versions cv on cv.id=q.catalog_version_id
    where q.id=skda_question_alternatives.question_id
      and cv.status='published'
  )
);

create policy skda_evaluation_requirements_select on public.skda_evaluation_requirements
for select to authenticated using (
  exists (
    select 1
    from public.skda_questions q
    join public.skda_catalog_versions cv on cv.id=q.catalog_version_id
    where q.id=skda_evaluation_requirements.question_id
      and cv.status='published'
  )
);

create policy skda_alternative_requirements_select on public.skda_alternative_requirements
for select to authenticated using (
  exists (
    select 1
    from public.skda_question_alternatives qa
    join public.skda_questions q on q.id=qa.question_id
    join public.skda_catalog_versions cv on cv.id=q.catalog_version_id
    where qa.id=skda_alternative_requirements.alternative_id
      and cv.status='published'
  )
);

create policy skda_question_history_links_select on public.skda_question_history_links
for select to authenticated using (
  exists (
    select 1
    from public.skda_questions q
    join public.skda_catalog_versions cv on cv.id=q.catalog_version_id
    where q.id=skda_question_history_links.source_question_id
      and cv.status='published'
  )
);

create policy skda_reference_practices_select on public.skda_reference_practices
for select to authenticated using (active=true);

create policy skda_reference_practice_links_select on public.skda_reference_practice_links
for select to authenticated using (
  exists (
    select 1 from public.skda_reference_practices rp
    where rp.id=skda_reference_practice_links.reference_practice_id
      and rp.active=true
  )
);

-- Autoavaliacao e praticas: isolamento por organizacao + permissoes SK-DA.
create policy skda_self_assessment_snapshots_select
on public.skda_self_assessment_snapshots
for select to authenticated
using (public.has_module_access(organization_id,'SK-DA'));

create policy skda_self_assessment_snapshots_insert
on public.skda_self_assessment_snapshots
for insert to authenticated
with check (public.has_module_permission(organization_id,'SK-DA','assessment.edit'));

create policy skda_self_assessment_answers_select
on public.skda_self_assessment_answers
for select to authenticated
using (
  exists (
    select 1 from public.skda_self_assessment_snapshots s
    where s.id=skda_self_assessment_answers.snapshot_id
      and public.has_module_access(s.organization_id,'SK-DA')
  )
);

create policy skda_self_assessment_answers_insert
on public.skda_self_assessment_answers
for insert to authenticated
with check (
  exists (
    select 1 from public.skda_self_assessment_snapshots s
    where s.id=skda_self_assessment_answers.snapshot_id
      and public.has_module_permission(s.organization_id,'SK-DA','assessment.edit')
  )
);

create policy skda_practices_select on public.skda_practices
for select to authenticated
using (public.has_module_access(organization_id,'SK-DA'));

create policy skda_practices_insert on public.skda_practices
for insert to authenticated
with check (public.has_module_permission(organization_id,'SK-DA','assessment.edit'));

create policy skda_practices_update on public.skda_practices
for update to authenticated
using (public.has_module_permission(organization_id,'SK-DA','assessment.edit'))
with check (public.has_module_permission(organization_id,'SK-DA','assessment.edit'));

create policy skda_work_patterns_select on public.skda_work_patterns
for select to authenticated
using (
  exists (
    select 1 from public.skda_practices p
    where p.id=skda_work_patterns.practice_id
      and public.has_module_access(p.organization_id,'SK-DA')
  )
);

create policy skda_work_patterns_insert on public.skda_work_patterns
for insert to authenticated
with check (
  exists (
    select 1 from public.skda_practices p
    where p.id=skda_work_patterns.practice_id
      and public.has_module_permission(p.organization_id,'SK-DA','assessment.edit')
  )
);

create policy skda_work_patterns_update on public.skda_work_patterns
for update to authenticated
using (
  exists (
    select 1 from public.skda_practices p
    where p.id=skda_work_patterns.practice_id
      and public.has_module_permission(p.organization_id,'SK-DA','assessment.edit')
  )
)
with check (
  exists (
    select 1 from public.skda_practices p
    where p.id=skda_work_patterns.practice_id
      and public.has_module_permission(p.organization_id,'SK-DA','assessment.edit')
  )
);

create policy skda_practice_requirement_assessments_select
on public.skda_practice_requirement_assessments
for select to authenticated
using (
  exists (
    select 1 from public.skda_practices p
    where p.id=skda_practice_requirement_assessments.practice_id
      and public.has_module_access(p.organization_id,'SK-DA')
  )
);

create policy skda_practice_requirement_assessments_write
on public.skda_practice_requirement_assessments
for all to authenticated
using (
  exists (
    select 1 from public.skda_practices p
    where p.id=skda_practice_requirement_assessments.practice_id
      and public.has_module_permission(p.organization_id,'SK-DA','assessment.edit')
  )
)
with check (
  exists (
    select 1 from public.skda_practices p
    where p.id=skda_practice_requirement_assessments.practice_id
      and public.has_module_permission(p.organization_id,'SK-DA','assessment.edit')
  )
);

commit;
