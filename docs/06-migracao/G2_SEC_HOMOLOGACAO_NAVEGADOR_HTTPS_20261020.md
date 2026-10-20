---
titulo: Homologação da interface real em navegador e HTTPS interno
data: 2026-10-20
projeto: SPARKOOP-SPARKs-DA
estado: portal e abertura do módulo validados; início de projeto sintético bloqueado antes de execução
ambiente: cópia isolada no Hostinger; acesso operacional pelo RMKB-NTB
---

# G2-SEC — Navegador, interface isolada e HTTPS

## Autorização e limites
Autorização do usuário em 20/10/2026 14:00:26 UTC para cópia isolada do frontend, HTTPS interno e navegador com contas/organizações fictícias existentes e dados de teste identificados. Continuidade reiterada às 14:14:29 UTC. Não é necessária nova aprovação desse pacote. Preservar frontend publicado, clone corrigido, V5, prova de recuperação, Supabase e serviços corporativos. Sem portas públicas, DNS/Traefik corporativo, confiança global de certificados, contas reais, arquivos legados, OAuth/SMTP externo, Edge Functions, commit/push ou cutover.

## Preparação efetivamente concluída
Diretório no VPS: `/root/sparks-g2-integration/20261020-01/browser-https-01/`.
Build isolado no RMKB-NTB: `apps/web/.g2-browser-20261020-01/`, criado a partir dos arquivos da aplicação, sem copiar `.env`. Resumo do build registra 286 arquivos de origem e HEAD `20c2d0c1948aabde5953eeb41416bc1ec68c7177`; preserva inclusive o trabalho local já existente. TypeScript e Vite concluídos (PID 29876 exit 0). Bundle aponta exclusivamente para a API interna. Nenhuma alteração do código funcional nem atualização de dependências do projeto. PID 30072 exit 0 reconferiu os hashes e encontrou ZERO arquivos de origem alterados; a apresentação da contagem nesse comando foi inadequada (uma sequência de valores 1), portanto a quantidade 286 decorre do build-summary, não daquele contador.
Imagem de testes Playwright 1.64.0-noble obtida, fixada e derivada apenas para instalar libnss3-tools na nova imagem. Bibliotecas Playwright/playwright-core 1.64.0 obtidas com integridade verificada. Não instalado navegador/certificado global no Windows ou no VPS. A primeira construção falhou porque FROM recebeu ID local como repositório; corrigido para RepoDigest oficial. Logs e imagens anteriores preservados.
PID 29924 exit 0, 14:09:31 UTC: criado `sparks-g2-int-ui-https-20261020-01`, Nginx não-root, raiz somente leitura, capabilities retiradas, na rede interna existente e sem portas publicadas. Endereços resolvidos somente nessa rede: `https://g2-ui.test:8443` (frontend), `https://g2-api.test:8443` (API) e `https://g2-unapproved.test:8443` (controle negativo CORS). Bundle servido sem modificações funcionais; API encaminha ao gateway existente. Foi adicionada SOMENTE a origem HTTPS da UI aos dois mapas CORS do gateway, com validação e recarga controlada; não alterados outros serviços ou DNS externo.
CA e certificado exclusivos de teste, com SANs dos três nomes internos. Validade do certificado servidor: 20/10/2026 14:04:34 UTC a 22/10/2026 14:04:34 UTC. A chave anon limitada já usada no gateway tem validade temporária própria e não deve ser tratada como configuração definitiva. Chaves privadas e credenciais permanecem no VPS, não em screenshots ou relatórios.

