-- CORE-CHK-001: governed lifecycle; draft migration, NOT APPLIED.
begin;
create or replace function public.transition_sparks_checklist_execution(
  target_execution_id uuid,
  target_status text,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_execution public.sparks_checklist_executions%rowtype;
  v_unresolved integer;
  v_required_unresolved integer;
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
  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Justificativa obrigatoria (minimo de 10 caracteres).' using errcode = '22023';
  end if;
  if target_status is null or not (
    (v_execution.status = 'draft' and target_status in ('in_progress','cancelled')) or
    (v_execution.status = 'in_progress' and target_status in ('under_review','cancelled')) or
    (v_execution.status = 'under_review' and target_status in ('in_progress','completed','cancelled')) or
    (v_execution.status = 'completed' and target_status = 'in_progress') or
    (v_execution.status = 'cancelled' and target_status = 'in_progress')
  ) then
    raise exception 'Transicao de situacao nao permitida.' using errcode = '22023';
  end if;
  if target_status = 'under_review' then
    select count(*) into v_unresolved
    from public.sparks_checklist_execution_items item
    where item.execution_id = target_execution_id and item.status in ('not_started','in_progress','blocked');
    if v_unresolved > 0 then
      raise exception 'Existem itens pendentes; revisao nao pode ser iniciada.' using errcode = '22023';
    end if;
  end if;
  if target_status = 'completed' then
    select count(*) into v_required_unresolved
    from public.sparks_checklist_execution_items item
    join public.sparks_checklist_template_items template_item on template_item.id = item.template_item_id
    where item.execution_id = target_execution_id
      and template_item.is_required = true
      and (item.status not in ('fulfilled','not_applicable')
        or (item.status = 'not_applicable' and length(trim(coalesce(item.justification,''))) < 10));
    if v_required_unresolved > 0 then
      raise exception 'Existem requisitos obrigatorios nao resolvidos.' using errcode = '22023';
    end if;
  end if;
  update public.sparks_checklist_executions
  set status = target_status, updated_at = timezone('utc',now()), updated_by = auth.uid()
  where id = target_execution_id;
  insert into public.sparks_checklist_audit (
    execution_id, action, actor_id, before_state, after_state, change_reason
  ) values (
    target_execution_id, 'status_transition', auth.uid(),
    jsonb_build_object('status',v_execution.status),
    jsonb_build_object('status',target_status),trim(change_reason)
  );
  return target_execution_id;
end;
$function$;
revoke all on function public.transition_sparks_checklist_execution(uuid,text,text) from public,anon;
grant execute on function public.transition_sparks_checklist_execution(uuid,text,text) to authenticated;
commit;
