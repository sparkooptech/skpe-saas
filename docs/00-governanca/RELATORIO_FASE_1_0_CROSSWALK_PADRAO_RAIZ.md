# Relatorio Fase 1.0 - Crosswalk com Padrao Documental Raiz

FRONTMATTER MODEL: PENDING METADATA MODEL DECISION

## 1. Objetivo

Executar um crosswalk proporcional entre:

- a hipotese local da Fase 0 do `skpe-saas`;
- o padrao documental mais maduro observado em `C:\Users\robso\OneDrive\DevKit\projetos\docs`;
- as necessidades reais do corpus atual do `skpe-saas`.

Objetivo operacional:

- reutilizar o vocabulario e a arquitetura semantica ja consolidados no padrao raiz;
- evitar um segundo sistema documental concorrente;
- produzir base suficiente para a proxima decisao de modelo de metadata;
- nao aplicar frontmatter ainda;
- nao migrar documentos ainda.

## 2. Fontes de referencia

### 2.1 `skpe-saas`

- `README.md`
- `docs/00-governanca/ROADMAP_GOVERNANCA_DOCUMENTAL_AGENTICA.md`
- `docs/00-governanca/RELATORIO_FASE_0_GOVERNANCA_DOCUMENTAL_AGENTICA.md`
- `docs/00-governanca/RELATORIO_FASE_0_1_DECISOES_ESTRUTURANTES.md`
- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
- `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`

### 2.2 `projetos/docs` - somente leitura

Leitura prioritaria:

- `docs/products/README.md`
- `docs/products/coliga/README.md`
- `docs/products/produz/README.md`
- `docs/products/coliga/governance/README.md`
- `docs/products/coliga/canonical-sources/README.md`
- `docs/products/coliga/navigation/README.md`
- `docs/products/produz/governance/README.md`
- `docs/products/produz/canonical-sources/README.md`
- `docs/products/produz/navigation/produz-knowledge-map.md`
- `docs/products/coliga/navigation/coliga-semantic-map.md`
- `docs/governance/README.md`
- `docs/governance/knowledge-promotion-pipeline.md`
- `docs/governance/semantic-authority-hierarchy.md`
- `docs/governance/vault-current-truth.md`
- `docs/governance/vault-canonical-boundary-decision.md`
- `docs/governance/knowledge-classification-model.md`
- `docs/governance/canonical-authority-strategy.md`
- `docs/governance/document-creation-governance.md`
- `docs/governance/frontmatter-hardening-strategy.md`
- `docs/onboarding/VAULT_AI_BOOTSTRAP.md`
- `docs/navigation/knowledge-vault-map.md`

Leitura complementar de espacos maduros:

- `docs/products/coliga/architecture/database/domain-table-naming-strategy.md`
- `docs/products/produz/canonical-sources/produz-canonical-sources-map.md`
- `docs/products/produz/proposals/revision-foundation/README.md`

## 3. Padrao documental encontrado

FACT:

- o padrao raiz e orientado a hubs, product spaces e progressive disclosure;
- o corpus maduro em `docs/products/**` usa frontmatter de forma quase universal;
- o grafo documental nao e expresso apenas por metadata; o corpo do documento tambem carrega navegacao semantica explicita;
- existe uma hierarquia de autoridade documental combinada com um pipeline de promocao seletiva;
- o vault trata `docs/` como camada governada de conhecimento, separada do conhecimento operacional disperso.

INFERENCE:

- o padrao raiz nao e apenas um schema de frontmatter; ele e um sistema editorial completo composto por:
  - hubs de entrada;
  - classificacao de autoridade;
  - relacoes semanticas redundantes para humano + IA;
  - lineage de migracao;
  - governanca de promocao para canonicidade.

Padrao raiz sintetizado:

1. um hub principal roteia para product spaces, dominios transversais e camadas de governanca;
2. cada espaco maduro tem seus proprios hubs locais;
3. frontmatter define identidade, papel semantico e relacoes basicas;
4. o corpo reforca parentage, child links, related links e mapas semanticos;
5. documentos canonicos surgem por promocao seletiva, nao por adicao massiva de metadata.

## 4. Frontmatter observado

### 4.1 Campos recorrentes no padrao raiz

