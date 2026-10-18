-- Tenant-scoped candidate picker; never exposes directory outside the requested organization.
create or replace function public.list_skda_organization_lead_candidates(target_organization_id uuid)
returns table(user_id uuid, display_name text, email text)
language plpgsql stable security definer set search_path = ''
as $function$
begin
  if auth.uid() is null or target_organization_id is null then
    raise exception 'Consulta DA nao autorizada.' using errcode = '42501';
  end if;
  if not (public.is_platform_super_admin() or public.is_organization_admin(target_organization_id)) then
    raise exception 'Consulta DA nao autorizada.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.organization_modules om
    join public.modules m on m.id = om.module_id
    where om.organization_id = target_organization_id and m.code = 'SK-DA'
      and m.status = 'active' and om.enabled = true and om.status in ('trial','active')
      and om.valid_from <= timezone('utc',now())
      and (om.valid_until is null or om.valid_until >= timezone('utc',now()))
  ) then
    raise exception 'Consulta DA nao autorizada.' using errcode = '42501';
  end if;
  return query
  select distinct p.id, coalesce(nullif(trim(p.display_name),''),nullif(trim(p.full_name),''),p.email),p.email
  from public.organization_memberships membership
  join public.profiles p on p.id = membership.user_id
  where membership.organization_id = target_organization_id
    and membership.status = 'active' and p.active = true
    and membership.valid_from <= timezone('utc',now())
    and (membership.valid_until is null or membership.valid_until >= timezone('utc',now()))
  order by 2,3;
end;
$function$;
revoke all on function public.list_skda_organization_lead_candidates(uuid) from public,anon;
grant execute on function public.list_skda_organization_lead_candidates(uuid) to authenticated;
