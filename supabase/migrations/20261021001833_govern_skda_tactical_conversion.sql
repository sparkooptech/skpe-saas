-- Plataforma SPARKs
-- Governanca transversal da conversao SK-DA -> Gestao Tatica.
-- Corrige as classes canonicas, explicita a permissao do modulo e garante
-- atomicidade entre iniciativa, fato gerador e perfil de execucao.

alter table public.sparks_initiatives
  drop constraint if exists sparks_initiatives_class_check;

alter table public.sparks_initiatives
  add constraint sparks_initiatives_class_check
  check (initiative_class = any (array[
    'initiative'::text,
    'program'::text,
    'project'::text,
    'structuring_action'::text,
    'process'::text,
    'sprint'::text,
    'task'::text,
    'work'::text
  ]));

insert into public.module_permissions (
  module_id,
  code,
  name,
  description,
  permission_group,
  active
)
select
  m.id,
  'initiatives.manage',
  'Converter recomendações em iniciativas',
  'Permite transformar recomendações validadas do SK-DA em iniciativas da Gestão Tática com fato gerador rastreável.',
  'initiatives',
  true
from public.modules m
where m.code = 'SK-DA'
on conflict (module_id, code) do update
set
  name = excluded.name,
  description = excluded.description,
  permission_group = excluded.permission_group,
  active = true,
  updated_at = timezone('utc', now());

with grants(role_code, permission_code) as (
  values
    ('administrator', 'initiatives.manage'),
    ('coordinator', 'initiatives.manage')
)
insert into public.role_permissions (
  module_role_id,
  module_permission_id
)
select
  mr.id,
  mp.id
from grants g
join public.modules m
  on m.code = 'SK-DA'
join public.module_roles mr
  on mr.module_id = m.id
 and mr.code = g.role_code
join public.module_permissions mp
  on mp.module_id = m.id
 and mp.code = g.permission_code
on conflict do nothing;

