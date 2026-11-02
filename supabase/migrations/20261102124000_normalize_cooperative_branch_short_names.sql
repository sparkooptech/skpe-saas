begin;

update public.cooperative_branches
set short_name = case
  when upper(code) = 'TRABALHO_PRODUCAO_BENS_SERVICOS' then 'TPBS'
  else name
end,
updated_at = timezone('utc', now())
where short_name is distinct from case
  when upper(code) = 'TRABALHO_PRODUCAO_BENS_SERVICOS' then 'TPBS'
  else name
end;

create or replace function public.sync_organization_cooperative_branch_short_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  branch_short_name text;
begin
  if new.cooperative_branch_id is null then
    return new;
  end if;

  select coalesce(nullif(trim(branch.short_name), ''), branch.name)
    into branch_short_name
  from public.cooperative_branches branch
  where branch.id = new.cooperative_branch_id;

  if branch_short_name is not null then
    new.cooperative_branch := branch_short_name;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_sync_organization_cooperative_branch_short_name
  on public.organizations;
create trigger trg_sync_organization_cooperative_branch_short_name
before insert or update of cooperative_branch_id, cooperative_branch
on public.organizations
for each row
execute function public.sync_organization_cooperative_branch_short_name();

update public.organizations organization
set cooperative_branch = coalesce(nullif(trim(branch.short_name), ''), branch.name)
from public.cooperative_branches branch
where organization.cooperative_branch_id = branch.id
  and organization.cooperative_branch is distinct from
      coalesce(nullif(trim(branch.short_name), ''), branch.name);

revoke all on function public.sync_organization_cooperative_branch_short_name()
  from public, anon, authenticated;

comment on function public.sync_organization_cooperative_branch_short_name() is
  'Mantem organizations.cooperative_branch como rotulo curto governado pelo catalogo mestre. TPBS e persistido como abreviacao; demais ramos preservam o nome oficial.';

commit;
