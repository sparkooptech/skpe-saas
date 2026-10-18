-- SPARKs DA deployment preflight (READ ONLY). Run against an explicitly identified environment.
-- Never infer deployment eligibility from the presence of a project alone.
select current_database() as database_name,
       current_setting('server_version') as postgres_version,
       to_regclass('public.organizations') is not null as organizations_present,
       to_regclass('public.profiles') is not null as profiles_present,
       to_regclass('public.sparks_initiatives') is not null as initiatives_present,
       to_regclass('public.sparks_checklist_executions') is not null as checklist_executions_present,
       to_regclass('public.skda_journeys') is not null as da_journeys_present;

select m.code, m.status, count(om.organization_id) as organization_assignments,
       count(om.organization_id) filter (where om.enabled) as enabled_assignments
from public.modules m
left join public.organization_modules om on om.module_id = m.id
where m.code = 'SK-DA'
group by m.code,m.status;

select d.code as domain_code,v.code as category_code,v.active
from public.sparks_domains d
join public.sparks_domain_values v on v.domain_id = d.id
where d.code = 'INITIATIVE_CATEGORY' and v.code = 'operational';

select p.proname, pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_platform_super_admin','is_organization_admin',
                   'create_sparks_initiative','can_manage_sparks_initiatives')
order by p.proname;

-- Backup validation is an external mandatory gate: this script does NOT create a backup.
