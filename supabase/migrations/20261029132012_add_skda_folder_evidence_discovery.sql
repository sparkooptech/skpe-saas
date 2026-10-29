begin;

create or replace function public.register_skda_folder_evidence_discovery(
  target_organization_id uuid,
  target_diagnosis_id uuid,
  target_evidence_asset_id uuid,
  target_question_ids uuid[] default '{}'::uuid[],
  target_group_code text default 'complementar',
  target_group_title text default 'Outras evidências',
  target_relative_path text default null,
  target_scan_id text default null,
  target_discovery_tags text[] default '{}'::text[],
  target_relevance_confidence numeric default 60,
  target_triage_summary text default null,
  change_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_catalog_version_id uuid;
  v_diagnosis_correlation_id uuid;
  v_question_count integer := 0;
  v_intelligence_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Operação exige usuário autenticado.' using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  if not public.has_module_permission(target_organization_id,'SK-DA','evidence.link') then
    raise exception 'Acesso negado: sem permissão para vincular evidências ao Diagnóstico Assistido.' using errcode='42501';
  end if;

  select d.catalog_version_id
    into v_catalog_version_id
  from public.skda_diagnoses d
  where d.id=target_diagnosis_id
    and d.organization_id=target_organization_id
    and d.archived_at is null;

  if v_catalog_version_id is null then
    raise exception 'Jornada ou catálogo oficial não encontrado.' using errcode='P0002';
  end if;

  if not exists (
    select 1
    from public.sparks_evidence_assets a
    where a.id=target_evidence_asset_id
      and a.organization_id=target_organization_id
      and a.archived_at is null
  ) then
    raise exception 'Evidência não pertence à organização informada.' using errcode='22023';
  end if;

  insert into public.skda_evidence_correlations (
    organization_id,diagnosis_id,evidence_asset_id,target_type,target_id,
    usage_type,relevance_level,analyst_interpretation,validation_status,metadata
  )
  values (
    target_organization_id,target_diagnosis_id,target_evidence_asset_id,'diagnosis',target_diagnosis_id,
    'support','important',
    coalesce(nullif(trim(target_triage_summary),''),
      'Evidência descoberta por varredura inteligente de pasta e encaminhada para validação humana.'),
    'pending',
    jsonb_build_object(
      'source','folder_scan',
      'folder_scan_id',target_scan_id,
      'relative_path',target_relative_path,
      'checklist_group_code',coalesce(nullif(trim(target_group_code),''),'complementar'),
      'checklist_group_title',coalesce(nullif(trim(target_group_title),''),'Outras evidências'),
      'discovery_tags',to_jsonb(coalesce(target_discovery_tags,'{}'::text[])),
      'auto_discovered',true,
      'relevance_confidence',greatest(0,least(100,coalesce(target_relevance_confidence,60))),
      'human_validation_required',true,
      'discovered_at',timezone('utc',now())
    )
  )
  on conflict (diagnosis_id,evidence_asset_id,target_type,target_id)
  do update set
    relevance_level='important',
    analyst_interpretation=excluded.analyst_interpretation,
    validation_status=case
      when public.skda_evidence_correlations.validation_status='validated'
        then public.skda_evidence_correlations.validation_status
      else 'pending'
    end,
    metadata=coalesce(public.skda_evidence_correlations.metadata,'{}'::jsonb) || excluded.metadata,
    updated_at=timezone('utc',now())
  returning id into v_diagnosis_correlation_id;

  perform public.link_sparks_evidence_module_context(
    target_organization_id,
    target_evidence_asset_id,
    'SK-DA',
    'diagnosis',
    target_diagnosis_id,
    'Evidência descoberta automaticamente em pasta disponibilizada à Jornada DA.',
    'important',
    change_reason
  );

  with valid_questions as (
    select q.id
    from public.skda_questions q
    where q.catalog_version_id=v_catalog_version_id
      and q.id=any(coalesce(target_question_ids,'{}'::uuid[]))
  ),
  upserted_correlations as (
    insert into public.skda_evidence_correlations (
      organization_id,diagnosis_id,evidence_asset_id,target_type,target_id,
      usage_type,relevance_level,analyst_interpretation,validation_status,metadata
    )
    select
      target_organization_id,target_diagnosis_id,target_evidence_asset_id,'question',q.id,
      'support','important',
      'Associação sugerida automaticamente pela triagem da pasta; validar suficiência e aderência antes de concluir o diagnóstico.',
      'pending',
      jsonb_build_object(
        'source','folder_scan',
        'folder_scan_id',target_scan_id,
        'relative_path',target_relative_path,
        'auto_suggested',true,
        'relevance_confidence',greatest(0,least(100,coalesce(target_relevance_confidence,60))),
        'human_validation_required',true
      )
    from valid_questions q
    on conflict (diagnosis_id,evidence_asset_id,target_type,target_id)
    do update set
      relevance_level='important',
      analyst_interpretation=excluded.analyst_interpretation,
      metadata=coalesce(public.skda_evidence_correlations.metadata,'{}'::jsonb) || excluded.metadata,
      updated_at=timezone('utc',now())
    returning target_id,id
  )
  select count(*) into v_question_count from upserted_correlations;

  insert into public.skda_evidence_question_intelligence (
    organization_id,diagnosis_id,evidence_asset_id,question_id,correlation_id,
    document_intake_status,evidence_coverage_status,practice_state,
    relevance_score,analysis_mode,analysis_status,source_locator,
    self_assessment_guidance,metadata,created_by,updated_by
  )
  select
    target_organization_id,
    target_diagnosis_id,
    target_evidence_asset_id,
    q.id,
    c.id,
    'triage',
    'under_analysis',
    'not_assessed',
    greatest(0,least(100,coalesce(target_relevance_confidence,60))),
    'assisted',
    'queued',
    target_relative_path,
    q.guidance,
    jsonb_build_object(
      'pipeline','SK-DOC>SK-KM>SK-DA',
      'purpose','folder_evidence_discovery',
      'folder_scan_id',target_scan_id,
      'relative_path',target_relative_path,
      'checklist_group_code',target_group_code,
      'discovery_tags',to_jsonb(coalesce(target_discovery_tags,'{}'::text[])),
      'triage_summary',target_triage_summary,
      'auto_suggested',true,
      'human_validation_required',true,
      'queued_at',timezone('utc',now())
    ),
    auth.uid(),
    auth.uid()
  from public.skda_questions q
  left join public.skda_evidence_correlations c
    on c.diagnosis_id=target_diagnosis_id
   and c.evidence_asset_id=target_evidence_asset_id
   and c.target_type='question'
   and c.target_id=q.id
  where q.catalog_version_id=v_catalog_version_id
    and q.id=any(coalesce(target_question_ids,'{}'::uuid[]))
  on conflict (diagnosis_id,evidence_asset_id,question_id)
  do update set
    correlation_id=coalesce(excluded.correlation_id,public.skda_evidence_question_intelligence.correlation_id),
    document_intake_status='triage',
    evidence_coverage_status=case
      when public.skda_evidence_question_intelligence.analysis_status in ('validated','rejected')
        then public.skda_evidence_question_intelligence.evidence_coverage_status
      else 'under_analysis'
    end,
    relevance_score=case
      when public.skda_evidence_question_intelligence.analysis_status in ('validated','rejected')
        then public.skda_evidence_question_intelligence.relevance_score
      else excluded.relevance_score
    end,
    analysis_status=case
      when public.skda_evidence_question_intelligence.analysis_status in ('validated','rejected')
        then public.skda_evidence_question_intelligence.analysis_status
      else 'queued'
    end,
    source_locator=excluded.source_locator,
    metadata=coalesce(public.skda_evidence_question_intelligence.metadata,'{}'::jsonb) || excluded.metadata,
    updated_by=auth.uid(),
    updated_at=timezone('utc',now());

  get diagnostics v_intelligence_count = row_count;

  return jsonb_build_object(
    'diagnosis_correlation_id',v_diagnosis_correlation_id,
    'suggested_question_count',v_question_count,
    'intelligence_count',v_intelligence_count,
    'group_code',target_group_code,
    'group_title',target_group_title,
    'human_validation_required',true
  );
end;
$function$;

revoke all on function public.register_skda_folder_evidence_discovery(
  uuid,uuid,uuid,uuid[],text,text,text,text,text[],numeric,text,text
) from public,anon;

grant execute on function public.register_skda_folder_evidence_discovery(
  uuid,uuid,uuid,uuid[],text,text,text,text,text[],numeric,text,text
) to authenticated,service_role;

comment on function public.register_skda_folder_evidence_discovery(
  uuid,uuid,uuid,uuid[],text,text,text,text,text[],numeric,text,text
) is
'Registra a triagem de uma evidência encontrada por varredura de pasta, cria associações sugeridas por questão e exige validação humana antes de qualquer conclusão diagnóstica.';

notify pgrst, 'reload schema';

commit;
