-- SK-DA leadership is tenant-scoped. Does not activate modules or grant platform super-admin.
begin;

insert into public.module_roles (module_id,code,name,description,role_level,is_system_role,active)
select m.id,'sparkoop_lead','Lider SPARKOOP DA',
  'Conducao tecnica da jornada DA; nao equivale a aprovacao institucional.',80,true,true
from public.modules m where m.code = 'SK-DA'
on conflict (module_id,code) do update set name = excluded.name,
  description = excluded.description,active = true;

insert into public.module_roles (module_id,code,name,description,role_level,is_system_role,active)
select m.id,'organization_lead','Lider organizacional DA',
  'Representante designado pela organizacao; exige vinculo ativo e validacao de substituicao.',60,true,true
from public.modules m where m.code = 'SK-DA'
on conflict (module_id,code) do update set name = excluded.name,
  description = excluded.description,active = true;

insert into public.module_permissions (module_id,code,name,description,permission_group,active)
select m.id,p.code,p.name,p.description,'journeys',true
from public.modules m
cross join (values
  ('journeys.open','Abrir jornada DA','Abertura governada de jornada DA'),
  ('journeys.read','Consultar jornada DA','Leitura de jornadas da organizacao'),
  ('initiatives.manage','Gerenciar iniciativas DA','Criar iniciativa operacional vinculada a jornada DA')
) p(code,name,description)
where m.code = 'SK-DA'
on conflict (module_id,code) do update set name = excluded.name,
  description = excluded.description,active = true;

insert into public.role_permissions (module_role_id,module_permission_id)
select mr.id,mp.id from public.module_roles mr
join public.module_permissions mp on mp.module_id = mr.module_id
join public.modules m on m.id = mr.module_id
where m.code = 'SK-DA' and mr.code = 'sparkoop_lead'
  and mp.code in ('journeys.open','journeys.read','initiatives.manage')
on conflict do nothing;

insert into public.role_permissions (module_role_id,module_permission_id)
select mr.id,mp.id from public.module_roles mr
join public.module_permissions mp on mp.module_id = mr.module_id
join public.modules m on m.id = mr.module_id
where m.code = 'SK-DA' and mr.code = 'organization_lead'
  and mp.code = 'journeys.read'
on conflict do nothing;

-- Ricardo is identified by canonical email, not by an invented UUID.
-- Assign both leadership role records on already-enabled SK-DA tenants with active membership.
-- Organizational leadership remains provisional in skda_journeys, never institutional approval.
insert into public.user_module_roles (
  organization_module_id,user_id,module_role_id,status,valid_from,assigned_at
)
select om.id,p.id,mr.id,'active',timezone('utc',now()),timezone('utc',now())
from public.profiles p
join public.organization_memberships membership on membership.user_id = p.id
join public.organization_modules om on om.organization_id = membership.organization_id
join public.modules m on m.id = om.module_id and m.code = 'SK-DA' and m.status = 'active'
join public.module_roles mr on mr.module_id = m.id and mr.code in ('sparkoop_lead','organization_lead')
where lower(p.email) = 'ricardo.rodrigues@sparkoop.com' and p.active = true
  and membership.status = 'active'
  and membership.valid_from <= timezone('utc',now())
  and (membership.valid_until is null or membership.valid_until >= timezone('utc',now()))
  and om.enabled = true and om.status in ('trial','active')
  and om.valid_from <= timezone('utc',now())
  and (om.valid_until is null or om.valid_until >= timezone('utc',now()))
on conflict (organization_module_id,user_id,module_role_id) do nothing;
commit;
