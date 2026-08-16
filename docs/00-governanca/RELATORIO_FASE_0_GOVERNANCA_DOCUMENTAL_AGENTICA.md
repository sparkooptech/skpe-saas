# Relatorio Fase 0 - Governanca Documental Agentica

FRONTMATTER MODEL: PENDING PHASE 1

## 1. Estado Git

FACT:

- git root: `C:/Users/robso/OneDrive/DevKit/skpe-saas`
- branch: `feature/formulacao-estrategica-operacional`
- HEAD: `d01b11ee58138706afb24c89fd9e7e7b481348be`
- remote: `origin https://github.com/sparkooptech/skpe-saas.git`

FACT: havia alteracoes preexistentes fora do escopo desta execucao em `apps/**`.

FACT: havia alteracao documental preexistente em `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`.

FACT: havia itens nao rastreados preexistentes: `_audit/` e `canonico-skpe-paas.code-workspace`.

## 2. Escopo investigado

FACT: a investigacao comecou na raiz e incluiu:

- `README.md`;
- `docs/**`;
- `_audit/**` como evidencia historica e de praticas paralelas;
- `apps/web/README.md`;
- `supabase/functions/*/README.md`;
- estrutura geral do repositorio.

INFERENCE: o corpus documental relevante encontrado fica majoritariamente em `docs`, com extensoes historicas e de trabalho em `_audit`.

FACT: contagem aproximada de ativos textuais relevantes inspecionados:

- `docs`: 72 arquivos Markdown;
- `_audit`: 8 arquivos Markdown;
- raiz: 1 `README.md`;
- `supabase/functions`: 2 `README.md`;
- `apps/web`: 1 `README.md`.

INFERENCE: o repositorio possui aproximadamente 80 a 85 ativos documentais relevantes para esta frente, desconsiderando artefatos claramente funcionais, SQL de execucao e codigo-fonte.

## 3. Entry points encontrados

FACT: entrypoints existentes ou candidatos visiveis:

