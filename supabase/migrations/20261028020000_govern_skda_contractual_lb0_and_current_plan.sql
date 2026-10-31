begin;

-- Preserve the first contractual agenda as LB0 and keep later schedule changes as current plan.
create or replace function public.capture_skda_contractual_baseline_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.metadata->'contractual_baseline_schedule' is null
     and new.metadata->'contractual_schedule_proposal' is not null
     and jsonb_typeof(new.metadata->'contractual_schedule_proposal')='array' then
    new.metadata := jsonb_set(
      coalesce(new.metadata,'{}'::jsonb),
      '{contractual_baseline_schedule}',
      new.metadata->'contractual_schedule_proposal',
      true
    );
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_skda_za_capture_contractual_lb0 on public.skda_diagnoses;
create trigger trg_skda_za_capture_contractual_lb0
before insert or update of metadata
on public.skda_diagnoses
for each row
execute function public.capture_skda_contractual_baseline_schedule();

-- Keep the transverse baseline guard, but allow one governed initialization for SK-DA
-- when the action was created without LB0 and the contractual schedule is now known.
create or replace function public.sparks_protect_initiative_action_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  skda_contractual_baseline_initialization boolean;
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'A organizacao da acao e imutavel.'
      using errcode = '22023';
  end if;

  if new.initiative_id is distinct from old.initiative_id then
    raise exception 'A iniciativa pai da acao e imutavel.'
      using errcode = '22023';
  end if;

  if new.source_module_code is distinct from old.source_module_code then
    raise exception 'O modulo de origem da acao e imutavel.'
      using errcode = '22023';
  end if;

  skda_contractual_baseline_initialization :=
    old.source_module_code='SK-DA'
    and new.source_module_code='SK-DA'
    and new.metadata->>'lb0_source' in ('contractual_schedule','parent_contractual_schedule')
    and (
      (old.baseline_start_date is null and new.baseline_start_date is not null)
      or new.baseline_start_date is not distinct from old.baseline_start_date
    )
    and (
      (old.baseline_due_date is null and new.baseline_due_date is not null)
      or new.baseline_due_date is not distinct from old.baseline_due_date
    );

  if (
    new.baseline_start_date is distinct from old.baseline_start_date
    or new.baseline_due_date is distinct from old.baseline_due_date
  ) and not skda_contractual_baseline_initialization then
    raise exception 'A baseline original da acao e imutavel.'
      using errcode = '22023';
  end if;

  return new;
end;
$function$;

