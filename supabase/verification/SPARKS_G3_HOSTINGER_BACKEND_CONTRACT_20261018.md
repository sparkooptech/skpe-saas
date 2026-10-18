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

## G3 - Contratos localizados no frontend - 2026-10-18
- Auth: App.tsx usa getSession, onAuthStateChange, signInWithOAuth, signInWithPassword, signOut, resetPasswordForEmail e updateUser. UserProfileDialog tambem usa resetPasswordForEmail.
- Edge Functions: PlatformAdmin usa create-platform-user e invite-platform-user; CanonicalImportStaging usa skpe-import-incorporation em diversas operacoes. Existem outras invocacoes no SkpeCockpit, que precisam ser rastreadas por nome.
- Storage: EvidenceManagementWorkspace remove objetos de sparks-evidence; MethodologyArtifactsSection envia para methodology-artifacts e cria signed URLs; DeliveryKitDialog faz download; SkpeCockpit cria signed URLs para user-avatars.
- Atenção: methodology-artifacts nao apareceu entre os 3 buckets com objetos no agrupamento storage.objects. Bucket vazio nao aparece nesse agrupamento. Confirmar existencia e politicas diretamente no catalogo de buckets antes de concluir que falta.
- Testes necessarios: fluxo OAuth, convite, reset de senha, leitura/escrita com RLS, assinatura de URLs, download de evidencias, incorporacao e isolamento multi-tenant. Sem backend substituto, testes de configuracao nao sao testes de paridade funcional.

## Storage - baseline confirmado no catalogo DEV (2026-10-18)
- Existem QUATRO buckets e TODOS public=false: methodology-artifacts (0 objetos), organization-branding (11), sparks-evidence (1), user-avatars (3). O agrupamento anterior por storage.objects omitia bucket vazio.
- Limites de arquivo em bytes: methodology-artifacts 52428800, organization-branding 5242880, sparks-evidence 52428800, user-avatars 5242880.
- Existem 24 politicas em storage.objects: 4 organization_branding (SELECT/INSERT/UPDATE/DELETE), 4 p_methodology_storage, 4 sparks_evidence_storage, 12 user_avatars (proprio usuario, administrador da organizacao, super_admin, por operacao).
- Os nomes e comandos das politicas foram confirmados; a equivalencia das expressoes USING/WITH CHECK, dos grants, do JWT e do isolamento de tenant ainda NAO foi testada.
- G3 exige testes de autorizacao para cada bucket e papel, URLs assinadas, upload/download/remocao, limites de tamanho e caminhos. Proibir fallback de acesso publico indiscriminado.
