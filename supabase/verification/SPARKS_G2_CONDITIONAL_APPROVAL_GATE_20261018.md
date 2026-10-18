# SPARKs | G2 - Registro de precondicoes e autorizacao condicional

Data: 2026-10-18
Autorizacao do usuario: preparar e executar ensaio G2 SOMENTE se origem correta confirmada, capacidade disponivel e nenhum custo adicional.
Status: NAO INICIADO backup/restore. Bloqueios de precondicao permanecem.

## Evidencias verificadas
- Supabase conectado lista somente projeto skpe-saas-dev (ref vumbfpbcozjebomcthdw). Isso NAO comprova que e a origem definitiva de producao.
- apps/web/.env.local usa a mesma referencia DEV. apps/web/.env.example nao identifica origem.
- Workflow .github/workflows/deploy-skpe-saas-homol.yml injeta URL por secret SKPE_SAAS_HOMOL_SUPABASE_URL; valor nao consultado. Portanto, o endpoint efetivamente implantado nao foi confirmado.
- SSH nao interativo de RMKB-NTB para alias sparkoop-hostinger recusado com Permission denied (publickey,password); exit code 255. Nao repetir por outros meios para contornar autenticacao.
- Inventario historico da VPS indica espaco livre, mas capacidade efetiva sob carga e recursos para restore isolado NAO foram revalidados nesta sessao.
- A conexao atual Supabase oferece consultas SQL, mas nao foi comprovado um canal de exportacao consistente com papeis/privilegios e copia binaria de Storage. Nao chamar dump SQL avulso de backup restauravel.

## Decisao de seguranca
- Nao executar backup, copiar dados pessoais, criar banco/volume/servico ou iniciar restore enquanto origem, acesso, capacidade e custo nao estiverem comprovados.
- Nao usar outros bancos existentes como destino; nao alterar Supabase ou Hostinger operacionais.
- Nao assumir que pausa manual de lancamentos equivale a bloqueio tecnico de escrita.
- Preservar identidades, UUIDs, papeis, SUPER-ADMIN e politicas de tenant.

## Evidencias faltantes para liberar ensaio
1. Confirmacao inequivoca da origem operacional correta e identificador do projeto, com concordancia entre aplicacao implantada e origem.
2. Acesso autorizado e funcional ao Hostinger pelo RMKB-NTB, ou canal administrativo formal que permita ensaio segregado.
3. Preflight atualizado de CPU, RAM, disco, I/O e espaco para backup + restauracao, sem upgrade ou novo custo.
4. Metodo de backup consistente e criptografado, exportacao de objetos binarios e validacao de checksums; destino temporario isolado e politica de descarte aprovada.
5. Confirmacao de ausencia de custo adicional e de que nao ha mudanca de producao.

A aprovacao condicional continua valida; este registro nao solicita autorizacao para qualquer operacao fora dessas condicoes.

## Confirmacao adicional do usuario - 2026-10-18 20:14:34Z
- O usuario confirmou expressamente que o projeto Supabase `skpe-saas-dev` (ref `vumbfpbcozjebomcthdw`) e objeto da transicao para Hostinger.
- G2: escopo da origem DEV confirmado. NAO inferir que este seja o unico projeto operacional ou o endpoint da aplicacao publicada; conferir implantacao separadamente.
- Ainda bloqueado: acesso SSH autorizado e funcional, preflight atualizado de capacidade, metodo de backup consistente e comprovacao de custo zero.
- A autorizacao condicional do ensaio ja foi concedida; nao pedir novamente a mesma aprovacao quando as precondicoes forem satisfeitas.

