begin;

-- SPARKs DA | ingestão externa transversal + inteligência organizacional governada

create or replace function public.register_external_sparks_evidence_asset(
  target_organization_id uuid,
  evidence_title text,
  evidence_description text,
  target_evidence_type text,
  target_origin_module_code text,
  target_reference_date date,
  target_external_origin text,
  target_external_key text,
  target_source_locator jsonb,
  target_file_name text,
  target_mime_type text,
  target_file_size_bytes bigint,
  target_content_hash text,
  target_extracted_text text,
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
  next_version integer;
begin
  if not public.can_register_sparks_evidence(target_organization_id) then
    raise exception 'Acesso negado para registrar evidências nesta organização.' using errcode='42501';
  end if;

  if length(trim(coalesce(evidence_title,''))) = 0 then
    raise exception 'Informe o título da evidência.' using errcode='22023';
  end if;

  if length(trim(coalesce(target_external_key,''))) = 0 then
    raise exception 'Informe a chave externa estável da evidência.' using errcode='22023';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  select e.id into asset_id
  from public.sparks_evidence_assets e
  where e.organization_id=target_organization_id
    and e.source_external_key=target_external_key
    and e.archived_at is null
  order by e.created_at
  limit 1;

  if asset_id is null and target_content_hash is not null then
    select e.id into asset_id
    from public.sparks_evidence_assets e
    where e.organization_id=target_organization_id
      and e.content_hash=target_content_hash
      and e.archived_at is null
    limit 1;
  end if;

  if asset_id is null then
    insert into public.sparks_evidence_assets(
      organization_id,title,description,evidence_type,source_type,origin_module_code,
      external_origin,reference_date,confidentiality_level,validation_status,reliability_level,
      content_hash,source_locator,source_external_key,metadata,created_by,updated_by
    )
    values(
      target_organization_id,trim(evidence_title),nullif(trim(evidence_description),''),
      coalesce(nullif(trim(target_evidence_type),''),'document'),'external',
      nullif(trim(target_origin_module_code),''),nullif(trim(target_external_origin),''),
      target_reference_date,'internal','pending','not_assessed',target_content_hash,
      coalesce(target_source_locator,'{}'::jsonb),trim(target_external_key),
      jsonb_build_object(
        'ingestion_kind','external_reference',
        'human_validation_required',true,
        'registered_at',timezone('utc',now())
      ),
      auth.uid(),auth.uid()
    )
    returning id into asset_id;
  else
    update public.sparks_evidence_assets
    set title=trim(evidence_title),
        description=coalesce(nullif(trim(evidence_description),''),description),
        reference_date=coalesce(target_reference_date,reference_date),
        external_origin=coalesce(nullif(trim(target_external_origin),''),external_origin),
        source_locator=coalesce(target_source_locator,source_locator),
        source_external_key=trim(target_external_key),
        content_hash=coalesce(target_content_hash,content_hash),
        updated_at=timezone('utc',now()),
        updated_by=auth.uid()
    where id=asset_id;
  end if;

  if nullif(trim(coalesce(target_file_name,'')),'') is not null
     or nullif(trim(coalesce(target_extracted_text,'')),'') is not null then
    select coalesce(max(v.version_number),0)+1 into next_version
    from public.sparks_evidence_versions v
    where v.evidence_asset_id=asset_id;

    if not exists (
      select 1
      from public.sparks_evidence_versions v
      where v.evidence_asset_id=asset_id
        and (
          (target_content_hash is not null and v.content_hash=target_content_hash)
          or (
            target_content_hash is null
            and v.metadata->>'source_external_key'=target_external_key
            and coalesce(v.file_name,'')=coalesce(target_file_name,'')
          )
        )
    ) then
      insert into public.sparks_evidence_versions(
        evidence_asset_id,version_number,version_label,file_name,mime_type,file_size_bytes,
        content_hash,extracted_text,change_summary,metadata,created_by
      )
      values(
        asset_id,next_version,'ext-'||next_version::text,nullif(trim(target_file_name),''),
        nullif(trim(target_mime_type),''),target_file_size_bytes,target_content_hash,
        nullif(target_extracted_text,''),trim(change_reason),
        jsonb_build_object(
          'source_external_key',target_external_key,
          'source_locator',coalesce(target_source_locator,'{}'::jsonb),
          'external_origin',target_external_origin
        ),
        auth.uid()
      )
      returning id into version_id;

      update public.sparks_evidence_assets
      set current_version_id=version_id,updated_at=timezone('utc',now()),updated_by=auth.uid()
      where id=asset_id;
    end if;
  end if;

  return asset_id;
end;
$function$;

revoke all on function public.register_external_sparks_evidence_asset(uuid,text,text,text,text,date,text,text,jsonb,text,text,bigint,text,text,text) from public,anon;
grant execute on function public.register_external_sparks_evidence_asset(uuid,text,text,text,text,date,text,text,jsonb,text,text,bigint,text,text,text) to authenticated,service_role;

create or replace function public.review_skda_evidence_intelligence(
  target_intelligence_id uuid,
  target_analysis_status text,
  target_evidence_coverage_status text,
  target_practice_state text,
  target_diagnostic_hypothesis text,
  target_interview_question_suggestion text,
  target_gap_description text,
  target_improvement_suggestion text,
  target_confidence_score numeric,
  target_review_note text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  row_data public.skda_evidence_question_intelligence%rowtype;
begin
  select * into row_data
  from public.skda_evidence_question_intelligence
  where id=target_intelligence_id
  for update;

  if row_data.id is null then
    raise exception 'Inteligência de evidência não encontrada.' using errcode='P0002';
  end if;

  if target_analysis_status = 'proposed'
     and not public.has_module_permission(row_data.organization_id,'SK-DA','assessment.edit') then
    raise exception 'Permissão para analisar evidências do SK-DA não autorizada.' using errcode='42501';
  end if;

  if target_analysis_status in ('validated','rejected','superseded')
     and not public.has_module_permission(row_data.organization_id,'SK-DA','assessment.validate') then
    raise exception 'Permissão para validar inteligência do SK-DA não autorizada.' using errcode='42501';
  end if;

  if target_analysis_status not in ('proposed','validated','rejected','superseded') then
    raise exception 'Situação de análise inválida.' using errcode='22023';
  end if;

  if length(trim(coalesce(target_review_note,''))) < 10 then
    raise exception 'Informe uma justificativa de revisão com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  update public.skda_evidence_question_intelligence
  set analysis_status=target_analysis_status,
      evidence_coverage_status=coalesce(nullif(target_evidence_coverage_status,''),evidence_coverage_status),
      practice_state=coalesce(nullif(target_practice_state,''),practice_state),
      diagnostic_hypothesis=nullif(trim(target_diagnostic_hypothesis),''),
      interview_question_suggestion=nullif(trim(target_interview_question_suggestion),''),
      gap_description=nullif(trim(target_gap_description),''),
      improvement_suggestion=nullif(trim(target_improvement_suggestion),''),
      confidence_score=target_confidence_score,
      validated_at=case when target_analysis_status in ('validated','rejected') then timezone('utc',now()) else null end,
      validated_by=case when target_analysis_status in ('validated','rejected') then auth.uid() else null end,
      metadata=metadata || jsonb_build_object(
        'last_review_note',trim(target_review_note),
        'last_reviewed_at',timezone('utc',now()),
        'last_reviewed_by',auth.uid()
      ),
      updated_at=timezone('utc',now()),
      updated_by=auth.uid()
  where id=target_intelligence_id;

  return target_intelligence_id;
end;
$function$;

revoke all on function public.review_skda_evidence_intelligence(uuid,text,text,text,text,text,text,text,numeric,text) from public,anon;
grant execute on function public.review_skda_evidence_intelligence(uuid,text,text,text,text,text,text,text,numeric,text) to authenticated,service_role;

create or replace function public.convert_skda_intelligence_to_finding(
  target_intelligence_id uuid,
  target_finding_type text,
  target_title text,
  target_description text,
  target_priority text,
  target_recommendation text,
  target_owner_user_id uuid,
  target_due_date date
)
returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  intel public.skda_evidence_question_intelligence%rowtype;
  finding_id uuid;
begin
  select * into intel
  from public.skda_evidence_question_intelligence
  where id=target_intelligence_id
  for update;

  if intel.id is null then
    raise exception 'Inteligência de evidência não encontrada.' using errcode='P0002';
  end if;

  if not public.has_module_permission(intel.organization_id,'SK-DA','findings.edit') then
    raise exception 'Permissão para formalizar achados do SK-DA não autorizada.' using errcode='42501';
  end if;

  if intel.analysis_status <> 'validated' then
    raise exception 'Somente uma inteligência validada pode originar achado formal.' using errcode='22023';
  end if;

  if target_finding_type not in ('strength','gap','opportunity','risk','observation') then
    raise exception 'Tipo de achado inválido.' using errcode='22023';
  end if;

  if target_priority not in ('low','medium','high','critical') then
    raise exception 'Prioridade inválida.' using errcode='22023';
  end if;

  select f.id into finding_id
  from public.skda_findings f
  where f.diagnosis_id=intel.diagnosis_id
    and f.metadata->>'source_intelligence_id'=intel.id::text
    and f.status <> 'dismissed'
  limit 1;

  if finding_id is null then
    insert into public.skda_findings(
      organization_id,diagnosis_id,question_id,finding_type,title,description,priority,status,
      recommendation,owner_user_id,due_date,metadata,created_by,updated_by
    )
    values(
      intel.organization_id,intel.diagnosis_id,intel.question_id,target_finding_type,
      trim(target_title),trim(target_description),target_priority,'open',
      nullif(trim(target_recommendation),''),target_owner_user_id,target_due_date,
      jsonb_build_object(
        'origin','organizational_intelligence',
        'source_intelligence_id',intel.id,
        'source_evidence_asset_id',intel.evidence_asset_id,
        'confidence_score',intel.confidence_score,
        'practice_state',intel.practice_state,
        'evidence_coverage_status',intel.evidence_coverage_status
      ),
      auth.uid(),auth.uid()
    )
    returning id into finding_id;

    insert into public.skda_evidence_correlations(
      organization_id,diagnosis_id,evidence_asset_id,target_type,target_id,usage_type,
      relevance_level,validation_status,validated_at,validated_by,analyst_interpretation,
      metadata,created_by,updated_by
    )
    values(
      intel.organization_id,intel.diagnosis_id,intel.evidence_asset_id,'finding',finding_id,
      'support','fundamental','validated',timezone('utc',now()),auth.uid(),
      coalesce(intel.diagnostic_hypothesis,intel.supports_claim,intel.gap_description),
      jsonb_build_object('source_intelligence_id',intel.id,'origin','organizational_intelligence'),
      auth.uid(),auth.uid()
    )
    on conflict (diagnosis_id,evidence_asset_id,target_type,target_id) do nothing;

    update public.skda_evidence_question_intelligence
    set metadata=metadata || jsonb_build_object(
          'finding_id',finding_id,
          'converted_to_finding_at',timezone('utc',now()),
          'converted_to_finding_by',auth.uid()
        ),
        updated_at=timezone('utc',now()),
        updated_by=auth.uid()
    where id=intel.id;
  end if;

  return finding_id;
end;
$function$;

revoke all on function public.convert_skda_intelligence_to_finding(uuid,text,text,text,text,text,uuid,date) from public,anon;
grant execute on function public.convert_skda_intelligence_to_finding(uuid,text,text,text,text,text,uuid,date) to authenticated,service_role;



create or replace function public.link_sparks_evidence_module_context(
  target_organization_id uuid,
  target_evidence_asset_id uuid,
  target_module_code text,
  target_type text,
  target_id uuid,
  target_usage_purpose text,
  target_relevance_level text,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  link_id uuid;
begin
  if not public.has_module_permission(target_organization_id,target_module_code,'evidence.link') then
    raise exception 'Permissão para vincular evidências ao módulo não autorizada.' using errcode='42501';
  end if;

  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;

  if not exists (
    select 1 from public.sparks_evidence_assets e
    where e.id=target_evidence_asset_id
      and e.organization_id=target_organization_id
      and e.archived_at is null
  ) then
    raise exception 'Evidência não encontrada para a organização informada.' using errcode='P0002';
  end if;

  insert into public.sparks_evidence_links(
    organization_id,evidence_asset_id,module_code,target_type,target_id,usage_purpose,
    usage_status,relevance_level,is_primary,notes,metadata,created_by
  )
  values(
    target_organization_id,target_evidence_asset_id,trim(target_module_code),trim(target_type),
    target_id,nullif(trim(target_usage_purpose),''),'active',
    coalesce(nullif(trim(target_relevance_level),''),'important'),false,
    trim(change_reason),
    jsonb_build_object(
      'linked_at',timezone('utc',now()),
      'linked_by',auth.uid(),
      'ownership_rule','evidence_belongs_to_organization_module_only_consumes'
    ),
    auth.uid()
  )
  on conflict on constraint sparks_evidence_links_unique
  do update set
    usage_status='active',
    usage_purpose=excluded.usage_purpose,
    relevance_level=excluded.relevance_level,
    notes=excluded.notes,
    metadata=public.sparks_evidence_links.metadata || excluded.metadata
  returning id into link_id;

  return link_id;
end;
$function$;

revoke all on function public.link_sparks_evidence_module_context(uuid,uuid,text,text,uuid,text,text,text) from public,anon;
grant execute on function public.link_sparks_evidence_module_context(uuid,uuid,text,text,uuid,text,text,text) to authenticated,service_role;

create or replace view public.skda_organizational_intelligence_summary
with (security_invoker=true)
as
select
  i.organization_id,
  i.diagnosis_id,
  count(*)::integer as total_items,
  count(*) filter (where i.analysis_status in ('queued','processing','proposed'))::integer as under_analysis,
  count(*) filter (where i.analysis_status='validated')::integer as validated,
  count(*) filter (where i.analysis_status='rejected')::integer as rejected,
  count(*) filter (where i.analysis_status='validated' and not (i.metadata ? 'finding_id'))::integer as validated_pending_finding,
  count(*) filter (where i.metadata ? 'finding_id')::integer as converted_to_findings,
  count(*) filter (where nullif(trim(i.interview_question_suggestion),'') is not null and i.analysis_status <> 'rejected')::integer as interview_prompts
from public.skda_evidence_question_intelligence i
group by i.organization_id,i.diagnosis_id;

grant select on public.skda_organizational_intelligence_summary to authenticated,service_role;

commit;
