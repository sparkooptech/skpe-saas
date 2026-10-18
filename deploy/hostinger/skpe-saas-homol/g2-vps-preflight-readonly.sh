# G2 | Read-only Hostinger capacity and cryptography preflight
# No secrets, backups, database writes or service changes.
set -eu
STAGING=/root/sparks-g2-secure-staging
[ -d "$STAGING" ] || { echo 'FAIL: staging missing'; exit 1; }
[ "$(stat -c %a "$STAGING")" = 700 ] || { echo 'FAIL: staging mode is not 700'; exit 1; }
[ "$(find "$STAGING" -mindepth 1 -maxdepth 1 | wc -l)" -eq 0 ] || { echo 'FAIL: staging not empty'; exit 1; }
command -v gpg >/dev/null
command -v openssl >/dev/null
command -v sha256sum >/dev/null
command -v flock >/dev/null
FREE_KIB=$(df -Pk / | awk 'NR==2 {print $4}')
[ "$FREE_KIB" -gt 1048576 ] || { echo 'FAIL: insufficient disk space'; exit 1; }
echo 'G2_HOSTINGER_READONLY_OK'
echo "DISK_FREE_KIB=$FREE_KIB"
echo 'STAGING_EMPTY=true'
echo 'STAGING_MODE=700'
echo 'BACKUP_REAL=not_started'
echo 'RESTORE_REAL=not_started'