## Preflight retomado apos SSH - 2026-10-18 20:24Z
- SSH BatchMode de RMKB-NTB para Hostinger FUNCIONAL apos usuario carregar chave no ssh-agent.
- VPS: 4 vCPU, RAM 15GiB total/12GiB disponivel, disco raiz 193GB/147GB livre (25% usado), carga 1m 2.69. Amostra pontual, nao prova headroom sustentado.
- Docker: 31 conteineres ativos, imagens 8.737GB, volumes 10.46GB, build cache 4.255GB; nao executar prune/limpeza.
- Amostra CPU Docker: postgres compartilhado 66.61%, extrator-api-homol 36.45%, extrator-web-homol 20.36% de um nucleo, nao medias de longo prazo.
- Hostinger pg_dump/psql 17.10 disponiveis. Supabase origem PostgreSQL 17, db 54MB, 219 tabelas public, 15 objetos metadata Storage. Tamanho fisico dos objetos NAO verificado.
- CLI Supabase local 2.116.0, linked project-ref correto, mas `supabase projects list` falha com `Invalid access token`. Nao ha DATABASE_URL/SUPABASE_DB_PASSWORD/SUPABASE_ACCESS_TOKEN/PGPASSWORD definidos no ambiente do processo verificado. Sem credencial de exportacao validada.
- Resultado: G2 preflight de infraestrutura parcial; backup e restore NAO executados. Bloqueio atual e canal de exportacao autenticado/consistente e inventario de bytes Storage, alem de limites de carga e custo comprovados.
- Proxima acao humana segura: renovar login CLI pelo proprio usuario (`supabase login`), sem enviar token ao chat, e confirmar `supabase projects list`. Nao confundir acesso API com credenciais de banco necessarias para dump.

## Preflight adicional - 2026-10-18 20:33Z
- Supabase CLI autenticado, projeto vinculado e confirmado pelo comando projects list no repositorio canonico.
- `supabase db dump --dry-run` imprime PGPASSWORD temporario em texto claro; PROIBIDO usar dry-run em logs, tickets, console compartilhado ou commits. Credencial ja exposta na saida operacional deve ser tratada como comprometida ate invalidacao/expiracao.
- Volume C: do RMKB-NTB: BitLocker FullyDecrypted, ProtectionStatus Off, 0% criptografia. NAO guardar dump bruto no C:.
- VPS Hostinger: raiz ext4, gpg e openssl presentes; nao ha confirmacao de criptografia em repouso ou chave publica de destinatario aprovada.
- Repositorio agora ignora supabase/verification/g2-backups/, *.dump, *.backup, *.pgdump e respectivas variantes .gpg; isso evita commit acidental, mas NAO substitui criptografia ou controle de acesso.
- PostgreSQL compartilhado nao tem role postgres local disponivel; evitar presumir credenciais/roles. Nenhuma modificacao no PostgreSQL da Hostinger.
- G2 backup/restore ainda NAO executados: faltam metodo de exportacao consistente sem vazamento de segredo, chave/destino de guarda criptografada e verificacao de bytes dos objetos Storage.

## Preparacao VPS para armazenamento criptografado - 2026-10-18 21:10Z
- Usuario solicitou avancar apos proposta de preparar armazenamento na propria VPS sem custo adicional.
- Criado SOMENTE diretorio vazio `/root/sparks-g2-secure-staging` na VPS Hostinger; `drwx------ root:root`, permissoes 700, sem dados copiados.
- VPS: 147GB livres, 12GiB RAM disponivel, 31 conteineres; carga 1m 3.71 em 4 vCPU (amostra, risco de concorrencia). Sistema de arquivos ext4, sem evidencia de criptografia de volume.
- gpg e openssl disponiveis, mas keyring GPG root nao tem destinatario publico configurado. Diretorio com chmod 700 NAO e armazenamento criptografado.
- PROIBIDO exportar dump ou objetos brutos para este diretorio ate chave publica de destinatario aprovada, recuperacao comprovada fora da VPS, fluxo streaming-encrypt sem arquivos temporarios plaintext, e verificacao de exportabilidade Auth/Storage.
- Nenhum backup, dump, restauracao, servico, volume Docker ou banco foi criado/alterado. Pasta vazia nao deve ser removida sem autorizacao.

