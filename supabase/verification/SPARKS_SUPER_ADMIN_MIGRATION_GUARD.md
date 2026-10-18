# SPARKs | Gate de continuidade do SUPER-ADMIN protegido

Data: 2026-10-18. Status: verificacao de origem realizada; destino nao provisionado.

## Identidade canônica obrigatória
- Conta: `rr.gestao@gmail.com` (Ricardo Rodrigues).
- Identidade auth.users verificada no Supabase DEV: `7ef3825f-3547-43a8-84ec-89dc21e0efd5`; `deleted_at IS NULL`.
- Papel verificado: `public.platform_roles.code = 'super_admin'` associado via `public.user_platform_roles`.
- Este UUID e identificador da origem, NAO um valor para impor cegamente no Keycloak. Preservar mapeamento auditavel e referencias.
- Nao confundir com a outra conta `ricardo.rodrigues@sparkoop.com`, que possui atribuicoes distintas.

## Evidencia e lacuna de protecao na origem
- Consulta somente leitura a pg_trigger em `auth.users`, `public.profiles`, `public.user_platform_roles` e `public.platform_roles` nao identificou trigger explicito que impeça exclusao ou rebaixamento desta conta. Existem triggers de updated_at, onboarding e validacao de visitante.
- RLS `user_platform_roles_manage_super_admin` permite operacoes de administracao por super_admin, mas nao equivale a protecao contra exclusao ou rebaixamento de um principal especifico.
- Podem existir protecoes em APIs, frontend, politicas externas ou funcoes nao cobertas por essa consulta; exigir auditoria antes de declarar equivalencia.

## Invariantes obrigatorios no destino Hostinger
1. A conta `rr.gestao@gmail.com` existe, esta ativa e pode autenticar; identidade verificada e ligada ao perfil SPARKs correto.
2. Papel global `super_admin` e suas permissoes efetivas preservados, incluindo acesso a todos os modulos e administracao transversal.
3. Operacoes comuns de usuario, administrador de organizacao e outros superadmins NAO podem excluir, desativar, bloquear, remover o papel, reduzir privilegios ou transferir identidade desta conta.
4. Protecao deve operar no backend/banco e no provedor de identidade (Keycloak ou Auth compativel), inclusive por APIs e operacoes em lote, nao apenas ocultando botoes.
5. Acesso de emergencia para recuperacao de desastre precisa de procedimento de dupla autorizacao, auditoria imutavel e break-glass, sem bloquear administradores de infraestrutura de forma irrecuperavel.
6. Nenhuma senha, refresh token, hash ou segredo de autenticacao e registrado em Git ou logs; se nao houver migracao de credencial segura, executar recredenciamento verificado e testado.
7. Apos migracao, validar login, recuperacao de acesso, sessao, papeis e permissao por tenant, bem como tentativa negativa de exclusao/rebaixamento por API, SQL da aplicacao e console do IdP.
8. A migracao nao passa no gate G5 nem permite corte G6 sem evidencia assinada da preservacao e protecao da conta.

## Testes de aceite requeridos
- Identidade: localizar exatamente uma conta ativa no destino com email normalizado; correlacionar com origem.
- Papel: exatamente uma atribuicao ativa de `super_admin` para a identidade, sem perda das permissoes da plataforma.
- Autorizacao: provar que a conta pode acessar SK-PE, SK-DA e administracao global.
- Negativos: tentar desativar/excluir/rebaixar com contas de teste autorizadas, em ambiente isolado; todas as tentativas devem falhar e produzir auditoria.
- Recuperacao: simular falha de credenciais em ambiente de homologacao, sem interromper a conta real.
- Rollback: documentar como restaurar identidade, papel e vinculos antes de qualquer corte.

## Regra de implementacao
Nao aplicar agora alteracoes no Supabase DEV/PRD, nem criar usuario manualmente na Hostinger sem IdP confirmado, backup, reconciliacao e aprovacao de corte. Implementar protecao no destino junto com o contrato definitivo de identidade; evitar triggers de exclusao em `auth.users` sem avaliar privilegios, atualizacoes e operacao do IdP.
