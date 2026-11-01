begin;

create table if not exists public.skda_interview_question_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  diagnosis_id uuid not null,
  interview_id uuid not null references public.skda_interviews(id) on delete cascade,
  question_id uuid not null references public.skda_questions(id) on delete cascade,
  sequence_order integer not null default 0 check (sequence_order >= 0),
  status text not null default 'pending'
    check (status in ('pending','in_progress','completed','skipped')),
  observed_practice text,
  interview_notes text,
  evidence_cited text,
  evidence_requested text,
  gap_summary text,
  output_type text
    check (output_type is null or output_type in (
      'evidence_identified',
      'evidence_to_provide',
      'practice_without_formalization',
      'document_without_execution',
      'execution_without_result',
      'partial_evidence',
      'contradiction',
      'action_gap',
      'report_to_validate',
      'not_applicable',
      'not_evaluated'
    )),
  next_action text,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  foreign key (diagnosis_id,organization_id)
    references public.skda_diagnoses(id,organization_id) on delete cascade,
  unique(interview_id,question_id)
);

create index if not exists idx_skda_interview_question_records_diagnosis
  on public.skda_interview_question_records(diagnosis_id,question_id,status);

create index if not exists idx_skda_interview_question_records_interview
  on public.skda_interview_question_records(interview_id,sequence_order);

drop trigger if exists set_skda_interview_question_records_updated_at
  on public.skda_interview_question_records;
create trigger set_skda_interview_question_records_updated_at
before update on public.skda_interview_question_records
for each row execute function public.set_updated_at();

alter table public.skda_interview_question_records enable row level security;

drop policy if exists skda_interview_question_records_select on public.skda_interview_question_records;
create policy skda_interview_question_records_select
on public.skda_interview_question_records
for select to authenticated
using (public.has_module_access(organization_id,'SK-DA'));

drop policy if exists skda_interview_question_records_manage on public.skda_interview_question_records;
create policy skda_interview_question_records_manage
on public.skda_interview_question_records
for all to authenticated
using (public.has_module_permission(organization_id,'SK-DA','interview.edit'))
with check (public.has_module_permission(organization_id,'SK-DA','interview.edit'));

grant select,insert,update,delete on public.skda_interview_question_records to authenticated,service_role;