| Campo | Frequencia aparente | Papel semantico | Obrigatorio aparente? | Observacao |
|---|---|---|---|---|
| `id` | muito alta | identidade semantica estavel | sim no padrao endurecido | alguns legados podem omitir |
| `title` | muito alta | titulo canonico explicito | sim | recorrencia quase universal |
| `domain` | muito alta | familia documental ou dominio principal | sim | no products hub aparece como `products` |
| `type` | muito alta | genero documental | sim | usado para hubs, maps, reports, architecture etc. |
| `status` | muito alta | lifecycle ou estado atual do documento | sim | vocabulario e mais amplo que o da Fase 0 |
| `owner` | muito alta | stewardship/autoria institucional | sim no endurecimento | forte papel operacional |
| `canonical` | alta | atalho booleano de autoridade | quase sempre presente | ha combinacoes sem este campo |
| `canonicality` | alta | classe semantica de autoridade | nao universal, mas muito forte | aparenta carregar semantica diferente de `status` |
| `criticality` | alta | prioridade ou impacto do artefato | nao universal | forte em hubs e docs nucleares |
| `parent` | alta | relacao hierarquica principal | nao universal | convive com links no corpo |
| `related` | alta | relacoes semanticas laterais | sim no endurecimento minimo | padrao raiz usa `related`, nao `related_to` |
| `tags` | media/alta | indexacao tematica | recomendada | nao aparenta ser minima em todos os clusters |
| `language` | media/alta | lingua do documento | opcional | comum em corpus maduros |
| `encoding` | media/alta | codificacao do artefato | opcional | comum em corpus maduros |
| `semantic_layer` | media/alta | camada semantica editorial | opcional, mas muito util | aparece de forma consistente em espacos maduros |
| `created` | media | data de criacao | opcional | padrao maduro tende a usar `created`/`updated` |
| `updated` | media | data de ultima atualizacao | opcional | preferencia observada sobre `updated_at` |
| `product` | localizada | product space formal | extensao contextual | forte em espacos maduros como PRODUZ |
| `capability` | localizada | capacidade dentro do product space | extensao contextual | nao e base universal do vault |
| `migrated_from` | localizada | lineage de origem | extensao de migracao | relevante para promocao seletiva |
| `migrated_at` | localizada | data da migracao | extensao de migracao | acompanha lineage |
| `migration_wave` | localizada | onda de migracao | extensao de migracao | operacional para roadmap de migracao |
| `origin_status` | localizada | estado original da fonte | extensao de migracao | evita perda de contexto |
| `source` | localizada | origem ou fonte precedente | extensao de migracao | nao parece core universal |

### 4.2 Leitura do endurecimento raiz

FACT:

- `docs/governance/frontmatter-hardening-strategy.md` endurece um nucleo minimo centrado em `id`, `title`, `domain`, `type`, `status`, `owner`, `related`, com `canonical`, `parent` e `tags` como campos fortemente recomendados;
- o corpus maduro tambem mostra uso consistente de `canonicality`, `criticality` e `semantic_layer`.

INFERENCE:

- o menor subconjunto compativel com o padrao raiz nao e o mesmo da hipotese local da Fase 0;
- a hipotese local ficou curta em relacoes e ownership, e criou vocabulos paralelos em pelo menos um ponto relevante: `related_to`.

## 5. Relacoes semanticas

FACT:

- o padrao raiz expressa relacoes tanto no frontmatter quanto no corpo;
- `parent` e a relacao hierarquica mais evidente no frontmatter;
- `related` expressa vizinhanca semantica lateral;
- hubs, semantic maps, canonical sources maps e knowledge maps funcionam como indices ativos;
- Child Links, Parent Links e Related Links aparecem no corpo de varios documentos;
- migration lineage tambem e tratado como relacao documental formal.

Resposta as perguntas da fase:

1. O grafo documental e expresso apenas pelo frontmatter?

Nao. O padrao raiz usa modelo hibrido: frontmatter + corpo.

2. Ha redundancia deliberada para consumo humano + IA?

Sim. A redundancia e intencional e operacional.

3. Como o padrao diferencia hierarquia de relacao semantica?

- `parent` para hierarquia principal;
- `related` para relacao lateral;
- hubs e maps para descoberta progressiva;
- lineage para relacao historica e de promocao.

4. Como o padrao diferencia documentacao canonica, supporting, onboarding, snapshots e future candidates?

- por combinacao de `status`, `canonicality`, `canonical`, `type`, `semantic_layer` e posicionamento do documento na topologia;
- por documentos de governanca que explicam a hierarquia de autoridade;
- por hubs que separam conscientemente o que e fonte canonica, apoio, onboarding, migracao ou proposta.

## 6. Canonicidade

### 6.1 `status`, `canonicality` e `canonical`

