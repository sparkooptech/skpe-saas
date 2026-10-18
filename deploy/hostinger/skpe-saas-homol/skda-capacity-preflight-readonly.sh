#!/usr/bin/env bash
# SK-DA | Hostinger capacity and coexistence preflight (read-only, no credentials).
# Run from an authenticated VPS shell: bash skda-capacity-preflight-readonly.sh
set -uo pipefail

section() { printf '\n=== %s ===\n' "$1"; }
section 'Host and date'
date -u '+UTC %Y-%m-%dT%H:%M:%SZ'
hostname
uname -srm

section 'CPU and memory'
if command -v nproc >/dev/null 2>&1; then nproc; fi
if command -v free >/dev/null 2>&1; then free -h; fi
if command -v uptime >/dev/null 2>&1; then uptime; fi

section 'Disk and inode capacity'
df -hP / /var/lib/docker /docker 2>/dev/null || df -hP /
df -iP / /var/lib/docker /docker 2>/dev/null || df -iP /

section 'Docker runtime (no environment variables)'
if command -v docker >/dev/null 2>&1; then
  docker version --format 'Client={{.Client.Version}} Server={{.Server.Version}}' 2>/dev/null || true
  docker info --format 'CPUs={{.NCPU}} MemBytes={{.MemTotal}} RootDir={{.DockerRootDir}}' 2>/dev/null || true
  docker ps --format '{{.Names}} | {{.Image}} | {{.Status}}' 2>/dev/null || true
  section 'Container resource consumption'
  docker stats --no-stream --format '{{.Name}} | CPU={{.CPUPerc}} | RAM={{.MemUsage}}' 2>/dev/null || true
else
  printf 'Docker not found\n'
fi

section 'Listening TCP ports (no process command lines)'
if command -v ss >/dev/null 2>&1; then ss -lntH | awk '{print $4}' | sort -u; fi

section 'PostgreSQL client and server availability (no credentials)'
command -v pg_dump || true
command -v pg_restore || true
command -v psql || true
if command -v docker >/dev/null 2>&1; then
  docker ps --format '{{.Names}} | {{.Image}}' 2>/dev/null | grep -Ei 'postgres|supabase|traefik' || true
fi

section 'Result'
printf 'Read-only inventory complete. No files, containers, databases, volumes or ports were changed.\n'
