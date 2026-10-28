begin;

create table if not exists public.skda_question_evidence_expectations (
  id uuid primary key default gen_random_uuid(),
  catalog_version_id uuid not null references public.skda_catalog_versions(id) on delete cascade,
  question_id uuid not null references public.skda_questions(id) on delete cascade,
  reference_practice_id uuid references public.skda_reference_practices(id) on delete set null,
  evidence_key text not null,
  title text not null,
  description text,
  answer_level text not null check (answer_level in ('A','B','C','D')),
  purpose text not null default 'both'
    check (purpose in ('support_declared_answer','evolution_to_d','both')),
  necessity text not null default 'recommended'
    check (necessity in ('required','recommended','alternative')),
  evidence_dimension text not null
    check (evidence_dimension in (
      'existence','institutionalization','execution','recurrence',
      'coverage','control_results','learning_improvement'
    )),
  evidence_kind text not null default 'other'
    check (evidence_kind in (
      'policy','procedure','minutes','record','report','indicator',
      'system_record','plan','contract','communication','interview',
      'physical_evidence','other'
    )),
  branch_code text,
  activity_scope text,
  source_authority text not null default 'sparkoop'
    check (source_authority in ('official','canonical','sparkoop','benchmark','inference')),
  source_reference text,
  confidence text not null default 'medium'
    check (confidence in ('high','medium','low')),
  active boolean not null default true,
  display_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  check (length(trim(evidence_key)) > 0),
  check (length(trim(title)) > 0)
);

create unique index if not exists uq_skda_question_evidence_expectations_scope
  on public.skda_question_evidence_expectations(
    question_id,evidence_key,answer_level,coalesce(branch_code,''),coalesce(activity_scope,'')
  );

create index if not exists idx_skda_question_evidence_expectations_lookup
  on public.skda_question_evidence_expectations(question_id,answer_level,branch_code,active,display_order);

alter table public.skda_question_evidence_expectations enable row level security;

drop policy if exists skda_question_evidence_expectations_select on public.skda_question_evidence_expectations;
create policy skda_question_evidence_expectations_select
on public.skda_question_evidence_expectations
for select to authenticated
using (active or public.is_platform_super_admin());

drop policy if exists skda_question_evidence_expectations_manage on public.skda_question_evidence_expectations;
create policy skda_question_evidence_expectations_manage
on public.skda_question_evidence_expectations
for all to authenticated
using (public.is_platform_super_admin())
with check (public.is_platform_super_admin());

grant select on public.skda_question_evidence_expectations to authenticated,service_role;
grant insert,update,delete on public.skda_question_evidence_expectations to service_role;

