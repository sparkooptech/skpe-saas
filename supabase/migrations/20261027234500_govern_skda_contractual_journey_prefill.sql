-- Govern contractual intake as the initial authority for SK-DA journey planning.
-- CNTCOOP OI 227/2026 is reconciled because the previous baseline was produced by a system default,
-- not by a deliberate user replanning decision.

create or replace function public.apply_skda_contractual_schedule(target_diagnosis_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  d public.skda_diagnoses%rowtype;
  schedule jsonb;
  dates date[];
  n integer;
  d1 date;
  d2 date;
  d3 date;
  d4 date;
  d5 date;
  d6 date;
  dlast date;
begin
  select * into d
  from public.skda_diagnoses
  where id=target_diagnosis_id
    and archived_at is null;

  if d.id is null or d.execution_initiative_id is null then
    return;
  end if;

  schedule := d.metadata->'contractual_schedule_proposal';
  if schedule is null or jsonb_typeof(schedule) <> 'array' then
    return;
  end if;

  select array_agg(x.dt order by x.dt)
    into dates
  from (
    select distinct (item->>'date')::date as dt
    from jsonb_array_elements(schedule) item
    where coalesce(item->>'date','') ~ '^\d{4}-\d{2}-\d{2}$'
  ) x;

  n := coalesce(array_length(dates,1),0);
  if n = 0 then
    return;
  end if;

  d1 := dates[1];
  d2 := dates[least(2,n)];
  d3 := dates[least(3,n)];
  d4 := dates[least(4,n)];
  d5 := dates[least(5,n)];
  d6 := dates[least(6,n)];
  dlast := dates[n];

  update public.sparks_initiatives
  set
    baseline_start_date=coalesce(baseline_start_date,d1),
    baseline_target_end_date=coalesce(baseline_target_end_date,dlast),
    start_date=coalesce(d.started_on,d1),
    target_end_date=coalesce(d.planned_end_on,dlast),
    metadata=metadata || jsonb_build_object(
      'contractual_baseline_expected_start',d1,
      'contractual_baseline_expected_end',dlast,
      'current_plan_source','contractual_schedule',
      'contractual_schedule_applied_at',timezone('utc',now())
    ),
    updated_at=timezone('utc',now())
  where id=d.execution_initiative_id
    and organization_id=d.organization_id;

  update public.sparks_initiative_actions a
  set
    planned_start_date = case a.code
      when 'MF0' then d1
      when 'MF1' then d1
      when 'MF2' then d1
      when 'MF3' then d2
      when 'MF4' then d3
      when 'MF5' then case when n >= 6 then d5 else d4 end
      when 'MF6' then d3
      when 'MF7' then case when n >= 6 then d6 else dlast end
      when 'MF8' then case when n >= 6 then d6 else dlast end
      when 'MF9' then dlast
      when 'MF10' then dlast
      else a.planned_start_date
    end,
    planned_due_date = case a.code
      when 'MF0' then d1
      when 'MF1' then d2
      when 'MF2' then d2
      when 'MF3' then d3
      when 'MF4' then case when n >= 4 then d4 else d3 end
      when 'MF5' then case when n >= 6 then d6 else dlast end
      when 'MF6' then case when n >= 6 then d6 else dlast end
      when 'MF7' then dlast
      when 'MF8' then dlast
      when 'MF9' then dlast
      when 'MF10' then dlast
      else a.planned_due_date
    end,
    metadata=a.metadata || jsonb_build_object(
      'contractual_baseline_expected',true,
      'current_plan_source','contractual_schedule',
      'legacy_lb0_preserved',true
    ),
    updated_at=timezone('utc',now())
  where a.organization_id=d.organization_id
    and a.initiative_id=d.execution_initiative_id
    and a.parent_action_id is null
    and a.code in ('MF0','MF1','MF2','MF3','MF4','MF5','MF6','MF7','MF8','MF9','MF10')
    and a.archived_at is null;

  update public.sparks_initiative_actions child
  set
    planned_start_date=parent.planned_start_date,
    planned_due_date=parent.planned_due_date,
    metadata=child.metadata || jsonb_build_object(
      'contractual_baseline_expected','from_parent_plan',
      'current_plan_source','contractual_schedule',
      'legacy_lb0_preserved',true
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

create or replace function public.sync_skda_contractual_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.execution_initiative_id is not null
     and new.metadata->'contractual_schedule_proposal' is not null
     and (
       tg_op='INSERT'
       or old.metadata->'contractual_schedule_proposal' is distinct from new.metadata->'contractual_schedule_proposal'
     ) then
    perform public.apply_skda_contractual_schedule(new.id);
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_skda_zz_contractual_schedule on public.skda_diagnoses;
create trigger trg_skda_zz_contractual_schedule
after insert or update of metadata
on public.skda_diagnoses
for each row
execute function public.sync_skda_contractual_schedule();

do $block$
declare
  v_org_id uuid;
  v_diagnosis_id uuid;
  v_profile_id uuid;
  v_lead_id uuid;
  v_schedule jsonb;
  v_scope text;
  v_methodology text;
begin
  select id into v_org_id
  from public.organizations
  where upper(coalesce(code,''))='CNTCOOP'
     or upper(coalesce(legal_name,'')) like '%CNTCOOP%'
     or upper(coalesce(trade_name,'')) like '%CNTCOOP%'
  order by created_at
  limit 1;

  if v_org_id is null then
    raise notice 'CNTCOOP not found; reconciliation skipped.';
    return;
  end if;

  select id into v_diagnosis_id
  from public.skda_diagnoses
  where organization_id=v_org_id
    and reference_year=2026
    and archived_at is null
  order by created_at desc
  limit 1;

  if v_diagnosis_id is null then
    raise notice 'CNTCOOP 2026 journey not found; reconciliation skipped.';
    return;
  end if;

  select p.id into v_profile_id
  from public.profiles p
  where p.active
    and lower(p.email)=lower('ricardo.rodrigues@sparkoop.com')
  order by p.created_at
  limit 1;

  if v_profile_id is null then
    raise exception 'Perfil ativo ricardo.rodrigues@sparkoop.com não encontrado; reconciliação de liderança abortada.';
  end if;

  update public.profiles
  set
    full_name=case when nullif(trim(full_name),'') is null or lower(trim(full_name))='ricardo' then 'Ricardo Rodrigues' else full_name end,
    display_name=case when nullif(trim(display_name),'') is null or lower(trim(display_name))='ricardo' then 'Ricardo Rodrigues' else display_name end,
    updated_at=timezone('utc',now())
  where id=v_profile_id;

  insert into public.organization_memberships (
    organization_id,user_id,status,is_organization_admin,job_title,valid_from,valid_until,activated_at
  )
  values (
    v_org_id,v_profile_id,'active',false,'Líder SPARKOOP · Diagnóstico Assistido',timezone('utc',now()),null,timezone('utc',now())
  )
  on conflict (organization_id,user_id) do nothing;

  select p.id into v_lead_id
  from public.organization_memberships m
  join public.profiles p on p.id=m.user_id
  where m.organization_id=v_org_id
    and m.user_id=v_profile_id
    and m.status='active'
    and (m.valid_until is null or m.valid_until >= timezone('utc',now()))
  limit 1;

  if v_lead_id is null then
    raise exception 'Ricardo Rodrigues existe, mas o vínculo CNTCOOP não está ativo; nenhuma reativação automática foi executada.';
  end if;

  v_schedule := jsonb_build_array(
    jsonb_build_object('date','2026-10-19','start','18:00','durationHours',2,'location','Off-line / preparação'),
    jsonb_build_object('date','2026-10-24','start','08:00','durationHours',1,'location','Off-line / ajuste'),
    jsonb_build_object('date','2026-10-26','start','08:00','durationHours',4,'location','Microsoft Teams'),
    jsonb_build_object('date','2026-10-27','start','14:00','durationHours',4,'location','Microsoft Teams'),
    jsonb_build_object('date','2026-10-28','start','14:00','durationHours',4,'location','Microsoft Teams'),
    jsonb_build_object('date','2026-10-29','start','14:00','durationHours',4,'location','Microsoft Teams'),
    jsonb_build_object('date','2026-10-31','start','08:00','durationHours',6,'location','Off-line / consolidação')
  );

  v_scope := 'Realizar a Jornada de Diagnóstico Assistido da CNTCOOP no ciclo 2026, com base no PDGC/Avaliacoop, integrando Autoavaliação, histórico dos ciclos, evidências organizacionais e entrevistas de Governança e Gestão para consolidar achados rastreáveis, prioridades 80×20, Plano de Ação e devolutiva.';

  v_methodology := 'Conduzir o Diagnóstico Assistido como processo de desenvolvimento organizacional, não como auditoria; utilizar a Autoavaliação vigente como baseline declarado e os ciclos anteriores como linha histórica; aprofundar Governança antes de Gestão, questão a questão; confrontar declarações com evidências; distinguir hipóteses de achados; avaliar existência, implantação, recorrência, abrangência, controle, resultados e aprendizado; registrar confiança e lacunas; tratar impacto de pontuação somente como potencial estimado e condicionado às evidências.';

  update public.skda_diagnoses
  set
    started_on='2026-10-19'::date,
    planned_end_on='2026-10-31'::date,
    lead_user_id=coalesce(v_lead_id,lead_user_id),
    metadata=metadata
      || jsonb_build_object(
        'scope_statement',v_scope,
        'methodology_notes',v_methodology,
        'contracted_hours',25,
        'contractual_schedule_proposal',v_schedule,
        'contractual_intake_status','baseline_validated',
        'contractual_baseline_status','validated',
        'contract_period_constraint',jsonb_build_object('started_on','2026-10-19','planned_end_on','2026-10-31'),
        'contractual_baseline_reconciled_at',timezone('utc',now()),
        'eap_legacy_baseline_preserved',true,
        'contractual_baseline_reconciliation_reason','A LB0 histórica anterior foi preservada pela governança de imutabilidade; o plano vigente foi reconciliado à OI 227/2026, que prevalece como fonte contratual.'
      ),
    updated_at=timezone('utc',now())
  where id=v_diagnosis_id;

  perform public.apply_skda_contractual_schedule(v_diagnosis_id);

  raise notice 'CNTCOOP contractual baseline reconciled: journey %, lead %, period 2026-10-19..2026-10-31.',v_diagnosis_id,v_lead_id;
end;
$block$;

comment on function public.apply_skda_contractual_schedule(uuid) is
  'Aplica a agenda contratual da Jornada DA como LB0 do Projeto/EAP e datas iniciais das MegaFases, etapas e entregáveis, preservando a possibilidade de replanejamento posterior.';
