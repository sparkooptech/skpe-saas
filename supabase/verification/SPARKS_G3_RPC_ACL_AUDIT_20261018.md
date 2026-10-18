# G3 | ACLs efetivas de duas RPCs - 2026-10-18

## Consulta read-only no Supabase DEV
Consulta `aclexplode(pg_proc.proacl)` confirmou concessoes explicitas de EXECUTE.

| Funcao | PUBLIC | anon | authenticated | postgres | service_role |
| --- | --- | --- | --- | --- | --- |
| assign_skpe_person_role | nao identificado | sim | sim | sim | sim |
| delete_skpe_organizational_area | sim | sim | sim | sim | sim |

A entrada PUBLIC foi identificada como grantee de OID zero na ACL de `delete_skpe_organizational_area`. Os grants nao sao grantable. A consulta anterior `has_function_privilege` confirmou EXECUTE efetivo de anon para ambas.

## Comparacao com migrations
- `assign_skpe_person_role`: migration local concede anon explicitamente e usa guarda `can_manage_skpe_governance`.
- `delete_skpe_organizational_area`: migration historica consultada concede authenticated e service_role; a ACL atual do DEV tambem contem anon e PUBLIC. Investigar quando e por qual migracao ou configuracao essas concessoes foram adicionadas. Nao presumir origem sem historico.
- Nao inferir vulnerabilidade apenas por EXECUTE: confirmar caminhos de autorizacao e negacao em ensaio isolado.

## Gate
Nenhum REVOKE ou GRANT aplicado no DEV. Antes de mudar ACLs, identificar clientes que usam as RPCs, testar impacto e preparar rollback.
