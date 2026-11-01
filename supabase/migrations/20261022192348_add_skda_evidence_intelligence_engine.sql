begin;

update public.skda_diagnoses
set current_phase_code = case current_phase_code
  when 'DA-01' then 'DA-00'
  when 'DA-02' then 'DA-01'
  when 'DA-03' then 'DA-01'
  when 'DA-04' then 'DA-01'
  when 'DA-05' then 'DA-02'
  when 'DA-06' then 'DA-03'
  else current_phase_code
end,
metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
  'journey_phase_model','DA-00..DA-03',
  'journey_phase_model_updated_at',timezone('utc',now())
)
where current_phase_code in ('DA-01','DA-02','DA-03','DA-04','DA-05','DA-06')
  and coalesce(metadata->>'journey_phase_model','') <> 'DA-00..DA-03';

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'sparks-evidence',
  'sparks-evidence',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]::text[]
)
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists sparks_evidence_objects_select on storage.objects;
create policy sparks_evidence_objects_select
on storage.objects for select to authenticated
using (
  bucket_id='sparks-evidence'
  and exists (
    select 1
    from public.organizations o
    where o.id::text=split_part(name,'/',1)
      and public.has_module_access(o.id,'SK-DA')
  )
);

drop policy if exists sparks_evidence_objects_insert on storage.objects;
create policy sparks_evidence_objects_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='sparks-evidence'
  and exists (
    select 1
    from public.organizations o
    where o.id::text=split_part(name,'/',1)
      and (
        public.has_module_permission(o.id,'SK-DA','assessment.edit')
        or public.has_module_permission(o.id,'SK-DA','evidence.manage')
        or public.has_module_access(o.id,'SK-DA')
      )
  )
);

drop policy if exists sparks_evidence_objects_update on storage.objects;
create policy sparks_evidence_objects_update
on storage.objects for update to authenticated
using (
  bucket_id='sparks-evidence'
  and exists (
    select 1 from public.organizations o
    where o.id::text=split_part(name,'/',1)
      and public.has_module_access(o.id,'SK-DA')
  )
)
with check (
  bucket_id='sparks-evidence'
  and exists (
    select 1 from public.organizations o
    where o.id::text=split_part(name,'/',1)
      and public.has_module_access(o.id,'SK-DA')
  )
);

create or replace function public.register_sparks_evidence_asset_for_module(
  target_organization_id uuid,
  target_module_code text,
  evidence_title text,
  evidence_description text,
  target_evidence_type text,
  target_source_type text,
  target_reference_date date,
  target_validity_date date,
  target_confidentiality_level text,
  target_content_hash text,
  target_file_name text,
  target_mime_type text,
  target_file_size_bytes bigint,
  target_storage_bucket text,
  target_storage_path text,
  change_reason text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  asset_id uuid;
  version_id uuid;
  module_code text := upper(trim(coalesce(target_module_code,'')));
begin
  if module_code='' or not public.has_module_access(target_organization_id,module_code) then
    raise exception 'Acesso ao módulo não autorizado para registrar evidências.';
  end if;

  if length(trim(coalesce(evidence_title,'')))=0 then
    raise exception 'Informe o título da evidência.';
  end if;

  if length(trim(coalesce(change_reason,'')))<10 then
    raise exception 'Informe uma justificativa com pelo menos 10 caracteres.';
  end if;

  if target_content_hash is not null then
    select evidence.id
      into asset_id
    from public.sparks_evidence_assets evidence
    where evidence.organization_id=target_organization_id
      and evidence.content_hash=target_content_hash
      and evidence.archived_at is null
    limit 1;
  end if;

  if asset_id is not null then
    return asset_id;
  end if;

  insert into public.sparks_evidence_assets (
    organization_id,title,description,evidence_type,source_type,origin_module_code,
    reference_date,validity_date,confidentiality_level,content_hash,
    created_by,updated_by,metadata
  ) values (
    target_organization_id,
    trim(evidence_title),
    nullif(trim(coalesce(evidence_description,'')),''),
    target_evidence_type,
    coalesce(target_source_type,'internal'),
    module_code,
    target_reference_date,
    target_validity_date,
    coalesce(target_confidentiality_level,'internal'),
    target_content_hash,
    auth.uid(),
    auth.uid(),
    jsonb_build_object(
      'creation_reason',trim(change_reason),
      'registered_by_module',module_code,
      'intelligence_pipeline',case when module_code='SK-DA' then 'SK-DOC>SK-KM>SK-DA' else null end
    )
  )
  returning id into asset_id;

  if target_file_name is not null then
    insert into public.sparks_evidence_versions (
      evidence_asset_id,version_number,version_label,storage_bucket,storage_path,
      file_name,mime_type,file_size_bytes,content_hash,change_summary,created_by
    ) values (
      asset_id,1,'1.0',target_storage_bucket,target_storage_path,
      target_file_name,target_mime_type,target_file_size_bytes,target_content_hash,
      trim(change_reason),auth.uid()
    )
    returning id into version_id;

    update public.sparks_evidence_assets
       set current_version_id=version_id,
           updated_at=timezone('utc',now()),
           updated_by=auth.uid()
     where id=asset_id;
  end if;

  return asset_id;
end;
$$;

revoke all on function public.register_sparks_evidence_asset_for_module(uuid,text,text,text,text,text,date,date,text,text,text,text,bigint,text,text,text) from public;
grant execute on function public.register_sparks_evidence_asset_for_module(uuid,text,text,text,text,text,date,date,text,text,text,text,bigint,text,text,text)
  to authenticated,service_role;

create table if not exists public.skda_evidence_question_intelligence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  diagnosis_id uuid not null,
  evidence_asset_id uuid not null references public.sparks_evidence_assets(id) on delete cascade,
  question_id uuid not null references public.skda_questions(id) on delete cascade,
  correlation_id uuid null references public.skda_evidence_correlations(id) on delete set null,

  document_intake_status text not null default 'identified'
    check (document_intake_status in ('identified','available','triage','accepted','returned','complement_requested','validated','not_applicable')),
  evidence_coverage_status text not null default 'under_analysis'
    check (evidence_coverage_status in ('under_analysis','covers','partially_covers','does_not_cover','needs_complement','not_applicable')),
  practice_state text not null default 'not_assessed'
    check (practice_state in ('not_assessed','exists','applied','recurrent','broad','controlled','result_oriented','learning_improvement')),

  relevance_score numeric(5,2) check (relevance_score is null or relevance_score between 0 and 100),
  adequacy_score numeric(5,2) check (adequacy_score is null or adequacy_score between 0 and 100),
  sufficiency_score numeric(5,2) check (sufficiency_score is null or sufficiency_score between 0 and 100),
  reliability_score numeric(5,2) check (reliability_score is null or reliability_score between 0 and 100),
  actuality_score numeric(5,2) check (actuality_score is null or actuality_score between 0 and 100),
  coverage_score numeric(5,2) check (coverage_score is null or coverage_score between 0 and 100),
  confidence_score numeric(5,2) check (confidence_score is null or confidence_score between 0 and 100),

  supports_claim text,
  does_not_support text,
  gap_description text,
  complement_needed text,
  improvement_suggestion text,
  interview_question_suggestion text,
  self_assessment_guidance text,
  diagnostic_hypothesis text,

  analysis_mode text not null default 'assisted'
    check (analysis_mode in ('manual','assisted','automatic')),
  analysis_status text not null default 'pending'
    check (analysis_status in ('pending','queued','processing','proposed','validated','rejected','superseded')),
  source_excerpt text,
  source_locator text,
  engine_name text,
  engine_version text,
  metadata jsonb not null default '{}'::jsonb,

  validated_at timestamptz,
  validated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,

  foreign key (diagnosis_id,organization_id)
    references public.skda_diagnoses(id,organization_id) on delete cascade,
  unique(diagnosis_id,evidence_asset_id,question_id)
);

