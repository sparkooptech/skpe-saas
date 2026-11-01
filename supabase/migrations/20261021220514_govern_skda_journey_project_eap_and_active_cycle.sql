begin;

-- ============================================================
-- SK-DA | Jornada, Projeto transversal, EAP e ciclo ativo
-- ============================================================

create or replace function public.guard_skda_single_active_journey()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.archived_at is null
     and new.status not in ('completed','archived')
     and exists (
       select 1
       from public.skda_diagnoses existing
       where existing.organization_id = new.organization_id
         and existing.id <> coalesce(new.id, gen_random_uuid())
         and existing.archived_at is null
         and existing.status not in ('completed','archived')
     ) then
    raise exception
      'Já existe uma Jornada DA em andamento para esta organização. Conclua ou encerre o ciclo atual antes de iniciar uma nova Jornada.'
      using errcode='23505';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_skda_single_active_journey on public.skda_diagnoses;

create trigger trg_skda_single_active_journey
before insert or update of organization_id,status,archived_at
on public.skda_diagnoses
for each row
execute function public.guard_skda_single_active_journey();


create or replace function public.ensure_skda_journey_eap(target_diagnosis_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  diagnosis_row public.skda_diagnoses%rowtype;
  service_order_start date;
  service_order_end date;
  baseline_span integer;
  plan_span integer;
begin
  select *
    into diagnosis_row
  from public.skda_diagnoses
  where id=target_diagnosis_id
    and archived_at is null;

  if diagnosis_row.id is null or diagnosis_row.execution_initiative_id is null then
    return;
  end if;

  update public.sparks_initiatives
  set status=case when status='proposed' then 'planned' else status end,
      validation_status=case when status='proposed' then 'not_required' else validation_status end,
      updated_at=timezone('utc',now())
  where id=diagnosis_row.execution_initiative_id
    and organization_id=diagnosis_row.organization_id;

  if coalesce(diagnosis_row.metadata #>> '{service_order,authorized_start_date}','')
       ~ '^\d{4}-\d{2}-\d{2}$' then
    service_order_start := (diagnosis_row.metadata #>> '{service_order,authorized_start_date}')::date;
  end if;

  if coalesce(diagnosis_row.metadata #>> '{service_order,authorized_end_date}','')
       ~ '^\d{4}-\d{2}-\d{2}$' then
    service_order_end := (diagnosis_row.metadata #>> '{service_order,authorized_end_date}')::date;
  end if;

  if service_order_start is not null and service_order_end is not null then
    baseline_span := greatest(1, service_order_end-service_order_start+1);
  end if;

  if diagnosis_row.started_on is not null and diagnosis_row.planned_end_on is not null then
    plan_span := greatest(1, diagnosis_row.planned_end_on-diagnosis_row.started_on+1);
  end if;

  insert into public.sparks_initiative_actions (
    organization_id,
    initiative_id,
    code,
    name,
    description,
    action_type,
    source_module_code,
    source_reference,
    why_text,
    how_text,
    baseline_start_date,
    baseline_due_date,
    planned_start_date,
    planned_due_date,
    started_at,
    status,
    priority,
    progress,
    metadata,
    created_by,
    updated_by
  )
  select
    diagnosis_row.organization_id,
    diagnosis_row.execution_initiative_id,
    phase.code,
    phase.title,
    phase.work_pattern,
    'action',
    'SK-DA',
    'skda_diagnosis:' || diagnosis_row.id::text || ':' || phase.code,
    'Executar a MegaFase da Jornada de Diagnóstico Assistido com rastreabilidade de escopo, entregas, evidências e decisões.',
    phase.work_pattern,
    case when baseline_span is null then null
      else service_order_start + floor((phase.ord * baseline_span)::numeric / 11)::integer
    end,
    case when baseline_span is null then null
      else service_order_start + greatest(
        floor(((phase.ord+1) * baseline_span)::numeric / 11)::integer - 1,
        floor((phase.ord * baseline_span)::numeric / 11)::integer
      )
    end,
    case when plan_span is null then null
      else diagnosis_row.started_on + floor((phase.ord * plan_span)::numeric / 11)::integer
    end,
    case when plan_span is null then null
      else diagnosis_row.started_on + greatest(
        floor(((phase.ord+1) * plan_span)::numeric / 11)::integer - 1,
        floor((phase.ord * plan_span)::numeric / 11)::integer
      )
    end,
    case when diagnosis_row.current_megaphase_code=phase.code
      then coalesce(diagnosis_row.started_on::timestamptz,timezone('utc',now()))
      else null
    end,
    case when diagnosis_row.current_megaphase_code=phase.code then 'in_progress' else 'planned' end,
    case when diagnosis_row.current_megaphase_code=phase.code then 'high' else 'medium' end,
    0,
    jsonb_build_object(
      'execution_structure','skda_megaphase',
      'diagnosis_id',diagnosis_row.id,
      'diagnosis_code',diagnosis_row.code,
      'display_order',phase.ord,
      'work_pattern',phase.work_pattern,
      'expected_deliverables',phase.deliverables,
      'responsible_user_id',diagnosis_row.lead_user_id,
      'lb0_source',case when baseline_span is null then 'pending_service_order' else 'service_order' end,
      'current_plan_source',case when plan_span is null then 'pending' else 'journey_configuration' end
    ),
    coalesce(auth.uid(),diagnosis_row.created_by),
    coalesce(auth.uid(),diagnosis_row.updated_by,diagnosis_row.created_by)
  from (
    values
      (0,'MF0','Constituição e abertura','Abertura governada, kickoff, escopo, papéis e critérios de aplicação.','["Termo de abertura","Escopo validado","Papéis e governança"]'::jsonb),
      (1,'MF1','Intake e inventário','Coleta progressiva, inventário de fontes e registro explícito de lacunas.','["Dossiê de entrada","Inventário de fontes","Mapa de lacunas documentais"]'::jsonb),
      (2,'MF2','Canonização documental','Organizar fontes, versões, autoridade documental e relação questão-evidência.','["Fontes classificadas","Matriz questão-evidência","Pendências de comprovação"]'::jsonb),
      (3,'MF3','Histórico e pré-diagnóstico','Construir linha histórica, hipóteses, recorrências e pontos a aprofundar.','["Linha histórica","Hipóteses de diagnóstico","Roteiro de aprofundamento"]'::jsonb),
      (4,'MF4','Entrevistas Governança','Escuta orientada, confronto de hipóteses e coleta de evidências de Governança.','["Entrevistas de Governança","Registros de evidências","Questões a validar"]'::jsonb),
      (5,'MF5','Entrevistas Gestão','Escuta orientada, confronto de hipóteses e coleta de evidências de Gestão.','["Entrevistas de Gestão","Registros de evidências","Questões a validar"]'::jsonb),
      (6,'MF6','Evidências, PDCL e maturidade','Avaliar suficiência das evidências, prática gerencial, PDCL e nível de maturidade.','["Avaliação de suficiência","Práticas e padrões de trabalho","Maturidade evidenciada"]'::jsonb),
      (7,'MF7','Diagnóstico integrado','Consolidar fatos, evidências, divergências, riscos, forças, oportunidades e lacunas.','["Diagnóstico integrado","Forças e lacunas","Riscos e oportunidades"]'::jsonb),
      (8,'MF8','Priorização 80/20','Priorizar poucas ações de maior impacto sem impedir antecipações deliberadas.','["Matriz de priorização","Ações 80/20","Impacto potencial estimado"]'::jsonb),
      (9,'MF9','Plano por ciclos','Organizar ações aprovadas nos Ciclos 1, 2 e 3 com origem e decisão rastreáveis.','["Plano de Ação por ciclos","Responsáveis e prazos","Fatos geradores rastreáveis"]'::jsonb),
      (10,'MF10','Devolutiva e integração','Validar entendimento, pactuar evolução e integrar ações aos demais módulos SPARKs.','["Devolutiva executiva","Decisões validadas","Integrações e próximos passos"]'::jsonb)
  ) as phase(ord,code,title,work_pattern,deliverables)
  on conflict (initiative_id,code) do update set
    name=excluded.name,
    description=excluded.description,
    source_module_code='SK-DA',
    source_reference=excluded.source_reference,
    baseline_start_date=coalesce(public.sparks_initiative_actions.baseline_start_date,excluded.baseline_start_date),
    baseline_due_date=coalesce(public.sparks_initiative_actions.baseline_due_date,excluded.baseline_due_date),
    planned_start_date=coalesce(public.sparks_initiative_actions.planned_start_date,excluded.planned_start_date),
    planned_due_date=coalesce(public.sparks_initiative_actions.planned_due_date,excluded.planned_due_date),
    metadata=public.sparks_initiative_actions.metadata || excluded.metadata,
    updated_by=excluded.updated_by,
    updated_at=timezone('utc',now());

  update public.sparks_initiatives
  set
    baseline_start_date=coalesce(baseline_start_date,service_order_start),
    baseline_target_end_date=coalesce(baseline_target_end_date,service_order_end),
    start_date=coalesce(start_date,diagnosis_row.started_on),
    target_end_date=coalesce(target_end_date,diagnosis_row.planned_end_on),
    metadata=metadata || jsonb_build_object(
      'execution_structure','skda_journey_project',
      'diagnosis_id',diagnosis_row.id,
      'lb0_source',case when baseline_span is null then 'pending_service_order' else 'service_order' end
    ),
    updated_at=timezone('utc',now())
  where id=diagnosis_row.execution_initiative_id
    and organization_id=diagnosis_row.organization_id;
end;
$function$;

revoke all on function public.ensure_skda_journey_eap(uuid) from public,anon,authenticated;
grant execute on function public.ensure_skda_journey_eap(uuid) to service_role;


create or replace function public.sync_skda_journey_eap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.execution_initiative_id is not null then
    perform public.ensure_skda_journey_eap(new.id);
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_skda_sync_journey_eap on public.skda_diagnoses;

create trigger trg_skda_sync_journey_eap
after insert or update of execution_initiative_id,started_on,planned_end_on,lead_user_id,current_megaphase_code,metadata
on public.skda_diagnoses
for each row
execute function public.sync_skda_journey_eap();


-- Backfill controlado de Projetos para Jornadas criadas antes da regra automática.
do $block$
declare
  diagnosis_row record;
  category_id uuid;
  v_initiative_id uuid;
begin
  for diagnosis_row in
    select *
    from public.skda_diagnoses
    where archived_at is null
      and execution_initiative_id is null
  loop
    select dv.id
      into category_id
    from public.sparks_domain_values dv
    join public.sparks_domains d on d.id=dv.domain_id
    where d.code='INITIATIVE_CATEGORY'
      and d.active
      and dv.active
      and dv.code='transformation'
      and (
        (d.scope_type='global' and d.organization_id is null and d.module_code is null)
        or
        (d.scope_type='organization' and d.organization_id=diagnosis_row.organization_id)
      )
    order by case when d.scope_type='organization' then 1 else 2 end
    limit 1;

    if category_id is null then
      raise exception 'Categoria transformation não encontrada para a organização %.',diagnosis_row.organization_id;
    end if;

    insert into public.sparks_initiatives (
      organization_id,
      category_id,
      code,
      name,
      description,
      initiative_class,
      status,
      priority,
      criticality,
      proposal_origin,
      source_module_code,
      proposal_source_reference,
      validation_status,
      start_date,
      target_end_date,
      progress,
      risk_level,
      health_status,
      last_update_at,
      metadata,
      created_by,
      updated_by
    ) values (
      diagnosis_row.organization_id,
      category_id,
      'PROJ-' || diagnosis_row.code,
      'Projeto · ' || diagnosis_row.name,
      coalesce(diagnosis_row.description,'Projeto transversal para condução da Jornada de Diagnóstico Assistido.'),
      'project',
      'proposed',
      'medium',
      'medium',
      'organization',
      'SK-DA',
      'skda_diagnosis:' || diagnosis_row.id::text,
      'not_required',
      diagnosis_row.started_on,
      diagnosis_row.planned_end_on,
      0,
      'not_assessed',
      'not_assessed',
      timezone('utc',now()),
      jsonb_build_object(
        'execution_structure','skda_journey_project',
        'diagnosis_id',diagnosis_row.id,
        'backfilled',true
      ),
      diagnosis_row.created_by,
      diagnosis_row.updated_by
    )
    returning id into v_initiative_id;

    insert into public.sparks_initiative_origins (
      initiative_id,organization_id,source_module_code,source_entity_type,
      source_entity_id,source_reference,trigger_type,impact_level,
      contribution_weight,is_primary,rationale,metadata,created_by,updated_by
    ) values (
      v_initiative_id,diagnosis_row.organization_id,'SK-DA','skda_diagnosis',
      diagnosis_row.id,diagnosis_row.code,'diagnosis_journey','not_assessed',
      0,true,'Projeto criado automaticamente para executar a Jornada DA.',
      jsonb_build_object('diagnosis_code',diagnosis_row.code,'backfilled',true),
      diagnosis_row.created_by,diagnosis_row.updated_by
    );

    insert into public.sparks_initiative_execution_profiles (
      initiative_id,organization_id,primary_model_code,enabled_capabilities,
      configuration,created_by,updated_by
    ) values (
      v_initiative_id,diagnosis_row.organization_id,'project_management',
      '["kanban","5w2w","risks"]'::jsonb,
      jsonb_build_object('source','SK-DA','diagnosis_id',diagnosis_row.id,'automatic_project',true),
      diagnosis_row.created_by,diagnosis_row.updated_by
    )
    on conflict (initiative_id) do update set
      primary_model_code='project_management',
      enabled_capabilities=excluded.enabled_capabilities,
      configuration=public.sparks_initiative_execution_profiles.configuration || excluded.configuration;

    update public.skda_diagnoses
    set execution_initiative_id=v_initiative_id,
        updated_at=timezone('utc',now())
    where id=diagnosis_row.id;
  end loop;
end;
$block$;

-- Garante EAP para todas as Jornadas com Projeto.
select public.ensure_skda_journey_eap(id)
from public.skda_diagnoses
where archived_at is null
  and execution_initiative_id is not null;

commit;
