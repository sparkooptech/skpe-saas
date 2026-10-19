#!/usr/bin/env bash
set -euo pipefail
umask 077
base=/root/sparks-g2-secure-staging
: "${G2_DATABASE_URL_FILE:?}"
bash "$base/g2-dev-source-identity-guard.sh" >/dev/null
tmp=$(mktemp -d /dev/shm/sparks-g2-connect.XXXXXXXX)
rmdir "$tmp"
trap 'rm -rf -- "$tmp"' EXIT
python3 "$base/g2-uri-to-libpq-tmpfs.py" "$G2_DATABASE_URL_FILE" "$tmp" >/dev/null
if docker run --rm --network bridge --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --memory 256m --cpus 1 \
  --mount "type=bind,source=$tmp,target=/run/g2,readonly" \
  -e PGSERVICEFILE=/run/g2/pg_service.conf -e PGPASSFILE=/run/g2/pgpass \
  postgres:17-alpine psql --no-psqlrc --set ON_ERROR_STOP=1 --dbname=service=g2 \
  --tuples-only --no-align --command "select current_database() = 'postgres' and current_setting('server_version_num')::int >= 170000" \
  > "$tmp/result" 2>"$tmp/error"; then
  if [[ "$(tr -d '[:space:]' < "$tmp/result")" == t ]]; then
    echo 'G2_DEV_DATABASE_CONNECTIVITY=PASS'
    echo 'G2_DEV_DATABASE_READONLY_QUERY=PASS'
    echo 'G2_REAL_BACKUP=NOT_EXECUTED'
    exit 0
  fi
  echo 'G2_FAILURE_CLASS=QUERY_RESULT'
elif grep -Eqi 'password authentication failed|no password supplied' "$tmp/error"; then
  echo 'G2_FAILURE_CLASS=AUTHENTICATION'
elif grep -Eqi 'could not translate host name|name or service not known|temporary failure in name resolution' "$tmp/error"; then
  echo 'G2_FAILURE_CLASS=DNS'
elif grep -Eqi 'connection refused|timeout expired|network is unreachable|no route to host' "$tmp/error"; then
  echo 'G2_FAILURE_CLASS=NETWORK'
elif grep -Eqi 'permission denied|mount|docker:' "$tmp/error"; then
  echo 'G2_FAILURE_CLASS=CONTAINER_OR_MOUNT'
elif grep -Eqi 'service file|service=g2|pg_service.conf' "$tmp/error"; then
  echo 'G2_FAILURE_CLASS=LIBPQ_CONFIGURATION'
else
  echo 'G2_FAILURE_CLASS=OTHER_REDACTED'
fi
echo 'G2_DEV_DATABASE_CONNECTIVITY=BLOCKED'
echo 'G2_DETAILS=REDACTED'
exit 2
