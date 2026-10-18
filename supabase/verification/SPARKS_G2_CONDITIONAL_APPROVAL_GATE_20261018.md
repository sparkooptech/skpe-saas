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
