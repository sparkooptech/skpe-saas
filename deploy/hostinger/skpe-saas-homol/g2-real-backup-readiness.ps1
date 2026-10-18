# G2 - Fail-closed readiness gate for real encrypted backup
# This script does NOT export any data or read private keys.
param(
  [Parameter(Mandatory=$true)][string]$PublicKeyPath,
  [Parameter(Mandatory=$true)][string]$CustodyReceiptPath
)
$ErrorActionPreference='Stop'
$expected='vumbfpbcozjebomcthdw'
$root=(Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Set-Location $root
$linked=(Get-Content 'supabase\.temp\project-ref' -Raw).Trim()
if($linked -ne $expected){throw 'G2_BLOCKED: wrong linked project'}
if(-not (Test-Path -LiteralPath $PublicKeyPath -PathType Leaf)){throw 'G2_BLOCKED: public key missing'}
if(-not (Test-Path -LiteralPath $CustodyReceiptPath -PathType Leaf)){throw 'G2_BLOCKED: custody receipt missing'}
$receipt=Get-Content -LiteralPath $CustodyReceiptPath -Raw | ConvertFrom-Json
if($receipt.project_ref -ne $expected){throw 'G2_BLOCKED: custody project mismatch'}
if($receipt.private_key_recovery_tested -ne $true){throw 'G2_BLOCKED: recovery not verified'}
if($receipt.private_key_stored_off_unencrypted_windows_disk -ne $true){throw 'G2_BLOCKED: unsafe private key custody'}
if([string]::IsNullOrWhiteSpace($receipt.key_fingerprint)){throw 'G2_BLOCKED: missing fingerprint'}
if([string]::IsNullOrWhiteSpace($receipt.recovery_evidence)){throw 'G2_BLOCKED: missing recovery evidence'}
$public=Get-Content -LiteralPath $PublicKeyPath -Raw
if($public -notmatch '-----BEGIN PGP PUBLIC KEY BLOCK-----'){throw 'G2_BLOCKED: not an armored GPG public key'}
$cli=(Get-Command supabase -ErrorAction Stop).Source
$old=$ErrorActionPreference
try {
 $ErrorActionPreference='Continue'
 $output=(& $cli projects list --output json 2>&1 | Out-String)
 $exit=$LASTEXITCODE
} finally {$ErrorActionPreference=$old}
if($exit -ne 0 -or $output -notmatch [regex]::Escape($expected)){throw 'G2_BLOCKED: Supabase CLI authentication unavailable'}
Write-Output 'G2_REAL_BACKUP_PREFLIGHT=PASS'
Write-Output 'G2_REAL_BACKUP_EXECUTED=NO'
