# G2 | Preflight nao destrutivo, sem segredos em logs
$ErrorActionPreference = 'Stop'
$project = 'vumbfpbcozjebomcthdw'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Set-Location $root
$linked = (Get-Content 'supabase\.temp\project-ref' -Raw).Trim()
if ($linked -ne $project) { throw 'G2: projeto Supabase vinculado nao corresponde ao DEV aprovado.' }
$cli = Get-Command supabase -ErrorAction Stop
$ssh = Get-Command ssh -ErrorAction Stop
$projects = (& $cli.Source projects list 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0 -or $projects -notmatch [regex]::Escape($project)) { throw 'G2: autenticacao Supabase ou escopo DEV indisponivel.' }
$remote = (& $ssh.Source -o BatchMode=yes -o ConnectTimeout=8 sparkoop-hostinger 'test -d /root/sparks-g2-secure-staging && test -z "$(ls -A /root/sparks-g2-secure-staging)" && test "$(stat -c %a /root/sparks-g2-secure-staging)" = 700 && command -v gpg >/dev/null && command -v openssl >/dev/null && echo G2_REMOTE_READY' 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0 -or $remote -notmatch 'G2_REMOTE_READY') { throw 'G2: staging VPS nao esta vazio/protegido ou ferramentas ausentes.' }
Write-Output 'G2 PRE-FLIGHT OK: CLI autenticado, projeto DEV correto, SSH e staging vazio protegido.'
Write-Output 'G2 BACKUP BLOQUEADO: falta custodia de chave de recuperacao independente e exportacao consistente Auth/Storage.'