FACT:

- os tres mecanismos aparecem juntos em partes relevantes do padrao raiz;
- tambem existem combinacoes diferentes entre eles;
- ha documentos com `status: canonical` e `canonical: true`;
- ha documentos com `status` diferente de `canonical`, mas ainda assim com `canonicality: canonical` ou `canonical: true`;
- ha documentos de trabalho com `canonicality` nao canonica e `canonical: false`.

INFERENCE:

- os tres campos nao devem ser tratados como sinonimos perfeitos;
- `status` aparenta carregar lifecycle ou estado atual;
- `canonicality` aparenta carregar classe de autoridade ou papel semantico;
- `canonical` aparenta funcionar como shortcut booleano util para descoberta rapida, filtros e automacao.

Resposta objetiva:

1. Sao redundantes?

Parcialmente sobrepostos, mas nao redundantemente equivalentes.

2. Cumprem papeis diferentes?

Sim, na pratica observada.

3. Existem documentos com combinacoes diferentes?

Sim.

4. Ha razao operacional para manter os tres?

Sim. O trio permite separar lifecycle, classe de autoridade e sinal booleano de canonicidade.

5. Algum deles pode ser legado?

Possivelmente em subconjuntos locais, mas nao ha evidencia suficiente para o `skpe-saas` simplificar isso agora com seguranca.

6. Ha risco em simplificar incorretamente?

Sim. O risco principal e colapsar autoridade, estado e governanca em um unico marcador insuficiente.

### 6.2 Implicacao para o `skpe-saas`

SUPERSEDED CANDIDATE DECISION:

- a decisao preliminar da Fase 0 de tratar `canonical` apenas como campo separado e `status` com vocabulario minimo local e util como historico;
- porem ela e insuficiente como schema definitivo sem considerar `canonicality` e o vocabulario mais rico observado no padrao raiz.

## 7. Hubs e progressive disclosure

FACT:

- `docs/products/README.md` funciona como hub transversal para product spaces;
- `coliga` e `produz` possuem hubs locais de governanca, canonical sources, navigation, onboarding e outros clusters;
- os hubs nao substituem todos os documentos; eles orquestram a ordem de descoberta;
- o modelo evita documento monstro ao quebrar a navegacao em camadas.

INFERENCE:

- o conceito de hub resolve melhor o problema de entrypoint do que um documento enciclopedico unico;
- o valor principal nao esta em copiar a arvore de `COLIGA` ou `PRODUZ`, mas em reutilizar o principio editorial:
  - descoberta na borda;
  - encaminhamento por contexto;
  - especializacao progressiva.

## 8. Promotion pipeline / lineage

FACT:

- o padrao raiz formaliza pipeline de promocao seletiva de conhecimento operacional para conhecimento canonico;
- o vault diferencia conhecimento operacional, hibrido e canonico;
- lineage de migracao e preservado em campos e em documentos de migracao;
- canonical boundary e current truth sao tratados explicitamente em governanca.

INFERENCE:

- esta logica e diretamente reaproveitavel para o papel de `_audit/**` no `skpe-saas`;
- `_audit/**` nao precisa virar um sistema paralelo; pode permanecer como camada de evidencia e fechamento, com promocao seletiva apenas quando um artefato amadurecer para `docs/**`.

## 9. Crosswalk Fase 0 x padrao raiz

### 9.1 Tabela principal

| Necessidade semantica | Fase 0 local | Padrao raiz | Compativel? | Recomendacao |
|---|---|---|---|---|
| Identidade estavel | `id` | `id` | sim | reutilizar sem alteracao |
| Titulo explicito | `title` | `title` | sim | reutilizar sem alteracao |
| Genero documental | `type` | `type` | sim | reutilizar sem alteracao |
| Estado/lifecycle | `status` com vocabulario minimo local | `status` com vocabulario mais rico | parcial | reutilizar com regra especifica; nao congelar vocabulario local ainda |
| Stewardship | `owner` condicional | `owner` muito recorrente | parcial | promover `owner` para campo fortemente esperado |
| Dominio/familia | `domain` condicional | `domain` muito recorrente | parcial | reutilizar com regra especifica; evitar usar como pseudo-vertical |
| Canonicidade booleana | `canonical` | `canonical` | sim | reutilizar com regra especifica |
| Classe de autoridade | ausente | `canonicality` | nao | incorporar na decisao de modelo |
| Relacao hierarquica | ausente | `parent` | nao | incorporar na decisao de modelo |
| Relacao lateral | `related_to` | `related` | parcial | renomear para `related` |
| Camada semantica | ausente | `semantic_layer` | nao | considerar reutilizacao contextual, nao obrigatoriedade universal imediata |
| Criticidade | ausente | `criticality` | nao | manter fora do minimo local inicial, mas dentro do horizonte raiz |
| Indexacao | ausente | `tags` | nao | opcional futura, nao minima imediata |
| Temporalidade | `updated_at` | `updated` e `created` | parcial | alinhar nomenclatura futura ao raiz; nao decidir aplicacao agora |
| Escopo plataforma/modulo | `scope` | topologia + `domain` + hubs + relations | parcial | nao promover como core definitivo sem provar necessidade |
| Dependencia de leitura | `depends_on` | relacoes no corpo e lineage, sem ser campo core | parcial | manter como extensao eventual, nao como campo minimo herdado |

