begin;

-- Importacao fiel das autoavaliacoes PDGC, sem inferir validacao.
alter table public.skda_self_assessment_snapshots
  add column if not exists assessment_cycle_year integer,
  add column if not exists source_document_name text,
  add column if not exists source_section text,
  add column if not exists import_status text not null default 'pending_review';

alter table public.skda_self_assessment_answers
  add column if not exists original_comments text,
  add column if not exists original_observations text,
  add column if not exists reported_measures text,
  add column if not exists source_page text,
  add column if not exists source_question_code text;

-- Preserva multiplas medidas de diferentes ciclos, sem declarar execucao.
create table if not exists public.skda_reported_cycle_measures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_id uuid references public.skda_self_assessment_snapshots(id) on delete set null,
  answer_id uuid references public.skda_self_assessment_answers(id) on delete set null,
  cycle_year integer not null check (cycle_year between 2000 and 2100),
  source_question_code text,
  measure_original_text text not null,
  observation_original_text text,
  source_document_name text not null,
  source_page text,
  source_content_hash text,
  verification_status text not null default 'reported'
    check (verification_status in ('reported','under_review','evidenced','validated','not_confirmed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (length(trim(measure_original_text)) > 0)
);
create index if not exists idx_skda_reported_cycle_measures_org_cycle
  on public.skda_reported_cycle_measures(organization_id,cycle_year);
create unique index if not exists idx_skda_reported_cycle_measures_source
  on public.skda_reported_cycle_measures(organization_id,cycle_year,source_content_hash)
  where source_content_hash is not null;

alter table public.skda_reported_cycle_measures enable row level security;
drop policy if exists skda_reported_cycle_measures_select on public.skda_reported_cycle_measures;
create policy skda_reported_cycle_measures_select
  on public.skda_reported_cycle_measures
  for select to authenticated
  using (public.has_module_access(organization_id, 'SK-DA'));

drop policy if exists skda_reported_cycle_measures_insert on public.skda_reported_cycle_measures;
create policy skda_reported_cycle_measures_insert
  on public.skda_reported_cycle_measures
  for insert to authenticated
  with check (public.has_module_permission(organization_id, 'SK-DA', 'assessment.edit'));

drop policy if exists skda_reported_cycle_measures_update on public.skda_reported_cycle_measures;
create policy skda_reported_cycle_measures_update
  on public.skda_reported_cycle_measures
  for update to authenticated
  using (public.has_module_permission(organization_id, 'SK-DA', 'assessment.edit'))
  with check (public.has_module_permission(organization_id, 'SK-DA', 'assessment.edit'));

commit;
