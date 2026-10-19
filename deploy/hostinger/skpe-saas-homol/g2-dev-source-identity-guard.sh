#!/usr/bin/env bash
# G2 connection identity guard. Never echoes the URI or its password.
set -euo pipefail
: "${G2_DATABASE_URL_FILE:?}"
[[ -f "$G2_DATABASE_URL_FILE" && ! -L "$G2_DATABASE_URL_FILE" ]] || exit 2
[[ "$(stat -c %a "$G2_DATABASE_URL_FILE")" == 600 ]] || exit 2
IFS= read -r uri < "$G2_DATABASE_URL_FILE"
# Supabase direct URI: db.<project-ref>.supabase.co; pooled URI:
# *.pooler.supabase.com with postgres.<project-ref> as database username.
ref=vumbfpbcozjebomcthdw
case "$uri" in
 postgresql://*|postgres://*) ;;
 *) echo 'G2_BLOCKED=INVALID_SCHEME'; exit 2 ;;
esac
# Reject newline, whitespace, shell metacharacters, and encoded alternate host delimiters.
[[ "$uri" != *[$'\r\n\t ']* ]] || { echo 'G2_BLOCKED=WHITESPACE'; exit 2; }
authority="${uri#*://}"
authority="${authority%%/*}"
authority="${authority%%\?*}"
[[ "$authority" == *@* ]] || { echo 'G2_BLOCKED=USERINFO_MISSING'; exit 2; }
userinfo="${authority%@*}"
hostport="${authority##*@}"
[[ "$userinfo" != *'@'* && "$hostport" != *'@'* ]] || { echo 'G2_BLOCKED=AMBIGUOUS_AUTHORITY'; exit 2; }
host="${hostport%%:*}"
case "$host" in
 "db.$ref.supabase.co")
   [[ "$userinfo" == postgres:* ]] || { echo 'G2_BLOCKED=UNEXPECTED_DIRECT_USER'; exit 2; }
   ;;
 *.pooler.supabase.com)
   [[ "$userinfo" == "postgres.$ref:"* ]] || { echo 'G2_BLOCKED=UNEXPECTED_POOLER_USER'; exit 2; }
   ;;
 *) echo 'G2_BLOCKED=PROJECT_HOST_MISMATCH'; exit 2 ;;
esac
[[ "$hostport" != *'%'* && "$hostport" != *'\\'* ]] || { echo 'G2_BLOCKED=AMBIGUOUS_HOST'; exit 2; }
echo 'G2_CONNECTION_PROJECT_IDENTITY=PASS'
echo 'G2_CONNECTION_REACHABILITY=NOT_TESTED'
