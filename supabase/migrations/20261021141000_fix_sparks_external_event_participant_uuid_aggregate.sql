begin;

-- Corrige agregação UUID na resolução de participante externo sem alterar a API canônica.
create or replace function public.set_sparks_external_event_participant(
  target_event_id uuid,
  target_person_id uuid,
  target_full_name text,
  target_preferred_name text default null,
  target_primary_email text default null,
  target_external_organization text default null,
  target_relationship_type text default 'other',
  target_job_title text default null,
  target_participant_role text default 'participant',
  target_participant_function text default null,
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
  v_person public.sparks_people%rowtype;
  v_person_id uuid := target_person_id;
  v_participant_id uuid;
  v_before jsonb;
  v_after jsonb;
  v_relationship_type text := lower(trim(coalesce(target_relationship_type, 'other')));
  v_participant_role text := lower(trim(coalesce(target_participant_role, 'participant')));
  v_email text := nullif(lower(trim(coalesce(target_primary_email, ''))), '');
  v_existing_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Operacao exige usuario autenticado.' using errcode='42501';
  end if;
  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  select * into v_event
  from public.sparks_events
  where id = target_event_id and archived_at is null
  for update;

  if v_event.id is null then
    raise exception 'Evento nao encontrado ou arquivado.' using errcode='22023';
  end if;
  if not public.can_manage_sparks_event_source(v_event.organization_id, v_event.source_module_code, v_event.source_entity_type, v_event.source_entity_id) then
    raise exception 'Acesso negado: o usuario nao pode gerir participantes deste evento.' using errcode='42501';
  end if;
  if v_event.source_module_code is not null and not public.has_module_access(v_event.organization_id, v_event.source_module_code) then
    raise exception 'Acesso negado ao modulo de origem do evento.' using errcode='42501';
  end if;
  if v_participant_role not in ('owner','chair','secretary','responsible','participant','observer') then
    raise exception 'Papel de participante invalido.' using errcode='22023';
  end if;
  if v_relationship_type not in ('service_provider','representative','partner','other') then
    raise exception 'Natureza da relacao externa invalida.' using errcode='22023';
  end if;

  if v_person_id is not null then
    if not exists (
      select 1 from public.sparks_organization_people relationship
      where relationship.organization_id = v_event.organization_id
        and relationship.person_id = v_person_id
        and relationship.status = 'active'
        and (relationship.start_date is null or relationship.start_date <= current_date)
        and (relationship.end_date is null or relationship.end_date >= current_date)
    ) then
      raise exception 'A pessoa selecionada nao possui vinculo ativo com esta organizacao.' using errcode='42501';
    end if;
  else
    if length(trim(coalesce(target_full_name,''))) = 0 then
      raise exception 'Informe o nome da pessoa externa.' using errcode='22023';
    end if;

    if v_email is not null then
      select count(*)::integer, min(person.id::text)::uuid
        into v_existing_count, v_person_id
      from public.sparks_people person
      join public.sparks_organization_people relationship
        on relationship.person_id = person.id
       and relationship.organization_id = v_event.organization_id
       and relationship.status = 'active'
       and (relationship.start_date is null or relationship.start_date <= current_date)
       and (relationship.end_date is null or relationship.end_date >= current_date)
      where person.archived_at is null
        and person.person_status = 'active'
        and lower(coalesce(person.primary_email,'')) = v_email;

      if v_existing_count > 1 then
        raise exception 'Mais de uma pessoa ativa possui este e-mail na organizacao. Selecione a pessoa existente.' using errcode='22023';
      end if;
    end if;

    if v_person_id is null then
      insert into public.sparks_people(
        full_name, preferred_name, primary_email, person_status, data_source,
        metadata, created_by, updated_by
      ) values (
        trim(target_full_name),
        nullif(trim(coalesce(target_preferred_name,'')),''),
        v_email,
        'active',
        'manual',
        '{}'::jsonb,
        auth.uid(),
        auth.uid()
      ) returning id into v_person_id;
    end if;
  end if;

  select * into v_person
  from public.sparks_people
  where id = v_person_id and archived_at is null;

  if v_person.id is null then
    raise exception 'Pessoa externa nao encontrada ou arquivada.' using errcode='22023';
  end if;
  if v_person.profile_user_id is not null then
    raise exception 'A pessoa selecionada possui usuario de plataforma. Use o fluxo de participante interno.' using errcode='22023';
  end if;

  if not exists (
    select 1 from public.sparks_organization_people relationship
    where relationship.organization_id = v_event.organization_id
      and relationship.person_id = v_person_id
      and relationship.status = 'active'
      and (relationship.start_date is null or relationship.start_date <= current_date)
      and (relationship.end_date is null or relationship.end_date >= current_date)
  ) then
    insert into public.sparks_organization_people(
      organization_id, person_id, relationship_type, job_title, start_date,
      status, metadata, created_by, updated_by
    ) values (
      v_event.organization_id,
      v_person_id,
      v_relationship_type,
      nullif(trim(coalesce(target_job_title,'')),''),
      current_date,
      'active',
      jsonb_strip_nulls(jsonb_build_object(
        'external_organization', nullif(trim(coalesce(target_external_organization,'')), ''),
        'source', 'sparks_event_participant'
      )),
      auth.uid(),
      auth.uid()
    );
  end if;

  select to_jsonb(p) into v_before
  from public.sparks_event_participants p
  where p.event_id = target_event_id and p.person_id = v_person_id;

  insert into public.sparks_event_participants(
    event_id, person_id, user_id, participant_role, participant_function,
    response_status, attendance_status, required, created_by, updated_by
  ) values (
    target_event_id,
    v_person_id,
    null,
    v_participant_role,
    nullif(trim(coalesce(target_participant_function,'')),''),
    'pending',
    'not_recorded',
    coalesce(target_required,true),
    auth.uid(),
    auth.uid()
  )
  on conflict (event_id, person_id) where person_id is not null
  do update set
    participant_role = excluded.participant_role,
    participant_function = excluded.participant_function,
    required = excluded.required,
    updated_by = auth.uid(),
    updated_at = timezone('utc', now())
  returning id into v_participant_id;

  select to_jsonb(p) into v_after
  from public.sparks_event_participants p
  where p.id = v_participant_id;

  insert into public.sparks_agenda_audit(
    organization_id,event_id,actor_user_id,action_code,change_reason,previous_data,new_data
  ) values (
    v_event.organization_id,v_event.id,auth.uid(),'event.participant.external.set',
    trim(change_reason),v_before,v_after
  );

  return v_participant_id;
end;
$function$;

revoke all on function public.set_sparks_external_event_participant(uuid,uuid,text,text,text,text,text,text,text,text,boolean,text) from public, anon;
grant execute on function public.set_sparks_external_event_participant(uuid,uuid,text,text,text,text,text,text,text,text,boolean,text) to authenticated, service_role;

comment on function public.set_sparks_external_event_participant(uuid,uuid,text,text,text,text,text,text,text,text,boolean,text) is
  'Gerencia participante externo de evento SPARKs com identidade canônica de pessoa e resolução segura de UUID por e-mail.';

commit;
