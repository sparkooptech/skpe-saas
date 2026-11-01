begin;

-- ============================================================
-- SK-DA | Jornada como Projeto + Entrevistas na Agenda + Plano
-- de Ação em ciclos.
--
-- Regras:
-- - skda_diagnoses continua sendo a autoridade metodológica do DA.
-- - sparks_initiatives representa a execução transversal da Jornada.
-- - sparks_events/sparks_event_participants continuam sendo a
--   autoridade transversal de Agenda e participantes.
-- - ações aprovadas do DA continuam sendo iniciativas transversais;
--   o DA guarda apenas a alocação metodológica em Ciclos 1..3.
-- ============================================================

alter table public.skda_diagnoses
  add column execution_initiative_id uuid
    references public.sparks_initiatives(id) on delete set null,
  add column current_megaphase_code text not null default 'MF0';

alter table public.skda_diagnoses
  add constraint skda_diagnoses_current_megaphase_check
  check (
    current_megaphase_code in (
      'MF0','MF1','MF2','MF3','MF4','MF5',
      'MF6','MF7','MF8','MF9','MF10'
    )
  );

comment on column public.skda_diagnoses.current_megaphase_code is
  'MegaFase metodológica corrente da Jornada DA. Distingue o processo metodológico MF0..MF10 dos workspaces funcionais DA-00..DA-06.';

create unique index uq_skda_diagnoses_execution_initiative
  on public.skda_diagnoses(execution_initiative_id)
  where execution_initiative_id is not null;

comment on column public.skda_diagnoses.execution_initiative_id is
  'Projeto transversal que representa a execução/coordenação da Jornada DA. O diagnóstico permanece autoridade metodológica.';

alter table public.skda_interviews
  add column event_id uuid
    references public.sparks_events(id) on delete set null,
  add column actual_start timestamptz,
  add column actual_end timestamptz;

alter table public.skda_interviews
  add constraint skda_interviews_actual_range_check
  check (
    actual_end is null
    or actual_start is null
    or actual_end >= actual_start
  );

create unique index uq_skda_interviews_event
  on public.skda_interviews(event_id)
  where event_id is not null;

comment on column public.skda_interviews.event_id is
  'Evento transversal da Agenda SPARKs associado à entrevista.';
comment on column public.skda_interviews.actual_start is
  'Data/hora efetiva de início da entrevista, distinta da previsão.';
comment on column public.skda_interviews.actual_end is
  'Data/hora efetiva de término da entrevista, distinta da previsão.';

create table public.skda_action_plan_allocations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  diagnosis_id uuid not null,
  finding_id uuid not null references public.skda_findings(id) on delete cascade,
  initiative_id uuid references public.sparks_initiatives(id) on delete set null,
  cycle_number smallint not null
    check (cycle_number between 1 and 3),
  sequence_order integer not null default 0
    check (sequence_order >= 0),
  rationale text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  foreign key (diagnosis_id,organization_id)
    references public.skda_diagnoses(id,organization_id) on delete cascade,
  unique(diagnosis_id,finding_id)
);

create index idx_skda_action_plan_cycle
  on public.skda_action_plan_allocations(
    diagnosis_id,cycle_number,sequence_order
  );

create index idx_skda_action_plan_initiative
  on public.skda_action_plan_allocations(initiative_id)
  where initiative_id is not null;

create trigger set_skda_action_plan_allocations_updated_at
before update on public.skda_action_plan_allocations
for each row execute function public.set_updated_at();

alter table public.skda_action_plan_allocations enable row level security;

create policy skda_action_plan_allocations_select
on public.skda_action_plan_allocations
for select to authenticated
using (public.has_module_access(organization_id,'SK-DA'));

revoke all on table public.skda_action_plan_allocations
from public, anon, authenticated;

grant select on table public.skda_action_plan_allocations
to authenticated;

grant select,insert,update,delete
on table public.skda_action_plan_allocations
to service_role;

-- ============================================================
-- Agenda transversal: preservar autorização SK-PE existente e
-- adicionar SK-DA / skda_interview sem ampliar escopo indevido.
-- ============================================================