create index if not exists idx_skda_evidence_question_intelligence_diag
  on public.skda_evidence_question_intelligence(diagnosis_id,question_id,evidence_coverage_status);

create index if not exists idx_skda_evidence_question_intelligence_evidence
  on public.skda_evidence_question_intelligence(organization_id,evidence_asset_id,analysis_status);

alter table public.skda_evidence_question_intelligence enable row level security;

drop policy if exists skda_evidence_question_intelligence_select on public.skda_evidence_question_intelligence;
create policy skda_evidence_question_intelligence_select
on public.skda_evidence_question_intelligence for select to authenticated
using (public.has_module_access(organization_id,'SK-DA'));

drop policy if exists skda_evidence_question_intelligence_write on public.skda_evidence_question_intelligence;
create policy skda_evidence_question_intelligence_write
on public.skda_evidence_question_intelligence for all to authenticated
using (public.has_module_access(organization_id,'SK-DA'))
with check (public.has_module_access(organization_id,'SK-DA'));

grant select,insert,update,delete on public.skda_evidence_question_intelligence to authenticated;
grant all on public.skda_evidence_question_intelligence to service_role;

drop trigger if exists set_skda_evidence_question_intelligence_updated_at
  on public.skda_evidence_question_intelligence;
create trigger set_skda_evidence_question_intelligence_updated_at
before update on public.skda_evidence_question_intelligence
for each row execute function public.set_updated_at();

create or replace function public.queue_skda_evidence_question_intelligence(
  target_organization_id uuid,
  target_diagnosis_id uuid,
  target_evidence_asset_id uuid
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

  insert into public.skda_evidence_question_intelligence (
    organization_id,
    diagnosis_id,
    evidence_asset_id,
    question_id,
    correlation_id,
    document_intake_status,
    evidence_coverage_status,
    analysis_mode,
    analysis_status,
    self_assessment_guidance,
    created_by,
    updated_by,
    metadata
  )
  select
    target_organization_id,
    target_diagnosis_id,
    target_evidence_asset_id,
    q.id,
    c.id,
    'available',
    'under_analysis',
    'assisted',
    'queued',
    q.guidance,
    auth.uid(),
    auth.uid(),
    jsonb_build_object(
      'pipeline','SK-DOC>SK-KM>SK-DA',
      'purpose','evidence_question_intelligence',
      'queued_at',timezone('utc',now())
    )
  from public.skda_diagnoses d
  join public.skda_questions q
    on q.catalog_version_id=d.catalog_version_id
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
    document_intake_status='available',
    analysis_status=case
      when public.skda_evidence_question_intelligence.analysis_status in ('validated','rejected')
        then public.skda_evidence_question_intelligence.analysis_status
      else 'queued'
    end,
    updated_by=auth.uid(),
    updated_at=timezone('utc',now()),
    metadata=public.skda_evidence_question_intelligence.metadata
      || jsonb_build_object('requeued_at',timezone('utc',now()));

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.queue_skda_evidence_question_intelligence(uuid,uuid,uuid) from public;
grant execute on function public.queue_skda_evidence_question_intelligence(uuid,uuid,uuid)
  to authenticated,service_role;

commit;
