-- Atomic, idempotent SK-DA opening. Must run after 20261018133000.
create or replace function public.create_skda_journey(
  target_organization_id uuid,
  target_instrument_id uuid,
  target_assessment_cycle_id uuid,
  target_journey_kind text,
  target_consultant_user_id uuid,
  target_provisional_representative_user_id uuid,
  target_idempotency_key text,
  change_reason text
) returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare
  v_key text := trim(coalesce(target_idempotency_key,''));
  v_reason text := trim(coalesce(change_reason,''));
  v_fingerprint text;
  v_existing public.skda_journeys%rowtype;
  v_initiative_id uuid;
  v_journey_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;
  if not (public.is_platform_super_admin() or public.is_organization_admin(target_organization_id)) then
    raise exception 'Abertura DA exige administrador autorizado.' using errcode = '42501';
  end if;
  if length(v_reason) < 10 or length(v_key) not between 1 and 160 then
    raise exception 'Justificativa ou chave idempotente invalida.' using errcode = '22023';
  end if;
  if target_instrument_id is null or target_assessment_cycle_id is null
     or target_consultant_user_id is null or target_provisional_representative_user_id is null
     or target_journey_kind not in ('assisted_diagnosis','self_assessment','improvement_plan','monitoring') then
    raise exception 'Dados obrigatorios da jornada invalidos.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.organization_modules om
    join public.modules m on m.id = om.module_id
    where om.organization_id = target_organization_id
      and m.code = 'SK-DA' and m.status = 'active'
      and om.enabled and om.status in ('trial','active')
      and om.valid_from <= timezone('utc',now())
      and (om.valid_until is null or om.valid_until >= timezone('utc',now()))
  ) then
    raise exception 'SK-DA nao habilitado nesta organizacao.' using errcode = '42501';
  end if;
  -- Provisional roles are explicit identities; final organizational sign-off is separately governed.
  if not exists (select 1 from public.profiles p where p.id = target_consultant_user_id)
     or not exists (select 1 from public.profiles p where p.id = target_provisional_representative_user_id) then
    raise exception 'Responsaveis nao encontrados no diretorio.' using errcode = '22023';
  end if;
  v_fingerprint := md5(concat_ws('|',target_organization_id::text,target_instrument_id::text,
    target_assessment_cycle_id::text,target_journey_kind,target_consultant_user_id::text,
    target_provisional_representative_user_id::text));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(target_organization_id::text || ':' || v_key,0));
  select * into v_existing from public.skda_journeys
  where organization_id = target_organization_id and idempotency_key = v_key;
  if found then
    if v_existing.command_fingerprint <> v_fingerprint then
      raise exception 'Chave idempotente reutilizada com parametros diferentes.' using errcode = '23505';
    end if;
    return v_existing.id;
  end if;
  -- Canonical initiative and DA journey share this database transaction.
  v_initiative_id := public.create_sparks_initiative(
    target_organization_id => target_organization_id,
    target_initiative_class => 'project',
    target_category_code => 'operational',
    target_code => 'SKDA-' || substr(md5(target_organization_id::text || ':' || v_key),1,24),
    target_name => 'Jornada DA - ' || target_journey_kind,
    target_proposal_origin => 'module',
    target_source_module_code => 'SK-DA',
    target_proposal_source_reference => v_key,
    change_reason => v_reason
  );
  insert into public.skda_journeys (
    organization_id,initiative_id,instrument_id,assessment_cycle_id,journey_kind,
    consultant_user_id,organization_representative_user_id,representative_is_provisional,
    idempotency_key,command_fingerprint,created_by,updated_by
  ) values (
    target_organization_id,v_initiative_id,target_instrument_id,target_assessment_cycle_id,
    target_journey_kind,target_consultant_user_id,target_provisional_representative_user_id,
    true,v_key,v_fingerprint,auth.uid(),auth.uid()
  ) returning id into v_journey_id;
  insert into public.skda_journey_audit(journey_id,action,actor_user_id,after_state,change_reason)
  values (v_journey_id,'journey.opened',auth.uid(),jsonb_build_object(
    'initiative_id',v_initiative_id,'provisional_representative',true),v_reason);
  return v_journey_id;
end;
$function$;
revoke all on function public.create_skda_journey(uuid,uuid,uuid,text,uuid,uuid,text,text) from public,anon;
grant execute on function public.create_skda_journey(uuid,uuid,uuid,text,uuid,uuid,text,text) to authenticated;
