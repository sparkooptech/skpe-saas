-- Plataforma SPARKs
-- SK-DA - MVP operacional sobre o Core/Hostinger
-- Escopo: domínio mínimo, RBAC e RLS. Sem habilitar organizações reais.

begin;

update public.modules
set status = 'active',
    updated_at = timezone('utc', now())
where code = 'SK-DA';

insert into public.module_roles (module_id, code, name, description, role_level, is_system_role, active)
select m.id, v.code, v.name, v.description, v.role_level, true, true
from public.modules m
cross join (values
  ('administrator','Administrador do SK-DA','Administra acessos, configuração e conteúdo do Diagnóstico Assistido.',100),
  ('coordinator','Coordenador de Diagnóstico','Coordena diagnósticos, entrevistas, avaliações e devolutivas.',80),
  ('diagnostician','Analista de Diagnóstico','Executa avaliações, vincula evidências e registra achados.',70),
  ('interviewer','Entrevistador','Registra e conduz entrevistas do diagnóstico.',50),
  ('reviewer','Revisor','Revisa e valida avaliações, achados e recomendações.',40),
  ('viewer','Leitor','Consulta o diagnóstico sem editar.',10)
) as v(code,name,description,role_level)
where m.code = 'SK-DA'
on conflict (module_id, code) do update
set name=excluded.name, description=excluded.description, role_level=excluded.role_level,
    is_system_role=true, active=true, updated_at=timezone('utc',now());

insert into public.module_permissions (module_id, code, name, description, permission_group, active)
select m.id, v.code, v.name, v.description, v.permission_group, true
from public.modules m
cross join (values
  ('module.view','Acessar o módulo','Permite acessar o SK-DA.','module'),
  ('module.manage','Administrar o módulo','Permite administrar configurações e acessos do SK-DA.','module'),
  ('diagnosis.view','Consultar diagnósticos','Permite consultar instâncias de Diagnóstico Assistido.','diagnosis'),
  ('diagnosis.manage','Gerenciar diagnósticos','Permite criar e atualizar instâncias de Diagnóstico Assistido.','diagnosis'),
  ('assessment.view','Consultar avaliações','Permite consultar respostas e avaliações por questão.','assessment'),
  ('assessment.edit','Editar avaliações','Permite registrar e atualizar respostas e avaliações.','assessment'),
  ('assessment.validate','Validar avaliações','Permite validar avaliações e classificações.','assessment'),
  ('interview.view','Consultar entrevistas','Permite consultar entrevistas.','interview'),
  ('interview.edit','Gerenciar entrevistas','Permite planejar e registrar entrevistas.','interview'),
  ('evidence.view','Consultar evidências','Permite consultar evidências vinculadas ao diagnóstico.','evidence'),
  ('evidence.link','Vincular evidências','Permite vincular evidências do Core ao diagnóstico.','evidence'),
  ('findings.view','Consultar achados','Permite consultar achados, lacunas e recomendações.','findings'),
  ('findings.edit','Gerenciar achados','Permite registrar e atualizar achados e recomendações.','findings'),
  ('reports.view','Consultar relatórios','Permite consultar consolidações e devolutivas.','reports'),
  ('reports.export','Exportar relatórios','Permite exportar relatórios e evidências do diagnóstico.','reports')
) as v(code,name,description,permission_group)
where m.code = 'SK-DA'
on conflict (module_id, code) do update
set name=excluded.name, description=excluded.description, permission_group=excluded.permission_group,
    active=true, updated_at=timezone('utc',now());

