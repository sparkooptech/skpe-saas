#!/usr/bin/env bash
# G2 - exercise passphrase-protected secret-key custody on tmpfs only.
set -euo pipefail
umask 077
root=$(mktemp -d /dev/shm/sparks-g2-protected.XXXXXX)
trap 'rm -rf "$root"' EXIT
export GNUPGHOME="$root/gnupg"
mkdir -m 700 "$GNUPGHOME"
cat > "$root/keyparams" <<'EOF'
Key-Type: RSA
Key-Length: 3072
Subkey-Type: RSA
Subkey-Length: 3072
Name-Real: SPARKs G2 Protected Disposable Test
Name-Email: sparks-g2-protected@example.invalid
Expire-Date: 1d
%no-protection
%commit
EOF
gpg --batch --quiet --generate-key "$root/keyparams"
fpr=$(gpg --batch --with-colons --list-keys | awk -F: '$1=="fpr"{print $10; exit}')
test -n "$fpr"
gpg --batch --yes --armor --export "$fpr" > "$root/public.asc"
gpg --batch --yes --armor --export-secret-keys "$fpr" > "$root/secret.tmp"
# A random passphrase exists only in tmpfs; the test cannot establish human recovery.
openssl rand -base64 48 > "$root/passphrase"
openssl enc -aes-256-cbc -pbkdf2 -iter 250000 -salt -in "$root/secret.tmp" -out "$root/secret.enc" -pass "file:$root/passphrase"
rm -f "$root/secret.tmp"
printf 'synthetic-only\n' > "$root/plain"
gpg --batch --yes --trust-model always -r "$fpr" -o "$root/cipher.gpg" -e "$root/plain"
rm -rf "$GNUPGHOME"
export GNUPGHOME="$root/recovery"
mkdir -m 700 "$GNUPGHOME"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 -in "$root/secret.enc" -out "$root/recovered-secret.asc" -pass "file:$root/passphrase"
gpg --batch --quiet --import "$root/recovered-secret.asc"
gpg --batch --quiet -o "$root/recovered" -d "$root/cipher.gpg"
cmp "$root/plain" "$root/recovered"
echo 'G2_PROTECTED_DISPOSABLE_CUSTODY=PASS'
echo 'G2_PASSPHRASE_HUMAN_RECOVERY=NOT_TESTED'
echo 'G2_REAL_OPERATIONAL_KEY=NOT_CREATED'