- `README.md` na raiz;
- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`;
- `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`;
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`;
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`;
- `docs/02-arquitetura/REQ-PLAT-ORG-001_HOME_ORGANIZACAO_E_ROTEAMENTO_INTELIGENTE.md`;
- `docs/05-functional-specifications/LEIA-ME.md`.

INFERENCE: nao existe um entrypoint unico e inequívoco para agentes. Existem multiplos entrypoints fortes, cada um orientando um aspecto diferente:

- raiz: visao geral muito curta;
- governanca: guardrails de execucao e shell;
- metodologia: arquitetura funcional detalhada do SK-PE;
- arquitetura: decisoes transversais de Plataforma SPARKs;
- funcional: instrucoes operacionais de blocos especificos.

HYPOTHESIS: um agente sem memoria externa provavelmente comecaria pelo `README.md`, mas precisaria descobrir sozinho que o entendimento real depende de leitura posterior de guardrails, requisitos FE e ADRs.

## 4. Inventario resumido

Os rotulos abaixo sao instrumentos provisorios de auditoria, nao estados canonicos aprovados.

| caminho | titulo aparente | tipo aparente | dominio | escopo | status explicito | versao explicita | data explicita | autoria/origem | frontmatter | relacoes declaradas | entrada de agente? | autoridade aparente | risco de drift | possivel duplicidade | observacao |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `README.md` | SK-PE SaaS | overview de repositorio | plataforma + SK-PE | transversal | ausente | ausente | ausente | ausente | ausente | nao | sim | media | medio | nao | FACT: explica objetivo geral, mas e curto demais para orientar precedencia |
| `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md` | Guardrails de Execucao - Plataforma SPARKs | governanca operacional | plataforma | transversal | `active` | `1.0.2` | `2026-08-15` | `SPARKOOP` | completo | nao | sim | alta | medio | nao | FACT: melhor candidato atual a guardrail de agente dentro do repo |
| `docs/00-governanca/ADR-001-supabase-web-como-ambiente-de-desenvolvimento.md` | Uso do Supabase Web no Desenvolvimento | ADR simplificado | plataforma/dev | transversal | texto livre aprovado | ausente | ausente | ausente | ausente | nao | sim | media | medio | nao | FACT: decisao relevante, mas sem metadata formal |
| `docs/02-arquitetura/ADR-PLAT-BIZ-001_*.md` | Dominio Compartilhado de Arquitetura de Negocios | ADR | plataforma | transversal | `approved` | ausente | `2026-07-30` | ausente | completo | `parent`, `related` | sim | alta | baixo | nao | FACT: documento mais maduro em metadata e semantica transversal |
| `docs/02-arquitetura/REQ-PLAT-ORG-001_*.md` | Home da Organizacao e Roteamento Inteligente | requisito | plataforma | transversal | `Aprovado` | ausente | `2026-07-29` | ausente | ausente | nao | sim | alta | medio | nao | FACT: define ponto futuro de entrada da plataforma apos login |
| `docs/02-arquitetura/SKPE_Especificacao_Consolidada_*.md` | Especificacao Consolidada Iniciativas/BMC/VPC | especificacao consolidada | SK-PE + plataforma | misto | texto livre aprovado | ausente | `2026-07-27` no nome | ausente | ausente | nao | incerto | media | medio | incerto | INFERENCE: importante, mas sem metadata ou precedencia operacional |
| `docs/03-methodology/REQ-SKPE-FE-001_*.md` | Arquitetura Canonica da Formulacao Estrategica | requisito-mestre | SK-PE | especifico | `Aprovado para implementacao controlada` | ausente | `30/07/2026` | validacao COOTAQUARA | ausente | nao | sim | alta | medio | nao | FACT: principal definidor funcional do modulo SK-PE |
| `docs/03-methodology/REQ-SKPE-FE-002_*.md` | Governanca e Versionamento da Formulacao | requisito | SK-PE | especifico | texto livre | ausente | ausente | ausente | ausente | nao | sim | alta | medio | nao | FACT: define estados e substituicao no dominio, nao no corpus documental |
| `docs/03-methodology/REQ-SKPE-FE-003` a `REQ-SKPE-FE-010` | serie de requisitos FE | requisitos | SK-PE | especifico | texto livre variavel | ausente | variavel | variavel | ausente | referencias internas textuais | sim | alta | medio | baixa | INFERENCE: conjunto central do modulo, mas sem schema comum de metadata |
| `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md` | Contrato Canonico - Shell Aplicacional Transversal | contrato | plataforma/frontend | transversal | ausente | ausente | ausente | ausente | ausente | nao | sim | alta | medio | nao | FACT: forte candidato normativo transversal |
| `docs/03-methodology/CONTRATO_MEU_ESPACO_TRABALHO_FE09A05.md` | Meu Espaco de Trabalho | contrato | SK-PE/workspace | especifico | `contrato arquitetural para validacao` | ausente | ausente | ausente | ausente | roadmap textual | sim | media | medio | nao | FACT: mistura contrato, roadmap local e dependencia de validacoes futuras |
| `docs/03-methodology/CONTRATO_PAINEL_PRINCIPAL_FE09A06.md` | Painel Principal | contrato | plataforma + SK-PE | misto | texto livre | ausente | ausente | ausente | ausente | referencias textuais | sim | media | medio | nao | INFERENCE: documento de transicao entre modulo e fundacao transversal |
| `docs/03-methodology/MATRIZ_ROTAS_CONTEXTO_FE09A.md` | Matriz de Rotas e Contexto | matriz | SK-PE | especifico | ausente | ausente | ausente | ausente | ausente | nao | sim | alta | medio | nao | FACT: excelente apoio de navegacao, mas sem metadata de autoridade |
| `docs/03-methodology/MATRIZ_PAINEIS_CONTEXTO_FE09A05.md` | Matriz Paineis Contexto | matriz | SK-PE | especifico | ausente | ausente | ausente | ausente | ausente | nao | sim | media | medio | nao | FACT: reforca progressive disclosure funcional dentro do modulo |
| `docs/03-methodology/GUIA_IMPLEMENTACAO_CONTROLADA_FE09A.md` | Guia de Implementacao Controlada | guia | SK-PE | especifico | ausente | ausente | ausente | ausente | ausente | nao | sim | media | alto | incerto | INFERENCE: pode competir com contratos se lido fora de contexto |
| `docs/03-methodology/GUIA_VALIDACAO_FE09A01.md` | Guia de Validacao | guia | SK-PE | especifico | ausente | ausente | ausente | ausente | ausente | nao | sim | media | medio | nao | FACT: util para operacao, nao necessariamente para definicao canonica |
| `docs/03-methodology/ROADMAP_EXTENSOES_OCB_FE09A.md` | Roadmap de Extensoes Demandadas pela OCB | roadmap de produto | plataforma + SK-PE | misto | ausente | ausente | ausente | ausente | ausente | nao | incerto | media | alto | incerto | INFERENCE: relevante, mas sem status, gate ou precedencia formal |
| `docs/auditoria/RELATORIO_FECHAMENTO_C9E/C9F/C9C/C10` | Fechamentos de gates | relatorio de auditoria | auditoria/importacao | especifico | `approved` | `1.x.x` | `2026-08-14` | `auditoria_controlada_supabase_github` | completo | `depends_on`, `roadmap_step` | sim | media | medio | nao | FACT: melhor conjunto atual para rastreabilidade formal de gate |
| `docs/auditoria/RELATORIO_FORENSE_MIGRATIONS_C9C_AUSENTES.md` | Relatorio Forense | forense | auditoria | especifico | ausente | ausente | ausente | ausente | ausente | textuais | incerto | media | alto | nao | FACT: contem path local historico `C:/DADOS/SPARKs/skpe-saas` |
| `docs/05-functional-specifications/LEIA-ME.md` | Bloco 1.10B-2 | instrucoes operacionais | portabilidade | especifico | ausente | ausente | ausente | ausente | ausente | remissao a `PATCH_MANUAL.md` | sim | media | alto | sim | FACT: documento operacional, fortemente dependente de pre-requisitos funcionais |
| `docs/05-functional-specifications/ESPECIFICACAO_FUNCIONAL_PORTABILIDADE_ESTRATEGICA.md` | Fundacao de Importacao, Exportacao e Portabilidade | especificacao funcional | plataforma + SK-PE | misto | ausente | ausente | ausente | ausente | ausente | nao | sim | alta | medio | nao | FACT: chama a Plataforma de fonte oficial quando SaaS esta em uso |
| `docs/05-functional-specifications/ESPECIFICACAO_FUNCIONAL_PLANILHA_CANONICA_EXCEL.md` | Planilha Canonica | especificacao funcional | portabilidade | especifico | ausente | ausente | ausente | ausente | ausente | nao | sim | media | medio | nao | FACT: define canal portatil, nao substituto automatico da fonte oficial |
| `_audit/FE-10C-CROSSCHECK-LOCAL.md` | Crosscheck Local FE-10C | auditoria paralela | frontend/governanca | especifico | texto livre | ausente | ausente | ausente | ausente | multiplas referencias locais | incerto | baixa | alto | nao | FACT: evidencia forte, mas depende de documentos fora do repo e de paths absolutos |
| `_audit/MUST-PILOT-*` | pilotos e closures | relatorios de execucao | frontend/shell | especifico | texto livre | ausente | ausente | ausente | ausente | varias | incerto | baixa | alto | possivel | INFERENCE: historico util, mas nao deve competir com normas vigentes do repo |
| `supabase/functions/*/README.md` | readmes de functions | operacional | backend/supabase | especifico | ausente | ausente | ausente | ausente | ausente | nao | nao | baixa | baixo | nao | FACT: relevantes para funcoes locais, nao para governanca documental global |

## 5. Estado do frontmatter

FACT: em `docs/**` foram encontrados 72 arquivos Markdown; apenas 6 possuem frontmatter YAML no topo.

FACT: documentos com frontmatter no topo identificados nesta execucao:

- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C9E.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C9F.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_RECONCILIACAO_C9C.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`

FACT: ha multiplos esquemas:

- esquema governanca enxuto: `document_id`, `version`, `status`, `scope`, `owner`, `last_updated`;
- esquema ADR mais rico: `id`, `title`, `domain`, `type`, `status`, `canonicality`, `canonical`, `criticality`, `parent`, `related`, `tags`, `idioma`, `language`, `encoding`, `semantic_layer`, `created`, `updated`;
- esquema auditoria de gates: `id`, `version`, `status`, `domain`, `owner`, `roadmap_step`, `canonical_context`, `created_at`, `updated_at`, `origin`, `repository_closure_commit`, `depends_on`.

INFERENCE: o repositorio ainda nao possui um schema minimo comum; possui ilhas de metadata maduras, mas semanticamente incompatíveis entre si.

FACT: a maioria dos requisitos, contratos, matrizes, guias e especificacoes importantes nao possui frontmatter.

FACT: ha muitos usos de `---` no corpo de documentos que nao representam frontmatter.

INFERENCE: nao ha ainda mecanismo confiavel, repositorio-wide, para um agente resolver precedencia apenas por metadata.

## 6. Canonicidade atual

FACT: a ideia de canonicidade aparece com frequencia no corpus.

FACT: sinais atuais de canonicidade incluem:

- termos textuais como "canonico", "fonte oficial", "aprovado", "vigente", "contrato canonico", "branch canonica";
- campos formais como `status`, `canonicality`, `canonical`, `canonical_context`;
- regras de negocio internas em requisitos FE sobre versoes `draft`, `approved`, `superseded` e historico.

INFERENCE: a canonicidade e fortemente comunicada em texto livre e contexto humano, mais do que em um protocolo documental uniforme.

FACT: `docs/02-arquitetura/ADR-PLAT-BIZ-001_*.md` e o exemplo mais forte de documento com canonicidade declarada de forma operacional.

FACT: `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md` se autoapresenta como "Contrato Canonico", mas sem frontmatter ou relacoes formais.

HYPOTHESIS: diferentes autores e frentes usaram "canonico" para coisas distintas:

- fonte normativa de plataforma;
- branch de trabalho;
- escala de classificacao de dominio;
- canal oficial quando SaaS esta em uso.

## 7. Rastreabilidade atual

FACT: existe rastreabilidade parcial e localizada.

FACT: mecanismos encontrados:

- series nominais de requisitos FE (`REQ-SKPE-FE-001` a `REQ-SKPE-FE-010`);
- ADRs nomeados;
- relatorios de auditoria com `roadmap_step`, `canonical_context` e `depends_on`;
- matrizes e contratos nomeados por pacote FE;
- referencias textuais entre contratos, requisitos e guias.

FACT: `depends_on` formal so foi encontrado nos relatorios de auditoria e em um subconjunto muito pequeno do corpus.

FACT: nao foi encontrado uso consistente de `supersedes` ou `superseded_by` como metadata documental entre arquivos do repositorio.

INFERENCE: a rastreabilidade atual pode funcionar dentro de ilhas especificas, mas nao sustenta uma navegacao confiavel de ponta a ponta entre decisao, requisito, contrato, validacao e historico para todo o corpus.

Classificacao provisoria:

- rastreabilidade global atual: MEDIA-BAIXA;
- rastreabilidade dos gates de auditoria recentes: MEDIA-ALTA;
- rastreabilidade dos requisitos/metodologia para agentes: MEDIA.

## 8. Semantica e principais drifts

FACT: o repositorio diferencia Plataforma SPARKs e modulo SK-PE em varios documentos, inclusive no `README.md`, nos guardrails e em requisitos/transversais.

FACT: ha ao mesmo tempo documentos mistos, que partem do SK-PE e evoluem para fundacoes transversais de plataforma.

Principais clusters de drift semantico:

- `plataforma` x `modulo`: alguns contratos sao explicitamente transversais; outros sao especificos do SK-PE; alguns transitam entre ambos sem rotulagem estrutural.
- `normativo` x `historico`: relatorios de execucao e `_audit` usam linguagem prescritiva e podem soar normativos se lidos isoladamente.
- `requisito` x `contrato` x `guia`: varios documentos orientam comportamento, mas sem uma hierarquia documental explicita.
- `canonico` x `oficial` x `aprovado` x `vigente`: os termos aparecem, mas sem definicao comum consolidada no repositorio.
- `branch canonica`: o termo aparece em matrizes/contratos, o que pode confundir canonicidade do documento com estado de Git.

INFERENCE: o maior risco semantico nao e falta de conteudo; e excesso de conteudo forte sem protocolo comum de precedencia.

## 9. Documentos orfaos

HYPOTHESIS: possiveis orfaos ou semi-orfaos de alto risco:

- `docs/03-methodology/ROADMAP_EXTENSOES_OCB_FE09A.md`, por ser relevante mas pouco amarrado por metadata ou dependencia formal;
- subconjunto de `docs/05-functional-specifications/docs - Bloco */LEIA-ME.md`, que parecem series operacionais locais com pouca conexao formal ao restante do corpus;
- parte de `_audit/**`, que tem alto valor evidencial mas depende de contexto externo e nao possui encaixe claro na hierarquia documental do repo.

FACT: nao foi encontrada, nesta fase, uma pagina-indice viva que catalogue todos esses subconjuntos com status e papel.

## 10. Duplicidades candidatas

INFERENCE: duplicidades candidatas ou quase-duplicidades:

- multiplos `LEIA-ME.md` e variantes de Bloco 1.10B em `docs/05-functional-specifications/`;
- serie `_audit/MUST-PILOT-*` com proximidade tematica forte;
- documentos que repetem contexto sobre shell transversal, piloto, workspace e SK-PE em `docs/00-governanca`, `docs/03-methodology` e `_audit`.

HYPOTHESIS: parte dessas duplicidades e deliberada, mas hoje a distincao entre "fonte normativa", "registro de execucao" e "analise historica" nao esta visivel o suficiente.

## 11. Historicos com risco de consumo indevido

FACT: `_audit/**` contem evidencias detalhadas, linguagem de decisao e referencias a codigo/paths locais.

FACT: relatorios de auditoria de gates em `docs/auditoria/**` sao formais e recentes, mas tratam frentes especificas e nao devem ser lidos como politicas transversais do repositorio.

FACT: varios documentos narram aprovacao, fechamento ou piloto concluido, o que pode induzir um agente a supor precedencia geral indevida.

INFERENCE: `_audit/**` e o principal vetor de consumo indevido como pseudo-standard paralelo.

## 12. Referencias quebradas ou frageis

FACT: foram encontrados paths absolutos dependentes de maquina em `_audit/**` e em especificacoes funcionais, por exemplo:

- `C:\Users\robso\OneDrive\DevKit\projetos\docs\...`
- `C:\DADOS\SPARKs\skpe-saas\apps\web`
- `C:/DADOS/SPARKs/skpe-saas`

FACT: ha referencias a documentacao transversal fora deste repositorio, especialmente em `_audit/FE-10C-CROSSCHECK-LOCAL.md`.

INFERENCE: essas referencias sao frageis para outros agentes, outras maquinas e futuras sessoes.

HYPOTHESIS: parte dessas referencias ainda existe por ter sido produzida em auditorias locais, nao como corpus normativo repositorio-wide.

## 13. Dependencia de paths locais/maquinas especificas

FACT: a dependencia existe e e material.

Exemplos:

- `_audit/FE-10C-CROSSCHECK-LOCAL.md`;
- `_audit/MUST-PILOT-02-TYPOGRAPHY-PROTOTYPE-LAB.md`;
- `docs/05-functional-specifications/INSTRUCOES_BLOCO_110B01.md`;
- `docs/05-functional-specifications/docs - Bloco 1.10B-3.1 — Listagem, retomada e simulação autenticada de lotes existentes/LEIA-ME.md`;
- `docs/auditoria/RELATORIO_FORENSE_MIGRATIONS_C9C_AUSENTES.md`.

INFERENCE: esta e uma das maiores fragilidades atuais para Agentic DX.

## 14. Risco atual para agentes de IA

Resposta a pergunta central:

INFERENCE: um agente que chegasse hoje a raiz do `skpe-saas` conseguiria descobrir parcialmente o que e a Plataforma SPARKs, o que e o SK-PE e varios conceitos centrais, mas nao com seguranca suficiente para:

- resolver precedencia documental de forma consistente;
- distinguir automaticamente normativo x historico x auditoria;
- saber qual e o caminho minimo obrigatorio de leitura;
- rastrear substituicao documental entre familias diferentes;
- evitar consumo indevido de evidencia local/historica como regra vigente.

Classificacao provisoria de risco Agentic DX:

- descoberta inicial: MEDIA;
- entendimento de plataforma x modulo: MEDIA;
- resolucao de precedencia: ALTA;
- consumo seguro de historicos: ALTA;
- rastreabilidade de origem: MEDIA-ALTA.

## 15. Top 10 riscos documentais

1. Ausencia de entrypoint unico para agentes.
2. Apenas 6/72 docs em `docs/**` com frontmatter no topo.
3. Esquemas de frontmatter coexistentes e incompatíveis.
4. Falta de politica formal de precedencia entre requisito, contrato, guia, relatorio e auditoria.
5. `_audit/**` funcionar como pseudo-standard paralelo.
6. Uso de paths absolutos dependentes de maquina.
7. Termos de canonicidade usados sem definicao comum repositorio-wide.
8. Ausencia de `supersedes`/`superseded_by` documental consistente.
9. Conjuntos operacionais por bloco em `05-functional-specifications` com pouca amarracao formal.
10. Mistura de plataforma transversal com especificidades do SK-PE em parte do corpus.

## 16. Top 10 ativos documentais a preservar

1. `README.md`
2. `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
3. `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
4. `docs/02-arquitetura/REQ-PLAT-ORG-001_HOME_ORGANIZACAO_E_ROTEAMENTO_INTELIGENTE.md`
5. `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`
6. `docs/03-methodology/REQ-SKPE-FE-002_GOVERNANCA_VERSIONAMENTO_FORMULACAO.md`
7. `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`
8. `docs/03-methodology/MATRIZ_ROTAS_CONTEXTO_FE09A.md`
9. `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`
10. `docs/05-functional-specifications/ESPECIFICACAO_FUNCIONAL_PORTABILIDADE_ESTRATEGICA.md`

## 17. Candidatos para o piloto de frontmatter

INFERENCE: conjunto piloto seguro e pequeno:

- `README.md` ou um futuro entrypoint equivalente em `docs/00-governanca`;
- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`;
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`;
- `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`;
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`;
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`.

Racional:

- cobre entrypoint, governanca, arquitetura, requisito, contrato e relatorio;
- mistura Plataforma SPARKs e SK-PE;
- inclui documento ja maduro em metadata e documentos fortes ainda sem metadata.

## 18. O que NAO deve ser feito ainda

- aplicar frontmatter em massa;
- renomear, mover ou arquivar documentos existentes;
- oficializar uma ontologia extensa;
- declarar supersession historica sem decisao humana;
- tratar `_audit` como automaticamente descartavel ou automaticamente canonico;
- construir validador, grafo ou framework antes de consolidar o modelo minimo.

## 19. Human Decisions Required

1. Definir o entrypoint oficial para agentes.
2. Aprovar um vocabulario minimo de status documental.
3. Definir se `_audit` fica fora do caminho principal, e como.
4. Definir o papel exato de `README.md` versus `AGENT_EXECUTION_GUARDRAILS.md`.
5. Aprovar relacoes documentais minimas e politica de supersession.
6. Definir quando um documento misto plataforma/SK-PE deve ser particionado.

## 20. Recomendacoes para Fase 1

1. Definir schema minimo, nao maximo.
2. Comecar por um corpus piloto de 5 a 7 documentos.
3. Separar explicitamente normativo, apoio ativo e historico.
4. Definir relacoes de precedencia antes de migracao ampla.
5. Criar progressive disclosure para agentes a partir de um entrypoint oficial.
6. Tratar paths absolutos como anti-pattern documental.

## 21. Veredito

Classificacao para inicio da Fase 1:

READY WITH CONDITIONS

Justificativa:

FACT: existe corpus suficiente, documentos fortes e material bastante para modelagem incremental.

INFERENCE: a base nao esta bloqueada por falta de descoberta; esta condicionada a decisoes humanas sobre precedencia, schema minimo e tratamento de historicos.

HYPOTHESIS: se a Fase 1 tentar resolver tudo de uma vez, o repositorio tende a ganhar mais metadata do que clareza.
