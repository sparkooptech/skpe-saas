# SPARKs | Matriz de compatibilidade Supabase para Hostinger | 2026-10-18

Status: levantamento parcial, somente leitura. NENHUMA migracao executada. Vinculado a SPARKS_HOSTINGER_FULL_MIGRATION.md.

## Evidencias confirmadas
- VPS srv1890340: 4 CPUs logicas, 15 GiB RAM total, ~12 GiB disponivel, disco raiz 193 GB com ~147 GB livres. 31 containers ativos na amostra. Carga media de 1 minuto observada 4,63: requer monitoramento historico.
- PostgreSQL principal: container postgresql-33th-postgresql-1, PostgreSQL 17; bancos sparks_homol e sparks_prd preexistentes, ambos sem tabelas de usuario (consulta pg_class para relkind r/p). Nao foram modificados.
- Extensoes disponiveis em sparks_homol: citext 1.6, pg_trgm 1.6, pgcrypto 1.3, unaccent 1.1, uuid-ossp 1.1; nao instaladas nesse banco. vector e pgjwt nao apareceram na consulta.
- Infra existente: Keycloak 26.5.0, RustFS, Traefik, sparks-homol, extrator, PRODUZ, NEXUS e outros. Reuso depende de isolamento e provas de compatibilidade.
- Repositorio canonico RMKB-NTB C:\DADOS\SPARKs\skpe-saas: 327 arquivos SQL de migracao (contagem de arquivos, nao aplicacao no banco).
- Varredura textual SQL: auth.uid() 1364 referencias em 195 arquivos; storage.objects 56 em 7 arquivos; create extension 5 em 5 arquivos. Nao encontrados termos vector, pgjwt, pg_net, cron. ou auth.jwt() na varredura.
- Varredura textual frontend: supabase.auth 11 referencias/4 arquivos; supabase.storage 34/10; supabase.functions 13/3; supabase.rpc 365/83; supabase.from 30/11. Contagens textuais, nao numero de contratos independentes.
- Configuracao preparatoria apps/web/src/lib/sparksBackendConfig.ts suporta target supabase-managed (padrao) ou hostinger-compatible, mas nao implementa backend substituto.

## Matriz de compatibilidade e lacunas
| Camada | Origem Supabase | Destino candidato | Classificacao | Gate |
| --- | --- | --- | --- | --- |
| PostgreSQL dados e schemas | DB gerenciado, migrations e dados reais | PostgreSQL 17 sparks_homol | Adaptacao e reconciliacao necessarias; destino vazio | G1/G2/G3/G4 |
| Extensoes | pgcrypto e outras dependencias | Extensoes disponiveis mas nao habilitadas | Compatibilidade parcial; conferir origem real | G1/G3 |
| RLS e identidade SQL | auth.uid() e papeis authenticated | API autenticada + claims validados + contexto transacional seguro | BLOQUEADOR ate prova de equivalencia; nunca bypass RLS | G3/G5 |
| Auth e sessoes | Supabase Auth | Keycloak existente | BLOQUEADOR: usuarios, IDs, reset, convites, MFA, refresh, JWT, logout e email | G1/G3/G5 |
| APIs e RPC | supabase-js, PostgREST e centenas de RPC | Gateway/PostgREST/API compativel | BLOQUEADOR: contratos e privilegios | G1/G3/G5 |
| Storage | Supabase Storage e storage.objects | RustFS + servico de metadados/ACL | BLOQUEADOR: buckets, URLs assinadas, metadados, ACL, checksum | G1/G3/G4/G5 |
| Edge Functions | supabase.functions | Servicos HTTP isolados | BLOQUEADOR: inventario endpoints, secrets, auth e CORS | G1/G3/G5 |
| Realtime/eventos | A verificar | A definir se necessario | Pendente de inventario | G1 |
| Super-admin | rr.gestao@gmail.com, super_admin | Identidade e RBAC protegidos | BLOQUEADOR: preservacao de identidade, protecao contra remocao/rebaixamento, auditoria e testes negativos | G3/G5 |
| Backup/restore | Origem Supabase | Destino Hostinger + rollback | BLOQUEADOR: restore comprovado e RPO/RTO definidos | G2/G6 |
| Frontend | Vite/Supabase | Hostinger HTTPS | Preparacao de configuracao apenas, sem cutover | G3/G5/G6 |

## Sequencia segura
1. G0: coletar series temporais CPU, I/O, memoria, backup e uso real sem mutacao.
2. G1: inventario Supabase efetivamente aplicado (nao confundir com 327 SQL locais); catalogar Edge Functions, buckets, auth, RLS, RPC, views, grants e dependencias.
3. G2: backups verificados, teste de restauracao isolado e rollback documentado ANTES de aplicar migracoes.
4. G3: prototipo isolado de autenticacao e API/RLS com dados sinteticos; validar isolamento cross-tenant e super-admin.
5. Somente apos autorizacao: preparar destino, reconciliar dados e objetos, homologar e propor cutover reversivel.

## Restricoes
Nao alterar sparks_prd, sparks_homol, sparks-homol, outros bancos/containers, Supabase, DNS ou usuarios sem gates e autorizacao apropriados. Nao adicionar custos. Nao tocar em alteracoes paralelas SK-PE nao commitadas.

## Complemento de inventario G1 - 2026-10-18
- Supabase CLI local: 2.116.0; PostgreSQL major_version = 17 no config.toml; API publica schemas public e graphql_public e search_path adicional public, extensions.
- Edge Functions encontradas no repositorio: create-platform-user, invite-platform-user, lookup-address-by-cep, skpe-import-incorporation. Inventario LOCAL, nao confirma que estejam implantadas na origem remota.
- Criacao/convite de usuarios e importacao SK-PE sao contratos que exigem prova de equivalencia, seguranca e auditoria no destino.
- O estado efetivo das migracoes e os objetos da origem Supabase ainda precisam ser consultados de forma read-only. Os 327 arquivos locais nao comprovam 327 migracoes aplicadas.
- O banco de homologacao e o banco de producao Hostinger nao receberam migracoes; nenhum teste de restauracao foi executado.
- As tentativas adicionais de inspecao automatica foram parcialmente bloqueadas por controles de seguranca da ferramenta; nao houve contorno de bloqueios.
