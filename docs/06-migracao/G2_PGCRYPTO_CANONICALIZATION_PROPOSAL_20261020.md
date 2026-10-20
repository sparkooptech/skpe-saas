---
titulo: Proposta de Canonicalizacao do pgcrypto no schema extensions
data: 2026-10-20
estado: proposta validada em copia isolada; migration canonica nao criada
escopo: SPARKs / SK-PE / SK-DA
---

# Objetivo

Corrigir de forma idempotente a dependencia de funcoes canonicas que chamam `extensions.digest(...)`, sem reescrever migrations historicas e sem assumir que `pgcrypto` esteja ausente.

# Evidencia do problema

O HEAD atual contem:
- `20260725031733_create_organizational_foundation.sql`: `create extension if not exists "pgcrypto";`
- `20260728054500_generate_portability_json_manifest.sql`: `create extension if not exists pgcrypto;`
- `20260728061000_fix_portability_json_pgcrypto_schema.sql`: cria `extensions` e usa `create extension if not exists pgcrypto with schema extensions`
- `20260730100000_create_strategic_monitoring_governance_and_learning.sql`: repete `create extension if not exists pgcrypto with schema extensions`

O PostgreSQL 17.11 usado na integracao tem `search_path="$user", public`. O arquivo de controle do pgcrypto declara `relocatable = true`. Assim, uma instalacao anterior em `public` nao e realocada por um comando posterior `CREATE EXTENSION IF NOT EXISTS ... WITH SCHEMA extensions`.

A V5 restaurada, o clone homologado e a prova de recovery nao possuem pgcrypto nem schema extensions, embora funcoes como `generate_portability_json_export` e `close_skpe_monitoring_cycle` chamem `extensions.digest`. A copia de integracao reproduziu a falha ate a instalacao autorizada de pgcrypto 1.3 em extensions.

# Rascunho validado

O SQL de rascunho esta fora de `supabase/migrations`:
`deploy/hostinger/skpe-saas-homol/g2-pgcrypto-canonical-reconciliation-DRAFT.sql`

Comportamento proposto:
1. criar o schema extensions apenas se ausente;
2. se pgcrypto estiver ausente, instalar no schema extensions;
3. se pgcrypto estiver em outro schema, realocar com `ALTER EXTENSION pgcrypto SET SCHEMA extensions`;
4. se ja estiver em extensions, nao alterar;
5. abortar se `extensions.digest(bytea,text)` nao estiver disponivel ao final.

Nao se propoe editar migrations historicas. Quando autorizado, a migration deve ser criada pelo CLI instalado usando `supabase migration new <nome>`, e somente entao receber o SQL validado.

# Ensaios realizados

Todos os cenarios foram executados somente na copia de integracao e terminaram com ROLLBACK:
- idempotencia: pgcrypto ja em extensions -> aprovado;
- realocacao temporaria public -> extensions -> aprovado;
- ausencia temporaria da extensao -> criacao em extensions -> aprovado.

Em todos, `digest(...,'sha256')` retornou hash de 64 caracteres e o estado persistente final permaneceu pgcrypto 1.3 em extensions.

# Seguranca e preservacao

Estado atual confirmado:
- ACL canonica: 4.805 entradas;
- V5: 4.809 entradas;
- diferenca de 4 entradas = G2-HIER-01, exatamente os EXECUTE removidos de anon/authenticated sobre duas funcoes de hierarquia;
- grants diretos desses helpers na integracao: 0;
- tabelas: 254;
- politicas RLS: 271;
- anon USAGE em extensions: false;
- authenticated USAGE em extensions: false.

A metrica 4.805 usa exatamente os ACLs explicitos de schemas/relacoes/funcoes nos schemas public/auth/storage mais pg_default_acl, conforme `verify-integration-baseline.py`. Objetos do schema extensions nao entram nessa metrica.

# Compatibilidade Supabase 2026

