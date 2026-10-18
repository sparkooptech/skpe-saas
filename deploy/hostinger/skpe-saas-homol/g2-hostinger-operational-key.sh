#!/usr/bin/env bash
# G2 Hostinger-only contingency: create a recoverable operational GPG key.
# No secrets printed. No Windows key files. No existing services modified.
set -euo pipefail
umask 077
base=/root/sparks-g2-secure-staging
keydir="$base/operational-key"
[[ -d "$base" && ! -L "$base" && "$(stat -c %a "$base")" == 700 ]] || { echo 'G2_BLOCKED=STAGING_PERMISSIONS'; exit 2; }
if [[ -e "$keydir" ]]; then
 echo 'G2_OPERATIONAL_KEY=ALREADY_EXISTS_NO_OVERWRITE'
 exit 3
fi
tmp=$(mktemp -d /dev/shm/sparks-g2-operational.XXXXXXXX)
cleanup(){ rm -rf "$tmp"; }
trap cleanup EXIT
export GNUPGHOME="$tmp/home"
mkdir -m 700 "$GNUPGHOME"
cat > "$tmp/params" <<'EOF'
Key-Type: RSA
Key-Length: 3072
Subkey-Type: RSA
Subkey-Length: 3072
Name-Real: SPARKs G2 Hostinger Recovery
Name-Email: sparks-g2-recovery@local.invalid
Expire-Date: 0
%no-protection
%commit
EOF
gpg --batch --quiet --generate-key "$tmp/params"
fpr=$(gpg --batch --with-colons --list-keys | awk -F: '$1=="fpr"{print $10; exit}')
[[ "$fpr" =~ ^[0-9A-F]{40}$ ]] || { echo 'G2_BLOCKED=KEY_GENERATION'; exit 2; }
mkdir -m 700 "$keydir"
trap 'rm -rf "$tmp"; if [[ "${completed:-no}" != yes ]]; then rm -rf "$keydir"; fi' EXIT
openssl rand -base64 48 > "$keydir/recovery-passphrase"
chmod 600 "$keydir/recovery-passphrase"
gpg --batch --yes --armor --export "$fpr" > "$keydir/public.asc"
gpg --batch --yes --armor --export-secret-keys "$fpr" |
 openssl enc -aes-256-cbc -pbkdf2 -iter 250000 -salt -pass "file:$keydir/recovery-passphrase" -out "$keydir/private.asc.enc"
chmod 600 "$keydir/public.asc" "$keydir/private.asc.enc"
printf '%s\n' "$fpr" > "$keydir/fingerprint"
chmod 600 "$keydir/fingerprint"
# Destroy the initial keyring; verify recovery from encrypted secret-key artifact.
rm -rf "$GNUPGHOME"
export GNUPGHOME="$tmp/recovered"
mkdir -m 700 "$GNUPGHOME"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 -in "$keydir/private.asc.enc" -pass "file:$keydir/recovery-passphrase" |
 gpg --batch --quiet --import
recovered=$(gpg --batch --with-colons --list-secret-keys | awk -F: '$1=="fpr"{print $10; exit}')
[[ "$recovered" == "$fpr" ]] || { echo 'G2_BLOCKED=RECOVERY_FINGERPRINT'; exit 2; }
printf 'G2 operational custody recovery test\n' > "$tmp/plain"
gpg --batch --quiet --yes --trust-model always -r "$fpr" -o "$tmp/cipher.gpg" -e "$tmp/plain"
gpg --batch --quiet -o "$tmp/roundtrip" -d "$tmp/cipher.gpg"
cmp "$tmp/plain" "$tmp/roundtrip"
completed=yes
echo 'G2_OPERATIONAL_KEY=CREATED_ON_HOSTINGER'
echo 'G2_RECOVERY_TEST=PASS'
echo "G2_FINGERPRINT=$fpr"
echo 'G2_KEY_LOCATION=HOSTINGER_ONLY'
echo 'G2_OFFSITE_RECOVERY=NO'
echo 'G2_BACKUP_REAL=NOT_EXECUTED'