create or replace function public.get_skda_question_evidence_expectations(
  target_organization_id uuid,
  target_diagnosis_id uuid,
  target_question_id uuid,
  current_answer_level text default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  org_row record;
  question_row public.skda_questions%rowtype;
  normalized_level text;
  current_rank integer;
  declared_rows jsonb;
  evolution_rows jsonb;
  legacy_rows jsonb;
begin
  if not public.has_module_access(target_organization_id,'SK-DA') then
    raise exception 'Acesso ao SK-DA nao autorizado.';
  end if;

  select
    o.id,
    b.code as branch_code,
    o.primary_activity_description
  into org_row
  from public.organizations o
  left join public.cooperative_branches b on b.id=o.cooperative_branch_id
  where o.id=target_organization_id;

  select q.*
  into question_row
  from public.skda_diagnoses d
  join public.skda_questions q
    on q.catalog_version_id=d.catalog_version_id
  where d.id=target_diagnosis_id
    and d.organization_id=target_organization_id
    and q.id=target_question_id;

  if question_row.id is null then
    raise exception 'Questao nao pertence ao catalogo ativo do diagnostico.';
  end if;

  normalized_level := upper(nullif(trim(coalesce(current_answer_level,'')),''));
  if normalized_level not in ('A','B','C','D') then
    normalized_level := null;
  end if;

  current_rank := case normalized_level
    when 'A' then 1 when 'B' then 2 when 'C' then 3 when 'D' then 4 else 0 end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'evidence_key',e.evidence_key,
    'title',e.title,
    'description',e.description,
    'answer_level',e.answer_level,
    'necessity',e.necessity,
    'dimension',e.evidence_dimension,
    'kind',e.evidence_kind,
    'branch_code',e.branch_code,
    'activity_scope',e.activity_scope,
    'source_authority',e.source_authority,
    'source_reference',e.source_reference,
    'confidence',e.confidence,
    'metadata',e.metadata
  ) order by e.display_order,e.title),'[]'::jsonb)
  into declared_rows
  from public.skda_question_evidence_expectations e
  where e.question_id=target_question_id
    and e.active
    and normalized_level is not null
    and e.answer_level=normalized_level
    and e.purpose in ('support_declared_answer','both')
    and (e.branch_code is null or e.branch_code=org_row.branch_code)
    and (
      e.activity_scope is null
      or coalesce(org_row.primary_activity_description,'') ilike '%'||e.activity_scope||'%'
    );

  select coalesce(jsonb_agg(jsonb_build_object(
    'evidence_key',e.evidence_key,
    'title',e.title,
    'description',e.description,
    'answer_level',e.answer_level,
    'necessity',e.necessity,
    'dimension',e.evidence_dimension,
    'kind',e.evidence_kind,
    'branch_code',e.branch_code,
    'activity_scope',e.activity_scope,
    'source_authority',e.source_authority,
    'source_reference',e.source_reference,
    'confidence',e.confidence,
    'metadata',e.metadata
  ) order by
    case e.answer_level when 'A' then 1 when 'B' then 2 when 'C' then 3 else 4 end,
    e.display_order,e.title),'[]'::jsonb)
  into evolution_rows
  from public.skda_question_evidence_expectations e
  where e.question_id=target_question_id
    and e.active
    and current_rank < 4
    and (case e.answer_level when 'A' then 1 when 'B' then 2 when 'C' then 3 else 4 end) > current_rank
    and e.purpose in ('evolution_to_d','both')
    and (e.branch_code is null or e.branch_code=org_row.branch_code)
    and (
      e.activity_scope is null
      or coalesce(org_row.primary_activity_description,'') ilike '%'||e.activity_scope||'%'
    );

  legacy_rows := case
    when jsonb_typeof(question_row.expected_evidence)='array'
      then question_row.expected_evidence
    else '[]'::jsonb
  end;

  return jsonb_build_object(
    'question_id',question_row.id,
    'question_code',question_row.code,
    'question_text',question_row.question_text,
    'current_answer_level',normalized_level,
    'organization_context',jsonb_build_object(
      'branch_code',org_row.branch_code,
      'primary_activity_description',org_row.primary_activity_description
    ),
    'evidence_for_declared_answer',declared_rows,
    'evidence_to_reach_d',case when normalized_level='D' then '[]'::jsonb else evolution_rows end,
    'legacy_expected_evidence',legacy_rows,
    'catalog_status',case
      when jsonb_array_length(declared_rows)>0 or jsonb_array_length(evolution_rows)>0 then 'governed'
      when jsonb_array_length(legacy_rows)>0 then 'legacy_fallback'
      else 'not_curated'
    end
  );
end;
$function$;

revoke all on function public.get_skda_question_evidence_expectations(uuid,uuid,uuid,text) from public,anon;
grant execute on function public.get_skda_question_evidence_expectations(uuid,uuid,uuid,text)
  to authenticated,service_role;