## Confiança TLS: falhas preservadas e solução comprovada
Duas primeiras execuções de UI (PIDs 19916 e 30432, exit 1) não passaram da navegação TLS: ERR_CERT_AUTHORITY_INVALID, sem login ou teste funcional. A CA inicialmente estava no home de outro usuário da imagem; a correção para /home/ubuntu não foi, sozinha, suficiente. Não reclassificar essas tentativas como homologação.
A documentação Chromium informa o NSS Shared DB e o novo caminho desde M146. Foi criado um home temporário gravável no contêiner de teste, com banco NSS em `.local/share/pki/nssdb` e apenas a CA desta execução. Não foi desabilitada a verificação de certificados. Essa solução foi testada, mas não demonstra isoladamente qual diferença entre caminho e permissões explicava toda a falha anterior.
PID 30456 exit 1: primeiro diagnóstico específico falhou antes de abrir navegador por resolução de playwright-core no mount. Corrigido no diagnóstico canônico, sem mudança no servidor.
PID 26072 exit 0, 14:17:46 UTC: Chromium 156.0.8078.4, tanto headless padrão quanto canal chromium, retornou HTTP 200 com TLS 1.3 e emissor SPARKs G2 Isolated Test CA. `ignoreHTTPSErrors=false`; nenhum bypass por fingerprint/flag de certificado. Nenhuma conta, token ou banco utilizado nesse diagnóstico.
O teste usa a configuração padrão de lançamento Playwright dentro de contêiner não-root restrito; não declarar uma auditoria completa do sandbox do Chromium. Origem externa bloqueada pelo teste e rede exclusivamente interna.

## Bateria real da interface — 34 verificações aprovadas
PID 17360 exit 1: após resolver TLS, quatro fluxos pararam na automação do campo de senha. O componente legítimo usa readOnly até receber foco; locator.fill esperava edição antes de produzir esse foco. Corrigido o TESTE para clicar no campo antes de preencher, sem editar App.tsx. Essa tentativa registrou 11 aprovações e quatro timeouts, não um resultado funcional aprovado.
PID 30128 exit 0, 14:22:26 UTC: `ui-smoke-04`, **34 verificações aprovadas, zero falhas/erro terminal**. URL HTTPS da aplicação real; transporte normal da aplicação; nenhum mock de resposta e nenhuma substituição de fetch. A interceptação Playwright apenas limita destinos de rede.
Cobertura: TLS confiável e contexto seguro; CORS permitido exercitado pelo navegador; senha incorreta negada; login real das quatro contas sintéticas; resposta da RPC efetivamente chamada pela aplicação com conjunto exato de organizações; ausência de organização para conta sem vínculo; saída da tela de login; ausência de exceções JavaScript; persistência da sessão após recarga; verificação de ausência de overflow horizontal em viewport 390px; logout real das quatro contas; origem HTTPS não autorizada impedida de ler a API pelo navegador. Os resultados não representam todas as telas, navegadores ou dimensões responsivas.
Evidências: `ui-smoke-04/{summary.json,code.sha256,output/results.json,output/findings.json,output/*.png}`. Não foram salvos tokens de sessão nos relatórios. Entradas com senhas fictícias permanecem em arquivo restrito no VPS. Screenshots do login e do módulo sintético foram copiados ao diretório local de evidências.

## Dados de teste para entrar no módulo
A leitura real mostrou que as duas organizações fictícias ainda não possuíam módulos. O catálogo SK-PE já estava ativo; SK-DA e demais módulos planejados NÃO foram ativados.
PID 27148 exit 0: criado conjunto de fixture com dois registros organization_modules (SK-PE, trial) e três user_module_roles: administrador de módulo para cada administrador de sua própria organização e visualizador para o membro da organização A. Nenhuma permissão global de plataforma ou SQL foi concedida. Validade limitada a dois dias. Contas e organizações mantidas; nenhum usuário novo.
Antes do COMMIT, ensaio com ROLLBACK e verificação de visibilidade das quatro identidades. Após COMMIT, quantidades 2/3 confirmadas. Fixtures identificadas em configuration e mapa restrito de IDs. Permanecem disponíveis para continuidade; não foram removidas. Evidências: `module-fixtures-01/`.

## Abertura do SK-PE pelo navegador — 15 verificações aprovadas
A primeira preparação do runner de módulo terminou exit 1 (PID 5892) por nome incorreto do arquivo da suíte, antes de iniciar navegador; diretório parcial preservado. Corrigido o nome exato no runner e usado um destino novo, sem recriar fixtures.
PID 27272 exit 0, 14:26:50 UTC: `module-survey-02`, **15 verificações aprovadas, zero falhas**. Administradores A/B e visualizador A acessaram apenas sua organização, visualizaram o módulo, abriram a interface SK-PE sem erro HTTP ou exceção JavaScript e atingiram a Visão Geral. A tela real informa ausência de projeto estratégico; o administrador dispõe do botão Iniciar Jornada Estratégica, e o visualizador não. O último detalhe foi observado nos controles capturados, não contado como uma nova asserção automática.
Screenshots e textos foram inspecionados. Trata-se de estado vazio legítimo, NÃO de uma jornada estratégica já executada ou de homologação de evidências/importação.

