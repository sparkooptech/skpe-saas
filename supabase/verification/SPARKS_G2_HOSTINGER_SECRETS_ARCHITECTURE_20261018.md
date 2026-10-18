# G2 - Politica de segredos e recuperacao na Hostinger

Estado: arquitetura revisada, sem backup real nem chaves geradas.

1. O Windows RMKB-NTB NAO precisa de BitLocker/GPG como condicao para prosseguir com as etapas de preparacao na VPS. O script `g2-key-readiness.ps1` e uma checagem apenas para a hipotese de guardar chave privada no Windows, nao um gate global de G2.
2. Hostinger VPS tem `systemd-creds`, `gpg`, `openssl` e `cryptsetup`. A pasta `/root/sparks-g2-secure-staging` existe vazia com permissao 700. Nenhum cofre ou segredo operacional foi criado.
3. Segredos de servico podem permanecer na Hostinger com permissoes restritas, sem aparecer em CLI, logs, shell history, Git ou conversas. Evitar imprimir `supabase db dump --dry-run`, que revelou PGPASSWORD temporario.
4. Backups reais DEV devem ser cifrados ANTES de chegar ao armazenamento persistente. Um diretório 700 sozinho nao oferece criptografia em repouso.
5. Nao guardar exclusivamente na mesma VPS a unica chave capaz de recuperar os backups. Definir copia de recuperacao protegida independente da VPS e testar restauracao de amostra sintetica antes de dados reais.
6. A origem PRD continua nao confirmada; o escopo DEV `vumbfpbcozjebomcthdw` foi autorizado, mas nao equivale a autorizacao de cutover.
7. Nao instalar software, habilitar criptografia de disco, reiniciar servicos, alterar Postgres compartilhado, copiar dados ou criar volumes sem preflight e aprovacao apropriada.
8. Prosseguir com desenho de streaming criptografado, validacao de acesso ao Supabase, Auth/Storage e politica de custodia. G2 permanece PENDENTE de backup/restore.