A documentacao atual do Supabase informa que a maioria das extensoes e instalada sob o schema `extensions`. O changelog de PostgreSQL 17.11 alerta para pgcrypto apenas quanto a cifras PGP legadas; o uso atual do SPARKs e `digest(...,'sha256')`, portanto esse alerta nao exige reprocessamento dos hashes aqui. A politica atual tambem desencoraja pinagem explicita de versao; o rascunho nao especifica VERSION.

# Gate

Nao realizado:
- nenhuma nova migration em `supabase/migrations`;
- nenhum commit;
- nenhum push;
- nenhuma aplicacao em V5, clone homologado, recovery proof, producao ou outros ambientes.

Proximo passo sujeito a validacao: criar pelo CLI uma nova migration de reconciliacao, copiar o SQL validado, revisar diff, executar verificacao estatica e ensaiar em ambiente isolado antes de qualquer aplicacao adicional.


## Marco 16:31+ - migration canonica criada e validada

### Criacao pelo CLI
Com autorizacao explicita, foi executado o comando oficial:
`supabase migration new reconcile_pgcrypto_extensions_schema`

O wrapper remoto reteve a saida das duas primeiras chamadas e ambas chegaram a criar arquivo vazio. Foram identificados:
- `20261020163204_reconcile_pgcrypto_extensions_schema.sql` - preservado como migration canonica;
- `20261020163254_reconcile_pgcrypto_extensions_schema.sql` - duplicado vazio acidental.

Nenhum arquivo foi apagado. O duplicado vazio foi movido para:
`docs/06-migracao/evidencias-g2-pgcrypto-20261020/20261020163254_reconcile_pgcrypto_extensions_schema.DUPLICATE_EMPTY_PRESERVED.sql`

As duas sessoes residuais do conector associadas aos comandos `migration new` foram encerradas depois de confirmado que nao havia processo filho util e que os arquivos ja haviam sido criados.

### Migration canonica
Arquivo:
`supabase/migrations/20261020163204_reconcile_pgcrypto_extensions_schema.sql`

Conteudo: 40 linhas, sem GRANT, REVOKE ou DROP persistente. SHA-256:
`49c248216d760ebee90cc3e5f03210175829ccef89e516e189af9a31075860c9`

Logica:
1. garante schema extensions;
2. instala pgcrypto em extensions se ausente;
3. realoca pgcrypto para extensions se estiver em outro schema;
4. mantem sem alteracao se ja estiver correto;
5. aborta se pgcrypto nao terminar em extensions ou se `extensions.digest(bytea,text)` nao existir.

### Validacao da migration real
A migration canonica foi aplicada somente na copia isolada `sparks-g2-int-pg-20261020-01 / g2_homol_copy` em estado ja correto e terminou com COMMIT sem mudanca funcional.

O corpo exato da migration foi entao ensaiado com ROLLBACK em:
- pgcrypto temporariamente em public -> realocado para extensions, SHA-256 64, rollback restaurou extensions;
- pgcrypto temporariamente ausente -> criado em extensions 1.3, SHA-256 64, rollback restaurou estado original.

Pos-auditoria:
- ACL canonica: 4.805;
- grants diretos dos helpers G2-HIER-01 para anon/authenticated: 0;
- pgcrypto: 1.3 em extensions;
- extensions.digest(bytea,text): presente;
- public.digest(bytea,text): ausente;
- anon USAGE extensions: false;
- authenticated USAGE extensions: false;
- tabelas: 254;
- politicas: 271;
- pacote `PKG-SK-PE-20261020155414817-F9545F`: completed, project_id presente, integrity_hash 64, ultimo formato zip.

### Verificacao pelo Supabase CLI
`supabase migration list --local` reconheceu:
- `20261019050000` como local e nao aplicado;
- `20261020163204` como local e nao aplicado.

Portanto a nova migration esta versionada apenas no working tree e nao foi aplicada ao historico local/remote do Supabase CLI.

### Gate atual
Nao realizado:
- commit;
- push;
- aplicacao em V5;
- aplicacao no clone homologado;
- aplicacao no recovery proof;
- aplicacao em producao;
- cutover.

Qualquer um desses passos exige nova autorizacao explicita.
