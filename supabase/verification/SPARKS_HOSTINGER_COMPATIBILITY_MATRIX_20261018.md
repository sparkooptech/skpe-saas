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

## Inventario da origem DEV via conector Supabase - 2026-10-18
- Projeto acessivel: skpe-saas-dev (vumbfpbcozjebomcthdw), sa-east-1, ACTIVE_HEALTHY, PostgreSQL 17.6.1. A listagem do conector retorna somente esse projeto; NAO prova inexistencia de outro projeto ou da origem PRD fora da conta conectada.
- Catalogo pg_class (consultas read-only): public 219 tabelas e 11 views; auth 27 tabelas; storage 8 tabelas. Total 254 tabelas e 11 views nesses 3 schemas.
- pg_policies: public 247 politicas, storage 24, auth 0 (na consulta aos tres schemas). Total 271 politicas.
- pg_proc: public 788 funcoes, auth 4, storage 19. Total 811 entradas de funcoes, incluindo overloads e rotinas internas dos schemas.
- Edge Functions remotas ativas com verify_jwt=true: invite-platform-user (v2), create-platform-user (v4), lookup-address-by-cep (v2), skpe-import-incorporation (v11).
- Listagem aproximada de tabelas do conector mostra dados em auth.users, organizations, organization_memberships, skpe_journey_items, skpe_import_records e outras. Contagens aproximadas do conector nao substituem COUNT(*) transacional ou reconciliacao por tabela.
- Extensoes instaladas na origem incluem pgcrypto, uuid-ossp, pg_trgm, pg_stat_statements, supabase_vault, hypopg e index_advisor. vector, pgjwt, pg_net e pg_cron disponiveis, mas nao instaladas. Nao copiar automaticamente extensoes internas do Supabase para a Hostinger.
- O usuario declarou suspensao manual de entrada e manutencao de dados. Isso NAO e bloqueio tecnico de escrita e nao prova consistencia de snapshot.
- G1 continua aberto ate identificacao da origem efetiva de producao, inventario de buckets/objetos, grants, triggers, dependencias e estado das migracoes. G2 permanece nao homologado ate backup e RESTORE comprovado.

## Confirmacoes adicionais read-only na origem DEV - 2026-10-18
- supabase_migrations.schema_migrations: 308 migracoes aplicadas; maior version 20261007234118. Os 327 arquivos SQL locais nao equivalem a 327 migracoes aplicadas.
- storage.objects por bucket: organization-branding 11, sparks-evidence 1, user-avatars 3; total 15 registros de metadados de objetos. Integridade fisica e checksums ainda NAO validados. Consulta adicional de configuracao de buckets foi bloqueada pela seguranca da ferramenta.
- public: zero tabelas comuns/particionadas sem RLS habilitada entre 219 tabelas inspecionadas. Habilitacao de RLS nao comprova correcao das politicas.
- Contagens exatas no momento da consulta: auth.users 28, public.profiles 28, public.organization_memberships 37. Nao ha garantia de snapshot atomico entre consultas separadas.
- A suspensao manual de escrita comunicada pelo usuario nao impede jobs, APIs ou sessoes ativas de gravar; conferir congelamento efetivo antes de snapshot final.

## Integridade referencial de usuarios e evidencia - 2026-10-18
- auth.users: 28 total, 28 sem deleted_at. Usuarios sem public.profiles correspondente: 0. public.organization_memberships sem auth.users correspondente: 0.
- Storage: consulta read-only de metadados identificou 15 objetos nos 3 buckets. A unica public.sparks_evidence_versions com storage_bucket e storage_path preenchidos corresponde a um registro storage.objects: 1 referencia, 0 sem correspondencia. Isso nao prova existencia fisica, integridade binaria ou capacidade de download do arquivo.
- A lista de objetos inclui um PDF de evidencia de balancete 2025; nao registrar caminhos ou dados do documento em logs publicos. Preservar classificacao, autorizacao, confidencialidade e hashes ao migrar.
- Todos os resultados refletem consultas distintas, sem snapshot atomico. G2 exige exportacao consistente, copia de objetos e ensaio de restauracao isolado.
