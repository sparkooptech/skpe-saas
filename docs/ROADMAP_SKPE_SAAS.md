# Roadmap operacional - SKPE-SAAS

## Objetivo

Manter Robson e Ricardo trabalhando sobre a mesma versao oficial do
SKPE-SAAS, consolidar o deployment Docker de homologacao, estabelecer
acesso publico estavel e, somente depois, higienizar branches, worktrees
e artefatos locais que nao sejam mais necessarios.

A fonte compartilhada entre as maquinas e sempre:

- Repository: `sparkooptech/skpe-saas`
- Canonical branch: `origin/main`

Pastas locais, branches temporarias e worktrees nao sao fontes canonicas.

## Estado atual consolidado

### Repositorio

- Remote oficial: `sparkooptech/skpe-saas`
- Fonte canonica: `origin/main`
- Marco de pipeline Docker validada: `b56d01924c2a78d3e379bac96a4076170b8aea0a`

O SHA acima representa um marco validado de deployment e nao deve ser
usado para fazer downgrade se `origin/main` ja estiver mais avancada.

### Pipeline HOMOL

Status:

`OPERACIONAL, VALIDADA E CONCLUIDA EM HOMOL`

Fluxo validado:

`Git SHA exato`
-> `GitHub Actions`
-> `SSH dedicado`
-> `release por SHA`
-> `Docker build`
-> `preview isolado`
-> `healthcheck`
-> `cutover`
-> `sparks-homol`
-> `rollback quando necessario`

Ultima imagem validada:

`skpe-saas-homol:e45f640`

Container:

`sparks-homol`

Health:

`healthy`

Proveniencia:

`EXACT PROVENANCE`

Deploy SHA final:

`e45f6403bfe8d9c2720ecbad029f078563690993`

Workflow final:

`32390154856 - SUCCESS`

### Banco e Supabase

Durante todo o trabalho de deployment:

- Database mutations: `NONE`
- Database schema changes: `NONE`
- Database data changes: `NONE`
- Supabase mutations: `NONE`

Deployment de frontend/infraestrutura nao autoriza mudancas de banco.

### Acesso temporario por IP

Status:

`REMOVIDO`

Forwarder:

`sparks-homol-temp-access`

Porta temporaria removida:

`5191`

### Dominios

Dominio oficial HOMOL:

`https://sparks.sparkoop.com`

Roteamento final validado:

`Host(\`sparks-homol.sparkoop.com.br\`) || Host(\`sparks.sparkoop.com\`)`

Destino validado:

`sparks.sparkoop.com`
-> `179.198.118.251`
-> Hostinger
-> Traefik
-> `sparks-homol`
-> Nginx `:8080`

Estado final:

- DNS: `PASS`
- Docker: `PASS`
- Traefik: `PASS`
- TLS: `PASS`
- `/`: `200`
- `/login`: `200`
- `/healthz`: `200`

## Proximos passos

### P1 - Sincronizacao Robson / Ricardo

Objetivo:

Robson e Ricardo devem trabalhar sobre a mesma fonte oficial.

Regras:

- sempre executar `git fetch origin`
- considerar `origin/main` como fonte canonica
- nao sincronizar maquinas copiando pastas
- nao usar worktrees temporarias como fonte oficial
- nao reconstruir pipeline ja existente
- toda mudanca que precise ser compartilhada deve chegar ao GitHub

Resultado esperado:

`Robson -> origin/main <- Ricardo`

### P2 - Concluir `sparks.sparkoop.com`

Status:

`CONCLUIDO`

Criar/validar no DNS do dominio `sparkoop.com`:

- Type: `A`
- Name: `sparks`
- Target: `179.198.118.251`

Nao alterar outros registros de `sparkoop.com`.

### P3 - Router Traefik versionado

Status:

`CONCLUIDO`

Aplicar sobre uma branch NOVA baseada na `origin/main` atual somente o
delta necessario para aceitar:

`Host(\`sparks-homol.sparkoop.com.br\`) || Host(\`sparks.sparkoop.com\`)`

O patch deve ser reaplicado como delta minimo sobre a `origin/main`
atual.

Nao copiar arquivos completos de worktrees historicos.

Preservar:

- `websecure`
- `letsencrypt`
- porta interna `8080`
- healthcheck
- preview
- rollback

### P4 - Deployment do novo hostname

Status:

`CONCLUIDO`

Depois do DNS existir e do patch ser versionado:

- executar pipeline oficial
- validar emissao/uso de TLS
- validar `https://sparks.sparkoop.com/`
- validar `/login`
- validar `/healthz`
- validar container `healthy`
- confirmar proveniencia Git -> release -> image

### P5 - Remover acesso temporario

Status:

`CONCLUIDO`

Somente depois de `sparks.sparkoop.com` estar validado:

remover:

`sparks-homol-temp-access`

e confirmar que a porta `5191` deixou de escutar.

Nao remover `sparks-homol`.

### P6 - Auditoria do trabalho local de Robson

Antes de higienizar a estacao, revisar separadamente:

Working copy:

`C:\Users\robso\OneDrive\DevKit\skpe-saas`

Alteracoes locais atualmente identificadas incluem:

- mudancas em `apps/web`
- documentacao de governanca
- `_audit/`
- workspace local
- commits locais ainda nao publicados de branches antigas

Classificar cada item como:

- `LEGITIMATE WORK TO PRESERVE`
- `ALREADY IN GITHUB`
- `TEMPORARY / OBSOLETE`
- `UNKNOWN - HUMAN REVIEW`

Nada deve ser apagado antes dessa classificacao.

### P7 - Higienizacao da estacao de Robson

Somente depois da auditoria P6.

Objetivo:

reduzir branches, worktrees e diretorios temporarios acumulados durante
as waves sem perder trabalho legitimo.

Regras:

- nao usar `git reset --hard` indiscriminadamente
- nao usar `git clean -fd` indiscriminadamente
- nao apagar branches antes de verificar commits exclusivos
- nao apagar worktrees antes de verificar mudancas nao commitadas
- nao confundir releases do servidor com copias de desenvolvimento

Ao final, buscar um estado simples:

`C:\Users\robso\OneDrive\DevKit\skpe-saas`
= working copy humana principal

`GitHub / origin/main`
= verdade compartilhada

`temp/worktrees`
= somente os realmente necessarios

`/docker/skpe-saas-homol-<SHA>`
= releases de deployment/rollback no servidor

## Nao fazer agora

Nao:

- redesenhar arquitetura do projeto
- criar novo modelo de branches
- criar nova pipeline
- reconstruir SPARKS-PAAS
- internalizar Supabase nesta sequencia
- apagar branches/worktrees por conveniencia
- apagar releases de rollback
- alterar banco
- alterar schema
- alterar dados
- alterar Supabase

## Definicao de conclusao desta etapa

Esta frente estara consolidada quando:

1. Robson e Ricardo estiverem trabalhando a partir da mesma `origin/main`.
2. `sparks.sparkoop.com` estiver resolvendo para a Hostinger.
3. Traefik aceitar o novo hostname de forma versionada.
4. HTTPS e aplicacao estiverem validados.
5. Acesso temporario `:5191` tiver sido removido.
6. Trabalho local legitimo de Robson estiver protegido no GitHub.
7. Worktrees/branches temporarios puderem ser higienizados com seguranca.