with grants(role_code, permission_code) as (values
  ('administrator','module.view'),('administrator','module.manage'),('administrator','diagnosis.view'),('administrator','diagnosis.manage'),
  ('administrator','assessment.view'),('administrator','assessment.edit'),('administrator','assessment.validate'),
  ('administrator','interview.view'),('administrator','interview.edit'),('administrator','evidence.view'),('administrator','evidence.link'),
  ('administrator','findings.view'),('administrator','findings.edit'),('administrator','reports.view'),('administrator','reports.export'),
  ('coordinator','module.view'),('coordinator','diagnosis.view'),('coordinator','diagnosis.manage'),('coordinator','assessment.view'),
  ('coordinator','assessment.edit'),('coordinator','assessment.validate'),('coordinator','interview.view'),('coordinator','interview.edit'),
  ('coordinator','evidence.view'),('coordinator','evidence.link'),('coordinator','findings.view'),('coordinator','findings.edit'),
  ('coordinator','reports.view'),('coordinator','reports.export'),
  ('diagnostician','module.view'),('diagnostician','diagnosis.view'),('diagnostician','assessment.view'),('diagnostician','assessment.edit'),
  ('diagnostician','interview.view'),('diagnostician','evidence.view'),('diagnostician','evidence.link'),
  ('diagnostician','findings.view'),('diagnostician','findings.edit'),('diagnostician','reports.view'),
  ('interviewer','module.view'),('interviewer','diagnosis.view'),('interviewer','interview.view'),('interviewer','interview.edit'),
  ('interviewer','evidence.view'),('interviewer','evidence.link'),('interviewer','findings.view'),
  ('reviewer','module.view'),('reviewer','diagnosis.view'),('reviewer','assessment.view'),('reviewer','assessment.validate'),
  ('reviewer','interview.view'),('reviewer','evidence.view'),('reviewer','findings.view'),('reviewer','findings.edit'),('reviewer','reports.view'),
  ('viewer','module.view'),('viewer','diagnosis.view'),('viewer','assessment.view'),('viewer','interview.view'),
  ('viewer','evidence.view'),('viewer','findings.view'),('viewer','reports.view')
)
insert into public.role_permissions(module_role_id,module_permission_id)
select mr.id, mp.id
from grants g
join public.modules m on m.code='SK-DA'
join public.module_roles mr on mr.module_id=m.id and mr.code=g.role_code
join public.module_permissions mp on mp.module_id=m.id and mp.code=g.permission_code
on conflict do nothing;

create table public.skda_catalog_versions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version_code text not null,
  name text not null,
  description text,
  framework_code text not null default 'CUSTOM',
  status text not null default 'draft' check (status in ('draft','published','retired')),
  effective_from date,
  effective_until date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  unique(code,version_code),
  check (length(trim(code)) > 0),
  check (length(trim(version_code)) > 0),
  check (length(trim(name)) > 0),
  check (effective_until is null or effective_from is null or effective_until >= effective_from)
);

create table public.skda_questions (
  id uuid primary key default gen_random_uuid(),
  catalog_version_id uuid not null references public.skda_catalog_versions(id) on delete cascade,
  code text not null,
  axis_code text,
  axis_name text,
  criterion_code text,
  criterion_name text,
  question_text text not null,
  guidance text,
  score_weight numeric(10,4) not null default 1 check (score_weight >= 0),
  is_required boolean not null default true,
  display_order integer not null default 0,
  expected_evidence jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now()),
  unique(catalog_version_id,code),
  check (length(trim(code)) > 0),
  check (length(trim(question_text)) > 0)
);

create table public.skda_diagnoses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  catalog_version_id uuid references public.skda_catalog_versions(id) on delete restrict,
  diagnosis_type text not null default 'pdgc' check (diagnosis_type in ('pdgc','maturity','custom','other')),
  reference_year integer check (reference_year is null or reference_year between 2000 and 2100),
  status text not null default 'preparation' check (status in ('draft','preparation','evidence','interviews','assessment','validation','completed','archived')),
  current_phase_code text not null default 'DA-00',
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  started_on date,
  planned_end_on date,
  completed_at timestamptz,
  lead_user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  archived_at timestamptz,
  unique(organization_id,code),
  unique(id,organization_id),
  check (length(trim(code)) > 0),
  check (length(trim(name)) > 0),
  check (planned_end_on is null or started_on is null or planned_end_on >= started_on)
);

create table public.skda_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  diagnosis_id uuid not null,
  question_id uuid not null references public.skda_questions(id) on delete restrict,
  classification text not null default 'not_evaluated' check (classification in ('confirmed','reported','gap','not_applicable','not_evaluated')),
  response_status text not null default 'draft' check (response_status in ('draft','review','validated')),
  answer_text text,
  rationale text,
  maturity_level text,
  score numeric(6,2) check (score is null or score between 0 and 100),
  confidence_level text not null default 'not_assessed' check (confidence_level in ('not_assessed','low','moderate','high','very_high')),
  analyst_notes text,
  evaluated_at timestamptz,
  evaluated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz,
  validated_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  unique(diagnosis_id,question_id),
  foreign key(diagnosis_id,organization_id) references public.skda_diagnoses(id,organization_id) on delete cascade
);

create table public.skda_interviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  diagnosis_id uuid not null,
  code text not null,
  title text not null,
  interviewee_name text,
  interviewee_role text,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  channel text not null default 'teams',
  meeting_reference text,
  status text not null default 'planned' check (status in ('planned','in_progress','completed','validated','cancelled')),
  transcript_evidence_asset_id uuid references public.sparks_evidence_assets(id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  unique(diagnosis_id,code),
  foreign key(diagnosis_id,organization_id) references public.skda_diagnoses(id,organization_id) on delete cascade,
  check (length(trim(code)) > 0),
  check (length(trim(title)) > 0),
  check (scheduled_end is null or scheduled_start is null or scheduled_end >= scheduled_start)
);

