# G2 - Prova do commit exato de reconciliacao pgcrypto

**Data:** 20/10/2026
**Commit originalmente homologado:** `8aa6e6ff087ff072a238b4c801f69b914ee726c3`
**Branch limpo para integracao:** `fix/pgcrypto-extensions-schema-20261020`
**Base:** `sparkooptech/main` em `b0fc85cd2a7b6f6d922cc54dcd965102d3936794`
**Estado:** tecnicamente homologado em ambiente descartavel isolado; sem merge e sem aplicacao em ambiente oficial/producao.

## 1. Objetivo

Provar que o artefato exato versionado para reconciliar `pgcrypto` no schema `extensions` funciona sobre uma copia limpa derivada da V5, preserva os controles G2 previamente aprovados e suporta os fluxos reais de Auth, PostgREST, Storage, frontend HTTPS, Jornada PEM-00, artefatos e portabilidade.

## 2. Identidade do artefato

Migration:
`supabase/migrations/20261020163204_reconcile_pgcrypto_extensions_schema.sql`

Blob Git:
`1eb6f50b6d54a6dcd2a3fe098175b70ae79ef67c`

SHA-256 dos bytes do blob Git:
`49c248216d760ebee90cc3e5f03210175829ccef89e516e189af9a31075860c9`

O blob armazenado no commit original `8aa6e6f` e no cherry-pick do branch limpo e identico. Diferencas observadas no hash do arquivo checkoutado no Windows foram exclusivamente decorrentes de conversao CRLF; a comparacao correta de blob Git confirmou identidade byte a byte.

## 3. Prova sobre V5 limpa

Foi criada uma instancia PostgreSQL descartavel e isolada no Hostinger, sem portas publicas, derivada de dump somente leitura da V5.

Baseline antes da migration:
- 254 tabelas;
- 811 funcoes core em `public/auth/storage`;
- 271 politicas;
- 8.985 linhas baseline;
- 4.809 ACLs canonicas;
- `pgcrypto` ausente.

A migration foi extraida diretamente do objeto Git do commit, transferida em modo binario e teve o mesmo SHA-256 no RMKB-NTB e no Hostinger antes da execucao.

Resultado imediato da migration:
- `pgcrypto 1.3` em `extensions`;
- 36 funcoes da extensao;
- `extensions.digest(..., 'sha256')` produz hash de 64 caracteres;
- `public.digest(bytea,text)` ausente;
- `anon` sem `USAGE` em `extensions`;
- `authenticated` sem `USAGE` em `extensions`;
- 254 tabelas preservadas;
- 811 funcoes core preservadas;
- 271 politicas preservadas;
- 8.985 linhas baseline preservadas;
- ACL core ainda 4.809 antes dos deltas G2.

## 4. Equivalencia com baseline G2 corrigido

Foram aplicados somente os tres deltas G2 previamente aprovados, gerados diretamente a partir do clone corrigido:
- G2-HIER-01;
- G2-DELEG-02;
- G2-STO-03.

Resultado:
- ACL canonica: **4.805**;
- grants diretos dos helpers de hierarquia para `anon/authenticated`: **0**;
- MD5 da definicao de `can_access_descendant_organization`: `508e8435db7f6e5849047cdd9bc27b37`, identico ao clone corrigido;
- MD5 da expressao da policy `organization_branding_select`: `7a31ba2c1983ff566af0d5bc59608842`, identico ao clone corrigido;
- 254 tabelas;
- 811 funcoes core;
- 271 politicas;
- 8.985 linhas baseline.

O unico delta estrutural adicional do commit permanece `pgcrypto 1.3` em `extensions`.

## 5. Runtime Auth/PostgREST

Runtime isolado, rede Docker interna e zero portas publicadas.

Suite HTTP:
- **105/105 checks aprovados**;
- 4 usuarios sinteticos;
- 2 organizacoes sinteticas;
- 0 contas reais;
- tenant isolation e RLS;
- RPCs de leitura/gestao;
- 6 casos negativos de JWT;
- negacao direta dos helpers G2-HIER-01;
- writes cross-tenant negados;
- autoelevacao negada;
- metadata editavel do usuario incapaz de conceder admin;
- estados de validade de membership;
- refresh rotation e logout.

## 6. Storage

Storage API 1.84.5, historico congelado ate migration 73, versioning desabilitado e zero portas publicadas.

Suite SDK real via gateway:
- `@supabase/supabase-js 2.110.8`;
- custom fetch: **false**;
- **122/122 checks aprovados**;
- 4 objetos sinteticos criados e removidos pela suite;
- 0 objetos da suite SDK retidos;
- upload/download/upsert/delete;
- signed URL;
- isolamento entre tenants;
- nenhuma conta real utilizada.

## 7. Frontend exato do SHA

O frontend foi empacotado a partir do SHA `8aa6e6f`.

Archive fonte SHA-256:
`c54f18067941944c8d8d707d62abf5389c19153ab698c7eb249542216bc203bc`

Archive frontend produzido SHA-256:
`671f73e57b95c2f29406176cfc2e31399109f1065c45b2104ea9b94baaf488ce`

Build:
- Node 22 Alpine;
- `npm ci`;
- `tsc -b`;
- Vite build;
- target: `https://g2-api.test:8443`.

