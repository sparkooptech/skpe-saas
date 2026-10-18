-- SPARKs CORE checklist read: restricted, tenant-scoped, no direct table grants.
begin;
create or replace function public.get_sparks_checklist_execution(
  target_execution_id uuid,
  target_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_execution public.sparks_checklist_executions%rowtype;
  v_items jsonb;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;
  if target_execution_id is null or target_organization_id is null then
    raise exception 'Identificadores de checklist obrigatorios.' using errcode = '22023';
  end if;
  -- Check tenant authorization BEFORE looking up a record to avoid an existence oracle.
  if not (public.is_platform_super_admin() or public.is_organization_admin(target_organization_id)) then
    raise exception 'Permissao de leitura insuficiente.' using errcode = '42501';
  end if;
  select * into v_execution
  from public.sparks_checklist_executions
  where id = target_execution_id and organization_id = target_organization_id;
  if not found then
    raise exception 'Checklist nao encontrado na organizacao.' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', item.id,
    'templateItemId', item.template_item_id,
    'code', template_item.code,
    'name', template_item.name,
    'description', template_item.description,
    'required', template_item.is_required,
    'displayOrder', template_item.display_order,
    'status', item.status,
    'assignedUserId', item.assigned_user_id,
    'dueDate', item.due_date,
    'justification', item.justification,
    'evidenceCount', (select count(*) from public.sparks_checklist_item_evidence evidence
       where evidence.execution_item_id = item.id)
  ) order by template_item.display_order, template_item.code), '[]'::jsonb)
  into v_items
  from public.sparks_checklist_execution_items item
  join public.sparks_checklist_template_items template_item on template_item.id = item.template_item_id
  where item.execution_id = target_execution_id;
  return jsonb_build_object(
    'execution', jsonb_build_object(
      'id', v_execution.id,
      'organizationId', v_execution.organization_id,
      'moduleCode', v_execution.module_code,
      'templateVersionId', v_execution.template_version_id,
      'targetType', v_execution.target_type,
      'targetId', v_execution.target_id,
      'status', v_execution.status,
      'createdAt', v_execution.created_at
    ),
    'items', v_items
  );
end;
$function$;
revoke all on function public.get_sparks_checklist_execution(uuid,uuid) from public,anon;
grant execute on function public.get_sparks_checklist_execution(uuid,uuid) to authenticated;
commit;