## Teste sintetico de criptografia em memoria - 2026-10-18 21:19Z
- OpenSSL 3.0.13 e GnuPG 2.4.4 na VPS. `systemd-creds has-tpm2` indica suporte parcial, sem garantia de portabilidade de recuperacao.
- Teste de pipe `printf synthetic-G2-only | openssl enc -aes-256-cbc -pbkdf2 -salt ... | openssl enc -d ... | sha256sum` comparado com hash SHA-256 do original: 437c24da5f0a3018bc58a68d8eef439ab08e1ec56ffbcd0696c0d7aa0f1295df; iguais.
- Senha do teste e apenas literal sintetico publico, NUNCA usar como segredo real. AES-CBC neste comando nao fornece autenticidade; nao adotar como formato final de backup sem projeto de AEAD/integridade e gestao de chaves.
- Nenhum arquivo gravado no staging; conteudo da pasta permanece 0 entradas. Nenhum dado real, backup ou restore executado.
- Proximos gates: recuperacao independente da VPS, custodia de chaves, exportacao Auth/Storage consistente, snapshot, limites de CPU, isolamento e reconcilicao.

## Dimensionamento de origem DEV - 2026-10-18 21:21Z
- Consulta SQL read-only no projeto vumbfpbcozjebomcthdw: banco 54 MB; 15 objetos Storage com metadata.size numerico em todos; soma declarada 2.505.987 bytes (aprox. 2,39 MiB); 28 usuarios auth.
- Consulta sob role postgres confirma SELECT em auth.users e storage.objects, mas isso nao demonstra exportacao completa de dados Auth, hashes, roles, grants, nem bytes fisicos Storage.
- Estimativa baseada em metadados, nao checksum de arquivos nem tamanho de dump final. Nao assumir equivalencia de componentes Supabase internos na Hostinger.
- Nenhum backup ou restore real executado; staging continua sem arquivos de dados. Capacidade de disco nao e gargalo principal do ensaio DEV; exportacao consistente, chaves recuperaveis e integridade ainda sao gates.

## Novo inventario e preflight automatizado - 2026-10-18 21:28Z
- Storage DEV: organization-branding 11/1.431.110 bytes, sparks-evidence 1/320.735, user-avatars 3/754.142, methodology-artifacts 0/0; todos privados. Soma 15 objetos/2.505.987 bytes (metadados, nao leitura fisica).
- Script `deploy/hostinger/skpe-saas-homol/g2-preflight-no-secrets.ps1` criado para verificar escopo DEV, Supabase CLI, SSH, staging vazio e permissoes sem imprimir segredos ou executar dump.
- Executado sob sessao remota Desktop Commander: CLI retorna `Invalid access token` nessa sessao, embora usuario tenha obtido `projects list` autenticado em terminal interativo. Logo, autenticacao NAO esta comprovada no contexto nao interativo de execucao; NAO contornar via extracao de tokens.
- Backup/restore G2 nao executados. Proximo passo: resolver diferenca de sessao CLI sem expor tokens e estabelecer recuperacao independente da VPS.

## Diagnostico de autenticacao CLI - 2026-10-18 21:38Z
- RMKB-NTB usuario Windows RMKB; HOME C:\\Users\\RMKB; CLI supabase 2.116.0 via scoop.
- Sem SUPABASE_ACCESS_TOKEN em Process/User/Machine; ~/.supabase contem traces e telemetry.json, nao arquivo access-token. Nao foram impressos tokens.
- SSH BatchMode Hostinger funciona. Supabase CLI `projects list` retornou Invalid access token em processo remoto. O projeto DEV continua vinculado localmente, mas link nao equivale a sessao autenticada.
- Novo script de diagnostico sem leitura de credenciais: `deploy/hostinger/skpe-saas-homol/g2-cli-auth-diagnostic.ps1`.
- Nao tentar contornar com extracao de tokens de browser, keyring ou logs. Solicitar autenticacao interativa apenas se necessaria para dump. Nao houve dump real.

## VPS preflight homologado e auth instavel - 2026-10-18 22:04Z
- Executado `g2-vps-preflight-readonly.sh` por SSH com stdin de ProcessStartInfo e LF preservado: exit code 0, staging vazio, mode 700, GPG/OpenSSL/sha256sum/flock presentes, 153270864 KiB livres no momento do teste.
- Em verificacao posterior, `supabase projects list --output json` retornou novamente Invalid access token (exit 1) na sessao de automacao. O resultado anterior 21:52 de exit 0 nao deve ser tratado como autenticacao permanente. Nenhum token foi exibido ou copiado.
- Nao executar dump ate acesso estavel e custodia de chave independente. Nenhum backup/restore real executado.
