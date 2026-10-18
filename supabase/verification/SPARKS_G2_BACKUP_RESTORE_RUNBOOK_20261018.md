# SPARKs | G2 - Runbook de backup, restauracao isolada e reconciliacao

Data: 2026-10-18
Estado: PROPOSTA DOCUMENTAL; NENHUM BACKUP, RESTORE, DUMP OU DEPLOY EXECUTADO.
Escopo: SPARKs completo; origem definitiva ainda depende de confirmacao de qual ambiente atende producao.

## 0. Precondicoes
- Identificar e registrar projeto Supabase efetivamente operacional (DEV atualmente acessivel: vumbfpbcozjebomcthdw; nao assumir que e PRD).
- Aprovar local de guarda criptografado, responsavel, prazo de retencao, permissoes, politica LGPD, custo e capacidade.
- Confirmar credenciais temporarias, rede/TLS e escopo minimo; nao expor strings de conexao, tokens, senhas, hashes ou dados pessoais em logs.
- Verificar espaco disponivel com margem para dump, objetos, restauracao e indices; avaliar carga de CPU da VPS antes do ensaio.
- Definir banco e armazenamento de ensaio NOVOS e isolados, sem tocar em sparks_homol, sparks_prd, PRODUZ, EXTRATOR ou outros produtos.
- Confirmar suspensao de escritas pela organizacao e auditar processos automaticos. Nao impor bloqueio de escrita sem plano e autorizacao.

## 1. Baseline de origem (consultas read-only ja feitas)
- 254 tabelas e 11 views em public/auth/storage; 271 politicas RLS; 811 entradas pg_proc nesses schemas.
- 308 migrations aplicadas (ultima 20261007234118); 327 arquivos locais, sem equivalencia presumida.
- 28 usuarios auth, 28 profiles, 37 memberships; 0 usuarios sem perfil, 0 vinculos orfaos; 28 usuarios sem deleted_at.
- 15 metadados de objetos: 11 organization-branding, 1 sparks-evidence, 3 user-avatars.
- 1 evidencia transversal com referencia de Storage, 0 sem registro correspondente.
- Quatro Edge Functions ativas, todas verify_jwt=true.
- RLS habilitada nas 219 tabelas comuns/particionadas public.
Essas medidas foram tomadas em consultas separadas e NAO representam snapshot atomico.

## 2. Preparar manifestos (somente depois de aprovar execucao)
- Inventario de schemas, tipos, enums, sequencias, views, triggers, funcoes, grants, RLS, extensions e dependencias de auth.uid().
- Inventario de todas as tabelas por schema, contagens exatas sob snapshot consistente, chaves, checksums/manifestos, versao do PostgreSQL e collation.
- Inventario dos buckets, objetos, metadados, ACL, tamanhos, checksums, referencias cruzadas e falhas de leitura.
- Inventario de usuarios/identidades/papeis, preservando UUID interno e SUPER-ADMIN protegido, sem extrair senhas/tokens para documentos.
- Manifesto assinado ou com hash SHA-256, timestamp UTC, ferramenta/versao, operador, origem e local de guarda. Guardar valores sensiveis em cofre seguro.

## 3. Backup proposto (nao executar ainda)
- Exportar esquema e dados por mecanismo compativel com Supabase/PostgreSQL 17 e privilegios efetivos, incluindo roles e grants conforme viabilidade.
- Exportar dados de auth de forma controlada, sem assumir que senhas/hashes e sessoes possam ser restaurados no Keycloak.
- Capturar politicas, triggers, funcoes, extensoes, migrations aplicadas e contratos de API; verificar erros, exit codes e hashes.
- Copiar fisicamente todos os objetos do Storage com API autenticada, preservar bucket/key, tamanho, tipo MIME, hash e politica de acesso.
- Criar pelo menos duas copias protegidas, com controle de acesso e retencao. Nao confundir metadados de storage.objects com os bytes dos arquivos.
- Congelamento final e captura incremental/definitiva somente em janela aprovada.

## 4. Ensaio de restauracao (ponto de aprovacao obrigatoria)
- Criar destino temporario e segregado sem reutilizar bancos SPARKs existentes.
- Restaurar esquema e dados em ordem de dependencias; documentar componentes Supabase que exigem substituicao e extensoes nao disponiveis.
- Validar 100% das tabelas, contagens, FKs, funcoes, grants, RLS, views, triggers e consistencia de sequences.
- Restaurar objetos no armazenamento de ensaio e validar leitura, hashes e referencias.
- Validar login/convite/recuperacao de senha/MFA/roles em identidades de teste, sem usar senhas reais e sem enviar e-mails a usuarios reais.
- Testar acesso cross-tenant negativo e permissao de super_admin, inclusive protecao contra exclusao/rebaixamento.
- Medir tempo de restauracao (RTO) e perda potencial de dados (RPO); relatar custos e gargalos.

## 5. Critérios de aceite G2
- Evidencia de backup completo, legivel e com checksum; cadeia de custodia e local de guarda conhecidos.
- Restauracao isolada comprovada com logs saneados, manifestos reconciliados e testes de leitura.
- Divergencias de dados, identidade e objetos identificadas; nenhuma divergencia critica aberta.
- Plano de rollback e testes de recuperacao assinados; nenhuma operacao no ambiente operacional sem nova aprovacao.
- Em caso de falha, preservar origem intacta e interromper; nao apagar dumps, volumes ou bancos de ensaio sem autorizacao especifica.

## 6. Pontos pendentes
- Identificar fonte de producao efetiva, exportabilidade de auth, caminho seguro de backup de objetos, capacidade sob carga e estrategia de API/RLS.
- Confirmar quem aprova ensaio G2 e janela; registrar evidencia operacional apos a execucao, nunca antes.