### 9.2 Menor subconjunto compativel

INFERENCE:

O menor subconjunto compativel com o padrao raiz que parece resolver as necessidades comprovadas do `skpe-saas` e:

- `id`
- `title`
- `domain`
- `type`
- `status`
- `owner`
- `canonical`
- `canonicality`
- `parent`
- `related`

Campos fortemente candidatos, mas nao necessariamente universais para o primeiro piloto:

- `semantic_layer`
- `criticality`
- `created`
- `updated`
- `tags`

## 10. Planejamento Estrategico / SK-PE

### 10.1 Diferenca semantica

INFERENCE:

- `Planejamento Estrategico` nao e semanticamente a mesma coisa que `SK-PE`;
- `Planejamento Estrategico` representa melhor uma capacidade de negocio, espaco tematico ou dominio de trabalho;
- `SK-PE` representa melhor o modulo especialista que opera sobre esse espaco.

### 10.2 Representacao recomendada

RECOMMENDED:

- nao criar agora `vertical: planejamento-estrategico`;
- representar `Planejamento Estrategico` primeiro como conceito editorial resolvido por naming, topologia documental e, quando fizer sentido em espaco maduro, por `domain` e possivelmente `capability`;
- representar `SK-PE` como modulo especialista, nao como sinonimo do dominio.

Descricao funcional recomendada para o conceito:

- `Planejamento Estrategico`: capacidade/espaco tematico que constroi planos estrategicos realistas e executivos;
- `SK-PE`: modulo especialista responsavel por estruturar, revisar, desdobrar, auditar e consolidar artefatos desse espaco com governanca metodologica.

### 10.3 Documentos transversais e compartilhados

RECOMMENDED:

- documentos transversais da Plataforma SPARKs nao devem ser forcados para `Planejamento Estrategico`;
- documentos compartilhados PE + PN devem permanecer em camada transversal ou compartilhada, conectados por `related` e hubs, sem duplicacao;
- quando o conhecimento pertencer ao dominio compartilhado, o documento deve continuar compartilhado mesmo que um modulo o consuma intensamente.

## 11. Necessidade ou nao de `vertical`

Resposta as opcoes da fase:

### Opcao 1

O padrao raiz ja resolve parte substancial do problema sem novo campo por meio de:

- topologia por hubs;
- `domain`;
- `parent`;
- `related`;
- `semantic_layer`;
- extensoes contextuais como `product` e `capability`.

### Opcao 2

O padrao raiz quase resolve totalmente e deixa espaco para extensao minima contextual futura, se o `skpe-saas` amadurecer um product space semelhante ao que `PRODUZ` ja expressa com `product` e `capability`.

### Opcao 3

Nao ha evidencia forte suficiente para autorizar novo campo `vertical` agora.

Conclusao:

RECOMMENDED:

- adotar Opcao 2 como leitura de trabalho;
- na decisao imediata de metadata, agir operacionalmente como Opcao 1;
- manter `vertical` fora do schema ate prova clara de que `domain`, topologia, relacoes e eventual extensao contextual nao resolvem.

## 12. Simulacao do piloto

IMPORTANTE:

- simulacao apenas;
- nao aplicar nos arquivos reais;
- valores marcados como `FACT`, `INFERENCE` ou `HUMAN DECISION REQUIRED`.

### 12.1 `README.md`

```yaml
id: HUMAN DECISION REQUIRED - id estavel ainda nao definido
title: FACT - SK-PE SaaS
domain: INFERENCE - skpe-platform
type: INFERENCE - entrypoint
status: HUMAN DECISION REQUIRED - active ou canonical dependem de decisao
owner: HUMAN DECISION REQUIRED
canonical: HUMAN DECISION REQUIRED
canonicality: HUMAN DECISION REQUIRED
parent: INFERENCE - none
related:
  - FACT - sparks-agent-execution-guardrails
```

