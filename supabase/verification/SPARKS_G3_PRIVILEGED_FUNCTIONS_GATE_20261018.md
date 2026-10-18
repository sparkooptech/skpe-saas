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
