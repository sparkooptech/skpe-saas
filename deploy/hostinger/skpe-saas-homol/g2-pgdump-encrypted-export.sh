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
bash "$base/g2-dev-source-identity-guard.sh"
[[ -s "$key/public.asc" && -s "$key/fingerprint" && -s "$sink" ]] || { echo 'G2_BLOCKED=KEY_OR_SINK'; exit 2; }
# The caller must attest project-ref and pg_dump scope separately.
[[ "${G2_CONFIRMED_PROJECT_REF:-}" == 'vumbfpbcozjebomcthdw' ]] || { echo 'G2_BLOCKED=SOURCE_PROJECT_NOT_CONFIRMED'; exit 2; }
export G2_PUBLIC_KEY_FILE="$key/public.asc"
export G2_EXPECTED_FPR
G2_EXPECTED_FPR=$(cat "$key/fingerprint")
backup_dir="$base/encrypted-backups"
export G2_OUTPUT_DIR="$backup_dir"
mkdir -p -m 700 "$G2_OUTPUT_DIR"
[[ "$(stat -c %a "$G2_OUTPUT_DIR")" == 700 ]] || { echo 'G2_BLOCKED=BACKUP_DIR_PERMISSIONS'; exit 2; }
# Isolate this attempt: any failed or interrupted dump leaves no committed backup.
attempt=$(mktemp -d "$backup_dir/.g2-attempt.XXXXXXXX")
chmod 700 "$attempt"
export G2_OUTPUT_DIR="$attempt"
committed=no
cleanup(){
  if [[ "$committed" != yes ]]; then rm -rf -- "$attempt"; fi
}
trap cleanup EXIT
# The connection is parsed into libpq service and pgpass files in VPS tmpfs.
# Neither the URI nor the password appears in docker/pg_dump arguments or environment.
libpq_dir=$(mktemp -d /dev/shm/sparks-g2-libpq.XXXXXXXX)
rmdir "$libpq_dir"
cleanup(){
  rm -rf -- "$libpq_dir"
  if [[ "$committed" != yes ]]; then rm -rf -- "$attempt"; fi
}
trap cleanup EXIT
python3 "$base/g2-uri-to-libpq-tmpfs.py" "$G2_DATABASE_URL_FILE" "$libpq_dir"
docker run --rm --network bridge --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --memory 512m --cpus 1 \
  --mount "type=bind,source=$libpq_dir,target=/run/g2,readonly" \
  -e PGSERVICEFILE=/run/g2/pg_service.conf -e PGPASSFILE=/run/g2/pgpass \
  postgres:17-alpine pg_dump --dbname=service=g2 --format=custom --no-owner --no-privileges --schema=public --schema=auth --schema=storage | bash "$sink"
# A completed pg_dump plus completed GPG are both required (pipefail).
shopt -s nullglob
artifacts=("$attempt"/*.pgdump.gpg)
[[ ${#artifacts[@]} == 1 ]] || { echo 'G2_BLOCKED=ARTIFACT_COUNT'; exit 2; }
sha256sum -c "${artifacts[0]}.sha256" >/dev/null
mv -- "${artifacts[0]}" "${artifacts[0]}.sha256" "$backup_dir/"
rmdir "$attempt"
committed=yes
printf 'G2_POSTGRES_EXPORT=ENCRYPTED_AND_COMMITTED\n'
echo 'G2_STORAGE_OBJECT_BYTES=NOT_INCLUDED'
echo 'G2_EDGE_FUNCTIONS=NOT_INCLUDED'
