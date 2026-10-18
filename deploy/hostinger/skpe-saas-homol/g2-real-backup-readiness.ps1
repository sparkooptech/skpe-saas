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
# Inspect the actual OpenPGP public-key fingerprint, not only its ASCII armor.
$gpg=(Get-Command gpg -ErrorAction SilentlyContinue)
if(-not $gpg){throw 'G2_BLOCKED: GPG executable unavailable for fingerprint verification'}
$keyDetails=(& $gpg.Source --batch --no-default-keyring --with-colons --import-options show-only --import $PublicKeyPath 2>$null | Out-String)
if($LASTEXITCODE -ne 0){throw 'G2_BLOCKED: public key cannot be parsed by GPG'}
$fingerprints=@($keyDetails -split "`n" | Where-Object {$_ -match '^fpr:'} | ForEach-Object {($_ -split ':')[9].Trim()})
$expectedFingerprint=([string]$receipt.key_fingerprint).Trim().ToUpperInvariant()
if($expectedFingerprint -notmatch '^[0-9A-F]{40}$'){throw 'G2_BLOCKED: invalid custody fingerprint format'}
if($fingerprints.Count -lt 1 -or $fingerprints[0].ToUpperInvariant() -ne $expectedFingerprint){throw 'G2_BLOCKED: public key fingerprint differs from custody receipt'}
# Custody receipt remains an attestation: independently verified recovery evidence is required operationally.
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
