# G2 | Diagnostico seguro de autenticacao CLI
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
Set-Location $root
$expected = 'vumbfpbcozjebomcthdw'
$linked = (Get-Content 'supabase\.temp\project-ref' -Raw).Trim()
if ($linked -ne $expected) { throw 'Projeto vinculado difere do DEV aprovado.' }
$cli = Get-Command supabase -ErrorAction Stop
$tokenInProcess = [bool]$env:SUPABASE_ACCESS_TOKEN
$tokenInUser = [bool][Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN','User')
$tokenInMachine = [bool][Environment]::GetEnvironmentVariable('SUPABASE_ACCESS_TOKEN','Machine')
Write-Output 'Projeto DEV vinculado: OK'
Write-Output ('Token disponivel no processo: ' + $tokenInProcess)
Write-Output ('Token disponivel no perfil de usuario: ' + $tokenInUser)
Write-Output ('Token disponivel no perfil de maquina: ' + $tokenInMachine)
if (-not ($tokenInProcess -or $tokenInUser -or $tokenInMachine)) {
  Write-Output 'CLI: autenticacao interativa ou credential store ainda precisa ser validada.'
  Write-Output 'NAO exportar, copiar, imprimir ou persistir tokens para resolver este gate.'
}
Write-Output 'Proxima acao segura: executar supabase login no terminal interativo do usuario, sem compartilhar o token no chat, e repetir o preflight.'