### 12.2 `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`

```yaml
id: FACT - sparks-agent-execution-guardrails
title: FACT - Guardrails de Execucao Agentica - Plataforma SPARKs / SK-PE SaaS
domain: INFERENCE - governance
type: INFERENCE - governance
status: FACT - active
owner: FACT - SPARKOOP
canonical: HUMAN DECISION REQUIRED
canonicality: HUMAN DECISION REQUIRED
parent: INFERENCE - roadmap ou futuro hub de governanca
related:
  - FACT - roadmap-governanca-documental-agentica
  - FACT - relatorio-fase-0-governanca-documental-agentica
```

### 12.3 `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`

```yaml
id: FACT - adr-plat-biz-001
title: FACT - Dominio Compartilhado: Arquitetura de Negocios PE/PN
domain: FACT - business-architecture
type: FACT - adr
status: FACT - approved
owner: FACT - SPARKOOP
canonical: FACT - true
canonicality: FACT - canonical
parent: FACT - sparks-platform-business-architecture
related:
  - FACT - req-skpe-fe-001
  - FACT - shell-app-transversal-contract-fe09a03
```

### 12.4 `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`

```yaml
id: FACT - req-skpe-fe-001
title: FACT - Arquitetura Canonica de Formulacao Estrategica
domain: INFERENCE - strategic-planning
type: FACT - requirement
status: HUMAN DECISION REQUIRED - approved no corpo nao equivale automaticamente ao status oficial futuro
owner: HUMAN DECISION REQUIRED
canonical: HUMAN DECISION REQUIRED
canonicality: HUMAN DECISION REQUIRED
parent: INFERENCE - futuro hub de methodology ou capability
related:
  - FACT - adr-plat-biz-001
  - FACT - shell-app-transversal-contract-fe09a03
```

### 12.5 `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`

```yaml
id: FACT - shell-app-transversal-contract-fe09a03
title: FACT - Contrato Shell Aplicacional Transversal
domain: INFERENCE - shared-platform
type: FACT - contract
status: HUMAN DECISION REQUIRED
owner: HUMAN DECISION REQUIRED
canonical: HUMAN DECISION REQUIRED
canonicality: HUMAN DECISION REQUIRED
parent: INFERENCE - futuro hub transversal de arquitetura/metodologia
related:
  - FACT - adr-plat-biz-001
  - FACT - req-skpe-fe-001
```

### 12.6 `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`

```yaml
id: FACT - relatorio-fechamento-c10
title: FACT - Relatorio de Fechamento C10
domain: FACT - skpe-governance
type: FACT - report
status: FACT - approved
owner: FACT - SPARKOOP
canonical: INFERENCE - false
canonicality: INFERENCE - supporting ou historical; decisao humana ainda necessaria
parent: INFERENCE - audit-hub ou governance lineage
related:
  - FACT - relatorio-fechamento-c9f
  - FACT - req-skpe-fe-001
```

## 13. Entry point

Reavaliacao da D01 da Fase 0:

INFERENCE:

- a direcao de progressive disclosure da D01 continua correta;
- o ponto a revisar nao e o principio do entrypoint, e sim a sua forma editorial;
- a luz do padrao raiz, o melhor futuro entrypoint especializado tende a ser um hub documental compativel com a logica de `docs/products`, e nao um documento mestre autocontido.

Resposta as perguntas da fase:

1. O futuro entrypoint especializado deveria ser um hub documental compativel com `docs/products`?

Sim, preferencialmente.

2. Ou guardrail + README ja resolvem?

Ainda nao resolvem integralmente a navegacao semantica.

3. Como evitar mais um documento mestre?

Usando `README.md` como descoberta, um hub governante como primeiro destino e hubs/contextos especializados como proximos passos.

SUPERSEDED CANDIDATE DECISION:

- a ideia da Fase 0 de um entrypoint especializado permanece valida;
- a forma mais aderente ao padrao raiz e "hub enxuto + roteamento", nao "documento concentrador extenso".

## 14. Divergencias

### 14.1 Divergencias entre hipotese local e padrao raiz

