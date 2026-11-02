-- SPARKs evidence intake: governed document origins, discovery candidates and human validation.
-- SK-DOC remains document/evidence authority; SK-PE only consumes governed references.
begin;

create table if not exists public.sparks_evidence_intake_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.skpe_projects(id) on delete cascade,
  source_type text not null,
  source_url text not null,
  source_label text not null,
  custodian_module_code text not null default 'SK-DOC',
  consumer_module_code text not null default 'SK-PE',
  connector_mode text not null default 'microsoft_graph',
  include_subfolders boolean not null default true,
  status text not null default 'active',
  scan_status text not null default 'idle',
  last_scan_at timestamptz,
  last_scan_summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint sparks_evidence_intake_sources_type_check
    check (source_type in ('sharepoint','web_url','network_path','other')),
  constraint sparks_evidence_intake_sources_status_check
    check (status in ('active','paused','archived','error')),
  constraint sparks_evidence_intake_sources_scan_status_check
    check (scan_status in ('idle','queued','scanning','review_ready','completed','error')),
  constraint sparks_evidence_intake_sources_label_not_blank
    check (length(trim(source_label)) > 0),
  constraint sparks_evidence_intake_sources_url_not_blank
    check (length(trim(source_url)) > 0)
);

create unique index if not exists sparks_evidence_intake_sources_unique_url
  on public.sparks_evidence_intake_sources(organization_id, source_url)
  where status <> 'archived';
