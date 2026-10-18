#!/usr/bin/env bash
# Negative test for G2 export: invalid connection must leave no backup artifact.
set -euo pipefail
umask 077
base=/root/sparks-g2-secure-staging
export G2_CONFIRMED_PROJECT_REF=vumbfpbcozjebomcthdw
fake=$(mktemp /dev/shm/g2-invalid-url.XXXXXXXX)
trap 'rm -f "$fake"' EXIT
printf '%s\n' 'postgresql://invalid:invalid@127.0.0.1:1/invalid?sslmode=disable' > "$fake"
chmod 600 "$fake"
export G2_DATABASE_URL_FILE="$fake"
before=$(find "$base/encrypted-backups" -mindepth 1 -maxdepth 1 -type f -print | sort)
set +e
bash "$base/g2-pgdump-encrypted-export.sh" >/dev/null 2>/dev/null
rc=$?
set -e
after=$(find "$base/encrypted-backups" -mindepth 1 -maxdepth 1 -type f -print | sort)
[[ $rc -ne 0 && "$before" == "$after" ]] || { echo 'G2_INVALID_CONNECTION_TEST=FAIL'; exit 1; }
leftover=$(find "$base/encrypted-backups" -mindepth 1 -maxdepth 1 -type d -name '.g2-attempt.*' -print -quit)
[[ -z "$leftover" ]] || { echo 'G2_INVALID_CONNECTION_TEST=FAIL_ATTEMPT_LEFTOVER'; exit 1; }
echo 'G2_INVALID_CONNECTION_TEST=PASS'
echo 'G2_REAL_DATA_USED=NO'
