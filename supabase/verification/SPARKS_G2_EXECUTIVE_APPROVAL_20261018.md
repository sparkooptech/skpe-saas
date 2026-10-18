# SPARKs | G2 - Decisao executiva e ponto de aprovacao
Data: 2026-10-18
Escopo aprovado previamente: ensaio DEV skpe-saas-dev (vumbfpbcozjebomcthdw), condicionado a origem, capacidade, custo zero e nao interrupcao.
Estado: PRONTO PARA DECISAO DE CUSTODIA; SEM BACKUP OU RESTORE REAL.

## Fatos tecnicos comprovados
- DEV vinculado: vumbfpbcozjebomcthdw. Nao confundir com fonte PRD operacional.
- Supabase DEV: banco aproximado 54 MB, 28 usuarios Auth, 28 perfis, 37 memberships; 15 objetos Storage (metadados 2.505.987 bytes), quatro buckets privados; 4 Edge Functions.
- VPS Hostinger: aproximadamente 147 GB livres; staging /root/sparks-g2-secure-staging vazio, mode 700; GPG disponivel. Ensaio GPG sintetico encrypt/decrypt com cmp passou.
- Nenhuma copia fisica dos objetos Storage foi feita; metadados de tamanho nao comprovam integridade fisica.
- Supabase CLI: acesso intermitente na sessao automatizada; preflight passou em 21:52 e 22:11, mas voltou a falhar em 22:20. Revalidar imediatamente antes de qualquer exportacao.

## Modelo recomendado: criptografia assimetrica e recuperacao independente
- Gerar chave operacional GPG com passphrase forte sob custodia independente da VPS, em destino externo sob controle do usuario (cofre corporativo ou dispositivo criptografado). Nao gerar chave privada operacional na VPS para depois simplesmente confiar na copia local.
- Importar somente chave publica na VPS para criptografar o fluxo do backup. A chave privada nao deve estar disponivel na VPS.
- Guardar copia redundante da chave privada cifrada e sua passphrase em locais independentes; testar restauracao offline ANTES de extrair dados reais.
- Se o usuario optar por custodia apenas na Hostinger, registrar expressamente risco de perda simultanea de backup e chave e NAO declarar resiliencia contra perda da VPS.
- Segredos operacionais de conexao podem permanecer na Hostinger em cofre/arquivos restritos, fora do Git; nunca imprimir credenciais em logs ou linha de comando.

## Plano de execucao condicionado
1. Aprovar custodia e retencao dos backups; registrar responsavel e destino off-VPS. Testar recuperacao de chave sem dados reais.
2. Revalidar autenticacao Supabase e origem DEV; nao prosseguir se CLI retornar Invalid access token.
3. Revalidar espaco, carga, rede e custo; sem aquisicao de recursos adicionais.
4. Exportar banco de forma consistente, incluindo public/auth/storage e objetos gerenciados pelo Supabase, evitando vazamento de PGPASSWORD em dry-run.
5. Capturar bytes dos 15 objetos Storage via API autorizada, conferir hash/tamanho/bucket/ACL; incluir Edge Functions e configuracoes exportaveis.
6. Criptografar antes da persistencia de dados sensiveis; registrar hashes de ciphertext e manifestos sem PII.
7. Criar destino isolado NOVO; restaurar sem tocar em sparks_homol, sparks_prd ou outros produtos. Testar RLS, identidade e Storage; interromper em divergencia.
8. Preservar todas as evidencias e artefatos ate autorizacao de descarte.

## Aprovar antes de qualquer backup real
Pendente decisao do usuario:
(A) Custodia da chave privada fora da Hostinger em cofre corporativo / destino externo criptografado sob controle do usuario (recomendado).
(B) Custodia apenas na Hostinger, aceitando risco de recuperacao em caso de perda da VPS (nao recomendado).
Tambem confirmar prazo de retencao e local de segunda copia do backup cifrado. Sem essas definicoes, nao iniciar exportacao real.

## Limites
Nenhum push Git, deploy, migracao de schema, alteracao de usuario, configuracao de autenticacao, reinicio ou alteracao de servicos autorizados neste marco.
