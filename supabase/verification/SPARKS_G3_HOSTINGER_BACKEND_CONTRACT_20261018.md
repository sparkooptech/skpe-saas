# SPARKs | G3 - Contrato de compatibilidade do backend Hostinger

Data: 2026-10-18
Estado: desenho e homologacao pendentes. Nenhuma implantacao executada.

## Fato verificado no codigo
- O frontend cria cliente @supabase/supabase-js em apps/web/src/lib/supabase.ts.
- O seletor apps/web/src/lib/sparksBackendConfig.ts permite 'supabase-managed' (padrao) e 'hostinger-compatible', mas apenas valida URL/chave e NAO implementa servicos substitutos.
- O compose deploy/hostinger/skpe-saas-homol/docker-compose.yml publica frontend Nginx via Traefik; nao inclui API, Auth, Storage ou PostgREST.
- A implantacao frontend Hostinger nao comprova migracao do backend.

## Contratos obrigatorios e testes de paridade
1. Auth: login, logout, refresh, recuperacao de senha, convites, criacao de usuario, MFA quando utilizado, expiracao de JWT e protecao do super_admin. O subject externo do Keycloak nao substitui UUID interno sem mapeamento governado.
2. RPC/PostgREST: rotas /rest/v1, schema public, funcoes RPC, filtros, paginacao, ordenacao, errors, upsert, claims JWT, auth.uid(), auth.role(), permissoes e RLS.
3. Storage: buckets, objetos binarios, uploads, downloads, URLs assinadas, metadados, politicas por organizacao e integridade de hashes; RustFS sozinho nao reproduz automaticamente a API Supabase Storage.
4. Edge Functions: invite-platform-user, create-platform-user, lookup-address-by-cep, skpe-import-incorporation; contratos, verify_jwt, CORS, secrets, auditoria e chamadas internas.
5. Realtime: verificar dependencia efetiva no codigo e replicar somente funcionalidades comprovadas.
6. Tenant: todos os acessos com organizacao explicita e testes negativos de acesso cruzado; nao usar chave privilegiada no browser.
7. Observabilidade: healthchecks independentes, auditoria, rastreamento de erro, logs saneados, rate limiting, TLS e plano de rollback.

## Estrategia de entrega sem impacto
- G3a: especificar APIs/claims/identidade e fixtures sinteticas, sem mudar o frontend em uso.
- G3b: prova de conceito em rede isolada com banco temporario, sem dados reais, depois de validar recursos e custos.
- G3c: testes de contrato automatizados de Auth/RPC/Storage/Edge Functions e seguranca multi-organizacao.
- G3d: habilitacao opt-in apenas em homologacao; manter padrao 'supabase-managed' ate G5/G6.
- G3e: migracao de dados somente depois de backup/restauracao G2 e reconciliacao G4.

## Nao fazer
- Nao apontar supabase-js para PostgreSQL bruto.
- Nao alterar compose em producao nem endpoints, DNS, segredos ou tokens existentes.
- Nao duplicar usuarios; nao desabilitar RLS; nao promover usuario comum a super_admin.
- Nao declarar paridade funcional com base apenas na presenca de Keycloak, RustFS e PostgreSQL.
- Nao modificar arquivos SK-PE em edicao por agentes paralelos.

## Condicao de saida
Todos os contratos necessarios testados, com evidencias de requests/responses sem dados pessoais, regras de tenant e super_admin aprovadas, e rollback comprovado em homologacao. Ate la, G3 NAO CONCLUIDO.
