# SPARKs | Migracao integral para Hostinger (SPARKs-INFRA-001)

Status: execucao autorizada para preparacao e verificacoes nao destrutivas; corte de producao condicionado a gates de integridade e validacao executiva.
Data: 2026-10-18.

## Objetivo vinculante
Migrar **TODA** a plataforma SPARKs, incluindo SK-PE, SK-DA, CORE, cadastros transversais, identidade, usuarios, papeis, politicas, banco de dados, historico, documentos, evidencias, APIs, RPC, armazenamento, integracoes, rotinas, observabilidade, configuracoes e operacao. Hostinger passa a ser primaria apenas apos homologacao e corte controlado. Supabase permanece intacto como origem e contingencia ate autorizacao explicita para desativacao.

## Trilhas paralelas
**A. SK-DA:** finalizar jornadas, checklist transversal, instrumento PDGC, catalogos, evidencias, avaliacao, indicadores, relatorios, interfaces e testes; nao aplicar migracoes em DEV/PRD sem backup restauravel e rollback validado.

**B. INFRA-001:** inventariar todos os contratos Supabase; implantar servicos compativeis na Hostinger; migrar dados e objetos com reconciliacao; adaptar frontend e APIs; homologar seguranca, desempenho e recuperacao; executar corte reversivel.

## Inventario obrigatorio (nenhum item pode ser presumido como migrado)
1. PostgreSQL: schemas, extensoes, migrations, views, triggers, RPC, RLS, grants, sequences, jobs, secrets/referencias, politicas de backup e PITR.
2. Identidade: auth.users, identidades federadas, convites, senhas e estrategias de redefinicao, MFA, refresh tokens, JWT, sessoes, autorizacoes e auditoria. Migracao de hashes e credenciais somente se suportada e validada; alternativa: recredenciamento controlado.
3. APIs: supabase-js, PostgREST, endpoints Edge Functions, webhook, CORS, JWT, rate limits, erros, contratos e dependencias de URL/chave.
4. Arquivos: buckets, objetos, ACL, metadados, links assinados, versoes, checksums, uploads, evidencias e referencias no banco; sem perder rastreabilidade.
5. Eventos: Realtime, notificacoes, filas, cron, triggers, email transacional e templates.
6. Operacao: DNS, TLS/Traefik, healthchecks, observabilidade, logs, secrets, backups, restore, disaster recovery, CI/CD e ambientes DEV/HOMOL/PRD.
7. Multitenancy: organizacoes, vinculos, roles, areas, indicadores, evidencias e isolamento por organizacao em todos os modulos.

## Arquitetura-alvo candidata (nao validada)
- VPS Hostinger ja contratada, Traefik para roteamento TLS.
- PostgreSQL existente: banco SPARKs dedicado e roles de minimo privilegio, sem alterar outros produtos.
- Keycloak corporativo: identidade somente apos prova de equivalencia funcional com Supabase Auth.
- RustFS: objetos S3 somente apos prova de compatibilidade e migracao de ACL, metadados e links.
- PostgREST/servico de API e gateways compativeis com RPC/RLS/JWT; escolher mediante prova de conceito e testes.
- Ambientes segregados, redes/volumes proprios, backup restauravel e logs.

## Gates sequenciais e evidencias de aceite
G0. Capacidade Hostinger comprovada por inventario somente leitura; nenhum upgrade/custo sem aprovacao.
G1. Inventario completo do Supabase atual, dependencias no codigo e matriz origem-destino aprovada tecnicamente.
G2. Backup de origem verificado, copia de restauracao ensaiada e rollback documentado; nao confundir branch ou dump nao restaurado com backup validado.
G3. Infraestrutura destino isolada, compatibilidade Auth/API/RLS/Storage testada com fixtures sinteticas.
G4. Copia integral de dados/objetos; contagens, hashes, referencias e permissao por tenant reconciliadas; divergencias documentadas e zeradas antes do corte.
G5. SK-PE e SK-DA operacionais na Hostinger; login, reset, convite, fluxos, relatorios, evidencias, uploads, auditoria, integracoes e testes cross-tenant aprovados.
G6. Plano de janela, sincronizacao incremental/final, congelamento de escrita, DNS e retorno ao Supabase ensaiados; aprovacao expressa para corte de producao.
G7. Estabilizacao monitorada; desativacao do Supabase apenas com autorizacao separada e prova de retencao legal e tecnica.

## Riscos conhecidos e limites atuais
- Supabase DEV `vumbfpbcozjebomcthdw` tem historico de migracoes com falha na branch main; 11 migracoes CORE/DA locais nao aplicadas.
- O frontend atual utiliza Supabase; PostgreSQL isolado nao substitui automaticamente Auth, Storage, PostgREST, Realtime e Edge Functions.
- A capacidade livre da Hostinger e a autenticacao SSH ainda nao foram verificadas; nao implantar na VPS sem G0.
- O R2G2-ACER tem Docker funcional, mas RAM limitada e Docker com teto aproximado de 2.95 GB; nao usar como homologacao completa sem capacidade comprovada.
- Mudancas paralelas SK-PE nao relacionadas estao pendentes no worktree; nao adicionar nem modificar esses arquivos.
- Nao armazenar segredos em Git, logs ou artefatos; nao copiar dados pessoais para ambiente de teste sem controles.

## Primeiro ciclo de execucao
1. Inventariar dependencias do codigo, migrations, functions e buckets; registrar lacunas e estimativas.
2. Verificar VPS com `deploy/hostinger/skpe-saas-homol/skda-capacity-preflight-readonly.sh` em terminal autenticado.
3. Definir arquitetura de identidade/API com teste de equivalencia antes de alterar configuracao do frontend.
4. Criar runbook de backup/restore e migracao com checksums, sem tocar em dados reais antes de G2.
5. Continuar implementacao SK-DA e testes locais em paralelo.

## Regra de nao conclusao ficticia
Documentacao e commits nao significam migracao executada. Cada gate exige evidencia operacional verificavel, data, responsavel, resultado e rollback. Nenhuma afirmacao de que Hostinger ja e primaria antes do corte validado.