A primeira tentativa de build falhou somente por HOME/cache do npm em root filesystem read-only. A segunda execucao definiu HOME/cache em tmpfs e concluiu sem alterar codigo-fonte.

## 8. HTTPS/browser isolado

Interface:
`https://g2-ui.test:8443`

API:
`https://g2-api.test:8443`

Controles:
- CA privada apenas no container de teste;
- nenhuma alteracao de trust global;
- rede Docker internal;
- zero portas publicadas;
- root filesystem read-only;
- unico delta no gateway: origem HTTPS da UI de prova nos dois mapas CORS.

## 9. Jornada PEM-00

Fixtures estritamente sinteticos:
- 2 habilitacoes de modulo SK-PE para as organizacoes sinteticas;
- 3 papeis de modulo escopados;
- rehearsal com rollback antes da aplicacao;
- 1 vinculo sintetico temporario do `admin_a` com SPARKOOP;
- 1 atribuicao sintetica temporaria `project_leader`;
- nenhuma pessoa real reutilizada ou alterada.

Browser:
- **11/11 checks aprovados**;
- RPC de criacao PEM-00 HTTP 200;
- 1 projeto;
- 1 iniciativa;
- 1 binding;
- nenhum usuario novo.

## 10. Artefatos metodologicos

### Markdown
Criacao, versao e validacao tiveram sucesso HTTP.

O teste visual encontrou o mesmo comportamento ja observado na homologacao anterior: o drawer nao atualiza imediatamente o texto de protecao apos `loadAll()`. Isso gerou timeout somente na verificacao visual final.

Estado real confirmado no banco:
- exatamente 1 artefato sintetico Markdown criado pelo teste;
- status `validated`;
- versao atual 1;
- 1 versao;
- 1 validacao `validated`;
- zero `storage_path`.

Classificacao: problema visual preexistente e nao bloqueante para a migration pgcrypto.

### Arquivo sintetico
- **8/8 checks aprovados**;
- upload real pelo frontend;
- versao registrada;
- download pelo frontend;
- payload sintetico de 62 bytes retornou byte a byte identico;
- exatamente 1 objeto sintetico desse artefato permaneceu no bucket `methodology-artifacts` como evidencia funcional explicita.

## 11. Portabilidade

Browser:
- **13/13 checks aprovados**;
- JSON;
- XLSX;
- HTML;
- ZIP;
- zero erros HTTP;
- zero erros JavaScript.

Pacote:
`PKG-SK-PE-20261020180252568-B3D667`

Estado:
- `completed`;
- `project_id` presente;
- integrity hash com 64 caracteres;
- ultimo formato `zip`.

Arquivos gerados:
- JSON: 135.314 bytes;
- XLSX: 50.267 bytes;
- HTML: 232.752 bytes;
- ZIP: 91.773 bytes.

Auditoria:
- PACKAGE_CREATED: 1;
- JSON_EXPORT_GENERATED: 4;
- XLSX_EXPORT_GENERATED: 1;
- HTML_EXPORT_GENERATED: 1;
- ZIP_EXPORT_GENERATED: 1.

## 12. Preservacao final

Confirmado:
- os tres containers protegidos mantiveram ID, imagem, horario de inicio, network mode e ausencia de portas;
- rede de prova permanece `internal=true`;
- membros da rede exatamente os seis servicos previstos;
- todos os seis servicos ativos da prova sem portas publicadas;
- todos os seis com root filesystem read-only;
- ACL core final: 4.805;
- 254 tabelas;
- 811 funcoes core;
- 271 politicas;
- `pgcrypto 1.3` em `extensions`;
- `anon/authenticated` sem `USAGE` em `extensions`.

Apos os testes de navegador, o runtime contem apenas os fixtures sinteticos explicitamente esperados e 1 objeto sintetico do artefato de arquivo. Nenhum blob real foi utilizado.

## 13. Branch limpo

O branch de desenvolvimento original estava 128 commits a frente de `main`, tornando inadequado usa-lo diretamente para esta correcao isolada.

Foi criado um worktree/branch limpo a partir de `sparkooptech/main`:
`fix/pgcrypto-extensions-schema-20261020`

O cherry-pick da correcao produziu o commit `770a641`, inicialmente **1 commit a frente de main**, sem carregar as demais mudancas do branch de desenvolvimento.

A migration no cherry-pick usa exatamente o mesmo blob Git homologado.

## 14. Evidencias seguras

Os JSONs desta pasta foram copiados do ambiente de prova e submetidos a scanner local. Nenhum padrao de credencial/token foi encontrado:
- password;
- access_token;
- refresh_token;
- jwt_secret;
- anonKey;
- service_role;
- private_key.

Nao foram versionados:
- senhas;
- tokens;
- chaves privadas;
- dumps;
- arquivos de usuarios;
- blobs reais.

## 15. Gate

Esta prova **nao autoriza automaticamente**:
- merge em `main`;
- aplicacao em homologacao compartilhada/oficial;
- aplicacao em producao;
- cutover;
- publicacao de ingress/Traefik.

Proximo gate recomendado:
1. publicar o branch limpo;
2. revisar PR focado contra `main`;
3. somente com aprovacao explicita, realizar merge e aplicar progressivamente em homologacao oficial antes de producao.