## Próxima operação bloqueada — projeto fictício não criado
Preparada a suíte independente `g2-browser-project-flow-20261020.mjs` para iniciar um projeto exclusivamente na organização fictícia A pelo botão real e aceitar somente a confirmação que contém seu nome sintético. Ela não foi executada.
A chamada normal que prepararia seu runner e o executaria foi bloqueada pela ferramenta: "Esta ferramenta foi bloqueada pelas configurações de segurança da OpenAI. Verifique novamente o que está enviando." Nenhum PID ou resultado dessa chamada. get_file_info confirmou ENOENT para `g2-browser-project-runner-20261020.py`. Não reenviada por outra ferramenta, fragmentação ou codificação; nenhuma alteração de controles de segurança.
Não houve criação de projeto, evidência ou arquivo de cliente por essa tentativa. A verificação independente posterior não encontrou alterações em tabelas de projetos. A causa específica do bloqueio não foi informada. Não classificar como erro da RPC ou falta de autorização.

## Preservação final efetivamente comprovada
PID 20128 exit 0, 14:31:11 UTC: `g2-browser-preservation-20261020.py`, comparação das 254 tabelas. Das 8.985 linhas legadas, permanecem apenas os dois hashes de migração alterados por autorização anterior; outras 8.983 linhas preservadas. Nenhuma mudança adicional de schema, papéis globais, 811 funções, 271 políticas ou 4.805 ACLs. Histórico igual ao pós-COMMIT aprovado, 74 registros até 73; quatro buckets DISABLED e restrição dark preservada. Os 15 objetos legados e conteúdo Storage continuam iguais.
As únicas novas linhas públicas desta etapa foram dois vínculos de módulo e três papéis sintéticos. Auditoria/sessões Auth podem registrar os logins e logouts de teste; sequência Auth pode avançar. Zero sessões sintéticas restantes e zero arquivos no backend sintético.
Sete estados de contêineres anteriores comparados permanecem iguais; isso é verificação de identidade/imagem/início/redes, não afirmação de imutabilidade do arquivo CORS cuja alteração restrita foi declarada acima. Rede interna com seis serviços após saída dos runners; zero portas públicas. Checksums de backup e evidência da reconciliação conferem. Evidência: `preservation-01/summary.json`.

## Retomada sem regressão
O pacote navegador/HTTPS continua AUTORIZADO e parcialmente concluído. Não restaurar bancos, recriar serviços, refazer hashes, renovar contas ou repetir fixtures. Revalidar os recursos existentes e concluir o início da jornada fictícia quando a execução estiver permitida, respeitando checkpoints. Depois testar evidências pela UI, importação/reexportação e os artefatos offline HTML/Planilha Mestre, com dados exclusivamente fictícios e rastreabilidade.
Continuam sem homologação: criação do projeto pela interface, jornadas internas com dados, anexos/evidências pela UI, fluxos offline-first HTML/Planilha Mestre, expiração real dos links de 300/3600 segundos e comportamento em outros navegadores. As 122 verificações anteriores de Storage por SDK não foram repetidas nem renomeadas como testes de navegador.
Não há nova validação executiva de escopo a pedir por causa do bloqueio. Produção, arquivos legados, offsite, Edge Functions, OAuth/SMTP e cutover continuam fora do pacote. Nenhum commit Git/push/publicação nesta etapa.

## Fontes técnicas e evidências
Fontes públicas consultadas para requisitos técnicos: Chromium Linux Cert Management (NSS, caminho desde M146), documentação Docker do Playwright 1.64.0 e Vite Env and Mode. O índice markdown de changelog Supabase retornou formato não suportado pelo leitor; não usar isso como prova de compatibilidade. As conclusões de execução acima são sustentadas por logs e verificações do ambiente, não apenas por documentação externa.

