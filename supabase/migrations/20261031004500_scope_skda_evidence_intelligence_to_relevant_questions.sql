begin;

drop function if exists public.queue_skda_evidence_question_intelligence(uuid,uuid,uuid);

create or replace function public.queue_skda_evidence_question_intelligence(
  target_organization_id uuid,
  target_diagnosis_id uuid,
  target_evidence_asset_id uuid,
  target_question_ids uuid[] default null
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  affected integer;
begin
  if not public.has_module_access(target_organization_id,'SK-DA') then
    raise exception 'Acesso ao SK-DA não autorizado.';
  end if;

  if coalesce(array_length(target_question_ids,1),0)=0 then
    return 0;
  end if;

  insert into public.skda_evidence_question_intelligence (
    organization_id,diagnosis_id,evidence_asset_id,question_id,correlation_id,
    document_intake_status,evidence_coverage_status,analysis_mode,analysis_status,
    self_assessment_guidance,created_by,updated_by,metadata
  )
  select
    target_organization_id,target_diagnosis_id,target_evidence_asset_id,q.id,c.id,
    'triage','under_analysis','assisted','queued',q.guidance,auth.uid(),auth.uid(),
    jsonb_build_object(
      'pipeline','SK-DOC>SK-KM>SK-DA',
      'purpose','evidence_question_intelligence',
      'scope','semantic_candidate_questions_only',
      'human_validation_required',true,
      'queued_at',timezone('utc',now())
    )
  from public.skda_diagnoses d
  join public.skda_questions q on q.catalog_version_id=d.catalog_version_id
    and q.id=any(target_question_ids)
  left join public.skda_evidence_correlations c
    on c.diagnosis_id=d.id
   and c.organization_id=d.organization_id
   and c.evidence_asset_id=target_evidence_asset_id
   and c.target_type='question'
   and c.target_id=q.id
  where d.id=target_diagnosis_id
    and d.organization_id=target_organization_id
    and d.catalog_version_id is not null
  on conflict (diagnosis_id,evidence_asset_id,question_id)
  do update set
    document_intake_status='triage',
    analysis_status=case
      when public.skda_evidence_question_intelligence.analysis_status in ('validated','rejected')
        then public.skda_evidence_question_intelligence.analysis_status
      else 'queued'
    end,
    updated_by=auth.uid(),
    updated_at=timezone('utc',now()),
    metadata=public.skda_evidence_question_intelligence.metadata
      || jsonb_build_object('scope','semantic_candidate_questions_only','requeued_at',timezone('utc',now()));

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.queue_skda_evidence_question_intelligence(uuid,uuid,uuid,uuid[]) from public;
grant execute on function public.queue_skda_evidence_question_intelligence(uuid,uuid,uuid,uuid[])
  to authenticated,service_role;

-- Preserve legacy unreviewed all-question queue rows for audit, but retire them from operational use.
update public.skda_evidence_question_intelligence i
set analysis_status='rejected',
    updated_at=timezone('utc',now()),
    metadata=coalesce(i.metadata,'{}'::jsonb) || jsonb_build_object(
      'superseded_at',timezone('utc',now()),
      'superseded_reason','legacy_all_question_queue_replaced_by_semantic_scope'
    )
where i.analysis_status='queued'
  and coalesce(i.metadata->>'scope','')<> 'semantic_candidate_questions_only';

notify pgrst, 'reload schema';
commit;
