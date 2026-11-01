begin;

-- ============================================================
-- SK-DA | Endurecimento de acesso do nucleo canonico
-- Separa privilegios SQL de RLS e evita politica FOR ALL.
-- ============================================================

-- Catalogo/metodologia: leitura autenticada; manutencao somente por servico.
revoke all on table
  public.skda_catalog_models,
  public.skda_maturity_levels,
  public.skda_model_blocks,
  public.skda_model_criteria,
  public.skda_question_alternatives,
  public.skda_evaluation_requirements,
  public.skda_alternative_requirements,
  public.skda_question_history_links,
  public.skda_reference_practices,
  public.skda_reference_practice_links
from public, anon;

grant select on table
  public.skda_catalog_models,
  public.skda_maturity_levels,
  public.skda_model_blocks,
  public.skda_model_criteria,
  public.skda_question_alternatives,
  public.skda_evaluation_requirements,
  public.skda_alternative_requirements,
  public.skda_question_history_links,
  public.skda_reference_practices,
  public.skda_reference_practice_links
to authenticated;

grant select,insert,update,delete on table
  public.skda_catalog_models,
  public.skda_maturity_levels,
  public.skda_model_blocks,
  public.skda_model_criteria,
  public.skda_question_alternatives,
  public.skda_evaluation_requirements,
  public.skda_alternative_requirements,
  public.skda_question_history_links,
  public.skda_reference_practices,
  public.skda_reference_practice_links
to service_role;

-- Dados da Jornada: acesso autenticado estritamente conforme operacao.
revoke all on table
  public.skda_self_assessment_snapshots,
  public.skda_self_assessment_answers,
  public.skda_practices,
  public.skda_work_patterns,
  public.skda_practice_requirement_assessments
from public, anon;

grant select,insert on table
  public.skda_self_assessment_snapshots,
  public.skda_self_assessment_answers
to authenticated;

grant select,insert,update on table
  public.skda_practices,
  public.skda_work_patterns
to authenticated;

grant select,insert,update,delete on table
  public.skda_practice_requirement_assessments
to authenticated;

grant select,insert,update,delete on table
  public.skda_self_assessment_snapshots,
  public.skda_self_assessment_answers,
  public.skda_practices,
  public.skda_work_patterns,
  public.skda_practice_requirement_assessments
to service_role;

-- A autoavaliacao e snapshot: imutaveis para usuarios autenticados.
-- Nao existem politicas UPDATE/DELETE para snapshots e respostas declaradas.

drop policy if exists skda_practice_requirement_assessments_write
on public.skda_practice_requirement_assessments;

create policy skda_practice_requirement_assessments_insert
on public.skda_practice_requirement_assessments
for insert to authenticated
with check (
  exists (
    select 1
    from public.skda_practices practice
    where practice.id=skda_practice_requirement_assessments.practice_id
      and public.has_module_permission(
        practice.organization_id,
        'SK-DA',
        'assessment.edit'
      )
  )
);

create policy skda_practice_requirement_assessments_update
on public.skda_practice_requirement_assessments
for update to authenticated
using (
  exists (
    select 1
    from public.skda_practices practice
    where practice.id=skda_practice_requirement_assessments.practice_id
      and public.has_module_permission(
        practice.organization_id,
        'SK-DA',
        'assessment.edit'
      )
  )
)
with check (
  exists (
    select 1
    from public.skda_practices practice
    where practice.id=skda_practice_requirement_assessments.practice_id
      and public.has_module_permission(
        practice.organization_id,
        'SK-DA',
        'assessment.edit'
      )
  )
);

create policy skda_practice_requirement_assessments_delete
on public.skda_practice_requirement_assessments
for delete to authenticated
using (
  exists (
    select 1
    from public.skda_practices practice
    where practice.id=skda_practice_requirement_assessments.practice_id
      and public.has_module_permission(
        practice.organization_id,
        'SK-DA',
        'assessment.edit'
      )
  )
);

commit;
