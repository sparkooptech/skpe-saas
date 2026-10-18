# SK-DA | Gate de implantacao controlada (18/10/2026)

## Evidencias verificadas (somente leitura)
- Supabase skpe-saas-dev (ref vumbfpbcozjebomcthdw), PostgreSQL 17; nao identificado como Hostinger homologacao.
- Banco postgres, PostgreSQL 17.6; organizations, sparks_initiatives e profiles presentes.
- Categoria INITIATIVE_CATEGORY/operational confirmada com active=true.
- Colunas sparks_domain_values.active e organization_modules.enabled/status/valid_from/valid_until confirmadas no catalogo real.
- Assinaturas verificadas: is_platform_super_admin(), is_organization_admin(uuid), can_manage_sparks_initiatives(uuid,text) e create_sparks_initiative(uuid,text,text,text,text,text,text,text,uuid,uuid,text,text,text,text,date,date,text).
- Modulo SK-DA: planned, zero organizacoes vinculadas e zero habilitacoes.
- sparks_checklist_executions e skda_journeys ausentes.
- Branch Supabase main consta MIGRATIONS_FAILED (registro de agosto); causa nao determinada.
- Deploy web documentado em deploy/hostinger/skpe-saas-homol/; rollback de conteiner NAO recupera banco de dados.

## Ordem de migracoes
1. 20261018052000_create_sparks_checklist_execution_foundation.sql
2. 20261018053000_create_governed_checklist_execution_rpc.sql
3. 20261018054000_govern_sparks_checklist_items_and_evidence.sql
4. 20261018055000_govern_sparks_checklist_lifecycle.sql
5. 20261018131000_read_sparks_checklist_execution.sql
6. 20261018133000_create_skda_journey_foundation.sql
7. 20261018134500_create_governed_skda_journey_opening.sql
8. 20261018135500_read_governed_skda_journey.sql

## Gates obrigatorios
1. Identificar ambiente e banco de destino; nao presumir que Supabase DEV e Hostinger HOMOL.
2. Investigar MIGRATIONS_FAILED e reconciliar o historico de migracoes.
3. Confirmar backup consistente, destino, retencao e RESTAURACAO TESTADA antes de DDL.
4. Executar supabase/verification/skda_deployment_preflight_readonly.sql e revisar assinaturas.
5. Verificar autorizacao por organizacao, identidade, idempotencia, RLS e negacao de acesso.
6. Aplicar em homologacao isolada na ordem acima; nao habilitar SK-DA como efeito colateral.
7. Testar transacao real, rollback, idempotencia, escopo cruzado e falhas.
8. So entao habilitar organizacoes autorizadas e realizar deploy web com preview/healthcheck.

## Estado
Nenhuma migracao aplicada, nenhum deploy realizado e nenhuma organizacao habilitada nesta etapa. Backup restauravel nao confirmado.