- `related_to` local diverge de `related` raiz;
- `scope` local ainda nao provou ser melhor que topologia + `domain` + relacoes;
- `updated_at` local diverge da preferencia madura por `updated`;
- a Fase 0 nao contemplou `canonicality`, `parent` e `semantic_layer`;
- a Fase 0 tratou `owner` como condicional, enquanto o padrao raiz o usa com muito mais centralidade.

### 14.2 Divergencias internas do proprio padrao raiz

- nem todo cluster usa exatamente o mesmo conjunto de campos;
- `product` e `capability` existem, mas como extensoes contextuais, nao como base universal;
- `status` nao possui vocabulario unico simples em todo o vault;
- ha evidencias de legado coexistindo com endurecimento progressivo.

## 15. Recomendacoes

### A. Campos a reutilizar sem alteracao

- `id`
- `title`
- `domain`
- `type`
- `status`
- `owner`
- `canonical`
- `parent`
- `related`

### B. Campos a reutilizar com regra especifica

- `canonicality`: reutilizar para classe de autoridade, sem colapsar em `status`
- `status`: reutilizar para lifecycle, sem congelar agora o vocabulario definitivo
- `domain`: reutilizar sem transforma-lo em pseudo-campo `vertical`
- `parent`: usar para hierarquia primaria, nao para toda relacao
- `related`: usar para relacao lateral significativa, nao para dumping de links
- `semantic_layer`: reutilizar quando houver camada editorial clara e estavel

### C. Campos locais da Fase 0 a descartar ou renomear

- descartar `related_to` em favor de `related`
- retirar `scope` do nucleo minimo provisoriamente, ate prova clara de necessidade
- retirar `depends_on` do minimo local e trata-lo como extensao eventual
- alinhar `updated_at` para a familia `updated` na decisao futura, se o campo temporal permanecer

### D. Campos novos realmente necessarios

No nivel desta Fase 1.0, nenhum campo totalmente novo local foi comprovadamente necessario.

O que se mostrou necessario foi:

- reutilizar melhor campos ja existentes no padrao raiz;
- reintroduzir no debate local campos raiz ausentes da hipotese Fase 0, especialmente `canonicality` e `parent`.

### E. Conceito de Planejamento Estrategico

RECOMMENDED:

- `Planejamento Estrategico`: tratar como capacidade/espaco tematico;
- descricao: `Constroi planos estrategicos realistas e executivos.`
- `SK-PE`: tratar como modulo especialista que opera nesse espaco;
- papel metodologico: representar no conteudo e na topologia, nao como novo campo tecnico imediato;
- documentos transversais: manter como transversais;
- documentos PE: conectar ao espaco tematico ou capability correspondente quando esse espaco estiver editorialmente maduro;
- documentos compartilhados PE/PN: manter como compartilhados, sem duplicacao.

## 16. Human Decisions Required

1. Confirmar se o `skpe-saas` quer adotar explicitamente o nucleo compativel com `id`, `title`, `domain`, `type`, `status`, `owner`, `canonical`, `canonicality`, `parent`, `related`.
2. Confirmar se `status` local deve continuar aceitando `approved` como classe oficial ou se isso sera tratado como aprovacao complementar a lifecycle.
3. Confirmar se `REQ-SKPE-FE-001` deve ser tratado como documento canonico, supporting ou apenas requirement forte.
4. Confirmar se `CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03` e de fato fonte canonica transversal.
5. Confirmar ownership institucional dos documentos de metodologia que hoje nao o declaram de forma robusta.
6. Confirmar o future hub especializado de governanca como forma do entrypoint, sem implementa-lo ainda.
7. Confirmar se `Planejamento Estrategico` sera tratado editorialmente como capability, dominio local ou product-space candidate dentro de SPARKs.

## 17. Gate

Classificacao final:

`READY FOR METADATA MODEL DECISION`

Justificativa:

- ha padrao raiz suficientemente claro para evitar invencao local;
- ha evidencia suficiente para abandonar vocabulario paralelo em pontos criticos;
- ha base para decidir um subconjunto minimo compativel;
- ainda nao ha base para iniciar migracao ou aplicar frontmatter em lote.

Confirmacoes desta execucao:

- `PADRAO RAIZ ALTERADO: NAO`
- `FRONTMATTER APLICADO NO SKPE-SAAS: NAO`
- `ENTRYPOINT IMPLEMENTADO: NAO`
- `MIGRACAO INICIADA: NAO`
- `CODIGO-FONTE ALTERADO: NAO`
- `COMMIT: NAO`
- `PUSH: NAO`

Principio mantido:

Reutilizar.
Depois adaptar.
Somente entao, se comprovadamente necessario, estender.