create or replace function public.create_sparks_initiative(
  target_organization_id uuid,
  target_initiative_class text,
  target_category_code text,
  target_code text,
  target_name text,
  target_description text default null::text,
  target_priority text default 'medium'::text,
  target_criticality text default 'medium'::text,
  target_responsible_area_id uuid default null::uuid,
  target_parent_initiative_id uuid default null::uuid,
  target_proposal_origin text default 'organization'::text,
  target_source_module_code text default null::text,
  target_proposal_source_reference text default null::text,
  target_strategic_theme text default null::text,
  target_start_date date default null::date,
  target_end_date date default null::date,
  change_reason text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_category_id uuid;
  v_initiative_id uuid;
  v_validation_status text;
  v_new_data jsonb;
begin
  if auth.uid() is null then
    raise exception 'Operacao exige usuario autenticado.'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(change_reason, ''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.organizations organization_row
    where organization_row.id = target_organization_id
  ) then
    raise exception 'Organizacao nao encontrada.'
      using errcode = '22023';
  end if;

  if not public.can_manage_sparks_initiatives(
    target_organization_id,
    target_source_module_code
  ) then
    raise exception 'Acesso negado: o usuario nao pode criar iniciativas nesta organizacao.'
      using errcode = '42501';
  end if;

  if target_initiative_class not in (
    'initiative',
    'program',
    'project',
    'structuring_action',
    'process',
    'sprint',
    'task',
    'work'
  ) then
    raise exception 'Classe de iniciativa invalida.'
      using errcode = '22023';
  end if;

  if target_priority not in ('low','medium','high','critical') then
    raise exception 'Prioridade invalida.'
      using errcode = '22023';
  end if;

  if target_criticality not in ('low','medium','high','critical') then
    raise exception 'Criticidade invalida.'
      using errcode = '22023';
  end if;

  if target_proposal_origin not in (
    'sparks_suggestion',
    'organization',
    'joint_construction',
    'previous_plan',
    'assessment',
    'action_plan',
    'bmc_vpc',
    'benchmark',
    'module',
    'import',
    'integration',
    'legacy'
  ) then
    raise exception 'Origem da iniciativa invalida.'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(target_code, ''))) = 0 then
    raise exception 'Codigo da iniciativa e obrigatorio.'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(target_name, ''))) = 0 then
    raise exception 'Nome da iniciativa e obrigatorio.'
      using errcode = '22023';
  end if;

  if target_start_date is not null
     and target_end_date is not null
     and target_end_date < target_start_date then
    raise exception 'A data de termino-alvo nao pode ser anterior ao inicio.'
      using errcode = '22023';
  end if;

  select dv.id
  into v_category_id
  from public.sparks_domain_values dv
  join public.sparks_domains d
    on d.id = dv.domain_id
  where d.code = 'INITIATIVE_CATEGORY'
    and d.active
    and dv.active
    and dv.code = lower(trim(target_category_code))
    and (
      (
        d.scope_type = 'global'
        and d.organization_id is null
        and d.module_code is null
      )
      or (
        d.scope_type = 'organization'
        and d.organization_id = target_organization_id
      )
    )
  order by
    case when d.scope_type = 'organization' then 1 else 2 end
  limit 1;

  if v_category_id is null then
    raise exception 'Categoria de iniciativa invalida ou inativa para esta organizacao.'
      using errcode = '22023';
  end if;

  if target_parent_initiative_id is not null
     and not exists (
       select 1
       from public.sparks_initiatives parent
       where parent.id = target_parent_initiative_id
         and parent.organization_id = target_organization_id
         and parent.archived_at is null
     ) then
    raise exception 'Iniciativa-pai invalida para esta organizacao.'
      using errcode = '22023';
  end if;

  v_validation_status :=
    case
      when target_proposal_origin = 'organization'
        then 'not_required'
      else 'pending_validation'
    end;

  insert into public.sparks_initiatives (
    organization_id,
    parent_initiative_id,
    category_id,
    responsible_area_id,
    code,
    name,
    description,
    initiative_class,
    status,
    priority,
    criticality,
    strategic_theme,
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
    created_by,
    updated_by
  )
  values (
    target_organization_id,
    target_parent_initiative_id,
    v_category_id,
    target_responsible_area_id,
    trim(target_code),
    trim(target_name),
    nullif(trim(target_description), ''),
    target_initiative_class,
    'proposed',
    target_priority,
    target_criticality,
    nullif(trim(target_strategic_theme), ''),
    target_proposal_origin,
    nullif(upper(trim(target_source_module_code)), ''),
    nullif(trim(target_proposal_source_reference), ''),
    v_validation_status,
    target_start_date,
    target_end_date,
    0,
    'not_assessed',
    'not_assessed',
    timezone('utc', now()),
    auth.uid(),
    auth.uid()
  )
  returning id into v_initiative_id;

  select to_jsonb(si)
  into v_new_data
  from public.sparks_initiatives si
  where si.id = v_initiative_id;

  insert into public.sparks_initiative_audit (
    organization_id,
    initiative_id,
    actor_user_id,
    source_module_code,
    action_code,
    change_reason,
    previous_data,
    new_data
  )
  values (
    target_organization_id,
    v_initiative_id,
    auth.uid(),
    nullif(upper(trim(target_source_module_code)), ''),
    'initiative.created',
    trim(change_reason),
    null,
    v_new_data
  );

  return v_initiative_id;
end;
$function$;

