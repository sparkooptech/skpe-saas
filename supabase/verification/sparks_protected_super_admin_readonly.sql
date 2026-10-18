-- SPARKs INFRA-001: read-only super-admin parity gate.
-- Execute separately against source and destination.
with identity as (
  select id, deleted_at from auth.users where lower(email) = 'rr.gestao@gmail.com'
), assignments as (
  select i.id, upr.status, upr.valid_from, upr.valid_until,
         pr.code, pr.active as role_active
  from identity i
  left join public.user_platform_roles upr on upr.user_id = i.id
  left join public.platform_roles pr on pr.id = upr.platform_role_id
)
select
  (select count(*) from identity) as identity_count,
  (select count(*) from identity where deleted_at is null) as undeleted_identity_count,
  (select count(*) from assignments where code = 'super_admin'
    and status = 'active' and role_active is true and valid_from <= now()
    and (valid_until is null or valid_until >= now())) as active_super_admin_assignments,
  case when (select count(*) from identity where deleted_at is null) = 1
    and (select count(*) from assignments where code = 'super_admin'
      and status = 'active' and role_active is true and valid_from <= now()
      and (valid_until is null or valid_until >= now())) = 1
    then 'PASS' else 'FAIL' end as migration_gate;
