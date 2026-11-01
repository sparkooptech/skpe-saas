begin;

alter table public.skda_interview_question_records
  add column if not exists execution_date date;

update public.skda_interview_question_records
set execution_date = coalesce(
  completed_at::date,
  started_at::date,
  created_at::date
)
where execution_date is null
  and (
    status <> 'pending'
    or observed_practice is not null
    or interview_notes is not null
    or evidence_cited is not null
    or evidence_requested is not null
    or gap_summary is not null
    or output_type is not null
    or next_action is not null
  );

create index if not exists idx_skda_interview_question_records_execution_date
  on public.skda_interview_question_records(diagnosis_id,execution_date,question_id);

drop function if exists public.save_skda_interview_question_record(
  uuid,uuid,text,text,text,text,text,text,text,text,text
);

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
  target_execution_date date default null,
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
    output_type,next_action,execution_date,started_at,completed_at,metadata,created_by,updated_by
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
    coalesce(target_execution_date,current_date),
    case when target_status in ('in_progress','completed') then timezone('utc',now()) else null end,
    case when target_status in ('completed','skipped') then timezone('utc',now()) else null end,
    jsonb_build_object(
      'change_reason',change_reason,
      'last_recorded_at',timezone('utc',now()),
      'execution_date_editable',true
    ),
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
    execution_date=coalesce(excluded.execution_date,public.skda_interview_question_records.execution_date,current_date),
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
  uuid,uuid,text,text,text,text,text,text,text,text,date,text
) from public,anon;

grant execute on function public.save_skda_interview_question_record(
  uuid,uuid,text,text,text,text,text,text,text,text,date,text
) to authenticated,service_role;

comment on column public.skda_interview_question_records.execution_date is
'Data efetiva em que a questão foi trabalhada. Independente da pauta/data planejada do encontro e editável com rastreabilidade.';

comment on function public.save_skda_interview_question_record(
  uuid,uuid,text,text,text,text,text,text,text,text,date,text
) is
'Persiste o registro de campo e a data efetiva editável da questão sem amarrar a execução à pauta planejada do encontro.';

notify pgrst, 'reload schema';

commit;
