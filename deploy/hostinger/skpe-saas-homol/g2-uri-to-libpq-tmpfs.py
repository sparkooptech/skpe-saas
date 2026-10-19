#!/usr/bin/env python3
"""Convert a root-only PostgreSQL URI to libpq service and pgpass files in tmpfs."""
import os
import pathlib
import sys
from urllib.parse import urlsplit, unquote

if len(sys.argv) != 3:
    raise SystemExit("G2_BLOCKED=ARGUMENTS")
source = pathlib.Path(sys.argv[1])
destination = pathlib.Path(sys.argv[2])
if source.is_symlink() or source.stat().st_mode & 0o777 != 0o600:
    raise SystemExit("G2_BLOCKED=URI_FILE_PERMISSIONS")
if not str(destination).startswith("/dev/shm/"):
    raise SystemExit("G2_BLOCKED=NOT_TMPFS")
uri = source.read_text().strip()
parsed = urlsplit(uri)
if parsed.scheme not in ("postgresql", "postgres"):
    raise SystemExit("G2_BLOCKED=SCHEME")
host = parsed.hostname or ""
user = unquote(parsed.username or "")
password = unquote(parsed.password or "")
database = unquote(parsed.path.lstrip("/") or "postgres")
port = parsed.port or 5432
ref = "vumbfpbcozjebomcthdw"
direct = host == f"db.{ref}.supabase.co" and user == "postgres"
pooled = host.endswith(".pooler.supabase.com") and user == f"postgres.{ref}"
if not (direct or pooled) or not password:
    raise SystemExit("G2_BLOCKED=SOURCE_IDENTITY")
for value in (host, user, password, database):
    if any(c in value for c in "\r\n\x00"):
        raise SystemExit("G2_BLOCKED=CONTROL_CHAR")
for value in (host, user, database):
    if any(c in value for c in "=:"):
        raise SystemExit("G2_BLOCKED=INVALID_SERVICE_FIELD")
destination.mkdir(mode=0o700, exist_ok=False)
service = destination / "pg_service.conf"
pgpass = destination / "pgpass"
def write_private(path, value):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "w") as output:
        output.write(value)
write_private(service, f"[g2]\nhost={host}\nport={port}\nuser={user}\ndbname={database}\nsslmode=require\nconnect_timeout=15\n")
def escape_pgpass(s):
    return s.replace("\\", "\\\\").replace(":", "\\:")
write_private(pgpass, ":".join(escape_pgpass(v) for v in (host, str(port), database, user, password)) + "\n")
print("G2_LIBPQ_TMPFS=READY")
print("G2_URI_IN_PROCESS_ARGUMENTS=NO")