## Fechamento documental
PID 29488: resumo agregado salvo no VPS e em `docs/06-migracao/evidencias-g2-browser-20261020/browser-stage-summary-20261020.json`, sem tokens/senhas. Contagem local corrigida confirmou 286 arquivos no manifesto da cópia. Capturas `login-https.png` e `module-admin-synthetic.png` copiadas somente com tela de login/organização fictícia; a captura do módulo foi aberta e inspecionada. O estado vazio informa projeto ainda não iniciado, sem alegação de jornada concluída. Git manteve os mesmos cinco arquivos rastreados previamente modificados, sem alterações staged. Históricos e resultados falhos anteriores foram preservados, não sobrescritos.


## Marco 15:23-16:xx - Jornada PEM-00, evidencias e bloqueio de portabilidade

### Fixture SPARKOOP autorizado
A autorizacao recebida previa tres registros sinteticos. O preflight identificou que a identidade admin_a ja possuia exatamente uma pessoa transversal sintetica ativa em sparks_people, criada anteriormente pelo mecanismo de materializacao. Para evitar duplicidade, essa pessoa foi preservada e reutilizada. Foram ensaiados com ROLLBACK e depois aplicados com COMMIT somente os dois registros faltantes: um vinculo temporario em sparks_organization_people com a SPARKOOP e uma atribuicao temporaria project_leader em sparks_person_role_assignments. Ambos usam fixture g2_browser_pem00_fixture_20261020, escopo integration_only e vigencia curta. Resultado persistido: exatamente 1 vinculo ativo SPARKOOP e 1 atribuicao ativa project_leader para admin_a.

### Jornada criada pela interface real
A criacao pela interface HTTPS real foi repetida depois do fixture. Resultado: 11/11 verificacoes aprovadas, RPC start_skpe_project_pem00 HTTP 200, sem usuario novo. Pela organizacao sintetica A foram confirmados 1 projeto SK-PE, 1 iniciativa transversal, 1 binding e 1 responsabilidade ativa. O projeto ficou draft, fase atual PEM-00, progresso 0, com item PEM-00 in_progress/current e validacao pending. Uma verificacao anterior por trade_name havia retornado zero por criterio incorreto; a organizacao sintetica possui o nome em legal_name. A reconciliacao por ID confirmou o projeto.

### Carregamento da area de artefatos
Tentativas com janelas curtas sugeriram falsamente projectId vazio. A investigacao confirmou backend correto para get_skpe_project_context e get_skpe_journey_temporal_read_model (57 linhas). Com espera dirigida pela conclusao do carregamento e janela de ate 60 s, a area Entregas e Relatorios abriu normalmente e o survey terminou 8/8. Portanto nao registrar defeito de estado: tratava-se de latencia/concorrencia de carregamento no teste.

### Ciclo de artefato sintetico Markdown
Artefato G2 TESTE NAVEGADOR - Artefato Sintetico 20261020 criado pela interface. A criacao, primeira versao Markdown e validacao retornaram sucesso no backend. A automacao perdeu apenas a atualizacao visual do aviso protegido. Verificacao SQL posterior confirmou exatamente 1 artefato, status validated, current_version_number 1, 1 versao, 1 validacao validated e zero storage_path. Nao repetir o fluxo para evitar duplicata.

### Arquivo sintetico via Storage real
Artefato G2 TEST FILE ARTIFACT 20261020 testado pela interface real: 8/8 verificacoes, upload para methodology-artifacts, registro da versao e download pelo navegador. O payload sintetico tinha 62 bytes e o arquivo baixado foi identico byte a byte. Nenhum arquivo de cliente foi utilizado.

### Portabilidade - falha herdada da V5
Uma unica solicitacao sintetica de exportacao foi criada: PKG-SK-PE-20261020155414817-F9545F, org A, exportacao, complete_project, layout Pacote Estrategico Portavel SPARKs 1.0.0. A geracao JSON falhou em generate_portability_json_export com SQLSTATE 3F000: schema "extensions" does not exist. Nenhum JSON/XLSX/HTML/ZIP foi gerado. Reutilizar este pacote; nao criar outro.

