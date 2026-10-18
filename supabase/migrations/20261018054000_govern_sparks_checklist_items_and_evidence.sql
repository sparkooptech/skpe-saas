-- CORE-CHK-001: governed item assessment and evidence binding. Not deployed.
begin;

create or replace function public.assess_sparks_checklist_item(
  target_execution_id uuid,
  target_template_item_id uuid,
  target_status text,
  target_assigned_user_id uuid,
  target_due_date date,
  target_justification text,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_execution public.sparks_checklist_executions%rowtype;
  v_item public.sparks_checklist_execution_items%rowtype;
  v_item_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;
  select * into v_execution from public.sparks_checklist_executions
  where id = target_execution_id for update;
  if not found then
    raise exception 'Execucao inexistente.' using errcode = '22023';
  end if;
  if not (public.is_platform_super_admin() or public.is_organization_admin(v_execution.organization_id)) then
    raise exception 'Permissao administrativa necessaria.' using errcode = '42501';
  end if;
  if v_execution.status in ('completed','cancelled') then
    raise exception 'Execucao encerrada nao pode ser alterada.' using errcode = '22023';
  end if;
  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Justificativa obrigatoria.' using errcode = '22023';
  end if;
  if target_status is null or target_status not in (
    'not_started','in_progress','fulfilled','partially_fulfilled','not_fulfilled','not_applicable','blocked'
  ) then
    raise exception 'Situacao invalida.' using errcode = '22023';
  end if;
  if target_assigned_user_id is not null and not exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = v_execution.organization_id
      and membership.user_id = target_assigned_user_id
      and membership.status = 'active'
      and membership.valid_from <= timezone('utc',now())
      and (membership.valid_until is null or membership.valid_until >= timezone('utc',now()))
  ) then
    raise exception 'Responsavel nao possui vinculo ativo com a organizacao.' using errcode = '42501';
  end if;
  select * into v_item from public.sparks_checklist_execution_items
  where execution_id = target_execution_id and template_item_id = target_template_item_id for update;
  if not found then
    raise exception 'Item nao pertence a execucao.' using errcode = '22023';
  end if;
  update public.sparks_checklist_execution_items
  set status = target_status,
      assigned_user_id = target_assigned_user_id,
      due_date = target_due_date,
      justification = nullif(trim(coalesce(target_justification,'')),''),
      updated_at = timezone('utc',now())
  where id = v_item.id returning id into v_item_id;

  update public.sparks_checklist_executions
  set status = case when status = 'draft' then 'in_progress' else status end,
      updated_at = timezone('utc',now()), updated_by = auth.uid()
  where id = target_execution_id;

  insert into public.sparks_checklist_audit (
    execution_id, action, actor_id, before_state, after_state, change_reason
  ) values (
    target_execution_id, 'item_assessed', auth.uid(),
    jsonb_build_object('item_id',v_item.id,'status',v_item.status,'assignee',v_item.assigned_user_id),
    jsonb_build_object('item_id',v_item.id,'status',target_status,'assignee',target_assigned_user_id),
    trim(change_reason)
  );
  return v_item_id;
end;
$function$;

create or replace function public.attach_sparks_checklist_evidence(
  target_execution_item_id uuid,
  target_evidence_asset_id uuid,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_execution public.sparks_checklist_executions%rowtype;
  v_evidence_link_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao obrigatoria.' using errcode = '42501';
  end if;
  select execution.* into v_execution
  from public.sparks_checklist_execution_items item
  join public.sparks_checklist_executions execution on execution.id = item.execution_id
  where item.id = target_execution_item_id for update of execution;
  if not found then
    raise exception 'Item de execucao inexistente.' using errcode = '22023';
  end if;
  if not (public.is_platform_super_admin() or public.is_organization_admin(v_execution.organization_id))
    or not public.can_manage_sparks_evidence(v_execution.organization_id) then
    raise exception 'Permissao de evidencia e checklist necessaria.' using errcode = '42501';
  end if;
  if v_execution.status in ('completed','cancelled') then
    raise exception 'Execucao encerrada nao pode receber evidencia.' using errcode = '22023';
  end if;
  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Justificativa obrigatoria.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.sparks_evidence_assets evidence
    where evidence.id = target_evidence_asset_id
      and evidence.organization_id = v_execution.organization_id
      and evidence.archived_at is null
  ) then
    raise exception 'Evidencia nao pertence a organizacao.' using errcode = '22023';
  end if;
  insert into public.sparks_checklist_item_evidence (
    execution_item_id,evidence_asset_id,created_by
  ) values (target_execution_item_id,target_evidence_asset_id,auth.uid())
  on conflict (execution_item_id,evidence_asset_id) do update
    set purpose = excluded.purpose
  returning id into v_evidence_link_id;

  insert into public.sparks_checklist_audit (
    execution_id,action,actor_id,after_state,change_reason
  ) values (
    v_execution.id,'evidence_attached',auth.uid(),
    jsonb_build_object('execution_item_id',target_execution_item_id,
      'evidence_asset_id',target_evidence_asset_id),trim(change_reason)
  );
  return v_evidence_link_id;
end;
$function$;

revoke all on function public.assess_sparks_checklist_item(uuid,uuid,text,uuid,date,text,text) from public,anon;
revoke all on function public.attach_sparks_checklist_evidence(uuid,uuid,text) from public,anon;
grant execute on function public.assess_sparks_checklist_item(uuid,uuid,text,uuid,date,text,text) to authenticated;
grant execute on function public.attach_sparks_checklist_evidence(uuid,uuid,text) to authenticated;
commit;
