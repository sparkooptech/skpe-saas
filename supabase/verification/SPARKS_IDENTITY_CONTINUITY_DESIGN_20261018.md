# SPARKs | Decisao de arquitetura de usuarios e identidade | 2026-10-18

Status: proposta tecnica para G1/G3, sem alteracoes de banco ou runtime.

## Decisao
Nao criar uma segunda tabela canonica de usuarios. Reutilizar as entidades ja definidas em migracoes:
- auth.users: principal de identidade do Supabase atual;
- public.profiles: cadastro e identificador transversal;
- public.organization_memberships: vinculacao por organizacao;
- public.platform_roles e public.user_platform_roles: autorizacao global;
- public.privileged_access_sessions e public.privileged_access_audit: governanca e auditoria.

A migracao 20260725031733_create_organizational_foundation.sql define profiles.id como UUID com FK para auth.users(id), e organization_memberships.user_id com FK para auth.users(id). A migracao 20260726194000_create_platform_administration_foundation.sql vincula user_platform_roles.user_id a profiles(id). A varredura das migracoes encontrou 32 referencias textuais a 'references auth.users'.

## Principio de continuidade
O UUID de usuario ja referenciado por perfis, vinculos, papeis, evidencias e auditoria e um contrato de dados da plataforma. Um ID de usuario novo no Keycloak nao deve substituir automaticamente esse UUID. A API deve resolver a identidade externa autenticada para o UUID interno de modo verificavel e transacional, antes de executar qualquer RLS/RPC. Nao confiar em claims arbitrarias do cliente.

## Tabela adicional SOMENTE se comprovada a necessidade
Uma tabela de correspondencia de identidades pode ser necessaria no destino isolado para mapear issuer/subject do Keycloak para UUID interno do SPARKs. Ainda NAO criar. Modelo conceitual:
- id UUID PK;
- user_id UUID FK para perfil canonico;
- identity_provider TEXT NOT NULL;
- issuer TEXT NOT NULL;
- external_subject TEXT NOT NULL;
- status TEXT com ciclo de vida controlado;
- created_at e updated_at timestamptz;
- UNIQUE(issuer, external_subject).
Nao copiar senhas, hashes ou tokens. Impor RLS/grants restritivos e acesso apenas por backend privilegiado com auditoria. Evitar duplicacao de papeis ou cadastro de usuario.

## Gate especifico do super-admin
Preservar conta rr.gestao@gmail.com e UUID interno 7ef3825f-3547-43a8-84ec-89dc21e0efd5, com papel global super_admin e testes negativos contra exclusao/rebaixamento. O subject do Keycloak sera mapeado, nao imposto igual ao UUID do Supabase. Validar mecanismo de break-glass auditado.

## Antes de implementar
1. Confirmar o esquema REAL e o estado de migracoes do Supabase de origem, sem alterar dados.
2. Confirmar backup verificavel e ensaio de restauracao isolado (G2).
3. Validar fluxo de login, convite, recuperacao de senha, MFA, logout, JWT e renovacao em fixture sintetica.
4. Provar que auth.uid() e todas as politicas de RLS funcionam com contexto seguro e isolamento cross-tenant.
5. Executar testes de compatibilidade em ambiente isolado, sem tocar em sparks_homol, sparks_prd ou producao ate autorizacao.

## Limite da autorizacao
A permissao do usuario para criar tabela de usuarios, se necessaria e sem impacto, NAO equivale a autorizar migracao de dados, criacao de estruturas no ambiente existente, alteracao de Keycloak, mudanca de runtime, desligamento do Supabase ou cutover. Essas operacoes seguem gates e aprovacao.