A funcao generate_portability_json_export usa extensions.digest para SHA-256 e define search_path public,extensions. close_skpe_monitoring_cycle tambem usa extensions.digest. A referencia V5 g2_recovery_v5, o clone homologado, a prova de recovery e a copia de integracao possuem somente pg_trgm e plpgsql: nenhum schema extensions, nenhum pgcrypto e nenhum digest. Portanto o gap e herdado da origem, nao regressao da restauracao/integracao.

### Ensaio pgcrypto - somente rollback
pgcrypto 1.3 esta disponivel na imagem PostgreSQL. Em transacao: CREATE SCHEMA extensions AUTHORIZATION postgres; CREATE EXTENSION pgcrypto WITH SCHEMA extensions; digest funcionou e generate_portability_json_export retornou objeto, colocando temporariamente o pacote como completed com SHA-256 de 64 caracteres. ROLLBACK removeu integralmente schema/extensao e devolveu o pacote a draft sem hash.

Delta temporario medido: funcoes 4141->4177 (+36), schemas 8->9, extensoes 2->3; tabelas permaneceram 254 e politicas 271. O schema novo tem ACL nula e anon/authenticated nao possuem USAGE; embora EXECUTE das funcoes da extensao seja concedido por default, chamadas diretas por anon/authenticated foram negadas por falta de USAGE no schema. Depois do rollback: extensions=0 e pgcrypto=0.

### Gate atual
A aplicacao persistente de extensions + pgcrypto somente na copia de integracao e um novo delta de schema e exige validacao explicita. Proposta: aplicar apenas CREATE SCHEMA extensions AUTHORIZATION postgres e CREATE EXTENSION pgcrypto WITH SCHEMA extensions em sparks-g2-int-pg-20261020-01, confirmar ausencia de grants adicionais a anon/authenticated, preservar 254 tabelas/271 politicas/4805 ACLs existentes, reutilizar o pacote ja criado e executar JSON/XLSX/HTML/ZIP pela interface. Nao alterar V5, clone homologado, recovery proof, producao, rede publica, Git ou cutover.


## Marco 16:03-16:06 - pgcrypto persistente e portabilidade homologada

### Aplicacao autorizada
Com autorizacao explicita, somente em sparks-g2-int-pg-20261020-01 / g2_homol_copy:
- CREATE SCHEMA extensions AUTHORIZATION postgres;
- CREATE EXTENSION pgcrypto WITH SCHEMA extensions.

A aplicacao ocorreu em transacao com guardas e COMMIT somente apos confirmar: pgcrypto 1.3, digest SHA-256 com 64 caracteres, anon sem USAGE em extensions, authenticated sem USAGE em extensions, 254 tabelas e 271 politicas. Nenhuma alteracao foi aplicada a V5, clone homologado, recovery proof ou producao.

### Reuso do pacote existente
Foi reutilizado, sem criar novo pacote:
PKG-SK-PE-20261020155414817-F9545F
id 8308a7d9-8cc0-4a15-8f39-40295e2d5c80.

Antes do teste estava draft, sem project_id e sem integrity_hash.

### Exportacao pela interface real
A suite de navegador real terminou 13/13, sem falhas e sem novos usuarios. Foram gerados:
- JSON: 135320 bytes;
- XLSX: 50300 bytes;
- HTML: 232764 bytes;
- ZIP: 91858 bytes.

Validacoes da suite: pacote existente localizado; JSON baixado e parseavel; manifesto presente; escopo contem somente a organizacao sintetica; XLSX e ZIP com assinatura PK/ZIP; HTML valido e contendo a organizacao sintetica; nenhum erro HTTP e nenhum erro JavaScript.

Estado final do pacote: completed, project_id preenchido, integrity_hash SHA-256 com 64 caracteres, ultimo formato zip. O record_counts confirma 1 organizacao, 1 projeto e 57 skpe_journey_items; as demais secoes estruturadas ainda sem registros permanecem em zero.

