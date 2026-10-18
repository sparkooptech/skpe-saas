# Revisao dirigida de duas RPCs privilegiadas - 2026-10-18

## Evidencia do codigo local
- `supabase/migrations/20260829135123_govern_platform_admin_organizational_role_mutations.sql`: `assign_skpe_person_role` usa `SECURITY DEFINER`, `search_path` vazio e verifica `public.can_manage_skpe_governance(target_organization_id)` antes de delegar para `public.sparks_assign_person_role_canonical`. O arquivo concede EXECUTE a `anon`, `authenticated` e `service_role`.
- `supabase/migrations/20260727210000_create_organizational_areas_management.sql`: `delete_skpe_organizational_area` verifica `public.can_manage_skpe_governance` ou `auth.role()='service_role'` ou `session_user` privilegiado. Exige justificativa de dez caracteres e impede exclusao de area com subordinadas ou papeis vinculados. O arquivo concede EXECUTE a `authenticated` e `service_role`.

## Observacao no banco DEV
A consulta anterior de `has_function_privilege('anon', oid, 'EXECUTE')` indicou EXECUTE efetivo para ambas. Isso nao identifica a origem do privilegio. A tentativa de obter ACL detalhada foi bloqueada pela ferramenta, portanto nao afirmar heranca de PUBLIC como fato.

## Gate
1. Conferir ACL real e grants subsequentes por meio de conexao autorizada.
2. Revisar a implementacao atual das funcoes e suas dependencias, nao apenas uma migracao historica.
3. Executar testes negativos de identidade e organizacao em banco de ensaio isolado.
4. Nao alterar grants no DEV ou PRD sem plano de impacto e rollback.

Nenhuma alteracao de permissao, funcao ou dado foi executada.
