# SPARKs | Contratos Auth, Storage e RLS para migracao - 2026-10-18

## Evidencia do codigo local (read-only)
- apps/web/src/App.tsx: getSession, onAuthStateChange, signInWithOAuth, signInWithPassword, signOut, resetPasswordForEmail, updateUser.
- apps/web/src/components/user-profile/UserProfileDialog.tsx: resetPasswordForEmail e Storage upload.
- apps/web/src/modules/evidence/EvidenceManagementWorkspace.tsx: upload/remove/download de evidencias privadas.
- apps/web/src/modules/skpe/SkpeCockpit.tsx: signed URLs individuais e em lote, upload e previews.
- apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.tsx: upload e createSignedUrl com expiracao.
- apps/web/src/modules/platform-admin/PlatformAdmin.tsx: upload de originais e derivados, signed URLs.
- supabase/migrations/20260725040414_create_organizational_authorization_and_rls.sql e outras: auth.uid() na verificacao de membership e politicas RLS.

## Contratos que devem ser mantidos
1. Sessao: login/logout, OAuth quando habilitado, refresh, recuperacao de senha e redirect seguro, atualizacao de usuario.
2. Identidade: preservar UUID auth.users e vinculos public.profiles, organization_memberships, roles e super-admin.
3. Autorizacao: token validado pelo backend, tenant/org claims governadas, RLS equivalente ou enforcement server-side testado.
4. Storage: buckets privados, upload/download/delete, limite de tamanho, signed URLs e expiracao, preservacao de bytes/metadata/ACL.
5. Evidencias: nao perder associacoes entre tabelas e objetos; auditar hashes e referencias.
6. Auditoria e rollback: nenhuma mudanca em origem enquanto paridade nao estiver demonstrada.

## Bloqueios atuais
- CLI Supabase autenticacao Invalid access token (gate exit 2 em 22:33Z).
- Chave de recuperacao operacional e copia externa ainda nao comprovadas; contingencia na VPS autorizada.
- Banco Hostinger nao oferece automaticamente os servicos Auth/Storage do Supabase.
- Nao foram feitas alteracoes em codigo de produto, banco, containers ou ambiente de producao.

## Proxima prova
Construir contrato de testes automatizados de equivalencia, isolado dos ambientes operacionais; obter backup consistente criptografado e restauracao de ensaio antes de habilitar qualquer seletor Hostinger para usuarios reais.
