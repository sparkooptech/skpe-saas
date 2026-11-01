begin;

create or replace function public.get_organization_module_users(
  target_organization_id uuid,
  target_module_code text
)
returns table (
  user_id uuid,
  user_email text,
  user_display_name text,
  user_active boolean,
  membership_status text,
  job_title text,
  module_code text,
  module_name text,
  role_code text,
  role_name text,
  module_role_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
begin
  if not (
    public.is_platform_super_admin()
    or public.is_organization_admin(target_organization_id)
    or public.can_manage_module_users(target_organization_id, target_module_code)
    or public.has_module_permission(target_organization_id, target_module_code, 'users.manage')
    or public.has_module_permission(target_organization_id, target_module_code, 'journey.manage')
  ) then
    raise exception 'Acesso negado para consultar usuários do módulo % nesta organização.', target_module_code
      using errcode='42501';
  end if;

  return query
  select
    profile.id,
    profile.email,
    coalesce(nullif(trim(profile.display_name),''), nullif(trim(profile.full_name),''), profile.email),
    profile.active,
    membership.status::text,
    membership.job_title,
    module.code,
    module.name,
    role.code,
    role.name,
    user_role.status::text
  from public.organization_memberships membership
  join public.profiles profile
    on profile.id = membership.user_id
  join public.organization_modules organization_module
    on organization_module.organization_id = membership.organization_id
   and organization_module.enabled = true
   and organization_module.status = 'active'
  join public.modules module
    on module.id = organization_module.module_id
   and module.code = target_module_code
  join public.user_module_roles user_role
    on user_role.organization_module_id = organization_module.id
   and user_role.user_id = membership.user_id
   and user_role.status = 'active'
   and (user_role.valid_from is null or user_role.valid_from <= timezone('utc', now()))
   and (user_role.valid_until is null or user_role.valid_until >= timezone('utc', now()))
  join public.module_roles role
    on role.id = user_role.module_role_id
   and role.module_id = module.id
  where membership.organization_id = target_organization_id
    and profile.active = true
    and membership.status = 'active'
    and (membership.valid_from is null or membership.valid_from <= timezone('utc', now()))
    and (membership.valid_until is null or membership.valid_until >= timezone('utc', now()))
  order by
    coalesce(nullif(trim(profile.display_name),''), nullif(trim(profile.full_name),''), profile.email),
    role.name;
end;
$function$;

revoke all on function public.get_organization_module_users(uuid,text) from public,anon;
grant execute on function public.get_organization_module_users(uuid,text) to authenticated,service_role;

comment on function public.get_organization_module_users(uuid,text) is
'Retorna somente usuários ativos da organização com papel ativo no módulo informado. Identidade do usuário é separada de cargo organizacional e papel modular.';

commit;
