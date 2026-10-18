-- SK-DA: audited transfer of provisional organizational leadership.
-- Requires journey foundation and leadership roles. Does not grant platform privileges.
create or replace function public.assign_skda_organization_lead(
  target_organization_id uuid,
  target_journey_id uuid,
  target_representative_user_id uuid,
  change_reason text
) returns uuid
language plpgsql security definer set search_path = ''
as $function$
declare
  v_journey public.skda_journeys%rowtype;
  v_reason text := trim(coalesce(change_reason,''));
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;
  if target_organization_id is null or target_journey_id is null or target_representative_user_id is null then
    raise exception 'Identificadores obrigatorios.' using errcode = '22023';
  end if;
  if not (public.is_platform_super_admin() or public.is_organization_admin(target_organization_id)) then
    raise exception 'Operacao DA nao autorizada.' using errcode = '42501';
  end if;
  if length(v_reason) < 10 then
    raise exception 'Justificativa obrigatoria.' using errcode = '22023';
  end if;
  select * into v_journey from public.skda_journeys
  where id = target_journey_id and organization_id = target_organization_id for update;
  if not found then
    raise exception 'Jornada indisponivel ou acesso nao autorizado.' using errcode = '42501';
  end if;
  if v_journey.status in ('completed','cancelled') then
    raise exception 'Jornada encerrada nao permite troca de lideranca.' using errcode = '22023';
  end if;
  if target_representative_user_id = v_journey.consultant_user_id then
    raise exception 'Lider organizacional definitivo deve ser distinto do consultor.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.profiles p
    join public.organization_memberships membership on membership.user_id = p.id
    where p.id = target_representative_user_id and p.active = true
      and membership.organization_id = target_organization_id
      and membership.status = 'active'
      and membership.valid_from <= timezone('utc',now())
      and (membership.valid_until is null or membership.valid_until >= timezone('utc',now()))
  ) then
    raise exception 'Lider organizacional deve possuir vinculo ativo.' using errcode = '42501';
  end if;
  if v_journey.organization_representative_user_id = target_representative_user_id
     and v_journey.representative_is_provisional = false then
    return v_journey.id;
  end if;
  update public.skda_journeys
  set organization_representative_user_id = target_representative_user_id,
      representative_is_provisional = false,
      updated_at = timezone('utc',now()),updated_by = auth.uid()
  where id = v_journey.id;
  insert into public.skda_journey_audit (
    journey_id,action,actor_user_id,before_state,after_state,change_reason
  ) values (
    v_journey.id,'organization_lead.assigned',auth.uid(),
    jsonb_build_object('representative_user_id',v_journey.organization_representative_user_id,
      'provisional',v_journey.representative_is_provisional),
    jsonb_build_object('representative_user_id',target_representative_user_id,
      'provisional',false),v_reason
  );
  return v_journey.id;
end;
$function$;
revoke all on function public.assign_skda_organization_lead(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.assign_skda_organization_lead(uuid,uuid,uuid,text) to authenticated;
