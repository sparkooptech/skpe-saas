begin;

-- SK-DA | versão textual governada de entregáveis metodológicos
create or replace function public.create_methodology_artifact_text_version(
  target_artifact_id uuid,
  target_content_text text,
  target_change_summary text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_artifact public.sparks_methodology_artifacts%rowtype;
  v_version_id uuid;
  v_next_version integer;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.' using errcode='42501';
  end if;

  select *
    into v_artifact
  from public.sparks_methodology_artifacts
  where id = target_artifact_id
  for update;

  if v_artifact.id is null then
    raise exception 'Artefato não encontrado.' using errcode='P0002';
  end if;

  if not public.can_manage_methodology_artifacts(v_artifact.organization_id) then
    raise exception 'Acesso negado para versionar o artefato.' using errcode='42501';
  end if;

  if length(trim(coalesce(target_content_text,''))) < 10 then
    raise exception 'Informe conteúdo textual suficiente para criar a versão.' using errcode='22023';
  end if;

  if length(trim(coalesce(target_change_summary,''))) < 10 then
    raise exception 'Informe o resumo/justificativa da versão com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  select coalesce(max(version_number),0) + 1
    into v_next_version
  from public.sparks_methodology_artifact_versions
  where artifact_id = target_artifact_id;

  insert into public.sparks_methodology_artifact_versions(
    artifact_id,
    version_number,
    version_label,
    version_status,
    content_json,
    file_name,
    file_extension,
    change_summary,
    generated_by_ai,
    created_by
  )
  values(
    target_artifact_id,
    v_next_version,
    'v' || v_next_version::text,
    'draft',
    jsonb_build_object(
      'format','markdown',
      'content',trim(target_content_text),
      'source','SK-DA governed editor',
      'human_validation_required',true
    ),
    null,
    'md',
    trim(target_change_summary),
    false,
    auth.uid()
  )
  returning id into v_version_id;

  update public.sparks_methodology_artifacts
  set current_version_number = v_next_version,
      status = case when status = 'planned' then 'in_preparation' else status end,
      updated_at = now(),
      updated_by = auth.uid()
  where id = target_artifact_id;

  insert into public.sparks_methodology_artifact_audit(
    organization_id,
    project_id,
    artifact_id,
    artifact_version_id,
    actor_user_id,
    action_code,
    action_description,
    new_data
  )
  values(
    v_artifact.organization_id,
    v_artifact.project_id,
    target_artifact_id,
    v_version_id,
    auth.uid(),
    'VERSION_CREATED',
    trim(target_change_summary),
    jsonb_build_object(
      'version_number',v_next_version,
      'version_label','v' || v_next_version::text,
      'version_status','draft',
      'format','markdown',
      'human_validation_required',true
    )
  );

  return v_version_id;
end;
$function$;

revoke all on function public.create_methodology_artifact_text_version(uuid,text,text) from public,anon;
grant execute on function public.create_methodology_artifact_text_version(uuid,text,text) to authenticated,service_role;

comment on function public.create_methodology_artifact_text_version(uuid,text,text) is
'Cria nova versão textual/Markdown governada de um entregável metodológico. A criação da versão não representa validação, aprovação ou institucionalização.';

commit;
