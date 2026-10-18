# SPARKs | G3 - Funcoes SECURITY DEFINER e privilegios - 2026-10-18

## Contagem direta no Supabase DEV (somente leitura)
| Schema | Funcoes | SECURITY DEFINER |
| --- | ---: | ---: |
| public | 788 | 702 |
| auth | 4 | 0 |
| storage | 19 | 0 |

## Requisitos antes de migrar
- Inventariar assinaturas, owner, grants EXECUTE, search_path e dependencias de cada funcao privilegiada, sem exportar segredos em logs.
- Distinguir SECURITY DEFINER de SECURITY INVOKER e conferir politica de acesso por tenant e organizacao.
- Conferir que roles internas Supabase (authenticated, anon, service_role e roles de Auth/Storage) nao sejam assumidas como presentes no PostgreSQL Hostinger.
- Preservar a semantica de auth.uid() e validar a origem do JWT antes de qualquer chamada privilegiada.
- Executar testes negativos: usuario sem membership, organizacao distinta, role sem privilegio, token invalido e token expirado.
- Nenhuma funcao deve ser convertida automaticamente de SECURITY DEFINER para INVOKER nem receber grants amplos como atalho.

## Status
Consultas read-only concluidas; backup e restore reais ainda nao realizados. CLI do RMKB-NTB retornou Invalid access token. Nao foram aplicadas mudancas no DEV ou na Hostinger.

## Auditoria complementar de proprietarios e search_path - 2026-10-18 22:37Z
Consulta direta somente leitura no DEV:
- Schema public: 757 funcoes owner postgres (702 SECURITY DEFINER), 31 owner supabase_admin (0 SECURITY DEFINER).
- Das 702 SECURITY DEFINER: 662 search_path explicitamente vazio, 28 search_path=public, 9 search_path=public, auth, 2 search_path=public, extensions, 1 search_path=pg_catalog.
- Esta contagem nao equivale a auditoria de seguranca individual, nem prova que os search_paths sao seguros em todas as funcoes.
- Ao migrar, preservar ou adaptar explicitamente proprietarios, search_path, grants e referencias qualificadas. Nao converter proprietario automaticamente para superusuario Hostinger.

## Matriz efetiva de EXECUTE por papel - 2026-10-18 22:43Z
Consulta read-only has_function_privilege no Supabase DEV para 702 funcoes SECURITY DEFINER de public:

| anon | authenticated | funcoes |
| --- | --- | ---: |
| negado | permitido | 363 |
| negado | negado | 166 |
| permitido | permitido | 163 |
| permitido | negado | 10 |

Totais: 173 com EXECUTE efetivo para anon, 526 para authenticated. Estes privilegios podem resultar de grants diretos, via PUBLIC ou heranca; a consulta nao discrimina a origem. A existencia de EXECUTE nao implica explorabilidade nem bypass de controles internos. Antes de replicar, revisar assinaturas, grants, guardas de autorizacao e politicas por organizacao.

## Triagem de RPCs sensiveis acessiveis a anon - 2026-10-18 22:52Z
Foram inspecionadas apenas definicoes/metadados, sem invocar as funcoes. Amostra de 10 RPCs: set_platform_admin_user_role, set_platform_admin_user_module_role, set_platform_admin_organization_status, request_platform_user_invitation, cancel_platform_user_invitation, update_platform_admin_user_profile, set_platform_admin_user_organizational_role, get_platform_admin_users, assign_skpe_person_role e delete_skpe_organizational_area.
- Oito contem referencia textual a is_platform_super_admin ou require_platform_super_admin.
- assign_skpe_person_role e delete_skpe_organizational_area nao possuem essa referencia especifica, mas contem referencia a outro mecanismo de autorizacao (padrao textual can_manage/has_module_permission/require_/is_organization_admin/is_active_member/assert_/auth.uid) e RAISE EXCEPTION.
- Inspecao por padrao textual nao prova que a guarda e executada em todos os caminhos. Testes de autorizacao negativos sao obrigatorios em banco de ensaio isolado; nao testar mutacoes em DEV operacional.
- Prioridade: revisao individual das duas funcoes e das rotas de chamada, depois amostra ampliada das 173 funcoes anon-executaveis.