create or replace function public.list_skda_question_evidence_expectations(
  target_organization_id uuid,
  target_diagnosis_id uuid
)
returns table (
  expectation_id uuid,
  question_id uuid,
  reference_practice_id uuid,
  evidence_key text,
  title text,
  description text,
  answer_level text,
  purpose text,
  necessity text,
  evidence_dimension text,
  evidence_kind text,
  branch_code text,
  activity_scope text,
  source_authority text,
  source_reference text,
  confidence text,
  display_order integer,
  metadata jsonb
)
language sql
security definer
set search_path=''
as $function$
  select
    e.id,
    e.question_id,
    e.reference_practice_id,
    e.evidence_key,
    e.title,
    e.description,
    e.answer_level,
    e.purpose,
    e.necessity,
    e.evidence_dimension,
    e.evidence_kind,
    e.branch_code,
    e.activity_scope,
    e.source_authority,
    e.source_reference,
    e.confidence,
    e.display_order,
    e.metadata
  from public.skda_diagnoses d
  join public.skda_questions q
    on q.catalog_version_id=d.catalog_version_id
  join public.skda_question_evidence_expectations e
    on e.question_id=q.id
   and e.active
  join public.organizations o
    on o.id=d.organization_id
  left join public.cooperative_branches b
    on b.id=o.cooperative_branch_id
  where d.id=target_diagnosis_id
    and d.organization_id=target_organization_id
    and public.has_module_access(target_organization_id,'SK-DA')
    and (e.branch_code is null or e.branch_code=b.code)
    and (
      e.activity_scope is null
      or coalesce(o.primary_activity_description,'') ilike '%'||e.activity_scope||'%'
    )
  order by q.display_order,
    case e.answer_level when 'A' then 1 when 'B' then 2 when 'C' then 3 else 4 end,
    e.display_order,e.title;
$function$;

revoke all on function public.list_skda_question_evidence_expectations(uuid,uuid) from public,anon;
grant execute on function public.list_skda_question_evidence_expectations(uuid,uuid)
  to authenticated,service_role;

comment on table public.skda_question_evidence_expectations is
'Catalogo governado de evidencias esperadas por questao e nivel A-D, com especializacao opcional por ramo e atividade.';

comment on function public.get_skda_question_evidence_expectations(uuid,uuid,uuid,text) is
'Resolve evidencias para sustentar a resposta declarada e, quando abaixo de D, evidencias adicionais para evolucao ate atendimento pleno.';

-- Novo artefato do Kit de Abertura, complementar a matriz diagnostica questao x evidencia.
insert into public.sparks_methodology_artifacts (
  organization_id,project_id,module_code,artifact_type_id,artifact_code,title,purpose,
  macrophase_code,status,confidentiality_level,responsible_user_id,current_version_number,
  planned_due_date,source,metadata,created_by,updated_by
)
select
  d.organization_id,
  d.execution_initiative_id,
  'SK-DA',
  t.id,
  'MF1-A04',
  'Matriz de Evidencias Esperadas por Questao',
  'Orientar a Autoavaliacao e o Diagnostico Assistido indicando evidencias para sustentar a resposta declarada e, quando abaixo de D, o caminho de evidencias para atendimento pleno conforme ramo e atividade.',
  'MF1',
  'planned',
  1,
  d.lead_user_id,
  0,
  (
    select planned_due_date
    from public.sparks_initiative_actions a
    where a.initiative_id=d.execution_initiative_id
      and a.code='MF1'
    limit 1
  ),
  'SPARKs SaaS',
  jsonb_build_object(
    'diagnosis_id',d.id,
    'diagnosis_code',d.code,
    'artifact_role','opening_kit',
    'semantic_role','prescriptive_evidence_expectation_matrix',
    'complements_artifact','MF2-A02',
    'state_model','TEMPLATE_SPARKOOP -> ADAPTADO -> EM_VALIDACAO -> VALIDADO -> APROVADO -> INSTITUCIONALIZADO -> EM_EXECUCAO -> EVIDENCIADO -> AVALIADO'
  ),
  coalesce(d.created_by,d.lead_user_id),
  coalesce(d.updated_by,d.created_by,d.lead_user_id)
from public.skda_diagnoses d
join public.sparks_methodology_artifact_types t
  on t.module_code='SK-DA'
 and t.artifact_type_code='SKDA_EVIDENCE_PACKAGE'
 and t.active
where d.archived_at is null
  and d.execution_initiative_id is not null
on conflict (organization_id,project_id,artifact_code) do update set
  title=excluded.title,
  purpose=excluded.purpose,
  artifact_type_id=excluded.artifact_type_id,
  macrophase_code=excluded.macrophase_code,
  metadata=public.sparks_methodology_artifacts.metadata || excluded.metadata,
  updated_at=timezone('utc',now());

notify pgrst, 'reload schema';

commit;
