-- CORE-CHK-001: governed execution creation; draft only, never applied automatically.
begin;

create or replace function public.create_sparks_checklist_execution(
  target_organization_id uuid,
  target_module_code text,
  target_template_version_id uuid,
  target_type text,
  target_id uuid,
  target_idempotency_key text,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_module text := upper(trim(coalesce(target_module_code, '')));
  v_key text := trim(coalesce(target_idempotency_key, ''));
  v_fingerprint text;
  v_execution_id uuid;
  v_previous_fingerprint text;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;
  if target_organization_id is null or target_template_version_id is null or target_id is null
     or target_type is null then
    raise exception 'Organizacao, modelo e destino sao obrigatorios.' using errcode = '22023';
  end if;
  -- Conservative first release: administrator-only until dedicated checklist permissions exist.
  if not (public.is_platform_super_admin() or public.is_organization_admin(target_organization_id)) then
    raise exception 'Permissao administrativa necessaria para gerar checklists.' using errcode = '42501';
  end if;
  if length(trim(coalesce(change_reason, ''))) < 10 then
    raise exception 'Justificativa obrigatoria (minimo de 10 caracteres).' using errcode = '22023';
  end if;
  if v_module !~ '^[A-Z][A-Z0-9-]{1,31}$' or length(v_key) not between 1 and 160 then
    raise exception 'Modulo ou chave idempotente invalidos.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.organization_modules om
    join public.modules m on m.id = om.module_id
    where om.organization_id = target_organization_id
      and m.code = v_module and m.status = 'active'
      and om.enabled = true and om.status in ('trial', 'active')
      and om.valid_from <= timezone('utc', now())
      and (om.valid_until is null or om.valid_until >= timezone('utc', now()))
  ) then
    raise exception 'Modulo nao habilitado para a organizacao.' using errcode = '42501';
  end if;
  if target_type is null or target_type not in ('organization', 'sparks_initiative') then
    -- skda_journey and skpe_project require dedicated scoped validators before activation.
    raise exception 'Tipo de destino ainda nao habilitado para geracao governada.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.sparks_checklist_template_versions v
    join public.sparks_checklist_templates t on t.id = v.template_id
    where v.id = target_template_version_id
      and v.status = 'published' and t.active = true and t.module_code = v_module
  ) then
    raise exception 'Versao publicada do modulo nao encontrada.' using errcode = '22023';
  end if;
  if target_type = 'organization' then
    if target_id is distinct from target_organization_id
       or not exists (select 1 from public.organizations o where o.id = target_organization_id) then
      raise exception 'Destino organizacional invalido.' using errcode = '22023';
    end if;
  elsif target_type = 'sparks_initiative' then
    if not exists (
      select 1 from public.sparks_initiatives i
      where i.id = target_id and i.organization_id = target_organization_id
        and i.archived_at is null and i.source_module_code = v_module
    ) then
      raise exception 'Iniciativa nao encontrada no escopo do modulo e organizacao.' using errcode = '22023';
    end if;
  end if;
  v_fingerprint := md5(concat_ws('|', target_organization_id::text, v_module,
    target_template_version_id::text, target_type, target_id::text));

  insert into public.sparks_checklist_executions (
    organization_id, module_code, template_version_id, target_type, target_id,
    idempotency_key, command_fingerprint, created_by, updated_by
  ) values (
    target_organization_id, v_module, target_template_version_id, target_type, target_id,
    v_key, v_fingerprint, auth.uid(), auth.uid()
  ) on conflict (organization_id, module_code, idempotency_key) do nothing
  returning id into v_execution_id;

  if v_execution_id is null then
    select id, command_fingerprint into v_execution_id, v_previous_fingerprint
    from public.sparks_checklist_executions
    where organization_id = target_organization_id and module_code = v_module
      and idempotency_key = v_key;
    if v_execution_id is null or v_previous_fingerprint is distinct from v_fingerprint then
      raise exception 'Chave idempotente ja utilizada com dados diferentes.' using errcode = '23505';
    end if;
    return v_execution_id;
  end if;

  insert into public.sparks_checklist_execution_items (execution_id, template_item_id)
  select v_execution_id, item.id
  from public.sparks_checklist_template_items item
  where item.template_version_id = target_template_version_id;

  insert into public.sparks_checklist_audit (
    execution_id, action, actor_id, after_state, change_reason
  ) values (
    v_execution_id, 'created', auth.uid(),
    jsonb_build_object('template_version_id', target_template_version_id,
      'target_type', target_type, 'target_id', target_id), trim(change_reason)
  );
  return v_execution_id;
end;
$function$;

revoke all on function public.create_sparks_checklist_execution(uuid,text,uuid,text,uuid,text,text) from public,anon;
grant execute on function public.create_sparks_checklist_execution(uuid,text,uuid,text,uuid,text,text) to authenticated;
commit;