create or replace function public.can_manage_sparks_event_source(
  target_organization_id uuid,
  target_source_module_code text,
  target_source_entity_type text,
  target_source_entity_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    auth.uid() is not null
    and target_organization_id is not null
    and (
      public.can_manage_organization(target_organization_id)
      or (
        upper(trim(coalesce(target_source_module_code, ''))) = 'SK-PE'
        and lower(trim(coalesce(target_source_entity_type, ''))) = 'skpe_journey_item'
        and target_source_entity_id is not null
        and public.has_module_access(target_organization_id, 'SK-PE')
        and public.can_manage_skpe_journey(target_organization_id)
        and exists (
          select 1
          from public.skpe_journey_items ji
          join public.skpe_projects p
            on p.id = ji.project_id
           and p.organization_id = target_organization_id
           and p.archived_at is null
          where ji.id = target_source_entity_id
            and ji.archived_at is null
        )
      )
      or (
        upper(trim(coalesce(target_source_module_code, ''))) = 'SK-DA'
        and lower(trim(coalesce(target_source_entity_type, ''))) = 'skda_interview'
        and target_source_entity_id is not null
        and public.has_module_access(target_organization_id, 'SK-DA')
        and public.has_module_permission(
          target_organization_id,
          'SK-DA',
          'interview.edit'
        )
        and exists (
          select 1
          from public.skda_interviews interview
          where interview.id = target_source_entity_id
            and interview.organization_id = target_organization_id
        )
      )
    );
$function$;

revoke all on function public.can_manage_sparks_event_source(
  uuid,text,text,uuid
) from public, anon, authenticated;

grant execute on function public.can_manage_sparks_event_source(
  uuid,text,text,uuid
) to service_role;

comment on function public.can_manage_sparks_event_source(
  uuid,text,text,uuid
) is
  'Autoridade interna para eventos transversais. Preserva SK-PE Journey e habilita SK-DA somente para entrevistas pertencentes à mesma organização e sob interview.edit.';

-- ============================================================
-- Projeto transversal da Jornada DA.
-- ============================================================

create or replace function public.ensure_skda_diagnosis_project(
  target_diagnosis_id uuid,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_diagnosis public.skda_diagnoses%rowtype;
  v_initiative_id uuid;
  v_project_code text;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.'
      using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.'
      using errcode='22023';
  end if;

  select *
    into v_diagnosis
  from public.skda_diagnoses
  where id=target_diagnosis_id
    and archived_at is null
  for update;

  if v_diagnosis.id is null then
    raise exception 'Jornada DA não encontrada.'
      using errcode='P0002';
  end if;

  if not public.has_module_permission(
    v_diagnosis.organization_id,
    'SK-DA',
    'diagnosis.manage'
  ) then
    raise exception 'Acesso negado: sem permissão para gerir a Jornada DA.'
      using errcode='42501';
  end if;

  if v_diagnosis.execution_initiative_id is not null
     and exists (
       select 1
       from public.sparks_initiatives initiative
       where initiative.id=v_diagnosis.execution_initiative_id
         and initiative.organization_id=v_diagnosis.organization_id
         and initiative.archived_at is null
     ) then
    return v_diagnosis.execution_initiative_id;
  end if;

  select origin.initiative_id
    into v_initiative_id
  from public.sparks_initiative_origins origin
  join public.sparks_initiatives initiative
    on initiative.id=origin.initiative_id
   and initiative.organization_id=origin.organization_id
   and initiative.archived_at is null
  where origin.organization_id=v_diagnosis.organization_id
    and upper(coalesce(origin.source_module_code,''))='SK-DA'
    and origin.source_entity_type='skda_diagnosis'
    and origin.source_entity_id=v_diagnosis.id
  order by origin.is_primary desc,origin.created_at
  limit 1;

  if v_initiative_id is not null then
    update public.skda_diagnoses
    set execution_initiative_id=v_initiative_id,
        updated_by=auth.uid()
    where id=v_diagnosis.id;
    return v_initiative_id;
  end if;

  v_project_code := 'PROJ-' || trim(v_diagnosis.code);

  if exists (
    select 1
    from public.sparks_initiatives initiative
    where initiative.organization_id=v_diagnosis.organization_id
      and initiative.code=v_project_code
      and initiative.archived_at is null
  ) then
    raise exception
      'Já existe uma iniciativa ativa com o código %. Vincule-a de forma governada antes de continuar.',
      v_project_code
      using errcode='23505';
  end if;

  v_initiative_id := public.create_sparks_initiative(
    v_diagnosis.organization_id,
    'project',
    'transformation',
    v_project_code,
    'Projeto · ' || v_diagnosis.name,
    coalesce(
      v_diagnosis.description,
      'Projeto transversal para condução da Jornada de Diagnóstico Assistido.'
    ),
    'medium',
    'medium',
    null,
    null,
    'organization',
    'SK-DA',
    'skda_diagnosis:' || v_diagnosis.id::text,
    null,
    v_diagnosis.started_on,
    v_diagnosis.planned_end_on,
    change_reason
  );

  insert into public.sparks_initiative_origins (
    initiative_id,
    organization_id,
    source_module_code,
    source_entity_type,
    source_entity_id,
    source_reference,
    trigger_type,
    impact_level,
    contribution_weight,
    is_primary,
    rationale,
    metadata,
    created_by,
    updated_by
  ) values (
    v_initiative_id,
    v_diagnosis.organization_id,
    'SK-DA',
    'skda_diagnosis',
    v_diagnosis.id,
    v_diagnosis.code,
    'diagnosis_journey',
    'not_assessed',
    0,
    true,
    'Projeto criado para coordenar e executar a Jornada DA.',
    jsonb_build_object(
      'diagnosis_code',v_diagnosis.code,
      'diagnosis_type',v_diagnosis.diagnosis_type
    ),
    auth.uid(),
    auth.uid()
  );

  insert into public.sparks_initiative_execution_profiles (
    initiative_id,
    organization_id,
    primary_model_code,
    enabled_capabilities,
    configuration,
    created_by,
    updated_by
  ) values (
    v_initiative_id,
    v_diagnosis.organization_id,
    'project_management',
    '["kanban","5w2w","risks"]'::jsonb,
    jsonb_build_object(
      'source','SK-DA',
      'diagnosis_id',v_diagnosis.id
    ),
    auth.uid(),
    auth.uid()
  )
  on conflict (initiative_id) do update set
    primary_model_code='project_management',
    enabled_capabilities=excluded.enabled_capabilities,
    configuration=public.sparks_initiative_execution_profiles.configuration
      || excluded.configuration,
    updated_by=auth.uid();

  update public.skda_diagnoses
  set execution_initiative_id=v_initiative_id,
      updated_by=auth.uid()
  where id=v_diagnosis.id;

  return v_initiative_id;
end;
$function$;

revoke all on function public.ensure_skda_diagnosis_project(uuid,text)
from public,anon;

grant execute on function public.ensure_skda_diagnosis_project(uuid,text)
to authenticated,service_role;

create or replace function public.create_skda_diagnosis_with_project(
  target_organization_id uuid,
  target_code text,
  target_name text,
  target_description text default null,
  target_diagnosis_type text default 'pdgc',
  target_reference_year integer default null,
  change_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_diagnosis_id uuid;
  v_initiative_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.'
      using errcode='42501';
  end if;

  if not public.has_module_permission(
    target_organization_id,
    'SK-DA',
    'diagnosis.manage'
  ) then
    raise exception 'Acesso negado: sem permissão para criar Jornada DA.'
      using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.'
      using errcode='22023';
  end if;

  if length(trim(coalesce(target_code,'')))=0
     or length(trim(coalesce(target_name,'')))=0 then
    raise exception 'Código e nome da Jornada DA são obrigatórios.'
      using errcode='22023';
  end if;

  if lower(trim(coalesce(target_diagnosis_type,'')))
     not in ('pdgc','maturity','custom','other') then
    raise exception 'Tipo de diagnóstico inválido.'
      using errcode='22023';
  end if;

  insert into public.skda_diagnoses (
    organization_id,
    code,
    name,
    description,
    diagnosis_type,
    reference_year,
    status,
    current_phase_code,
    progress,
    created_by,
    updated_by
  ) values (
    target_organization_id,
    upper(trim(target_code)),
    trim(target_name),
    nullif(trim(coalesce(target_description,'')),''),
    lower(trim(target_diagnosis_type)),
    target_reference_year,
    'preparation',
    'DA-00',
    0,
    auth.uid(),
    auth.uid()
  )
  returning id into v_diagnosis_id;

  v_initiative_id := public.ensure_skda_diagnosis_project(
    v_diagnosis_id,
    change_reason
  );

  return jsonb_build_object(
    'diagnosis_id',v_diagnosis_id,
    'execution_initiative_id',v_initiative_id
  );
end;
$function$;

revoke all on function public.create_skda_diagnosis_with_project(
  uuid,text,text,text,text,integer,text
) from public,anon;

grant execute on function public.create_skda_diagnosis_with_project(
  uuid,text,text,text,text,integer,text
) to authenticated,service_role;

-- ============================================================
-- Entrevista DA como evento transversal da Agenda.
-- ============================================================

create or replace function public.create_skda_interview_with_event(
  target_diagnosis_id uuid,
  target_code text,
  target_title text,
  target_channel text default 'teams',
  target_scheduled_start timestamptz default null,
  target_scheduled_end timestamptz default null,
  target_meeting_reference text default null,
  change_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_diagnosis public.skda_diagnoses%rowtype;
  v_interview_id uuid := gen_random_uuid();
  v_event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.'
      using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.'
      using errcode='22023';
  end if;

  select *
    into v_diagnosis
  from public.skda_diagnoses
  where id=target_diagnosis_id
    and archived_at is null;

  if v_diagnosis.id is null then
    raise exception 'Jornada DA não encontrada.'
      using errcode='P0002';
  end if;

  if not public.has_module_permission(
    v_diagnosis.organization_id,
    'SK-DA',
    'interview.edit'
  ) then
    raise exception 'Acesso negado: sem permissão para gerir entrevistas.'
      using errcode='42501';
  end if;

  if length(trim(coalesce(target_code,'')))=0
     or length(trim(coalesce(target_title,'')))=0 then
    raise exception 'Código e título da entrevista são obrigatórios.'
      using errcode='22023';
  end if;

  if target_scheduled_end is not null
     and target_scheduled_start is not null
     and target_scheduled_end < target_scheduled_start then
    raise exception 'O término previsto não pode ser anterior ao início.'
      using errcode='22023';
  end if;

  insert into public.skda_interviews (
    id,
    organization_id,
    diagnosis_id,
    code,
    title,
    channel,
    scheduled_start,
    scheduled_end,
    meeting_reference,
    status,
    created_by,
    updated_by
  ) values (
    v_interview_id,
    v_diagnosis.organization_id,
    v_diagnosis.id,
    upper(trim(target_code)),
    trim(target_title),
    lower(trim(coalesce(target_channel,'teams'))),
    target_scheduled_start,
    target_scheduled_end,
    nullif(trim(coalesce(target_meeting_reference,'')),''),
    'planned',
    auth.uid(),
    auth.uid()
  );

  v_event_id := public.create_sparks_event(
    v_diagnosis.organization_id,
    'meeting',
    'Entrevista DA · ' || trim(target_title),
    'Entrevista planejada da Jornada ' || v_diagnosis.name || '.',
    target_scheduled_start,
    target_scheduled_end,
    false,
    null,
    'medium',
    'SK-DA',
    'skda_interview',
    v_interview_id,
    null,
    nullif(trim(coalesce(target_meeting_reference,'')),''),
    change_reason
  );

  perform public.set_sparks_event_participant(
    v_event_id,
    auth.uid(),
    'owner',
    true,
    change_reason
  );

  if target_scheduled_start is not null then
    perform public.transition_sparks_event_lifecycle(
      v_event_id,
      'scheduled',
      change_reason
    );
  end if;

  update public.skda_interviews
  set event_id=v_event_id,
      updated_by=auth.uid()
  where id=v_interview_id;

  return jsonb_build_object(
    'interview_id',v_interview_id,
    'event_id',v_event_id
  );
end;
$function$;

revoke all on function public.create_skda_interview_with_event(
  uuid,text,text,text,timestamptz,timestamptz,text,text
) from public,anon;

grant execute on function public.create_skda_interview_with_event(
  uuid,text,text,text,timestamptz,timestamptz,text,text
) to authenticated,service_role;

create or replace function public.record_skda_interview_realization(
  target_interview_id uuid,
  target_actual_start timestamptz,
  target_actual_end timestamptz default null,
  target_notes text default null,
  change_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_interview public.skda_interviews%rowtype;
  v_event public.sparks_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.'
      using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.'
      using errcode='22023';
  end if;

  select *
    into v_interview
  from public.skda_interviews
  where id=target_interview_id
  for update;

  if v_interview.id is null then
    raise exception 'Entrevista não encontrada.'
      using errcode='P0002';
  end if;

  if not public.has_module_permission(
    v_interview.organization_id,
    'SK-DA',
    'interview.edit'
  ) then
    raise exception 'Acesso negado: sem permissão para gerir entrevistas.'
      using errcode='42501';
  end if;

  if target_actual_start is null then
    raise exception 'Informe a data/hora real de início.'
      using errcode='22023';
  end if;

  if target_actual_end is not null
     and target_actual_end < target_actual_start then
    raise exception 'O término real não pode ser anterior ao início real.'
      using errcode='22023';
  end if;

  update public.skda_interviews
  set actual_start=target_actual_start,
      actual_end=target_actual_end,
      notes=coalesce(nullif(trim(coalesce(target_notes,'')),''),notes),
      status=case
        when target_actual_end is null then 'in_progress'
        else 'completed'
      end,
      updated_by=auth.uid()
  where id=v_interview.id
  returning * into v_interview;

  if v_interview.event_id is not null then
    select * into v_event
    from public.sparks_events
    where id=v_interview.event_id
      and archived_at is null;

    if v_event.id is not null then
      if v_event.status='draft' and v_event.starts_at is not null then
        perform public.transition_sparks_event_lifecycle(
          v_event.id,'scheduled',change_reason
        );
        v_event.status := 'scheduled';
      end if;

      if target_actual_end is null
         and v_event.status='scheduled' then
        perform public.transition_sparks_event_lifecycle(
          v_event.id,'in_progress',change_reason
        );
      elsif target_actual_end is not null then
        if v_event.status='scheduled' then
          perform public.transition_sparks_event_lifecycle(
            v_event.id,'completed',change_reason
          );
        elsif v_event.status='in_progress' then
          perform public.transition_sparks_event_lifecycle(
            v_event.id,'completed',change_reason
          );
        end if;
      end if;
    end if;
  end if;

  return to_jsonb(v_interview);
end;
$function$;

revoke all on function public.record_skda_interview_realization(
  uuid,timestamptz,timestamptz,text,text
) from public,anon;

grant execute on function public.record_skda_interview_realization(
  uuid,timestamptz,timestamptz,text,text
) to authenticated,service_role;

-- ============================================================
-- Plano de Ação: alocação metodológica em ciclos, sem duplicar
-- iniciativa transversal.
-- ============================================================

create or replace function public.set_skda_action_plan_cycle(
  target_finding_id uuid,
  target_cycle_number integer,
  target_rationale text default null,
  change_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_finding public.skda_findings%rowtype;
  v_initiative_id uuid;
  v_allocation public.skda_action_plan_allocations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.'
      using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.'
      using errcode='22023';
  end if;

  if target_cycle_number not between 1 and 3 then
    raise exception 'O ciclo deve estar entre 1 e 3.'
      using errcode='22023';
  end if;

  select *
    into v_finding
  from public.skda_findings
  where id=target_finding_id
  for update;

  if v_finding.id is null then
    raise exception 'Achado não encontrado.'
      using errcode='P0002';
  end if;

  if v_finding.status not in ('accepted','in_action') then
    raise exception 'Somente recomendações aprovadas podem integrar o Plano de Ação.'
      using errcode='55000';
  end if;

  if nullif(trim(coalesce(v_finding.recommendation,'')),'') is null then
    raise exception 'O achado precisa possuir recomendação para integrar o Plano de Ação.'
      using errcode='55000';
  end if;

  if not (
    public.has_module_permission(
      v_finding.organization_id,'SK-DA','findings.edit'
    )
    or public.has_module_permission(
      v_finding.organization_id,'SK-DA','findings.validate'
    )
  ) then
    raise exception 'Acesso negado: sem permissão para priorizar o Plano de Ação.'
      using errcode='42501';
  end if;

  select origin.initiative_id
    into v_initiative_id
  from public.sparks_initiative_origins origin
  where origin.organization_id=v_finding.organization_id
    and upper(coalesce(origin.source_module_code,''))='SK-DA'
    and origin.source_entity_type='skda_finding'
    and origin.source_entity_id=v_finding.id
  order by origin.is_primary desc,origin.created_at
  limit 1;

  insert into public.skda_action_plan_allocations (
    organization_id,
    diagnosis_id,
    finding_id,
    initiative_id,
    cycle_number,
    rationale,
    metadata,
    created_by,
    updated_by
  ) values (
    v_finding.organization_id,
    v_finding.diagnosis_id,
    v_finding.id,
    v_initiative_id,
    target_cycle_number,
    nullif(trim(coalesce(target_rationale,'')),''),
    jsonb_build_object(
      'prioritization_method',
      case when target_cycle_number=1 then 'pareto_80_20' else 'sequenced_cycle' end
    ),
    auth.uid(),
    auth.uid()
  )
  on conflict(diagnosis_id,finding_id) do update set
    initiative_id=coalesce(
      excluded.initiative_id,
      public.skda_action_plan_allocations.initiative_id
    ),
    cycle_number=excluded.cycle_number,
    rationale=excluded.rationale,
    metadata=public.skda_action_plan_allocations.metadata
      || excluded.metadata,
    updated_by=auth.uid()
  returning * into v_allocation;

  return to_jsonb(v_allocation);
end;
$function$;

revoke all on function public.set_skda_action_plan_cycle(
  uuid,integer,text,text
) from public,anon;

grant execute on function public.set_skda_action_plan_cycle(
  uuid,integer,text,text
) to authenticated,service_role;

create or replace function public.get_skda_interview_event_management(
  target_interview_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_interview public.skda_interviews%rowtype;
  v_event public.sparks_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Operacao exige usuario autenticado.' using errcode='42501';
  end if;

  select *
    into v_interview
  from public.skda_interviews
  where id=target_interview_id;

  if v_interview.id is null then
    raise exception 'Entrevista nao encontrada.' using errcode='P0002';
  end if;

  if v_interview.event_id is null then
    raise exception 'Entrevista ainda nao possui evento transversal associado.' using errcode='55000';
  end if;

  if not public.can_manage_sparks_event_source(
    v_interview.organization_id,
    'SK-DA',
    'skda_interview',
    v_interview.id
  ) then
    raise exception 'Acesso negado: sem permissao para gerir o evento desta entrevista.' using errcode='42501';
  end if;

  select *
    into v_event
  from public.sparks_events
  where id=v_interview.event_id
    and organization_id=v_interview.organization_id
    and archived_at is null;

  if v_event.id is null then
    raise exception 'Evento transversal da entrevista nao encontrado.' using errcode='P0002';
  end if;

  return jsonb_build_object(
    'event_id',v_event.id,
    'journey_item_code',v_interview.code,
    'journey_item_title',v_interview.title,
    'event_type',v_event.event_type,
    'event_title',v_event.title,
    'event_description',v_event.description,
    'starts_at',v_event.starts_at,
    'ends_at',v_event.ends_at,
    'all_day',v_event.all_day,
    'timezone_name',v_event.timezone_name,
    'event_status',v_event.status,
    'priority',v_event.priority,
    'location_text',v_event.location_text,
    'meeting_reference',v_event.meeting_reference,
    'participant_count',(
      select count(*) from public.sparks_event_participants p
      where p.event_id=v_event.id
    ),
    'accepted_count',(
      select count(*) from public.sparks_event_participants p
      where p.event_id=v_event.id and p.response_status='accepted'
    ),
    'attended_count',(
      select count(*) from public.sparks_event_participants p
      where p.event_id=v_event.id and p.attendance_status='attended'
    )
  );
end;
$function$;

revoke all on function public.get_skda_interview_event_management(uuid)
from public,anon;

grant execute on function public.get_skda_interview_event_management(uuid)
to authenticated,service_role;

comment on function public.get_skda_interview_event_management(uuid) is
  'Projeção governada do evento transversal associado a uma entrevista SK-DA, sem expor leitura direta da tabela sparks_events.';

-- ============================================================
-- Participantes internos do DA não precisam possuir papel no
-- módulo SK-DA. O vínculo ativo com a organização é suficiente
-- para participar da entrevista, sem conceder acesso ao módulo.
-- Demais fontes preservam a regra vigente.
-- ============================================================

create or replace function public.set_sparks_event_participant(
  target_event_id uuid,
  target_user_id uuid,
  target_participant_role text,
  target_required boolean default true,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_event public.sparks_events%rowtype;
  v_participant_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_is_skda_interview boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Operacao exige usuario autenticado.' using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  select * into v_event
  from public.sparks_events
  where id=target_event_id and archived_at is null
  for update;

  if v_event.id is null then
    raise exception 'Evento nao encontrado ou arquivado.' using errcode='22023';
  end if;

  if not public.can_manage_sparks_event_source(
    v_event.organization_id,
    v_event.source_module_code,
    v_event.source_entity_type,
    v_event.source_entity_id
  ) then
    raise exception 'Acesso negado: o usuario nao pode gerir participantes deste evento.' using errcode='42501';
  end if;

  v_is_skda_interview :=
    upper(coalesce(v_event.source_module_code,''))='SK-DA'
    and lower(coalesce(v_event.source_entity_type,''))='skda_interview';

  if not exists (
    select 1
    from public.organization_memberships membership
    join public.profiles profile on profile.id=membership.user_id
    where membership.organization_id=v_event.organization_id
      and membership.user_id=target_user_id
      and membership.status='active'
      and membership.valid_from <= timezone('utc',now())
      and (membership.valid_until is null or membership.valid_until >= timezone('utc',now()))
      and profile.active=true
  ) then
    raise exception 'Participante precisa ser usuario ativo da organizacao.' using errcode='22023';
  end if;

  if v_event.source_module_code is not null
     and not v_is_skda_interview
     and not exists (
       select 1
       from public.organization_modules om
       join public.modules m on m.id=om.module_id
       join public.user_module_roles umr on umr.organization_module_id=om.id
       join public.module_roles mr on mr.id=umr.module_role_id
       where om.organization_id=v_event.organization_id
         and m.code=v_event.source_module_code
         and m.status='active'
         and om.enabled=true
         and om.status in ('trial','active')
         and om.valid_from <= timezone('utc',now())
         and (om.valid_until is null or om.valid_until >= timezone('utc',now()))
         and umr.user_id=target_user_id
         and umr.status='active'
         and umr.valid_from <= timezone('utc',now())
         and (umr.valid_until is null or umr.valid_until >= timezone('utc',now()))
         and mr.active=true
     ) then
    raise exception 'Participante nao possui acesso ativo ao modulo de origem do evento.' using errcode='22023';
  end if;

  select to_jsonb(p) into v_before
  from public.sparks_event_participants p
  where p.event_id=target_event_id and p.user_id=target_user_id;

  insert into public.sparks_event_participants(
    event_id,user_id,participant_role,response_status,
    attendance_status,required,created_by,updated_by
  ) values(
    target_event_id,target_user_id,lower(trim(target_participant_role)),
    'pending','not_recorded',coalesce(target_required,true),
    auth.uid(),auth.uid()
  )
  on conflict(event_id,user_id) do update set
    participant_role=excluded.participant_role,
    required=excluded.required,
    updated_by=auth.uid()
  returning id into v_participant_id;

  select to_jsonb(p) into v_after
  from public.sparks_event_participants p
  where p.id=v_participant_id;

  insert into public.sparks_agenda_audit(
    organization_id,event_id,actor_user_id,action_code,
    change_reason,previous_data,new_data
  ) values(
    v_event.organization_id,v_event.id,auth.uid(),
    'event.participant.set',trim(change_reason),v_before,v_after
  );

  return v_participant_id;
end;
$function$;

comment on function public.set_sparks_event_participant(
  uuid,uuid,text,boolean,text
) is
  'Gerencia participante interno. Preserva a exigência de papel no módulo para fontes existentes; entrevistas SK-DA aceitam qualquer membro ativo da organização sem conceder acesso ao módulo.';

create or replace function public.get_sparks_event_participant_management(
  target_event_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_event public.sparks_events%rowtype;
  v_participants jsonb := '[]'::jsonb;
  v_candidates jsonb := '[]'::jsonb;
  v_external_candidates jsonb := '[]'::jsonb;
  v_is_skda_interview boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Operacao exige usuario autenticado.' using errcode='42501';
  end if;

  select * into v_event
  from public.sparks_events
  where id=target_event_id;

  if v_event.id is null then
    raise exception 'Evento nao encontrado.' using errcode='P0002';
  end if;

  if not public.can_manage_sparks_event_source(
    v_event.organization_id,
    v_event.source_module_code,
    v_event.source_entity_type,
    v_event.source_entity_id
  ) then
    raise exception 'Acesso negado: o usuario nao pode gerir participantes deste evento.' using errcode='42501';
  end if;

  v_is_skda_interview :=
    upper(coalesce(v_event.source_module_code,''))='SK-DA'
    and lower(coalesce(v_event.source_entity_type,''))='skda_interview';

  select coalesce(jsonb_agg(jsonb_build_object(
    'participant_id', ep.id,
    'person_id', ep.person_id,
    'user_id', ep.user_id,
    'participant_origin', case when ep.user_id is null then 'external' else 'internal' end,
    'user_email', coalesce(profile.email, person.primary_email),
    'user_display_name', coalesce(
      profile.display_name, profile.full_name,
      person.preferred_name, person.full_name,
      profile.email, person.primary_email
    ),
    'external_organization', relationship.metadata ->> 'external_organization',
    'relationship_type', relationship.relationship_type,
    'job_title', relationship.job_title,
    'participant_role', ep.participant_role,
    'participant_function', ep.participant_function,
    'response_status', ep.response_status,
    'attendance_status', ep.attendance_status,
    'required', ep.required
  ) order by
    case ep.participant_role
      when 'owner' then 1 when 'chair' then 2 when 'secretary' then 3
      when 'responsible' then 4 when 'participant' then 5 else 6
    end,
    coalesce(
      profile.display_name, profile.full_name,
      person.preferred_name, person.full_name,
      profile.email, person.primary_email
    ), ep.id), '[]'::jsonb)
  into v_participants
  from public.sparks_event_participants ep
  left join public.profiles profile on profile.id=ep.user_id
  left join public.sparks_people person on person.id=ep.person_id
  left join lateral (
    select r.*
    from public.sparks_organization_people r
    where r.organization_id=v_event.organization_id
      and r.person_id=ep.person_id
      and r.status='active'
    order by r.is_primary_relationship desc,
             r.start_date desc nulls last,
             r.created_at desc
    limit 1
  ) relationship on true
  where ep.event_id=v_event.id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id',candidate.user_id,
    'user_email',candidate.user_email,
    'user_display_name',candidate.user_display_name,
    'is_current_participant',candidate.is_current_participant
  ) order by candidate.user_display_name,candidate.user_email,candidate.user_id),'[]'::jsonb)
  into v_candidates
  from (
    select distinct
      membership.user_id,
      profile.email::text as user_email,
      coalesce(profile.display_name,profile.full_name,profile.email)::text
        as user_display_name,
      exists(
        select 1 from public.sparks_event_participants ep
        where ep.event_id=v_event.id
          and ep.user_id=membership.user_id
      ) as is_current_participant
    from public.organization_memberships membership
    join public.profiles profile on profile.id=membership.user_id
    where membership.organization_id=v_event.organization_id
      and membership.status='active'
      and membership.valid_from <= timezone('utc',now())
      and (membership.valid_until is null or membership.valid_until >= timezone('utc',now()))
      and profile.active=true
      and (
        v_event.source_module_code is null
        or v_is_skda_interview
        or exists(
          select 1
          from public.organization_modules om
          join public.modules module on module.id=om.module_id
          join public.user_module_roles umr
            on umr.organization_module_id=om.id
           and umr.user_id=membership.user_id
          join public.module_roles mr
            on mr.id=umr.module_role_id
           and mr.module_id=module.id
          where om.organization_id=v_event.organization_id
            and module.code=v_event.source_module_code
            and module.status='active'
            and om.enabled=true
            and om.status in ('trial','active')
            and om.valid_from <= timezone('utc',now())
            and (om.valid_until is null or om.valid_until >= timezone('utc',now()))
            and umr.status='active'
            and umr.valid_from <= timezone('utc',now())
            and (umr.valid_until is null or umr.valid_until >= timezone('utc',now()))
            and mr.active=true
        )
      )
  ) candidate;

  select coalesce(jsonb_agg(jsonb_build_object(
    'person_id',candidate.person_id,
    'display_name',candidate.display_name,
    'primary_email',candidate.primary_email,
    'external_organization',candidate.external_organization,
    'relationship_type',candidate.relationship_type,
    'job_title',candidate.job_title,
    'is_current_participant',candidate.is_current_participant
  ) order by candidate.display_name,candidate.primary_email,candidate.person_id),'[]'::jsonb)
  into v_external_candidates
  from (
    select distinct on (person.id)
      person.id as person_id,
      coalesce(person.preferred_name,person.full_name)::text as display_name,
      person.primary_email::text as primary_email,
      relationship.metadata ->> 'external_organization' as external_organization,
      relationship.relationship_type::text as relationship_type,
      relationship.job_title::text as job_title,
      exists(
        select 1 from public.sparks_event_participants ep
        where ep.event_id=v_event.id
          and ep.person_id=person.id
      ) as is_current_participant
    from public.sparks_organization_people relationship
    join public.sparks_people person on person.id=relationship.person_id
    where relationship.organization_id=v_event.organization_id
      and relationship.status='active'
      and (relationship.start_date is null or relationship.start_date <= current_date)
      and (relationship.end_date is null or relationship.end_date >= current_date)
      and person.person_status='active'
      and person.archived_at is null
      and person.profile_user_id is null
    order by person.id,
             relationship.is_primary_relationship desc,
             relationship.start_date desc nulls last,
             relationship.created_at desc
  ) candidate;

  return jsonb_build_object(
    'event_id',v_event.id,
    'event_status',v_event.status,
    'organization_id',v_event.organization_id,
    'source_module_code',v_event.source_module_code,
    'participants',v_participants,
    'eligible_users',v_candidates,
    'eligible_external_people',v_external_candidates
  );
end;
$function$;

comment on function public.get_sparks_event_participant_management(uuid) is
  'Projeção governada de participantes internos/externos. Para entrevista SK-DA, todos os membros ativos da organização são elegíveis sem receber acesso ao módulo.';

commit;