### Auditoria da portabilidade
A trilha do pacote registra PACKAGE_CREATED, JSON_EXPORT_GENERATED, XLSX_EXPORT_GENERATED, HTML_EXPORT_GENERATED e ZIP_EXPORT_GENERATED. As tentativas anteriores de JSON deixaram multiplos eventos JSON no pacote apos a correcao porque generate_portability_json_export e chamado novamente como fonte para cada derivacao local; nao foi criado outro pacote.

### Seguranca pos-instalacao
- pgcrypto=1.3 no schema extensions;
- anon USAGE extensions=false;
- authenticated USAGE extensions=false;
- tabelas=254;
- politicas=271.
A contagem anteriormente citada como '4805 ACLs' nao se reproduz como uma unica metrica canonica do catalogo. Para nao substituir uma metrica por outra, foi feita comparacao objetiva de privilegios: table_privileges da integracao e V5 coincidem exatamente em quantidade 2497 e hash; usage_privileges coincidem em quantidade 3 e hash. routine_privileges fora de extensions diferem em 4 entradas entre V5 (2450) e integracao (2446), diferenca que nao pode ter sido causada por pgcrypto porque todos os 36 objetos da extensao foram instalados exclusivamente em extensions. Nao declarar 4805 como confirmado sem recuperar a definicao original dessa metrica.

### Situacao
A dependencia ausente que bloqueava generate_portability_json_export foi corrigida exclusivamente na copia de integracao e o fluxo JSON/XLSX/HTML/ZIP esta homologado pela interface real. Nenhum commit, push, cutover, DNS, Traefik ou publicacao foi realizado.


## Marco 16:13+ - reconciliacao canonica preparada, nao aplicada

### ACL 4.805 recuperada
A definicao exata da metrica historica foi recuperada de `verify-integration-baseline.py`: ACLs explicitos de schemas, relacoes e funcoes nos schemas public/auth/storage, somados aos ACLs de `pg_default_acl`. Resultado atual da integracao: 4.805. Resultado V5: 4.809. As quatro entradas removidas correspondem exatamente a G2-HIER-01: EXECUTE de anon/authenticated sobre `get_organization_descendants` e `is_organization_descendant`. Os quatro grants existem na V5 e estao ausentes na integracao.

### Historico Git e causa estrutural
As migrations de pgcrypto existem no HEAD e sao ancestrais da branch atual. Nao ha migration faltante. Foram localizadas:
- 20260725031733_create_organizational_foundation.sql: instala pgcrypto sem schema;
- 20260728054500_generate_portability_json_manifest.sql: instala pgcrypto sem schema;
- 20260728061000_fix_portability_json_pgcrypto_schema.sql: cria extensions e usa IF NOT EXISTS WITH SCHEMA extensions;
- 20260730100000_create_strategic_monitoring_governance_and_learning.sql: repete o padrao em extensions e usa extensions.digest.

O Postgres 17.11 da integracao usa search_path "$user", public. O pgcrypto 1.3 e relocatable=true. Logo, se uma instalacao historica ocorrer primeiro em public, o comando posterior CREATE EXTENSION IF NOT EXISTS ... WITH SCHEMA extensions nao realoca a extensao. A V5 atualmente nao possui pgcrypto nem schema extensions, embora mantenha funcoes que chamam extensions.digest.

### Rascunho corretivo
Foi criado apenas fora de supabase/migrations:
`deploy/hostinger/skpe-saas-homol/g2-pgcrypto-canonical-reconciliation-DRAFT.sql`

O primeiro ensaio do rascunho revelou uma colisao de nome da variavel PL/pgSQL `current_schema` com o identificador especial PostgreSQL `current_schema`. A transacao abortou e nada persistiu. A variavel foi corrigida para `v_extension_schema`.

A versao corrigida foi validada com ROLLBACK em tres cenarios:
1. pgcrypto ja em extensions: idempotente, aprovado;
2. pgcrypto temporariamente em public: realocado para extensions, aprovado;
3. pgcrypto temporariamente ausente: criado em extensions, aprovado.
Todos retornaram SHA-256 com 64 caracteres e, apos ROLLBACK, o estado persistente continuou pgcrypto 1.3 em extensions.

