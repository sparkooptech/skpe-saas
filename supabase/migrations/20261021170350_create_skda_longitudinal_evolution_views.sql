begin;

create or replace view public.skda_organization_evolution_matrix
with (security_invoker = true)
as
select
  diagnosis.organization_id,
  diagnosis.id as diagnosis_id,
  diagnosis.code as diagnosis_code,
  diagnosis.name as diagnosis_name,
  diagnosis.reference_year,
  diagnosis.status as diagnosis_status,
  diagnosis.current_megaphase_code,
  diagnosis.catalog_version_id,
  catalog.code as model_code,
  catalog.version_code as model_version_code,
  catalog.name as model_version_name,
  question.id as question_id,
  question.code as question_code,
  question.question_text,
  maturity.id as maturity_level_id,
  maturity.code as maturity_level_code,
  maturity.name as maturity_level_name,
  block.id as block_id,
  block.code as block_code,
  block.name as block_name,
  criterion.id as criterion_id,
  criterion.code as criterion_code,
  criterion.name as criterion_name,
  response.id as response_id,
  response.classification,
  response.response_status,
  response.score,
  response.confidence_level,
  declared.id as declared_alternative_id,
  declared.code as declared_alternative_code,
  declared.alternative_text as declared_alternative_text,
  evidenced.id as evidenced_alternative_id,
  evidenced.code as evidenced_alternative_code,
  evidenced.alternative_text as evidenced_alternative_text,
  validated.id as validated_alternative_id,
  validated.code as validated_alternative_code,
  validated.alternative_text as validated_alternative_text,
  coalesce(practice_summary.practice_count,0) as practice_count,
  coalesce(practice_summary.validated_practice_count,0) as validated_practice_count,
  practice_summary.work_pattern_levels,
  coalesce(evidence_summary.evidence_count,0) as evidence_count,
  coalesce(evidence_summary.validated_evidence_count,0) as validated_evidence_count,
  coalesce(finding_summary.gap_count,0) as gap_count,
  coalesce(finding_summary.open_gap_count,0) as open_gap_count,
  coalesce(finding_summary.strength_count,0) as strength_count,
  response.evaluated_at,
  response.validated_at,
  response.updated_at as response_updated_at
from public.skda_diagnoses diagnosis
join public.skda_catalog_versions catalog
  on catalog.id=diagnosis.catalog_version_id
join public.skda_questions question
  on question.catalog_version_id=diagnosis.catalog_version_id
left join public.skda_responses response
  on response.diagnosis_id=diagnosis.id
 and response.question_id=question.id
left join public.skda_maturity_levels maturity
  on maturity.id=question.maturity_level_id
left join public.skda_model_blocks block
  on block.id=question.block_id
left join public.skda_model_criteria criterion
  on criterion.id=question.criterion_id
left join public.skda_question_alternatives declared
  on declared.id=response.declared_alternative_id
left join public.skda_question_alternatives evidenced
  on evidenced.id=response.evidenced_alternative_id
left join public.skda_question_alternatives validated
  on validated.id=response.validated_alternative_id
left join lateral (
  select
    count(*)::integer as practice_count,
    count(*) filter (where practice.status='validated')::integer
      as validated_practice_count,
    array_remove(
      array_agg(distinct work_pattern.institutionalization_status),
      null
    ) as work_pattern_levels
  from public.skda_practices practice
  left join public.skda_work_patterns work_pattern
    on work_pattern.practice_id=practice.id
  where practice.diagnosis_id=diagnosis.id
    and practice.question_id=question.id
) practice_summary on true
left join lateral (
  select
    count(distinct correlation.evidence_asset_id)::integer as evidence_count,
    count(distinct correlation.evidence_asset_id)
      filter (where correlation.validation_status='validated')::integer
      as validated_evidence_count
  from public.skda_evidence_correlations correlation
  where correlation.diagnosis_id=diagnosis.id
    and (
      (correlation.target_type='question' and correlation.target_id=question.id)
      or (
        response.id is not null
        and correlation.target_type='response'
        and correlation.target_id=response.id
      )
    )
) evidence_summary on true
left join lateral (
  select
    count(*) filter (where finding.finding_type='gap')::integer as gap_count,
    count(*) filter (
      where finding.finding_type='gap'
        and finding.status in ('open','accepted','in_action')
    )::integer as open_gap_count,
    count(*) filter (where finding.finding_type='strength')::integer
      as strength_count
  from public.skda_findings finding
  where finding.diagnosis_id=diagnosis.id
    and finding.question_id=question.id
) finding_summary on true
where diagnosis.archived_at is null;