create or replace function public.apply_skda_contractual_schedule(target_diagnosis_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  d public.skda_diagnoses%rowtype;
  baseline_schedule jsonb;
  plan_schedule jsonb;
  baseline_dates date[];
  plan_dates date[];
  nb integer;
  np integer;
  b1 date; b2 date; b3 date; b4 date; b5 date; b6 date; blast date;
  p1 date; p2 date; p3 date; p4 date; p5 date; p6 date; plast date;
begin
  select * into d
  from public.skda_diagnoses
  where id=target_diagnosis_id
    and archived_at is null;

  if d.id is null or d.execution_initiative_id is null then
    return;
  end if;

  plan_schedule := d.metadata->'contractual_schedule_proposal';
  baseline_schedule := coalesce(
    d.metadata->'contractual_baseline_schedule',
    plan_schedule
  );

  if plan_schedule is null or jsonb_typeof(plan_schedule) <> 'array' then
    return;
  end if;
  if baseline_schedule is null or jsonb_typeof(baseline_schedule) <> 'array' then
    baseline_schedule := plan_schedule;
  end if;

  select array_agg(x.dt order by x.dt)
    into baseline_dates
  from (
    select distinct (item->>'date')::date as dt
    from jsonb_array_elements(baseline_schedule) item
    where coalesce(item->>'date','') ~ '^\d{4}-\d{2}-\d{2}$'
  ) x;

  select array_agg(x.dt order by x.dt)
    into plan_dates
  from (
    select distinct (item->>'date')::date as dt
    from jsonb_array_elements(plan_schedule) item
    where coalesce(item->>'date','') ~ '^\d{4}-\d{2}-\d{2}$'
  ) x;

  nb := coalesce(array_length(baseline_dates,1),0);
  np := coalesce(array_length(plan_dates,1),0);
  if nb=0 or np=0 then
    return;
  end if;

  b1:=baseline_dates[1];
  b2:=baseline_dates[least(2,nb)];
  b3:=baseline_dates[least(3,nb)];
  b4:=baseline_dates[least(4,nb)];
  b5:=baseline_dates[least(5,nb)];
  b6:=baseline_dates[least(6,nb)];
  blast:=baseline_dates[nb];

  p1:=plan_dates[1];
  p2:=plan_dates[least(2,np)];
  p3:=plan_dates[least(3,np)];
  p4:=plan_dates[least(4,np)];
  p5:=plan_dates[least(5,np)];
  p6:=plan_dates[least(6,np)];
  plast:=plan_dates[np];

  update public.sparks_initiatives
  set
    baseline_start_date=case
      when metadata->>'lb0_source'='contractual_schedule' and baseline_start_date is not null
        then baseline_start_date
      else b1
    end,
    baseline_target_end_date=case
      when metadata->>'lb0_source'='contractual_schedule' and baseline_target_end_date is not null
        then baseline_target_end_date
      else blast
    end,
    start_date=coalesce(d.started_on,p1),
    target_end_date=coalesce(d.planned_end_on,plast),
    metadata=metadata || jsonb_build_object(
      'lb0_source','contractual_schedule',
      'contractual_baseline_expected_start',b1,
      'contractual_baseline_expected_end',blast,
      'current_plan_source','contractual_schedule',
      'contractual_schedule_applied_at',timezone('utc',now())
    ),
    updated_at=timezone('utc',now())
  where id=d.execution_initiative_id
    and organization_id=d.organization_id;

  update public.sparks_initiative_actions a
  set
    baseline_start_date=case
      when a.metadata->>'lb0_source'='contractual_schedule' and a.baseline_start_date is not null
        then a.baseline_start_date
      else case a.code
      when 'MF0' then b1 when 'MF1' then b1 when 'MF2' then b1
      when 'MF3' then b2 when 'MF4' then b3
      when 'MF5' then case when nb>=6 then b5 else b4 end
      when 'MF6' then b3
      when 'MF7' then case when nb>=6 then b6 else blast end
      when 'MF8' then case when nb>=6 then b6 else blast end
      when 'MF9' then blast when 'MF10' then blast
      else a.baseline_start_date end
    end,
    baseline_due_date=case
      when a.metadata->>'lb0_source'='contractual_schedule' and a.baseline_due_date is not null
        then a.baseline_due_date
      else case a.code
      when 'MF0' then b1 when 'MF1' then b2 when 'MF2' then b2
      when 'MF3' then b3
      when 'MF4' then case when nb>=4 then b4 else b3 end
      when 'MF5' then case when nb>=6 then b6 else blast end
      when 'MF6' then case when nb>=6 then b6 else blast end
      when 'MF7' then blast when 'MF8' then blast
      when 'MF9' then blast when 'MF10' then blast
      else a.baseline_due_date end
    end,
    planned_start_date=case a.code
      when 'MF0' then p1 when 'MF1' then p1 when 'MF2' then p1
      when 'MF3' then p2 when 'MF4' then p3
      when 'MF5' then case when np>=6 then p5 else p4 end
      when 'MF6' then p3
      when 'MF7' then case when np>=6 then p6 else plast end
      when 'MF8' then case when np>=6 then p6 else plast end
      when 'MF9' then plast when 'MF10' then plast
      else a.planned_start_date end,
    planned_due_date=case a.code
      when 'MF0' then p1 when 'MF1' then p2 when 'MF2' then p2
      when 'MF3' then p3
      when 'MF4' then case when np>=4 then p4 else p3 end
      when 'MF5' then case when np>=6 then p6 else plast end
      when 'MF6' then case when np>=6 then p6 else plast end
      when 'MF7' then plast when 'MF8' then plast
      when 'MF9' then plast when 'MF10' then plast
      else a.planned_due_date end,
    metadata=a.metadata || jsonb_build_object(
      'lb0_source','contractual_schedule',
      'current_plan_source','contractual_schedule',
      'lb0_immutable',true
    ),
    updated_at=timezone('utc',now())
  where a.organization_id=d.organization_id
    and a.initiative_id=d.execution_initiative_id
    and a.parent_action_id is null
    and a.code in ('MF0','MF1','MF2','MF3','MF4','MF5','MF6','MF7','MF8','MF9','MF10')
    and a.archived_at is null;

  update public.sparks_initiative_actions child
  set
    baseline_start_date=coalesce(child.baseline_start_date,parent.baseline_start_date),
    baseline_due_date=coalesce(child.baseline_due_date,parent.baseline_due_date),
    planned_start_date=parent.planned_start_date,
    planned_due_date=parent.planned_due_date,
    metadata=child.metadata || jsonb_build_object(
      'lb0_source','parent_contractual_schedule',
      'current_plan_source','parent_contractual_schedule',
      'lb0_immutable',true
    ),
    updated_at=timezone('utc',now())
  from public.sparks_initiative_actions parent
  where child.organization_id=d.organization_id
    and child.initiative_id=d.execution_initiative_id
    and child.parent_action_id=parent.id
    and parent.parent_action_id is null
    and child.archived_at is null
    and parent.archived_at is null;

  update public.sparks_methodology_artifacts art
  set
    planned_due_date=parent.planned_due_date,
    metadata=art.metadata || jsonb_build_object('plan_source','contractual_schedule'),
    updated_at=timezone('utc',now())
  from public.sparks_initiative_actions parent
  where art.organization_id=d.organization_id
    and art.project_id=d.execution_initiative_id
    and art.module_code='SK-DA'
    and art.macrophase_code=parent.code
    and parent.organization_id=d.organization_id
    and parent.initiative_id=d.execution_initiative_id
    and parent.parent_action_id is null
    and parent.archived_at is null;
end;
$function$;

revoke all on function public.apply_skda_contractual_schedule(uuid) from public,anon,authenticated;
grant execute on function public.apply_skda_contractual_schedule(uuid) to service_role;

-- CNTCOOP: capture the already validated OI 227/2026 agenda as immutable LB0,
-- then reconcile action-level baseline dates without changing current plan semantics.
do $block$
declare
  v_diagnosis_id uuid := '79f8b0dc-371e-4483-bfad-542cdbb37724';
begin
  update public.skda_diagnoses
  set metadata=jsonb_set(
        metadata,
        '{contractual_baseline_schedule}',
        metadata->'contractual_schedule_proposal',
        true
      ),
      updated_at=timezone('utc',now())
  where id=v_diagnosis_id
    and metadata->'contractual_schedule_proposal' is not null
    and metadata->'contractual_baseline_schedule' is null;

  perform public.apply_skda_contractual_schedule(v_diagnosis_id);
end;
$block$;

comment on function public.capture_skda_contractual_baseline_schedule() is
'Captura a primeira agenda contratual estruturada como LB0 imutável da Jornada SK-DA.';

comment on function public.apply_skda_contractual_schedule(uuid) is
'Aplica LB0 contratual sem sobrescrevê-la e mantém o plano vigente da EAP sincronizado com a agenda ratificada.';

-- Reconcile existing SK-DA evidence correlations into checklist groups without duplicating Core assets.
-- Only deterministic evidence-type mappings are promoted; everything else falls back to complementary.
update public.skda_evidence_correlations correlation
set
  metadata = coalesce(correlation.metadata,'{}'::jsonb) || jsonb_build_object(
    'checklist_group_code',case evidence.evidence_type
      when 'self_assessment' then 'autoavaliacao'
      when 'assisted_diagnosis' then 'complementar'
      when 'action_plan' then 'planos-acao'
      when 'interview' then 'entrevistas'
      when 'audio' then 'entrevistas'
      when 'video' then 'entrevistas'
      else 'complementar'
    end,
    'checklist_group_title',case evidence.evidence_type
      when 'self_assessment' then 'Autoavaliação vigente'
      when 'action_plan' then 'Planos de ação e acompanhamento'
      when 'interview' then 'Entrevistas e verificações'
      when 'audio' then 'Entrevistas e verificações'
      when 'video' then 'Entrevistas e verificações'
      else 'Outras evidências'
    end,
    'checklist_group_source','evidence_type_reconciliation'
  ),
  updated_at=timezone('utc',now())
from public.sparks_evidence_assets evidence
where evidence.id=correlation.evidence_asset_id
  and evidence.organization_id=correlation.organization_id
  and (
    not (coalesce(correlation.metadata,'{}'::jsonb) ? 'checklist_group_code')
    or nullif(trim(coalesce(correlation.metadata->>'checklist_group_code','')),'') is null
  );

notify pgrst, 'reload schema';

commit;
