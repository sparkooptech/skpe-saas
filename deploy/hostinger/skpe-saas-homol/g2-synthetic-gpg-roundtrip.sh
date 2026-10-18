#!/usr/bin/env bash
# G2: synthetic-only encryption/decryption test in volatile tmpfs.
# Does not access production data, PostgreSQL, Storage, or operational keys.
set -euo pipefail
umask 077
command -v gpg >/dev/null
command -v sha256sum >/dev/null
[ -d /dev/shm ] || { echo 'FAIL: no tmpfs'; exit 1; }
TMP=$(mktemp -d /dev/shm/sparks-g2-crypto.XXXXXXXX)
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT
export GNUPGHOME="$TMP/gnupg"
mkdir -m 700 "$GNUPGHOME"
cat > "$TMP/key-params" <<'KEY'
%no-protection
Key-Type: RSA
Key-Length: 3072
Key-Usage: encrypt
Name-Real: SPARKs G2 Synthetic Test Only
Name-Email: synthetic-test@example.invalid
Expire-Date: 1d
%commit
KEY
gpg --batch --quiet --generate-key "$TMP/key-params"
printf '%s\n' 'SPARKs G2 synthetic payload; no real data' > "$TMP/plain.txt"
gpg --batch --yes --quiet --trust-model always --recipient synthetic-test@example.invalid --output "$TMP/encrypted.gpg" --encrypt "$TMP/plain.txt"
gpg --batch --yes --quiet --output "$TMP/restored.txt" --decrypt "$TMP/encrypted.gpg" 2>/dev/null
cmp -s "$TMP/plain.txt" "$TMP/restored.txt"
echo 'G2_SYNTHETIC_GPG_ROUNDTRIP=PASS'
echo 'SENSITIVE_DATA_ACCESSED=false'
echo 'OPERATIONAL_KEY_CREATED=false'
echo 'REAL_BACKUP_EXECUTED=false'
