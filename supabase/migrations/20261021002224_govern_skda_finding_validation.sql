-- Plataforma SPARKs
-- Governanca de validacao de achados/recomendacoes do SK-DA.
-- Separa autoria/edicao de achado da aceitacao executiva da recomendacao.

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
  'findings.validate',
  'Validar recomendações',
  'Permite aceitar ou reabrir recomendações do Diagnóstico Assistido antes da conversão em Gestão Tática.',
  'findings',
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
    ('administrator', 'findings.validate'),
    ('coordinator', 'findings.validate'),
    ('reviewer', 'findings.validate')
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

create or replace function public.enforce_skda_finding_validation_transition()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  if new.status is distinct from old.status
     and (new.status = 'accepted' or old.status = 'accepted')
     and not public.has_module_permission(
       new.organization_id,
       'SK-DA',
       'findings.validate'
     ) then
    raise exception 'Acesso negado: usuario sem permissao para validar recomendacoes do SK-DA.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_skda_findings_validation_transition
on public.skda_findings;

create trigger trg_skda_findings_validation_transition
before update of status on public.skda_findings
for each row
execute function public.enforce_skda_finding_validation_transition();

create or replace function public.accept_skda_finding_recommendation(
  target_organization_id uuid,
  target_finding_id uuid,
  validation_reason text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_finding public.skda_findings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Operacao exige usuario autenticado.'
      using errcode = '42501';
  end if;

  if not public.has_module_permission(
    target_organization_id,
    'SK-DA',
    'findings.validate'
  ) then
    raise exception 'Acesso negado: usuario sem permissao para validar recomendacoes do SK-DA.'
      using errcode = '42501';
  end if;

  if length(trim(coalesce(validation_reason, ''))) < 10 then
    raise exception 'Informe uma justificativa de validacao com pelo menos 10 caracteres.'
      using errcode = '22023';
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

  if nullif(trim(v_finding.recommendation), '') is null then
    raise exception 'O achado precisa possuir recomendacao antes da validacao.'
      using errcode = '22023';
  end if;

  if v_finding.status not in ('open','accepted') then
    raise exception 'Somente recomendacoes abertas ou ja aceitas podem ser validadas.'
      using errcode = '22023';
  end if;

  update public.skda_findings
  set
    status = 'accepted',
    metadata = coalesce(metadata, '{}'::jsonb)
      || jsonb_build_object(
        'recommendation_accepted_at', timezone('utc', now()),
        'recommendation_accepted_by', auth.uid(),
        'recommendation_validation_reason', trim(validation_reason)
      ),
    updated_at = timezone('utc', now()),
    updated_by = auth.uid()
  where id = target_finding_id
    and organization_id = target_organization_id;

  return target_finding_id;
end;
$function$;

revoke all
on function public.accept_skda_finding_recommendation(uuid, uuid, text)
from public, anon;

grant execute
on function public.accept_skda_finding_recommendation(uuid, uuid, text)
to authenticated, service_role;

comment on function public.accept_skda_finding_recommendation(uuid, uuid, text) is
  'Aceita uma recomendacao do SK-DA com justificativa e rastreabilidade, exigindo findings.validate.';
