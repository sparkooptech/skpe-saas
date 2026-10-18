#!/usr/bin/env bash
# G2: run a PostgreSQL 17 pg_dump in a disposable container and stream to encrypted sink.
# Connection string is read from an existing root-only file; never put it in CLI args/logs.
set -euo pipefail
umask 077
base=/root/sparks-g2-secure-staging
key="$base/operational-key"
sink="$base/g2-encrypted-stream-sink.sh"
: "${G2_DATABASE_URL_FILE:?Missing root-only database URL file}"
[[ -f "$G2_DATABASE_URL_FILE" && ! -L "$G2_DATABASE_URL_FILE" ]] || { echo 'G2_BLOCKED=DB_URL_FILE'; exit 2; }
[[ "$(stat -c %a "$G2_DATABASE_URL_FILE")" == 600 ]] || { echo 'G2_BLOCKED=DB_URL_PERMISSIONS'; exit 2; }
[[ -s "$key/public.asc" && -s "$key/fingerprint" && -s "$sink" ]] || { echo 'G2_BLOCKED=KEY_OR_SINK'; exit 2; }
# The caller must attest project-ref and pg_dump scope separately.
[[ "${G2_CONFIRMED_PROJECT_REF:-}" == 'vumbfpbcozjebomcthdw' ]] || { echo 'G2_BLOCKED=SOURCE_PROJECT_NOT_CONFIRMED'; exit 2; }
export G2_PUBLIC_KEY_FILE="$key/public.asc"
export G2_EXPECTED_FPR
G2_EXPECTED_FPR=$(cat "$key/fingerprint")
export G2_OUTPUT_DIR="$base/encrypted-backups"
mkdir -p -m 700 "$G2_OUTPUT_DIR"
[[ "$(stat -c %a "$G2_OUTPUT_DIR")" == 700 ]] || { echo 'G2_BLOCKED=BACKUP_DIR_PERMISSIONS'; exit 2; }
# No pg_dump output is written on the host. Docker has no mounts and no published ports.
# PG URL is delivered on stdin to the container's entrypoint, not a process argument.
# The container prints only pg_dump binary output on stdout.
docker run --rm --network bridge --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --memory 512m --cpus 1 -i postgres:17-alpine sh -c '
  IFS= read -r uri
  export PGCONNECT_TIMEOUT=15
  export PGDATABASE="$uri"; unset uri; exec pg_dump --format=custom --no-owner --no-privileges --schema=public --schema=auth --schema=storage
' < "$G2_DATABASE_URL_FILE" | bash "$sink"
echo 'G2_POSTGRES_EXPORT=STREAMED_TO_ENCRYPTION'
echo 'G2_STORAGE_OBJECT_BYTES=NOT_INCLUDED'
echo 'G2_EDGE_FUNCTIONS=NOT_INCLUDED'
