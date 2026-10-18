#!/usr/bin/env bash
set -euo pipefail
name="sparks-g2-synthetic-$$"
cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker run -d --name "$name" --network none --read-only --tmpfs /tmp:rw,nosuid,nodev,size=32m --tmpfs /run/postgresql:rw,nosuid,nodev,size=8m --tmpfs /var/lib/postgresql/data:rw,nosuid,nodev,size=256m --memory 512m --cpus 1 -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17 >/dev/null
ready=0
for i in $(seq 1 30); do
 if docker exec "$name" pg_isready -U postgres >/dev/null 2>&1; then ready=1; break; fi
 sleep 1
done
if [ "$ready" -ne 1 ]; then echo "SYNTHETIC_DB_NOT_READY"; docker logs --tail 12 "$name" 2>&1 | sed -E 's/(password|secret|token)=\S+/REDACTED/g'; exit 2; fi
docker exec "$name" psql -U postgres -v ON_ERROR_STOP=1 -c "create role anon nologin; create role authenticated nologin; create role app_owner nologin;" >/dev/null
docker exec "$name" psql -U postgres -v ON_ERROR_STOP=1 -c "create schema demo; create table demo.records(id integer primary key, organization_id integer not null, value text not null); insert into demo.records values (1,100,'alpha'),(2,200,'beta'); alter table demo.records enable row level security; create policy org_read on demo.records for select using (organization_id = nullif(current_setting('app.organization_id',true),'')::integer); grant usage on schema demo to authenticated; grant select on demo.records to authenticated;" >/dev/null
docker exec "$name" sh -c "pg_dump -U postgres -Fc -n demo -f /tmp/synthetic.dump postgres && pg_restore -U postgres -C --list /tmp/synthetic.dump >/dev/null"
docker exec "$name" psql -U postgres -v ON_ERROR_STOP=1 -c "drop schema demo cascade;" >/dev/null
docker exec "$name" pg_restore -U postgres -d postgres /tmp/synthetic.dump >/dev/null
count=$(docker exec "$name" psql -U postgres -Atc "select count(*) from demo.records")
policy=$(docker exec "$name" psql -U postgres -Atc "select count(*) from pg_policies where schemaname='demo' and policyname='org_read'")
docker exec "$name" psql -U postgres -v ON_ERROR_STOP=1 -c "set role authenticated; set app.organization_id='100'; do \$\$ begin if (select count(*) from demo.records) <> 1 then raise exception 'tenant isolation failed'; end if; end \$\$;" >/dev/null
echo "SYNTHETIC_RESTORE=PASS ROWS=$count RLS_POLICY=$policy TENANT_100_VISIBLE=1"