comment on view public.skda_organization_evolution_matrix is
  'Matriz longitudinal por ciclo e questão para leitura Declarado x Evidenciado x Validado, práticas, evidências e achados. Usa security_invoker para respeitar RLS das tabelas de origem.';

revoke all on public.skda_organization_evolution_matrix
from public, anon;

grant select on public.skda_organization_evolution_matrix
to authenticated, service_role;


create or replace view public.skda_action_followup_longitudinal
with (security_invoker = true)
as
select
  diagnosis.organization_id,
  diagnosis.id as diagnosis_id,
  diagnosis.code as diagnosis_code,
  diagnosis.reference_year,
  diagnosis.status as diagnosis_status,
  finding.id as finding_id,
  finding.question_id,
  question.code as question_code,
  question.question_text,
  finding.finding_type,
  finding.title as finding_title,
  finding.description as finding_description,
  finding.priority,
  finding.status as finding_status,
  finding.recommendation,
  finding.due_date as finding_due_date,
  allocation.id as allocation_id,
  allocation.cycle_number,
  allocation.sequence_order,
  allocation.rationale as allocation_rationale,
  initiative.id as initiative_id,
  initiative.code as initiative_code,
  initiative.name as initiative_name,
  initiative.status as initiative_status,
  initiative.priority as initiative_priority,
  initiative.progress as initiative_progress,
  initiative.start_date,
  initiative.target_end_date,
  initiative.completed_at,
  initiative.health_status,
  initiative.risk_level,
  case
    when allocation.id is null then 'not_prioritized'
    when initiative.id is null then 'awaiting_conversion'
    when initiative.status='completed' then 'completed'
    when initiative.status in ('cancelled','archived') then 'closed_without_completion'
    when initiative.target_end_date is not null
      and initiative.target_end_date < current_date
      and initiative.status not in ('completed','cancelled','archived')
      then 'overdue'
    when initiative.status in ('proposed','under_analysis','approved','planned')
      then 'not_started'
    when initiative.status='in_progress' then 'in_progress'
    when initiative.status='on_hold' then 'on_hold'
    when initiative.status='blocked' then 'blocked'
    else 'other'
  end as followup_state,
  case
    when initiative.id is null then false
    when initiative.status='completed' and initiative.progress>=100 then true
    else false
  end as execution_completed,
  finding.created_at as finding_created_at,
  allocation.created_at as allocation_created_at,
  initiative.updated_at as initiative_updated_at
from public.skda_findings finding
join public.skda_diagnoses diagnosis
  on diagnosis.id=finding.diagnosis_id
 and diagnosis.organization_id=finding.organization_id
left join public.skda_questions question
  on question.id=finding.question_id
left join public.skda_action_plan_allocations allocation
  on allocation.diagnosis_id=finding.diagnosis_id
 and allocation.finding_id=finding.id
left join public.sparks_initiatives initiative
  on initiative.id=allocation.initiative_id
 and initiative.organization_id=finding.organization_id
 and initiative.archived_at is null
where diagnosis.archived_at is null
  and finding.finding_type in ('gap','opportunity','risk');

comment on view public.skda_action_followup_longitudinal is
  'Follow-up longitudinal das recomendações e ações do DA, incluindo ciclo, iniciativa transversal, progresso, atraso e situação de execução.';

revoke all on public.skda_action_followup_longitudinal
from public, anon;

grant select on public.skda_action_followup_longitudinal
to authenticated, service_role;

commit;