create or replace function public.create_skda_tactical_initiative(
  target_organization_id uuid,
  target_finding_id uuid,
  target_initiative_class text,
  target_category_code text,
  target_code text,
  target_name text,
  target_description text default null::text,
  target_priority text default 'medium'::text,
  target_criticality text default 'medium'::text,
  target_primary_model_code text default 'task'::text,
  target_impact_level text default 'not_assessed'::text,
  target_contribution_weight numeric default 100,
  target_enabled_capabilities jsonb default '[]'::jsonb,
  target_change_reason text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_finding public.skda_findings%rowtype;
  v_initiative_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Operacao exige usuario autenticado.'
      using errcode = '42501';
  end if;

  if not public.has_module_permission(
    target_organization_id,
    'SK-DA',
    'initiatives.manage'
  ) then
    raise exception 'Acesso negado: usuario sem permissao para converter recomendacoes em iniciativas.'
      using errcode = '42501';
  end if;

  select finding.*
  into v_finding
  from public.skda_findings finding
  where finding.id = target_finding_id
    and finding.organization_id = target_organization_id;

  if not found then
    raise exception 'Achado nao encontrado para esta organizacao.'
      using errcode = '22023';
  end if;

  if v_finding.status <> 'accepted' then
    raise exception 'A recomendacao precisa estar aceita antes da conversao em iniciativa.'
      using errcode = '22023';
  end if;

  if nullif(trim(v_finding.recommendation), '') is null then
    raise exception 'O achado precisa possuir uma recomendacao antes da conversao.'
      using errcode = '22023';
  end if;

  if target_primary_model_code not in (
    'project_management',
    'sipoc',
    'sprint',
    'task',
    'custom'
  ) then
    raise exception 'Modelo primario de execucao invalido.'
      using errcode = '22023';
  end if;

  if target_impact_level not in (
    'not_assessed',
    'low',
    'medium',
    'high',
    'critical'
  ) then
    raise exception 'Nivel de impacto invalido.'
      using errcode = '22023';
  end if;

  if target_contribution_weight < 0
     or target_contribution_weight > 100 then
    raise exception 'Peso de contribuicao deve estar entre 0 e 100.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(target_enabled_capabilities) <> 'array' then
    raise exception 'Capacidades habilitadas devem ser informadas como array JSON.'
      using errcode = '22023';
  end if;

  if length(trim(coalesce(target_change_reason, ''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.'
      using errcode = '22023';
  end if;

  v_initiative_id := public.create_sparks_initiative(
    target_organization_id,
    target_initiative_class,
    target_category_code,
    target_code,
    target_name,
    coalesce(
      nullif(trim(target_description), ''),
      v_finding.recommendation
    ),
    target_priority,
    target_criticality,
    null,
    null,
    'assessment',
    'SK-DA',
    'skda_finding:' || target_finding_id::text,
    null,
    null,
    null,
    target_change_reason
  );

  insert into public.sparks_initiative_origins (
    initiative_id,
    organization_id,
    source_module_code,
    source_entity_type,
    source_entity_id,
    source_reference,
    trigger_type,
    impact_level,
    contribution_weight,
    is_primary,
    rationale,
    metadata,
    created_by,
    updated_by
  )
  values (
    v_initiative_id,
    target_organization_id,
    'SK-DA',
    'skda_finding',
    target_finding_id,
    'diagnosis:' || v_finding.diagnosis_id::text,
    'diagnostic_recommendation',
    target_impact_level,
    target_contribution_weight,
    true,
    v_finding.recommendation,
    jsonb_build_object(
      'diagnosis_id', v_finding.diagnosis_id,
      'finding_type', v_finding.finding_type,
      'finding_priority', v_finding.priority
    ),
    auth.uid(),
    auth.uid()
  );

  insert into public.sparks_initiative_execution_profiles (
    initiative_id,
    organization_id,
    primary_model_code,
    enabled_capabilities,
    configuration,
    created_by,
    updated_by
  )
  values (
    v_initiative_id,
    target_organization_id,
    target_primary_model_code,
    target_enabled_capabilities,
    jsonb_build_object(
      'source_module_code', 'SK-DA',
      'source_finding_id', target_finding_id
    ),
    auth.uid(),
    auth.uid()
  );

  update public.skda_findings
  set
    status = 'in_action',
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'last_tactical_initiative_id', v_initiative_id,
        'converted_to_tactical_at', timezone('utc', now())
      ),
    updated_at = timezone('utc', now()),
    updated_by = auth.uid()
  where id = target_finding_id
    and organization_id = target_organization_id;

  return v_initiative_id;
end;
$function$;

revoke all
on function public.create_skda_tactical_initiative(
  uuid, uuid, text, text, text, text, text, text, text, text, text, numeric, jsonb, text
)
from public, anon;

grant execute
on function public.create_skda_tactical_initiative(
  uuid, uuid, text, text, text, text, text, text, text, text, text, numeric, jsonb, text
)
to authenticated, service_role;

comment on function public.create_skda_tactical_initiative(
  uuid, uuid, text, text, text, text, text, text, text, text, text, numeric, jsonb, text
) is
  'Converte atomicamente um achado/recomendacao aceita do SK-DA em iniciativa transversal, fato gerador primario e perfil de execucao.';
