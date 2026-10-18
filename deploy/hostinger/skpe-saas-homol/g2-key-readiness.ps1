# G2 | Preparacao de chave de recuperacao (sem gerar segredos)
# Executar somente no RMKB-NTB, em PowerShell, apos habilitar protecao em repouso.
# Este script nao cria chaves, nao envia arquivos e nao altera servicos.
$ErrorActionPreference = 'Stop'
$volume = Get-BitLockerVolume -MountPoint 'C:'
if ($volume.ProtectionStatus -ne 'On' -or $volume.VolumeStatus -ne 'FullyEncrypted') {
  throw 'G2 BLOQUEADO: unidade C: nao esta totalmente criptografada e protegida por BitLocker. Nao criar chave privada neste disco.'
}
$gpg = Get-Command 'gpg.exe' -ErrorAction SilentlyContinue
if (-not $gpg) { throw 'G2 BLOQUEADO: GPG nao encontrado no RMKB-NTB. Instale e valide o Gpg4win por canal oficial antes de gerar a chave.' }
Write-Output 'G2 PRECONDICOES LOCAIS OK: volume protegido e GPG presente.'
Write-Output 'Proximo gate: definir recuperacao offline da chave privada e testar descriptografia de arquivo sintetico antes de backup real.'
