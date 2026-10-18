# G2 - Teste seguro e estritamente read-only da autenticacao Supabase CLI
$ErrorActionPreference = 'Stop'
$expected = 'vumbfpbcozjebomcthdw'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Set-Location $root
$linked = (Get-Content 'supabase\.temp\project-ref' -Raw).Trim()
if ($linked -ne $expected) { throw 'Projeto vinculado nao corresponde ao DEV aprovado.' }
$cli = (Get-Command supabase -ErrorAction Stop).Source
$old = $ErrorActionPreference
try {
  $ErrorActionPreference = 'Continue'
  $output = (& $cli projects list --output json 2>&1 | Out-String)
  $exit = $LASTEXITCODE
} finally { $ErrorActionPreference = $old }
if ($exit -eq 0 -and $output -match [regex]::Escape($expected)) {
  Write-Output 'G2_CLI_AUTH=PASS'
  exit 0
}
if ($output -match 'Invalid access token') {
  Write-Output 'G2_CLI_AUTH=INVALID_TOKEN'
} else {
  Write-Output 'G2_CLI_AUTH=OTHER_FAILURE'
}
Write-Output 'Nao imprimir token, nao executar dry-run e nao exportar dados reais.'
exit 2