create table public.skda_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  diagnosis_id uuid not null,
  question_id uuid references public.skda_questions(id) on delete set null,
  interview_id uuid references public.skda_interviews(id) on delete set null,
  finding_type text not null check (finding_type in ('strength','gap','opportunity','risk','observation')),
  title text not null,
  description text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','accepted','in_action','resolved','dismissed')),
  recommendation text,
  owner_user_id uuid references public.profiles(id) on delete set null,
  due_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  foreign key(diagnosis_id,organization_id) references public.skda_diagnoses(id,organization_id) on delete cascade,
  check (length(trim(title)) > 0),
  check (length(trim(description)) > 0)
);

create table public.skda_evidence_correlations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  diagnosis_id uuid not null,
  evidence_asset_id uuid not null references public.sparks_evidence_assets(id) on delete cascade,
  target_type text not null
    check (target_type in ('diagnosis','question','response','interview','finding')),
  target_id uuid not null,
  usage_type text not null default 'support'
    check (usage_type in ('support','contradiction','context','baseline','validation','reference')),
  relevance_level text not null default 'important'
    check (relevance_level in ('fundamental','important','complementary','optional')),
  adequacy_score numeric(5,2) check (adequacy_score is null or adequacy_score between 0 and 100),
  sufficiency_score numeric(5,2) check (sufficiency_score is null or sufficiency_score between 0 and 100),
  reliability_score numeric(5,2) check (reliability_score is null or reliability_score between 0 and 100),
  analyst_interpretation text,
  validation_status text not null default 'pending'
    check (validation_status in ('pending','validated','rejected')),
  validated_at timestamptz,
  validated_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  foreign key (diagnosis_id,organization_id)
    references public.skda_diagnoses(id,organization_id) on delete cascade,
  unique(diagnosis_id,evidence_asset_id,target_type,target_id)
);

create index idx_skda_evidence_correlations_target
  on public.skda_evidence_correlations(diagnosis_id,target_type,target_id);

create index idx_skda_evidence_correlations_evidence
  on public.skda_evidence_correlations(organization_id,evidence_asset_id);

create table public.sparks_initiative_origins (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid not null,
  organization_id uuid not null,
  source_module_code text,
  source_entity_type text not null,
  source_entity_id uuid,
  source_reference text,
  trigger_type text not null,
  impact_level text not null default 'not_assessed'
    check (impact_level in ('not_assessed','low','medium','high','critical')),
  contribution_weight numeric(5,2) not null default 0
    check (contribution_weight between 0 and 100),
  is_primary boolean not null default false,
  rationale text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  foreign key (initiative_id,organization_id)
    references public.sparks_initiatives(id,organization_id) on delete cascade,
  check (length(trim(source_entity_type)) > 0),
  check (length(trim(trigger_type)) > 0),
  check (source_module_code is null or length(trim(source_module_code)) > 0),
  check (source_entity_id is not null or nullif(trim(source_reference),'') is not null)
);

create unique index uq_sparks_initiative_origins_primary
  on public.sparks_initiative_origins(initiative_id)
  where is_primary;

create unique index uq_sparks_initiative_origins_entity
  on public.sparks_initiative_origins(
    initiative_id,
    coalesce(source_module_code,''),
    source_entity_type,
    source_entity_id
  )
  where source_entity_id is not null;

create index idx_sparks_initiative_origins_org_source
  on public.sparks_initiative_origins(
    organization_id,
    source_module_code,
    trigger_type,
    impact_level
  );

create table public.sparks_initiative_execution_profiles (
  initiative_id uuid primary key,
  organization_id uuid not null,
  primary_model_code text not null default 'task'
    check (primary_model_code in ('project_management','sipoc','sprint','task','custom')),
  enabled_capabilities jsonb not null default '[]'::jsonb
    check (jsonb_typeof(enabled_capabilities) = 'array'),
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  foreign key (initiative_id,organization_id)
    references public.sparks_initiatives(id,organization_id) on delete cascade
);

create index idx_sparks_initiative_execution_profiles_org_model
  on public.sparks_initiative_execution_profiles(organization_id,primary_model_code);

