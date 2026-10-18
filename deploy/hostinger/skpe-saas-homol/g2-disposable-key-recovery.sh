#!/usr/bin/env bash
set -euo pipefail
umask 077
root=$(mktemp -d /dev/shm/sparks-g2-keytest.XXXXXX)
cleanup() { rm -rf "$root"; }
trap cleanup EXIT
export GNUPGHOME="$root/gnupg"
mkdir -m 700 "$GNUPGHOME"
cat > "$root/keyparams" <<'EOF'
Key-Type: RSA
Key-Length: 3072
Subkey-Type: RSA
Subkey-Length: 3072
Name-Real: SPARKs G2 Disposable Test
Name-Email: sparks-g2-disposable@example.invalid
Expire-Date: 1d
%no-protection
%commit
EOF
gpg --batch --quiet --generate-key "$root/keyparams"
fingerprint=$(gpg --batch --with-colons --list-keys | awk -F: '$1=="fpr"{print $10; exit}')
test -n "$fingerprint"
gpg --batch --yes --armor --export "$fingerprint" > "$root/public.asc"
gpg --batch --yes --armor --export-secret-keys "$fingerprint" > "$root/private.asc"
printf 'SPARKS_G2_DISPOSABLE_TEST\n' > "$root/plaintext"
gpg --batch --yes --trust-model always --recipient "$fingerprint" --output "$root/cipher.gpg" --encrypt "$root/plaintext"
rm -rf "$GNUPGHOME"
export GNUPGHOME="$root/recovery"
mkdir -m 700 "$GNUPGHOME"
gpg --batch --quiet --import "$root/private.asc"
gpg --batch --quiet --output "$root/recovered" --decrypt "$root/cipher.gpg"
cmp -s "$root/plaintext" "$root/recovered"
echo "G2_DISPOSABLE_KEY_RECOVERY=PASS"
echo "G2_TEST_KEY_ONLY=YES"
echo "G2_REAL_KEY_CUSTODY=NOT_CONFIGURED"
