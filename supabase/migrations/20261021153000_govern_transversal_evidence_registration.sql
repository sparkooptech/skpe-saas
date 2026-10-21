begin;

-- ============================================================
-- Core transversal de Evidências | capacidade restrita de
-- registro sem ampliar a gestão administrativa dos ativos.
-- ============================================================

insert into public.module_permissions (
  module_id,
  code,
  name,
  description,
  permission_group,
  active
)
select
  module.id,
  'evidence.register',
  'Registrar evidências',
  'Permite registrar novos ativos no Core transversal de Evidências sem conceder administração plena do acervo.',
  'evidence',
  true
from public.modules module
where module.code = 'SK-DA'
on conflict (module_id,code) do update set
  name = excluded.name,
  description = excluded.description,
  permission_group = excluded.permission_group,
  active = true,
  updated_at = timezone('utc',now());

with grants(role_code) as (
  values
    ('administrator'),
    ('coordinator'),
    ('diagnostician'),
    ('interviewer')
)
insert into public.role_permissions (
  module_role_id,
  module_permission_id
)
select
  role.id,
  permission.id
from grants
join public.modules module
  on module.code = 'SK-DA'
join public.module_roles role
  on role.module_id = module.id
 and role.code = grants.role_code
 and role.active = true
join public.module_permissions permission
  on permission.module_id = module.id
 and permission.code = 'evidence.register'
 and permission.active = true
on conflict do nothing;

create or replace function public.can_register_sparks_evidence(
  target_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    auth.uid() is not null
    and (
      public.is_platform_super_admin()
      or public.is_organization_admin(target_organization_id)
      or exists (
        select 1
        from public.organization_modules om
        join public.modules module
          on module.id = om.module_id
        join public.user_module_roles umr
          on umr.organization_module_id = om.id
        join public.module_roles role
          on role.id = umr.module_role_id
        join public.role_permissions rp
          on rp.module_role_id = role.id
        join public.module_permissions permission
          on permission.id = rp.module_permission_id
        where om.organization_id = target_organization_id
          and permission.code in ('evidence.register','evidence.manage')
          and module.status = 'active'
          and permission.active = true
          and role.active = true
          and om.enabled = true
          and om.status in ('trial','active')
          and om.valid_from <= timezone('utc',now())
          and (
            om.valid_until is null
            or om.valid_until >= timezone('utc',now())
          )
          and umr.user_id = auth.uid()
          and umr.status = 'active'
          and umr.valid_from <= timezone('utc',now())
          and (
            umr.valid_until is null
            or umr.valid_until >= timezone('utc',now())
          )
          and public.is_active_member(om.organization_id)
      )
    );
$function$;

comment on function public.can_register_sparks_evidence(uuid) is
  'Autoriza o registro de novos ativos no Core de Evidências sem conceder gestão plena do acervo. evidence.manage continua sendo a autoridade administrativa superior.';

revoke all on function public.can_register_sparks_evidence(uuid)
from public,anon;

grant execute on function public.can_register_sparks_evidence(uuid)
to authenticated,service_role;

create or replace function public.register_sparks_evidence_asset(
  target_organization_id uuid,
  evidence_title text,
  evidence_description text,
  target_evidence_type text,
  target_source_type text,
  target_origin_module_code text,
  target_reference_date date,
  target_validity_date date,
  target_confidentiality_level text,
  target_content_hash text,
  target_file_name text,
  target_mime_type text,
  target_file_size_bytes bigint,
  target_storage_bucket text,
  target_storage_path text,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  asset_id uuid;
  version_id uuid;
begin
  if not public.can_register_sparks_evidence(target_organization_id) then
    raise exception
      'Acesso negado: sem permissão para registrar evidências nesta organização.'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(evidence_title,''))) = 0 then
    raise exception 'Informe o título da evidência.'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.'
      using errcode = '22023';
  end if;

  if target_content_hash is not null then
    select evidence.id
      into asset_id
    from public.sparks_evidence_assets evidence
    where evidence.organization_id = target_organization_id
      and evidence.content_hash = target_content_hash
      and evidence.archived_at is null
    limit 1;
  end if;

  if asset_id is not null then
    return asset_id;
  end if;

  insert into public.sparks_evidence_assets (
    organization_id,
    title,
    description,
    evidence_type,
    source_type,
    origin_module_code,
    reference_date,
    validity_date,
    confidentiality_level,
    content_hash,
    created_by,
    updated_by,
    metadata
  ) values (
    target_organization_id,
    trim(evidence_title),
    nullif(trim(coalesce(evidence_description,'')),''),
    target_evidence_type,
    coalesce(target_source_type,'internal'),
    target_origin_module_code,
    target_reference_date,
    target_validity_date,
    coalesce(target_confidentiality_level,'internal'),
    target_content_hash,
    auth.uid(),
    auth.uid(),
    jsonb_build_object(
      'creation_reason',trim(change_reason),
      'registered_via','register_sparks_evidence_asset'
    )
  )
  returning id into asset_id;

  if target_file_name is not null then
    insert into public.sparks_evidence_versions (
      evidence_asset_id,
      version_number,
      version_label,
      storage_bucket,
      storage_path,
      file_name,
      mime_type,
      file_size_bytes,
      content_hash,
      change_summary,
      created_by
    ) values (
      asset_id,
      1,
      '1.0',
      target_storage_bucket,
      target_storage_path,
      target_file_name,
      target_mime_type,
      target_file_size_bytes,
      target_content_hash,
      trim(change_reason),
      auth.uid()
    )
    returning id into version_id;

    update public.sparks_evidence_assets
       set current_version_id = version_id
     where id = asset_id;
  end if;

  return asset_id;
end;
$function$;

revoke all on function public.register_sparks_evidence_asset(
  uuid,text,text,text,text,text,date,date,text,text,text,text,bigint,text,text,text
) from public,anon;

grant execute on function public.register_sparks_evidence_asset(
  uuid,text,text,text,text,text,date,date,text,text,text,text,bigint,text,text,text
) to authenticated,service_role;

commit;