create index idx_skda_catalog_versions_status on public.skda_catalog_versions(status,framework_code);
create index idx_skda_questions_catalog_order on public.skda_questions(catalog_version_id,display_order);
create index idx_skda_diagnoses_org_status on public.skda_diagnoses(organization_id,status) where archived_at is null;
create index idx_skda_diagnoses_catalog on public.skda_diagnoses(catalog_version_id);
create index idx_skda_responses_diagnosis_status on public.skda_responses(diagnosis_id,response_status);
create index idx_skda_responses_org_class on public.skda_responses(organization_id,classification);
create index idx_skda_responses_question on public.skda_responses(question_id);
create index idx_skda_interviews_diagnosis_status on public.skda_interviews(diagnosis_id,status);
create index idx_skda_interviews_org_schedule on public.skda_interviews(organization_id,scheduled_start);
create index idx_skda_findings_diagnosis_status on public.skda_findings(diagnosis_id,status,priority);
create index idx_skda_findings_org_type on public.skda_findings(organization_id,finding_type);
create index idx_skda_findings_question on public.skda_findings(question_id);
create index idx_skda_findings_interview on public.skda_findings(interview_id);

create trigger set_skda_catalog_versions_updated_at before update on public.skda_catalog_versions
for each row execute function public.set_updated_at();
create trigger set_skda_questions_updated_at before update on public.skda_questions
for each row execute function public.set_updated_at();
create trigger set_skda_diagnoses_updated_at before update on public.skda_diagnoses
for each row execute function public.set_updated_at();
create trigger set_skda_responses_updated_at before update on public.skda_responses
for each row execute function public.set_updated_at();
create trigger set_skda_interviews_updated_at before update on public.skda_interviews
for each row execute function public.set_updated_at();
create trigger set_skda_findings_updated_at before update on public.skda_findings
for each row execute function public.set_updated_at();
create trigger set_skda_evidence_correlations_updated_at before update on public.skda_evidence_correlations
for each row execute function public.set_updated_at();
create trigger set_sparks_initiative_origins_updated_at before update on public.sparks_initiative_origins
for each row execute function public.set_updated_at();
create trigger set_sparks_initiative_execution_profiles_updated_at before update on public.sparks_initiative_execution_profiles
for each row execute function public.set_updated_at();

alter table public.skda_catalog_versions enable row level security;
alter table public.skda_questions enable row level security;
alter table public.skda_diagnoses enable row level security;
alter table public.skda_responses enable row level security;
alter table public.skda_interviews enable row level security;
alter table public.skda_findings enable row level security;
alter table public.skda_evidence_correlations enable row level security;
alter table public.sparks_initiative_origins enable row level security;
alter table public.sparks_initiative_execution_profiles enable row level security;

create policy skda_catalog_versions_select on public.skda_catalog_versions
for select to authenticated using (status='published');
create policy skda_questions_select on public.skda_questions
for select to authenticated using (
  exists (
    select 1 from public.skda_catalog_versions cv
    where cv.id=skda_questions.catalog_version_id and cv.status='published'
  )
);

create policy skda_diagnoses_select on public.skda_diagnoses
for select to authenticated using (public.has_module_access(organization_id,'SK-DA'));
create policy skda_diagnoses_insert on public.skda_diagnoses
for insert to authenticated with check (public.has_module_permission(organization_id,'SK-DA','diagnosis.manage'));
create policy skda_diagnoses_update on public.skda_diagnoses
for update to authenticated
using (public.has_module_permission(organization_id,'SK-DA','diagnosis.manage'))
with check (public.has_module_permission(organization_id,'SK-DA','diagnosis.manage'));
create policy skda_diagnoses_delete on public.skda_diagnoses
for delete to authenticated using (public.has_module_permission(organization_id,'SK-DA','module.manage'));

create policy skda_responses_select on public.skda_responses
for select to authenticated using (public.has_module_access(organization_id,'SK-DA'));
create policy skda_responses_insert on public.skda_responses
for insert to authenticated with check (public.has_module_permission(organization_id,'SK-DA','assessment.edit'));
create policy skda_responses_update on public.skda_responses
for update to authenticated
using (
  public.has_module_permission(organization_id,'SK-DA','assessment.edit')
  or public.has_module_permission(organization_id,'SK-DA','assessment.validate')
)
with check (
  public.has_module_permission(organization_id,'SK-DA','assessment.edit')
  or public.has_module_permission(organization_id,'SK-DA','assessment.validate')
);

create policy skda_interviews_select on public.skda_interviews
for select to authenticated using (public.has_module_access(organization_id,'SK-DA'));
create policy skda_interviews_insert on public.skda_interviews
for insert to authenticated with check (public.has_module_permission(organization_id,'SK-DA','interview.edit'));
create policy skda_interviews_update on public.skda_interviews
for update to authenticated
using (public.has_module_permission(organization_id,'SK-DA','interview.edit'))
with check (public.has_module_permission(organization_id,'SK-DA','interview.edit'));

