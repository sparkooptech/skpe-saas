begin;

create schema if not exists extensions;

do $migration$
declare
  v_extension_schema text;
begin
  select n.nspname
    into v_extension_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_extension_schema is null then
    execute 'create extension pgcrypto with schema extensions';
  elsif v_extension_schema <> 'extensions' then
    execute 'alter extension pgcrypto set schema extensions';
  end if;

  select n.nspname
    into v_extension_schema
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
  where e.extname = 'pgcrypto';

  if v_extension_schema is distinct from 'extensions' then
    raise exception
      'pgcrypto reconciliation failed; schema=%',
      coalesce(v_extension_schema, '<missing>');
  end if;

  if to_regprocedure('extensions.digest(bytea,text)') is null then
    raise exception
      'extensions.digest(bytea,text) is not available after pgcrypto reconciliation';
  end if;
end
$migration$;

commit;
