#!/usr/bin/env bash
# G2 encrypted-stream sink. Receives pg_dump bytes on stdin and writes only ciphertext.
# Caller MUST supply a complete, consistent pg_dump stream; this is not an exporter.
set -euo pipefail
umask 077
: "${G2_PUBLIC_KEY_FILE:?Missing G2_PUBLIC_KEY_FILE}"
: "${G2_OUTPUT_DIR:?Missing G2_OUTPUT_DIR}"
: "${G2_EXPECTED_FPR:?Missing G2_EXPECTED_FPR}"
[[ "$G2_EXPECTED_FPR" =~ ^[0-9A-Fa-f]{40}$ ]] || { echo 'G2_BLOCKED=INVALID_FINGERPRINT' >&2; exit 2; }
[[ -f "$G2_PUBLIC_KEY_FILE" && ! -L "$G2_PUBLIC_KEY_FILE" ]] || { echo 'G2_BLOCKED=PUBLIC_KEY_UNAVAILABLE' >&2; exit 2; }
[[ -d "$G2_OUTPUT_DIR" && ! -L "$G2_OUTPUT_DIR" ]] || { echo 'G2_BLOCKED=OUTPUT_DIRECTORY_UNAVAILABLE' >&2; exit 2; }
[[ "$(stat -c %a "$G2_OUTPUT_DIR")" == 700 ]] || { echo 'G2_BLOCKED=OUTPUT_DIRECTORY_NOT_700' >&2; exit 2; }
tmp_home=$(mktemp -d /dev/shm/sparks-g2-pub.XXXXXX)
tmp_file=''
trap '[[ -n "$tmp_file" ]] && rm -f -- "$tmp_file"; rm -rf -- "$tmp_home"' EXIT
chmod 700 "$tmp_home"
gpg --batch --quiet --homedir "$tmp_home" --import "$G2_PUBLIC_KEY_FILE"
fpr=$(gpg --batch --homedir "$tmp_home" --with-colons --list-keys | awk -F: '$1=="fpr"{print $10; exit}')
[[ "${fpr^^}" == "${G2_EXPECTED_FPR^^}" ]] || { echo 'G2_BLOCKED=FINGERPRINT_MISMATCH' >&2; exit 2; }
stamp=$(date -u +%Y%m%dT%H%M%SZ)
tmp_file=$(mktemp "$G2_OUTPUT_DIR/.g2-$stamp.XXXXXXXX.enc")
# Pipe input directly to GPG. No plaintext file is created by this script.
gpg --batch --yes --homedir "$tmp_home" --trust-model always --recipient "$fpr" --encrypt --output "$tmp_file"
[[ -s "$tmp_file" ]] || { echo 'G2_BLOCKED=EMPTY_CIPHERTEXT' >&2; exit 2; }
final="$G2_OUTPUT_DIR/g2-$stamp-$$.pgdump.gpg"
mv -- "$tmp_file" "$final"
tmp_file=''
sha256sum "$final" > "$final.sha256"
chmod 600 "$final" "$final.sha256"
echo 'G2_ENCRYPTED_STREAM=PASS'
echo 'G2_PLAINTEXT_WRITTEN_BY_SINK=NO'
echo 'G2_SOURCE_CONSISTENCY=NOT_VERIFIED_BY_SINK'