create or replace function public.start_skda_interview_session(
  target_interview_id uuid,
  change_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_interview public.skda_interviews%rowtype;
  v_diagnosis public.skda_diagnoses%rowtype;
  v_event public.sparks_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.' using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  select * into v_interview
  from public.skda_interviews
  where id=target_interview_id
  for update;

  if v_interview.id is null then
    raise exception 'Entrevista não encontrada.' using errcode='P0002';
  end if;

  if not public.has_module_permission(v_interview.organization_id,'SK-DA','interview.edit') then
    raise exception 'Acesso negado: sem permissão para conduzir entrevistas.' using errcode='42501';
  end if;

  if v_interview.status in ('completed','validated','cancelled') then
    raise exception 'Esta entrevista não pode ser iniciada no estado atual.' using errcode='22023';
  end if;

  select * into v_diagnosis
  from public.skda_diagnoses
  where id=v_interview.diagnosis_id
    and organization_id=v_interview.organization_id
    and archived_at is null;

  if v_diagnosis.id is null or v_diagnosis.catalog_version_id is null then
    raise exception 'A Jornada precisa possuir catálogo oficial antes da entrevista.' using errcode='22023';
  end if;

  insert into public.skda_interview_question_records (
    organization_id,diagnosis_id,interview_id,question_id,sequence_order,status,created_by,updated_by
  )
  select
    v_interview.organization_id,
    v_interview.diagnosis_id,
    v_interview.id,
    q.id,
    row_number() over (
      order by
        case when lower(coalesce(q.axis_name,'')) like '%governan%' then 0
             when lower(coalesce(q.axis_name,'')) like '%gest%' then 1
             else 2 end,
        q.display_order
    ) - 1,
    'pending',
    auth.uid(),
    auth.uid()
  from public.skda_questions q
  where q.catalog_version_id=v_diagnosis.catalog_version_id
  on conflict (interview_id,question_id) do nothing;

  update public.skda_interviews
  set
    actual_start=coalesce(actual_start,timezone('utc',now())),
    status='in_progress',
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
        perform public.transition_sparks_event_lifecycle(v_event.id,'scheduled',change_reason);
        v_event.status := 'scheduled';
      end if;
      if v_event.status='scheduled' then
        perform public.transition_sparks_event_lifecycle(v_event.id,'in_progress',change_reason);
      end if;
    end if;
  end if;

  return to_jsonb(v_interview);
end;
$function$;

revoke all on function public.start_skda_interview_session(uuid,text) from public,anon;
grant execute on function public.start_skda_interview_session(uuid,text) to authenticated,service_role;

create or replace function public.save_skda_interview_question_record(
  target_interview_id uuid,
  target_question_id uuid,
  target_status text,
  target_observed_practice text default null,
  target_interview_notes text default null,
  target_evidence_cited text default null,
  target_evidence_requested text default null,
  target_gap_summary text default null,
  target_output_type text default null,
  target_next_action text default null,
  change_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_interview public.skda_interviews%rowtype;
  v_question public.skda_questions%rowtype;
  v_record public.skda_interview_question_records%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.' using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  if target_status not in ('pending','in_progress','completed','skipped') then
    raise exception 'Situação inválida para o registro da questão.' using errcode='22023';
  end if;

  if target_output_type is not null and target_output_type not in (
    'evidence_identified','evidence_to_provide','practice_without_formalization',
    'document_without_execution','execution_without_result','partial_evidence',
    'contradiction','action_gap','report_to_validate','not_applicable','not_evaluated'
  ) then
    raise exception 'Saída da entrevista inválida.' using errcode='22023';
  end if;

  select * into v_interview
  from public.skda_interviews
  where id=target_interview_id;

  if v_interview.id is null then
    raise exception 'Entrevista não encontrada.' using errcode='P0002';
  end if;

  if not public.has_module_permission(v_interview.organization_id,'SK-DA','interview.edit') then
    raise exception 'Acesso negado: sem permissão para registrar a entrevista.' using errcode='42501';
  end if;

  select q.* into v_question
  from public.skda_diagnoses d
  join public.skda_questions q on q.catalog_version_id=d.catalog_version_id
  where d.id=v_interview.diagnosis_id
    and d.organization_id=v_interview.organization_id
    and q.id=target_question_id;

  if v_question.id is null then
    raise exception 'Questão não pertence ao catálogo desta Jornada.' using errcode='22023';
  end if;

  insert into public.skda_interview_question_records (
    organization_id,diagnosis_id,interview_id,question_id,sequence_order,status,
    observed_practice,interview_notes,evidence_cited,evidence_requested,gap_summary,
    output_type,next_action,started_at,completed_at,metadata,created_by,updated_by
  )
  values (
    v_interview.organization_id,
    v_interview.diagnosis_id,
    v_interview.id,
    target_question_id,
    coalesce(v_question.display_order,0),
    target_status,
    nullif(trim(coalesce(target_observed_practice,'')),''),
    nullif(trim(coalesce(target_interview_notes,'')),''),
    nullif(trim(coalesce(target_evidence_cited,'')),''),
    nullif(trim(coalesce(target_evidence_requested,'')),''),
    nullif(trim(coalesce(target_gap_summary,'')),''),
    target_output_type,
    nullif(trim(coalesce(target_next_action,'')),''),
    case when target_status in ('in_progress','completed') then timezone('utc',now()) else null end,
    case when target_status in ('completed','skipped') then timezone('utc',now()) else null end,
    jsonb_build_object('change_reason',change_reason,'last_recorded_at',timezone('utc',now())),
    auth.uid(),
    auth.uid()
  )
  on conflict (interview_id,question_id) do update
  set
    status=excluded.status,
    observed_practice=excluded.observed_practice,
    interview_notes=excluded.interview_notes,
    evidence_cited=excluded.evidence_cited,
    evidence_requested=excluded.evidence_requested,
    gap_summary=excluded.gap_summary,
    output_type=excluded.output_type,
    next_action=excluded.next_action,
    started_at=coalesce(public.skda_interview_question_records.started_at,excluded.started_at),
    completed_at=case
      when excluded.status in ('completed','skipped') then coalesce(public.skda_interview_question_records.completed_at,excluded.completed_at)
      else null
    end,
    metadata=coalesce(public.skda_interview_question_records.metadata,'{}'::jsonb) || excluded.metadata,
    updated_by=auth.uid()
  returning * into v_record;

  return to_jsonb(v_record);
end;
$function$;

revoke all on function public.save_skda_interview_question_record(
  uuid,uuid,text,text,text,text,text,text,text,text,text
) from public,anon;
grant execute on function public.save_skda_interview_question_record(
  uuid,uuid,text,text,text,text,text,text,text,text,text
) to authenticated,service_role;

create or replace function public.finish_skda_interview_session(
  target_interview_id uuid,
  target_notes text default null,
  change_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_interview public.skda_interviews%rowtype;
  v_event public.sparks_events%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.' using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  select * into v_interview
  from public.skda_interviews
  where id=target_interview_id
  for update;

  if v_interview.id is null then
    raise exception 'Entrevista não encontrada.' using errcode='P0002';
  end if;

  if not public.has_module_permission(v_interview.organization_id,'SK-DA','interview.edit') then
    raise exception 'Acesso negado: sem permissão para concluir a entrevista.' using errcode='42501';
  end if;

  update public.skda_interviews
  set
    actual_start=coalesce(actual_start,timezone('utc',now())),
    actual_end=timezone('utc',now()),
    status='completed',
    notes=coalesce(nullif(trim(coalesce(target_notes,'')),''),notes),
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
        perform public.transition_sparks_event_lifecycle(v_event.id,'scheduled',change_reason);
        v_event.status := 'scheduled';
      end if;
      if v_event.status in ('scheduled','in_progress') then
        perform public.transition_sparks_event_lifecycle(v_event.id,'completed',change_reason);
      end if;
    end if;
  end if;

  return to_jsonb(v_interview);
end;
$function$;

revoke all on function public.finish_skda_interview_session(uuid,text,text) from public,anon;
grant execute on function public.finish_skda_interview_session(uuid,text,text) to authenticated,service_role;

comment on table public.skda_interview_question_records is
'Registro de campo por questão e por encontro do Diagnóstico Assistido, preservando fala, evidências, lacunas e saída da entrevista sem substituir a avaliação consolidada.';

comment on function public.start_skda_interview_session(uuid,text) is
'Inicia uma sessão de entrevista, materializa o roteiro oficial do catálogo e sincroniza o evento transversal.';

comment on function public.save_skda_interview_question_record(uuid,uuid,text,text,text,text,text,text,text,text,text) is
'Persiste o registro de campo de uma questão da entrevista e sua saída metodológica.';

comment on function public.finish_skda_interview_session(uuid,text,text) is
'Encerra uma sessão de entrevista e sincroniza a conclusão do evento transversal.';

notify pgrst, 'reload schema';

commit;
