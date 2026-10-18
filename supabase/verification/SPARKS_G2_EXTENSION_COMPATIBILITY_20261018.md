# G2 | Matriz de compatibilidade PostgreSQL e extensoes - 2026-10-18

## Origem DEV (Supabase, consulta read-only)
- hypopg 1.4.1 em extensions
- index_advisor 0.2.0 em extensions
- pg_stat_statements 1.11 em extensions
- pg_trgm 1.6 em public
- pgcrypto 1.3 em extensions
- plpgsql 1.0 em pg_catalog
- supabase_vault 0.3.1 em vault
- uuid-ossp 1.1 em extensions

## Destino Hostinger (inventario previo)
- PostgreSQL 17.10, container postgresql-33th-postgresql-1.
- Extensoes identificadas previamente: citext, pg_trgm, pgcrypto, unaccent, uuid-ossp.
- NAO assumir suporte nativo a hypopg, index_advisor, supabase_vault, pg_stat_statements ou schemas Auth/Storage do Supabase.
- As extensoes instaladas em bancos existentes nao garantem disponibilidade em banco de ensaio; verificar pg_available_extensions e privileges em destino isolado, sem alterar bancos existentes.

## Implicacoes de migracao
- Backup fiel deve preservar schema/dados e manifestos originais. Nao descartar objetos dependentes de extensoes nao suportadas.
- Planejar compatibilidade de auth.uid(), RLS, roles, grants, funcoes, triggers, secrets e Vault antes da restauracao.
- Supabase Auth e Storage sao servicos gerenciados, nao apenas tabelas Postgres. Exigem camada substituta ou arquitetura de transicao validada.
- Nenhuma instalacao de extensao, alteracao de configuracao ou restauracao foi executada neste estudo.
- A consulta de dependencias pg_depend com classid pg_proc retornou zero para as extensoes; isto NAO prova ausencia de referencias indiretas em funcoes, views, triggers ou aplicacao.

## Gate de execucao
CLI automatizada continua com Invalid access token (2026-10-18 22:31Z). Nenhuma exportacao real. Usuario autorizou contingencia temporaria de custodia na mesma VPS, com preferencia por copia externa e retencao 30 dias.