create table if not exists public.sparks_evidence_intake_candidates (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sparks_evidence_intake_sources(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_key text not null,
  external_url text,
  external_path text,
  file_name text not null,
  title text,
  mime_type text,
  file_size_bytes bigint,
  modified_at timestamptz,
  etag text,
  content_hash text,
  extracted_excerpt text,
  analysis_status text not null default 'pending',
  candidate_status text not null default 'discovered',
  relevance_score numeric(5,2),
  suggested_axis_codes text[] not null default '{}'::text[],
  suggested_checklist_item_ids uuid[] not null default '{}'::uuid[],
  suggested_compliance_level integer,
  suggested_evidence_type text not null default 'document',
  suggested_quality_score numeric(5,2),
  suggested_completeness_score numeric(5,2),
  suggested_currentness_score numeric(5,2),
  suggested_reliability_score numeric(5,2),
  suggested_overall_score numeric(5,2),
  analysis jsonb not null default '{}'::jsonb,
  evidence_asset_id uuid references public.sparks_evidence_assets(id) on delete set null,
  reviewed_checklist_item_id uuid references public.skpe_evidence_checklist_items(id) on delete set null,
  reviewed_compliance_level integer,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sparks_evidence_intake_candidates_analysis_status_check
    check (analysis_status in ('pending','analyzing','analyzed','unsupported','error')),
  constraint sparks_evidence_intake_candidates_status_check
    check (candidate_status in ('discovered','proposed','accepted','ignored','duplicate','error')),
  constraint sparks_evidence_intake_candidates_compliance_check
    check (suggested_compliance_level is null or suggested_compliance_level between 0 and 5),
  constraint sparks_evidence_intake_candidates_reviewed_compliance_check
    check (reviewed_compliance_level is null or reviewed_compliance_level between 0 and 5),
  constraint sparks_evidence_intake_candidates_scores_check check (
    (relevance_score is null or relevance_score between 0 and 100)
    and (suggested_quality_score is null or suggested_quality_score between 0 and 100)
    and (suggested_completeness_score is null or suggested_completeness_score between 0 and 100)
    and (suggested_currentness_score is null or suggested_currentness_score between 0 and 100)
    and (suggested_reliability_score is null or suggested_reliability_score between 0 and 100)
    and (suggested_overall_score is null or suggested_overall_score between 0 and 100)
  )
);

create unique index if not exists sparks_evidence_intake_candidates_external_key
  on public.sparks_evidence_intake_candidates(source_id, external_key);

create index if not exists sparks_evidence_intake_candidates_review
  on public.sparks_evidence_intake_candidates(organization_id, candidate_status, relevance_score desc);
alter table public.sparks_evidence_intake_sources enable row level security;
alter table public.sparks_evidence_intake_candidates enable row level security;

drop policy if exists sparks_evidence_intake_sources_select
  on public.sparks_evidence_intake_sources;
create policy sparks_evidence_intake_sources_select
on public.sparks_evidence_intake_sources
for select to authenticated
using (public.can_view_sparks_evidence(organization_id));

drop policy if exists sparks_evidence_intake_sources_manage
  on public.sparks_evidence_intake_sources;
create policy sparks_evidence_intake_sources_manage
on public.sparks_evidence_intake_sources
for all to authenticated
using (public.can_manage_sparks_evidence(organization_id))
with check (public.can_manage_sparks_evidence(organization_id));

drop policy if exists sparks_evidence_intake_candidates_select
  on public.sparks_evidence_intake_candidates;
create policy sparks_evidence_intake_candidates_select
on public.sparks_evidence_intake_candidates
for select to authenticated
using (public.can_view_sparks_evidence(organization_id));

drop policy if exists sparks_evidence_intake_candidates_manage
  on public.sparks_evidence_intake_candidates;
create policy sparks_evidence_intake_candidates_manage
on public.sparks_evidence_intake_candidates
for all to authenticated
using (public.can_manage_sparks_evidence(organization_id))
with check (public.can_manage_sparks_evidence(organization_id));

grant select on public.sparks_evidence_intake_sources to authenticated;
grant select on public.sparks_evidence_intake_candidates to authenticated;
grant all on public.sparks_evidence_intake_sources to service_role;
grant all on public.sparks_evidence_intake_candidates to service_role;

comment on table public.sparks_evidence_intake_sources is
  'Origens documentais governadas pelo SK-DOC para descoberta e intake de evidencias reutilizaveis.';
comment on table public.sparks_evidence_intake_candidates is
  'Documentos descobertos em uma origem; classificacao automatica e sugestoes nao produzem efeito ate validacao humana.';
create or replace function public.register_sparks_evidence_intake_source(
  target_organization_id uuid,
  target_project_id uuid,
  target_source_type text,
  target_source_url text,
  target_source_label text,
  target_include_subfolders boolean default true,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  source_id uuid;
begin
  if not public.can_manage_sparks_evidence(target_organization_id) then
    raise exception 'Acesso administrativo necessario para cadastrar origem documental.' using errcode = '42501';
  end if;
  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode = '22023';
  end if;
  if target_source_type not in ('sharepoint','web_url','network_path','other') then
    raise exception 'Tipo de origem documental invalido.' using errcode = '22023';
  end if;
  if length(trim(coalesce(target_source_url,''))) = 0
     or length(trim(coalesce(target_source_label,''))) = 0 then
    raise exception 'Informe a origem e o nome da fonte documental.' using errcode = '22023';
  end if;
  if target_project_id is not null and not exists (
    select 1 from public.skpe_projects p
    where p.id = target_project_id and p.organization_id = target_organization_id
  ) then
    raise exception 'Projeto nao pertence a organizacao informada.' using errcode = '22023';
  end if;

  insert into public.sparks_evidence_intake_sources (
    organization_id, project_id, source_type, source_url, source_label,
    include_subfolders, connector_mode, status, scan_status,
    metadata, created_by, updated_by
  ) values (
    target_organization_id, target_project_id, target_source_type,
    trim(target_source_url), trim(target_source_label),
    coalesce(target_include_subfolders,true),
    case when target_source_type='sharepoint' then 'microsoft_graph' else 'direct_url' end,
    'active','idle',
    jsonb_build_object('registration_reason',trim(change_reason)),
    auth.uid(),auth.uid()
  )
  on conflict (organization_id, source_url) where status <> 'archived'
  do update set
    project_id = excluded.project_id,
    source_label = excluded.source_label,
    source_type = excluded.source_type,
    include_subfolders = excluded.include_subfolders,
    status = 'active',
    updated_at = timezone('utc',now()),
    updated_by = auth.uid(),
    metadata = public.sparks_evidence_intake_sources.metadata
      || jsonb_build_object('last_registration_reason',trim(change_reason))
  returning id into source_id;

  return source_id;
end;
$function$;

revoke all on function public.register_sparks_evidence_intake_source(uuid,uuid,text,text,text,boolean,text)
  from public,anon;
grant execute on function public.register_sparks_evidence_intake_source(uuid,uuid,text,text,text,boolean,text)
  to authenticated;
create or replace function public.queue_sparks_evidence_intake_scan(
  target_source_id uuid,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  source_row public.sparks_evidence_intake_sources%rowtype;
begin
  select * into source_row
  from public.sparks_evidence_intake_sources
  where id = target_source_id
  for update;

  if source_row.id is null then
    raise exception 'Origem documental nao encontrada.' using errcode = '22023';
  end if;
  if not public.can_manage_sparks_evidence(source_row.organization_id) then
    raise exception 'Sem permissao para varrer esta origem documental.' using errcode = '42501';
  end if;
  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode = '22023';
  end if;

  update public.sparks_evidence_intake_sources
  set scan_status='queued',
      status='active',
      updated_at=timezone('utc',now()),
      updated_by=auth.uid(),
      metadata=metadata || jsonb_build_object('scan_request_reason',trim(change_reason))
  where id=target_source_id;

  return target_source_id;
end;
$function$;

revoke all on function public.queue_sparks_evidence_intake_scan(uuid,text)
  from public,anon;
grant execute on function public.queue_sparks_evidence_intake_scan(uuid,text)
  to authenticated;
create or replace function public.accept_sparks_evidence_intake_candidate(
  target_candidate_id uuid,
  target_project_id uuid,
  target_checklist_item_id uuid default null,
  target_compliance_level integer default null,
  target_quality_score numeric default null,
  target_completeness_score numeric default null,
  target_currentness_score numeric default null,
  target_reliability_score numeric default null,
  target_overall_score numeric default null,
  target_review_notes text default null,
  change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  candidate_row public.sparks_evidence_intake_candidates%rowtype;
  source_row public.sparks_evidence_intake_sources%rowtype;
  asset_id uuid;
  checklist_project_id uuid;
  checklist_org_id uuid;
begin
  select * into candidate_row
  from public.sparks_evidence_intake_candidates
  where id=target_candidate_id
  for update;

  if candidate_row.id is null then
    raise exception 'Candidato de evidencia nao encontrado.' using errcode='22023';
  end if;

  select * into source_row
  from public.sparks_evidence_intake_sources
  where id=candidate_row.source_id;

  if source_row.id is null then
    raise exception 'Origem documental do candidato nao encontrada.' using errcode='22023';
  end if;
  if not public.can_manage_sparks_evidence(source_row.organization_id) then
    raise exception 'Sem permissao para validar esta evidencia.' using errcode='42501';
  end if;
  if length(trim(coalesce(change_reason,''))) < 10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.' using errcode='22023';
  end if;
  if target_compliance_level is not null and target_compliance_level not between 0 and 5 then
    raise exception 'Nivel de atendimento deve estar entre 0 e 5.' using errcode='22023';
  end if;
  if not exists (
    select 1 from public.skpe_projects p
    where p.id=target_project_id and p.organization_id=source_row.organization_id
  ) then
    raise exception 'Projeto nao pertence a organizacao da evidencia.' using errcode='22023';
  end if;

  asset_id := candidate_row.evidence_asset_id;

  if asset_id is null then
    select a.id into asset_id
    from public.sparks_evidence_assets a
    where a.organization_id=source_row.organization_id
      and a.source_external_key=candidate_row.external_key
      and a.archived_at is null
    limit 1;
  end if;
  if asset_id is null then
    insert into public.sparks_evidence_assets (
      organization_id,title,description,evidence_type,source_type,
      origin_module_code,external_origin,reference_date,
      confidentiality_level,validation_status,reliability_level,
      source_external_key,source_locator,metadata,created_by,updated_by
    ) values (
      source_row.organization_id,
      coalesce(nullif(trim(candidate_row.title),''),candidate_row.file_name),
      nullif(candidate_row.analysis->>'summary',''),
      coalesce(candidate_row.suggested_evidence_type,'document'),
      'external',
      'SK-DOC',
      case
        when source_row.source_type='sharepoint' then 'SharePoint'
        when source_row.source_type='web_url' then 'URL externa'
        else source_row.source_label
      end,
      candidate_row.modified_at::date,
      'internal',
      'under_review',
      'not_assessed',
      candidate_row.external_key,
      jsonb_strip_nulls(jsonb_build_object(
        'source_id',source_row.id,
        'source_type',source_row.source_type,
        'source_url',source_row.source_url,
        'external_url',candidate_row.external_url,
        'external_path',candidate_row.external_path,
        'etag',candidate_row.etag
      )),
      jsonb_build_object(
        'custodian_module_code','SK-DOC',
        'intake_candidate_id',candidate_row.id,
        'intake_analysis',candidate_row.analysis,
        'human_validation_required',true,
        'review_notes',nullif(trim(coalesce(target_review_notes,'')),'')
      ),
      auth.uid(),auth.uid()
    )
    returning id into asset_id;
  end if;

  perform public.link_sparks_evidence(
    source_row.organization_id,
    asset_id,
    'SK-PE',
    'strategic_project',
    target_project_id,
    'Evidencia documental descoberta pelo intake governado e validada para uso no Planejamento Estrategico.',
    'important',
    false,
    change_reason
  );

  if target_checklist_item_id is not null then
    select checklist.project_id, checklist.organization_id
      into checklist_project_id, checklist_org_id
    from public.skpe_evidence_checklist_items item
    join public.skpe_evidence_checklists checklist on checklist.id=item.checklist_id
    where item.id=target_checklist_item_id;

    if checklist_project_id is null
       or checklist_project_id<>target_project_id
       or checklist_org_id<>source_row.organization_id then
      raise exception 'Requisito selecionado nao pertence ao projeto da evidencia.' using errcode='22023';
    end if;

    perform public.link_sparks_evidence(
      source_row.organization_id,
      asset_id,
      'SK-PE',
      'skpe_evidence_checklist_item',
      target_checklist_item_id,
      'Evidencia validada no intake e associada ao requisito do checklist de evidencias.',
      'important',
      false,
      change_reason
    );
    if target_compliance_level is not null then
      perform public.assess_skpe_evidence_checklist_item(
        target_checklist_item_id,
        target_compliance_level,
        target_quality_score,
        target_completeness_score,
        target_currentness_score,
        target_reliability_score,
        target_overall_score,
        null,
        nullif(candidate_row.analysis->>'gaps',''),
        null,
        nullif(candidate_row.analysis->>'recommendations',''),
        concat(
          'Validacao humana do intake documental. ',
          coalesce(target_review_notes,'')
        ),
        change_reason
      );
    end if;
  end if;

  update public.sparks_evidence_intake_candidates
  set candidate_status='accepted',
      evidence_asset_id=asset_id,
      reviewed_checklist_item_id=target_checklist_item_id,
      reviewed_compliance_level=target_compliance_level,
      reviewed_at=timezone('utc',now()),
      reviewed_by=auth.uid(),
      review_notes=nullif(trim(coalesce(target_review_notes,'')),''),
      updated_at=timezone('utc',now())
  where id=target_candidate_id;

  return asset_id;
end;
$function$;

revoke all on function public.accept_sparks_evidence_intake_candidate(
  uuid,uuid,uuid,integer,numeric,numeric,numeric,numeric,numeric,text,text
) from public,anon;
grant execute on function public.accept_sparks_evidence_intake_candidate(
  uuid,uuid,uuid,integer,numeric,numeric,numeric,numeric,numeric,text,text
) to authenticated;

commit;
