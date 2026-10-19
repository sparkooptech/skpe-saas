#!/usr/bin/env bash
# Run from an interactive Hostinger SSH terminal (not through logged automation).
# Reads the DEV database URL without echo and stores it only on the Hostinger VPS.
set -euo pipefail
umask 077
base=/root/sparks-g2-secure-staging
target="$base/dev-db-url"
[[ -t 0 && -t 1 ]] || { echo 'G2_BLOCKED=INTERACTIVE_TTY_REQUIRED'; exit 2; }
[[ -d "$base" && "$(stat -c %a "$base")" == 700 ]] || { echo 'G2_BLOCKED=STAGING_NOT_PRIVATE'; exit 2; }
[[ ! -e "$target" && ! -L "$target" ]] || { echo 'G2_BLOCKED=CONNECTION_ALREADY_PRESENT'; exit 2; }
printf 'Paste the Supabase DEV PostgreSQL URI (input hidden): ' >&2
IFS= read -r -s uri
printf '\n' >&2
[[ "$uri" == postgresql://* || "$uri" == postgres://* ]] || { echo 'G2_BLOCKED=INVALID_URI_SCHEME'; exit 2; }
# Reject whitespace/control characters; the project host must be verified separately.
[[ "$uri" != *[$'\r\n\t ']* ]] || { echo 'G2_BLOCKED=INVALID_URI_WHITESPACE'; exit 2; }
tmp=$(mktemp "$base/.dev-db-url.XXXXXXXX")
trap 'rm -f "$tmp"' EXIT
chmod 600 "$tmp"
printf '%s\n' "$uri" > "$tmp"
unset uri
mv -n -- "$tmp" "$target"
trap - EXIT
echo 'G2_DEV_CONNECTION_FILE=CREATED_ON_HOSTINGER'
echo 'G2_DB_CREDENTIAL_PRINTED=NO'
echo 'G2_SOURCE_HOST=REQUIRES_INDEPENDENT_VERIFICATION'
echo 'G2_BACKUP_REAL=NOT_EXECUTED'
