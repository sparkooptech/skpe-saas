begin;

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

  -- A pauta do encontro é proposicional. Nenhuma questão é pré-alocada ao encontro.
  -- O vínculo entrevista x questão nasce somente quando a questão recebe um registro de campo.
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

comment on function public.start_skda_interview_session(uuid,text) is
'Inicia o encontro sem pré-alocar questões. A pauta é proposicional e os vínculos por questão nascem apenas na execução real.';

notify pgrst, 'reload schema';

commit;