create policy skda_findings_select on public.skda_findings
for select to authenticated using (public.has_module_access(organization_id,'SK-DA'));
create policy skda_findings_insert on public.skda_findings
for insert to authenticated with check (public.has_module_permission(organization_id,'SK-DA','findings.edit'));
create policy skda_findings_update on public.skda_findings
for update to authenticated
using (public.has_module_permission(organization_id,'SK-DA','findings.edit'))
with check (public.has_module_permission(organization_id,'SK-DA','findings.edit'));

create policy skda_evidence_correlations_select on public.skda_evidence_correlations
for select to authenticated
using (public.has_module_access(organization_id,'SK-DA'));
create policy skda_evidence_correlations_insert on public.skda_evidence_correlations
for insert to authenticated
with check (public.has_module_permission(organization_id,'SK-DA','evidence.link'));
create policy skda_evidence_correlations_update on public.skda_evidence_correlations
for update to authenticated
using (public.has_module_permission(organization_id,'SK-DA','evidence.link'))
with check (public.has_module_permission(organization_id,'SK-DA','evidence.link'));
create policy skda_evidence_correlations_delete on public.skda_evidence_correlations
for delete to authenticated
using (public.has_module_permission(organization_id,'SK-DA','evidence.link'));

create policy sparks_initiative_origins_select on public.sparks_initiative_origins
for select to authenticated
using (public.can_read_organization(organization_id));
create policy sparks_initiative_origins_insert on public.sparks_initiative_origins
for insert to authenticated
with check (public.can_manage_organization(organization_id));
create policy sparks_initiative_origins_update on public.sparks_initiative_origins
for update to authenticated
using (public.can_manage_organization(organization_id))
with check (public.can_manage_organization(organization_id));
create policy sparks_initiative_origins_delete on public.sparks_initiative_origins
for delete to authenticated
using (public.can_manage_organization(organization_id));

create policy sparks_initiative_execution_profiles_select on public.sparks_initiative_execution_profiles
for select to authenticated
using (public.can_read_organization(organization_id));
create policy sparks_initiative_execution_profiles_insert on public.sparks_initiative_execution_profiles
for insert to authenticated
with check (public.can_manage_organization(organization_id));
create policy sparks_initiative_execution_profiles_update on public.sparks_initiative_execution_profiles
for update to authenticated
using (public.can_manage_organization(organization_id))
with check (public.can_manage_organization(organization_id));
create policy sparks_initiative_execution_profiles_delete on public.sparks_initiative_execution_profiles
for delete to authenticated
using (public.can_manage_organization(organization_id));

revoke all on table public.skda_catalog_versions, public.skda_questions, public.skda_diagnoses,
  public.skda_responses, public.skda_interviews, public.skda_findings,
  public.skda_evidence_correlations,
  public.sparks_initiative_origins, public.sparks_initiative_execution_profiles from anon;

grant select on table public.skda_catalog_versions, public.skda_questions to authenticated;
grant select,insert,update,delete on table public.skda_diagnoses to authenticated;
grant select,insert,update on table public.skda_responses, public.skda_interviews, public.skda_findings to authenticated;
grant select,insert,update,delete on table public.skda_evidence_correlations to authenticated;
grant select,insert,update,delete on table public.sparks_initiative_origins,
  public.sparks_initiative_execution_profiles to authenticated;

grant select,insert,update,delete on table public.skda_catalog_versions, public.skda_questions, public.skda_diagnoses,
  public.skda_responses, public.skda_interviews, public.skda_findings,
  public.skda_evidence_correlations,
  public.sparks_initiative_origins, public.sparks_initiative_execution_profiles to service_role;

create or replace function public.get_platform_admin_modules()
returns table (
  module_id uuid,
  module_code text,
  module_name text,
  module_short_name text,
  description text,
  status text,
  is_core boolean,
  display_order integer,
  enabled_organizations_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_platform_super_admin();

  return query
  select
    m.id,
    m.code,
    m.name,
    m.short_name,
    m.description,
    m.status,
    m.is_core,
    m.display_order,
    (
      select count(*)
      from public.organization_modules om
      join public.organizations o on o.id = om.organization_id
      where om.module_id = m.id
        and om.enabled = true
        and om.status = 'active'
        and o.code <> 'SKPE-V1-RUNTIME'
    )
  from public.modules m
  order by m.display_order, lower(m.name);
end;
$$;

commit;
