begin;

create table if not exists public.skda_interview_question_prompts (
  id uuid primary key default gen_random_uuid(),
  catalog_version_id uuid not null references public.skda_catalog_versions(id) on delete cascade,
  question_id uuid not null references public.skda_questions(id) on delete cascade,
  prompt_type text not null
    check (prompt_type in ('central','deepening','evidence_request','systemic_connection','result_probe','delta_probe')),
  prompt_text text not null,
  branch_code text,
  activity_scope text,
  source_authority text not null default 'sparkoop'
    check (source_authority in ('official','canonical','sparkoop','benchmark','inference')),
  source_reference text,
  display_order integer not null default 100,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc',now()),
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default timezone('utc',now()),
  updated_by uuid references public.profiles(id) on delete set null,
  check (length(trim(prompt_text)) > 0)
);

create unique index if not exists uq_skda_interview_question_prompts_scope
  on public.skda_interview_question_prompts(
    question_id,prompt_type,display_order,coalesce(branch_code,''),coalesce(activity_scope,'')
  );

create index if not exists idx_skda_interview_question_prompts_lookup
  on public.skda_interview_question_prompts(question_id,prompt_type,branch_code,active,display_order);

alter table public.skda_interview_question_prompts enable row level security;

drop policy if exists skda_interview_question_prompts_select on public.skda_interview_question_prompts;
create policy skda_interview_question_prompts_select
on public.skda_interview_question_prompts
for select to authenticated
using (active);

drop policy if exists skda_interview_question_prompts_manage on public.skda_interview_question_prompts;
create policy skda_interview_question_prompts_manage
on public.skda_interview_question_prompts
for all to authenticated
using (public.is_platform_super_admin())
with check (public.is_platform_super_admin());

grant select on public.skda_interview_question_prompts to authenticated,service_role;
grant insert,update,delete on public.skda_interview_question_prompts to service_role;

create or replace function public.list_skda_interview_question_prompts(
  target_organization_id uuid,
  target_diagnosis_id uuid
)
returns table (
  prompt_id uuid,
  question_id uuid,
  prompt_type text,
  prompt_text text,
  branch_code text,
  activity_scope text,
  source_authority text,
  source_reference text,
  display_order integer,
  metadata jsonb
)
language sql
security definer
set search_path=''
as $function$
  select
    p.id,
    p.question_id,
    p.prompt_type,
    p.prompt_text,
    p.branch_code,
    p.activity_scope,
    p.source_authority,
    p.source_reference,
    p.display_order,
    p.metadata
  from public.skda_diagnoses d
  join public.organizations o on o.id=d.organization_id
  left join public.cooperative_branches b on b.id=o.cooperative_branch_id
  join public.skda_questions q on q.catalog_version_id=d.catalog_version_id
  join public.skda_interview_question_prompts p on p.question_id=q.id and p.active
  where d.id=target_diagnosis_id
    and d.organization_id=target_organization_id
    and public.has_module_access(target_organization_id,'SK-DA')
    and (p.branch_code is null or p.branch_code=b.code)
    and (
      p.activity_scope is null
      or coalesce(o.primary_activity_description,'') ilike '%'||p.activity_scope||'%'
    )
  order by q.display_order,
    case p.prompt_type
      when 'central' then 1
      when 'deepening' then 2
      when 'result_probe' then 3
      when 'delta_probe' then 4
      when 'evidence_request' then 5
      else 6
    end,
    p.display_order;
$function$;

revoke all on function public.list_skda_interview_question_prompts(uuid,uuid) from public,anon;
grant execute on function public.list_skda_interview_question_prompts(uuid,uuid) to authenticated,service_role;

comment on table public.skda_interview_question_prompts is
'Roteiro governado por questão do SK-DA: pergunta central, aprofundamentos, pedidos de evidência e conexões sistêmicas, contextualizáveis por ramo/atividade.';

notify pgrst, 'reload schema';

commit;