### Estado do repositorio
Nenhuma migration pgcrypto nova foi criada em supabase/migrations. Ja existia, antes deste marco, o arquivo nao rastreado `supabase/migrations/20261019050000_harden_transversal_evidence_integrity.sql`; ele nao foi criado nem alterado por esta etapa.

CLI Supabase local: 2.116.0. O CLI informa versao 2.121.0 disponivel, mas nao foi atualizado para evitar mudanca de ferramenta durante a homologacao. O comando oficial confirmado e `supabase migration new <migration name>`.

### Gate
A proposta detalhada foi registrada em `docs/06-migracao/G2_PGCRYPTO_CANONICALIZATION_PROPOSAL_20261020.md`. Criar a nova migration canonica, ainda que apenas no Git, permanece sujeito a validacao explicita. Nenhum commit, push ou aplicacao em outro ambiente foi realizado.


## Marco 16:31+ - migration canonica criada e validada

### Criacao pelo CLI
Com autorizacao explicita, foi executado o comando oficial:
`supabase migration new reconcile_pgcrypto_extensions_schema`

O wrapper remoto reteve a saida das duas primeiras chamadas e ambas chegaram a criar arquivo vazio. Foram identificados:
- `20261020163204_reconcile_pgcrypto_extensions_schema.sql` - preservado como migration canonica;
- `20261020163254_reconcile_pgcrypto_extensions_schema.sql` - duplicado vazio acidental.

Nenhum arquivo foi apagado. O duplicado vazio foi movido para:
`docs/06-migracao/evidencias-g2-pgcrypto-20261020/20261020163254_reconcile_pgcrypto_extensions_schema.DUPLICATE_EMPTY_PRESERVED.sql`

As duas sessoes residuais do conector associadas aos comandos `migration new` foram encerradas depois de confirmado que nao havia processo filho util e que os arquivos ja haviam sido criados.

### Migration canonica
Arquivo:
`supabase/migrations/20261020163204_reconcile_pgcrypto_extensions_schema.sql`

Conteudo: 40 linhas, sem GRANT, REVOKE ou DROP persistente. SHA-256:
`49c248216d760ebee90cc3e5f03210175829ccef89e516e189af9a31075860c9`

Logica:
1. garante schema extensions;
2. instala pgcrypto em extensions se ausente;
3. realoca pgcrypto para extensions se estiver em outro schema;
4. mantem sem alteracao se ja estiver correto;
5. aborta se pgcrypto nao terminar em extensions ou se `extensions.digest(bytea,text)` nao existir.

### Validacao da migration real
A migration canonica foi aplicada somente na copia isolada `sparks-g2-int-pg-20261020-01 / g2_homol_copy` em estado ja correto e terminou com COMMIT sem mudanca funcional.

O corpo exato da migration foi entao ensaiado com ROLLBACK em:
- pgcrypto temporariamente em public -> realocado para extensions, SHA-256 64, rollback restaurou extensions;
- pgcrypto temporariamente ausente -> criado em extensions 1.3, SHA-256 64, rollback restaurou estado original.

Pos-auditoria:
- ACL canonica: 4.805;
- grants diretos dos helpers G2-HIER-01 para anon/authenticated: 0;
- pgcrypto: 1.3 em extensions;
- extensions.digest(bytea,text): presente;
- public.digest(bytea,text): ausente;
- anon USAGE extensions: false;
- authenticated USAGE extensions: false;
- tabelas: 254;
- politicas: 271;
- pacote `PKG-SK-PE-20261020155414817-F9545F`: completed, project_id presente, integrity_hash 64, ultimo formato zip.

### Verificacao pelo Supabase CLI
`supabase migration list --local` reconheceu:
- `20261019050000` como local e nao aplicado;
- `20261020163204` como local e nao aplicado.

Portanto a nova migration esta versionada apenas no working tree e nao foi aplicada ao historico local/remote do Supabase CLI.

### Gate atual
Nao realizado:
- commit;
- push;
- aplicacao em V5;
- aplicacao no clone homologado;
- aplicacao no recovery proof;
- aplicacao em producao;
- cutover.

Qualquer um desses passos exige nova autorizacao explicita.
