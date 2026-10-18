#!/usr/bin/env bash
set -euo pipefail
umask 077
base=/root/sparks-g2-secure-staging
key="$base/operational-key"
sink="$base/g2-encrypted-stream-sink.sh"
test -s "$sink"
tmp=$(mktemp -d /dev/shm/sparks-g2-sink-test.XXXXXXXX)
trap 'rm -rf "$tmp"' EXIT
mkdir -m 700 "$tmp/out"
printf 'G2 test stream, no production data\n' > "$tmp/plain"
export G2_PUBLIC_KEY_FILE="$key/public.asc"
export G2_OUTPUT_DIR="$tmp/out"
export G2_EXPECTED_FPR
G2_EXPECTED_FPR=$(cat "$key/fingerprint")
bash "$sink" < "$tmp/plain"
cipher=$(find "$tmp/out" -maxdepth 1 -type f -name '*.pgdump.gpg' -print -quit)
test -n "$cipher"
(cd "$tmp/out" && sha256sum -c "$(basename "$cipher").sha256" >/dev/null)
export GNUPGHOME="$tmp/recovery"
mkdir -m 700 "$GNUPGHOME"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 -in "$key/private.asc.enc" -pass "file:$key/recovery-passphrase" | gpg --batch --quiet --import
gpg --batch --quiet --output "$tmp/recovered" --decrypt "$cipher"
cmp "$tmp/plain" "$tmp/recovered"
echo 'G2_OPERATIONAL_KEY_STREAM_ROUNDTRIP=PASS'
echo 'G2_ENCRYPTED_SHA256=PASS'
echo 'G2_REAL_DATA_USED=NO'
