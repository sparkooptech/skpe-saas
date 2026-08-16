---
id: relatorio-fase-3-aplicacao-corpus-critico
title: Relatório Fase 3 - Aplicação Controlada ao Corpus Crítico
domain: governance
type: report
status: active
owner: governance
language: pt-BR
encoding: UTF-8
canonicality: supporting
canonical: false
related:
  - roadmap-governanca-documental-agentic-dx
  - sparks-platform-architecture-hub
  - skpe-strategic-planning-hub
---

# Relatório Fase 3 - Aplicação Controlada ao Corpus Crítico

## 1. Objetivo

Aplicar o modelo aprovado nas Fases 1 e 2 ao corpus documental crítico do `skpe-saas`, sem migração indiscriminada, consolidando metadados, relações, hubs, rota principal de navegação e proteção contra consumo indevido de histórico como se fosse norma vigente.

## 2. Estado herdado

Estado herdado sem reabertura de decisão:

- Fase 0 encerrada em `fb6c31d`;
- Fase 1 encerrada em `643508e`;
- Fase 2 encerrada em `6b38023`;
- `README.md` já operando como discovery entrypoint;
- `docs/02-arquitetura/README.md` já operando como primeiro hub oficial;
- `parent`, `related`, `governed_by` condicional e `supersedes` já decididos;
- `language: pt-BR` e `encoding: UTF-8` já obrigatórios.

## 3. Critérios de criticidade

Foi considerado crítico o documento que influencia diretamente pelo menos um destes eixos:

- descoberta inicial por agente;
- governança e limites operacionais;
- arquitetura transversal;
- definição metodológica do Planejamento Estratégico;
- contratos e requisitos centrais para continuidade da execução;
- distinção entre fonte vigente e histórico.

Classificação usada:

- `A. CRÍTICO / ROTA PRINCIPAL`
- `B. SUPPORTING`
- `C. HISTORICAL`
- `D. WORKING`
- `E. DUPLICATE CANDIDATE`
- `F. ORPHAN CANDIDATE`
- `G. FORA DO ESCOPO DESTA FASE`

## 4. Corpus analisado

Foram analisados 18 documentos do espaço documental mais sensível para navegação e execução:

| Documento | Classificação | Observação |
|---|---|---|
| `README.md` | A | entrypoint geral do repositório |
| `docs/00-governanca/ROADMAP_GOVERNANCA_DOCUMENTAL_AGENTICA.md` | B | governança da iniciativa, não norma primária |
| `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md` | A | fonte normativa transversal já existente |
| `docs/02-arquitetura/README.md` | A | hub arquitetural oficial |
| `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md` | A | decisão arquitetural compartilhada PE/PN |
| `docs/02-arquitetura/REQ-PLAT-ORG-001_HOME_ORGANIZACAO_E_ROTEAMENTO_INTELIGENTE.md` | A | requisito transversal de navegação e entrada |
| `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md` | A | arquitetura metodológica central |
| `docs/03-methodology/REQ-SKPE-FE-002_GOVERNANCA_VERSIONAMENTO_FORMULACAO.md` | A | governança do lifecycle da Formulação |
| `docs/03-methodology/REQ-SKPE-FE-003_IDENTIDADE_ESTRATEGICA_OPERACIONAL.md` | A | requisito nuclear da identidade estratégica |
| `docs/03-methodology/REQ-SKPE-FE-010_EXPERIENCIA_APLICACIONAL_E_OPERACIONALIZACAO_FORMULACAO.md` | A | requisito central da operacionalização |
| `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md` | A | contrato transversal de shell |
| `docs/03-methodology/CONTRATO_PAINEL_PRINCIPAL_FE09A06.md` | B | supporting operacional ligado à experiência |
| `docs/03-methodology/ARQUITETURA_INFORMACAO_E_NAVEGACAO_FE09A.md` | D | working, útil, mas ainda não normalizado nesta fase |
| `docs/03-methodology/MAPA_COMPONENTES_FRONTEND_FE09A.md` | D | working, forte acoplamento com implementação |
| `docs/auditoria/RELATORIO_FECHAMENTO_RECONCILIACAO_C9C.md` | C | histórico importante, não normativo |
| `docs/auditoria/RELATORIO_FECHAMENTO_C9E.md` | C | histórico importante, não normativo |
| `docs/auditoria/RELATORIO_FECHAMENTO_C9F.md` | C | histórico importante, não normativo |
| `docs/auditoria/RELATORIO_FECHAMENTO_C10.md` | C | histórico de fechamento integrado |

## 5. Corpus incluído

Foram incluídos 15 documentos no corpus tratado da Fase 3:

- `README.md`
- `docs/00-governanca/ROADMAP_GOVERNANCA_DOCUMENTAL_AGENTICA.md`
- `docs/02-arquitetura/README.md`
- `docs/02-arquitetura/REQ-PLAT-ORG-001_HOME_ORGANIZACAO_E_ROTEAMENTO_INTELIGENTE.md`
- `docs/03-methodology/README.md`
- `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`
- `docs/03-methodology/REQ-SKPE-FE-002_GOVERNANCA_VERSIONAMENTO_FORMULACAO.md`
- `docs/03-methodology/REQ-SKPE-FE-003_IDENTIDADE_ESTRATEGICA_OPERACIONAL.md`
- `docs/03-methodology/REQ-SKPE-FE-010_EXPERIENCIA_APLICACIONAL_E_OPERACIONALIZACAO_FORMULACAO.md`
- `docs/03-methodology/CONTRATO_PAINEL_PRINCIPAL_FE09A06.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_RECONCILIACAO_C9C.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C9E.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C9F.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`
- `docs/00-governanca/RELATORIO_FASE_3_APLICACAO_CORPUS_CRITICO.md`

Documentos críticos já válidos e preservados sem nova edição:

- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`

## 6. Corpus excluído/deferido

Ficaram fora da aplicação direta desta fase:

- documentos de `_audit/**`, por restrição explícita;
- documentos `working` fortemente acoplados a implementação, como mapas técnicos e arquitetura de informação detalhada;
- especificações funcionais em `docs/05-functional-specifications/**`, por mistura com SQL, payloads e instruções operacionais fora da rota principal da Governança documental;
- relatórios antigos não essenciais para a reconstrução da rota principal de entrada.

## 7. Metadados aplicados

Aplicações centrais:

- normalização do `README.md` como entrypoint com relações explícitas para guardrail e hubs;
- criação de `docs/03-methodology/README.md` como hub canônico de Planejamento Estratégico e do papel do SK-PE;
- normalização de requisitos centrais FE-001, FE-002, FE-003 e FE-010 como `requirement`, `status: active` e `domain: strategic-planning`;
- normalização de `REQ-PLAT-ORG-001` como requisito canônico transversal de navegação;
- reclassificação dos relatórios C9-C, C9-E e C9-F para `status: historical`, removendo semântica legada enganosa;
- manutenção de `C10` como histórico supporting;
- inclusão de frontmatter no roadmap e no relatório da própria fase.

## 8. Relações aplicadas

Relações novas ou ampliadas:

- `README.md`
  - `related -> sparks-platform-architecture-hub`
  - `related -> skpe-strategic-planning-hub`
  - `related -> sparks-agent-execution-guardrails`
- `req-plat-org-001`
  - `parent -> sparks-platform-architecture-hub`
  - `related -> skpe-saas-readme`
  - `related -> skpe-strategic-planning-hub`
- `req-skpe-fe-001`
  - `parent -> skpe-strategic-planning-hub`
  - `related -> adr-plat-biz-001`
  - `related -> req-skpe-fe-002`
  - `related -> req-skpe-fe-010`
- `req-skpe-fe-002`
  - `parent -> skpe-strategic-planning-hub`
  - `related -> req-skpe-fe-001`
  - `related -> req-skpe-fe-003`
  - `related -> req-skpe-fe-010`
- `req-skpe-fe-003`
  - `parent -> skpe-strategic-planning-hub`
  - `related -> req-skpe-fe-001`
  - `related -> req-skpe-fe-002`
- `req-skpe-fe-010`
  - `parent -> skpe-strategic-planning-hub`
  - `related -> req-skpe-fe-001`
  - `related -> shell-app-transversal-contract-fe09a03`
  - `related -> painel-principal-contract-fe09a06`
- `painel-principal-contract-fe09a06`
  - `parent -> skpe-strategic-planning-hub`
  - `related -> req-skpe-fe-010`
  - `related -> shell-app-transversal-contract-fe09a03`
- relatórios históricos C9-C, C9-E e C9-F
  - `related -> relatorio-fechamento-c10`

Relações preservadas:

- `parent` do contrato de shell para o hub de arquitetura;
- `governed_by` do contrato de shell para o guardrail;
- `related` do ADR para `req-skpe-fe-001`.

Supersession real encontrada:

- `Nenhuma`.

Nenhuma relação `supersedes` foi criada nesta fase.

## 9. Hubs

Hubs existentes/criados ao final da fase:

- `sparks-platform-architecture-hub`
  - arquivo: `docs/02-arquitetura/README.md`
  - estado: preservado e ampliado
- `skpe-strategic-planning-hub`
  - arquivo: `docs/03-methodology/README.md`
  - estado: criado nesta fase

Decisão deliberada:

- não criar hub de Governança nesta fase;
- o par `README.md + AGENT_EXECUTION_GUARDRAILS.md` já cobre a descoberta mínima desse espaço sem multiplicar entrypoints.

## 10. Planejamento Estratégico / SK-PE

Fonte canônica única aprovada nesta fase:

- arquivo: `docs/03-methodology/README.md`
- `id: skpe-strategic-planning-hub`

Conclusões:

- `Planejamento Estratégico` foi mantido como capacidade/espaço temático;
- `SK-PE` foi mantido como módulo especialista;
- as duas definições foram consolidadas em uma única fonte canônica de navegação e definição;
- não foi criado `vertical`;
- não houve espalhamento do texto completo por múltiplos documentos.

## 11. Canonicidade

Documentos marcados como `canonical: true` ou `canonicality: canonical` nesta fase porque havia evidência suficiente:

- `docs/02-arquitetura/README.md`
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
- `docs/02-arquitetura/REQ-PLAT-ORG-001_HOME_ORGANIZACAO_E_ROTEAMENTO_INTELIGENTE.md`
- `docs/03-methodology/README.md`
- `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`
- `docs/03-methodology/REQ-SKPE-FE-002_GOVERNANCA_VERSIONAMENTO_FORMULACAO.md`
- `docs/03-methodology/REQ-SKPE-FE-003_IDENTIDADE_ESTRATEGICA_OPERACIONAL.md`
- `docs/03-methodology/REQ-SKPE-FE-010_EXPERIENCIA_APLICACIONAL_E_OPERACIONALIZACAO_FORMULACAO.md`
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`
- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`

Supporting ativos:

- `README.md`
- `docs/00-governanca/ROADMAP_GOVERNANCA_DOCUMENTAL_AGENTICA.md`
- `docs/03-methodology/CONTRATO_PAINEL_PRINCIPAL_FE09A06.md`
- `docs/00-governanca/RELATORIO_FASE_3_APLICACAO_CORPUS_CRITICO.md`

Supporting históricos:

- `docs/auditoria/RELATORIO_FECHAMENTO_RECONCILIACAO_C9C.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C9E.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C9F.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`

## 12. Históricos

Históricos distinguidos ou preservados:

- `RELATORIO_FECHAMENTO_RECONCILIACAO_C9C.md`
- `RELATORIO_FECHAMENTO_C9E.md`
- `RELATORIO_FECHAMENTO_C9F.md`
- `RELATORIO_FECHAMENTO_C10.md`

Conclusão:

- `historical` foi usado para separar evidência de fechamento operacional de norma vigente;
- nenhum desses relatórios foi tratado como automaticamente superseded;
- `_audit/**` continuou fora da rota normativa principal.

## 13. Duplicidades

Duplicidades candidatas identificadas:

- `docs/auditoria/RELATORIO_FECHAMENTO_C9E.md` e `docs/auditoria/RELATORIO_FECHAMENTO_C9F.md`
  - relação: continuidade sequencial do mesmo espaço operacional;
  - decisão: manter como históricos distintos, não duplicados equivalentes.
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md` em relação aos fechamentos C9
  - relação: consolidação histórica posterior;
  - decisão: tratar C10 como ponto integrado de fechamento e C9 como evidências históricas supporting.
- `docs/03-methodology/ARQUITETURA_INFORMACAO_E_NAVEGACAO_FE09A.md` e `docs/03-methodology/REQ-SKPE-FE-010_EXPERIENCIA_APLICACIONAL_E_OPERACIONALIZACAO_FORMULACAO.md`
  - relação: vizinhança forte de experiência e navegação;
  - decisão: `REQ-SKPE-FE-010` permanece como fonte mais canônica do conceito; o documento de arquitetura de informação segue `WORKING`.

## 14. Órfãos

Órfãos críticos reduzidos:

- requisitos FE centrais agora têm `parent` no hub metodológico;
- `REQ-PLAT-ORG-001` agora tem `parent` no hub arquitetural;
- o `README.md` agora aponta explicitamente para guardrail e hubs.

Órfãos ainda presentes, porém não críticos para esta fase:

- `ARQUITETURA_INFORMACAO_E_NAVEGACAO_FE09A.md`
- `MAPA_COMPONENTES_FRONTEND_FE09A.md`
- parte dos contratos metodológicos satélite ainda sem hub/topologia explícita

## 15. Conflitos

Conflitos reais encontrados:

- frontmatter legado em relatórios históricos de auditoria, usando `status: approved`, `domain: SK-PE`, `owner: SPARKs PE` e campos como `depends_on` com paths físicos e migrations.

Tratamento:

- normalização para `status: historical`;
- `domain: governance`;
- `owner: operations`;
- remoção da semântica legada que poderia competir com a rota normativa.

Conflitos não corrigidos por restrição de escopo:

- qualquer divergência potencial entre documentação e código-fonte;
- qualquer dependência operacional mencionada em SQL, Supabase ou `_audit/**`.

## 16. Agentic DX

Teste hipotético de agente sem memória externa:

1. Onde começo?
   `README.md`
2. Qual documento é canônico?
   usar hubs, guardrail e documentos com `canonicality: canonical` / `canonical: true`
3. Qual é supporting?
   entrypoint geral, roadmap, relatório da fase e contrato do Painel Principal
4. Qual é historical?
   fechamentos C9-C, C9-E, C9-F e C10
5. Quem governa este documento?
   o contrato de shell responde via `governed_by`
6. Qual seu contexto/topologia?
   requisitos centrais respondem via `parent`
7. Quais documentos estão relacionados?
   `related` cobre hubs, requisitos e históricos próximos
8. O que não deve ser tratado como regra?
   relatórios históricos e `_audit/**`
9. Onde está Planejamento Estratégico?
   `docs/03-methodology/README.md`
10. Onde está o papel do SK-PE?
   `docs/03-methodology/README.md`
11. Como chegar à arquitetura transversal?
   `README.md -> sparks-platform-architecture-hub`
12. Como evitar `_audit` como autoridade?
   `_audit/**` segue fora da rota normativa e os históricos normais já foram marcados como `historical`
13. Como saber se documento foi substituído?
   não houve caso real de `supersedes`, então a resposta correta continua sendo “não há substituto explícito comprovado”

Resultado:

- reconstrução essencial do contexto: `SIM`
- prevenção contra consumo indevido de histórico: `SIM`
- descoberta do espaço metodológico antes órfão: `SIM`

## 17. Compatibilidade com padrão raiz

Compatibilidade observada:

- hubs enxutos;
- `parent` declarado no documento-filho;
- `children` apenas projetado no corpo dos hubs;
- `related` como relação lateral;
- IDs estáveis no lugar de paths físicos;
- rota `README -> hub -> documento especializado`;
- redundância deliberada apenas para navegação humana + IA.

Conclusão:

- a fase reutiliza a linguagem documental do padrão raiz sem criar sistema paralelo.

## 18. PT-BR / UTF-8

Validação executada sobre os arquivos alterados:

- escrita em Português (Brasil) com acentuação correta;
- manutenção de `language: pt-BR`;
- manutenção de `encoding: UTF-8`;
- varredura posterior de sinais de mojibake obrigatória.

## 19. Dúvidas remanescentes

- se `REQ-SKPE-FE-010` deve futuramente ter supporting satélites explicitamente ligados por `parent` ou apenas por `related`;
- se parte dos contratos FE-09A hoje working deve migrar para a órbita metodológica canônica ou permanecer supporting;
- quando abrir uma wave futura para documentos de `docs/05-functional-specifications/**`.

## 20. Riscos

- expansão prematura do hub metodológico para dezenas de documentos satélite;
- promoção excessiva de documentos working a canonical;
- reaparecimento de frontmatter legado em relatórios históricos futuros;
- multiplicação de hubs antes de comprovar ganho real de navegação.

## 21. Human Decisions Required

1. Confirmar se `REQ-PLAT-ORG-001` permanece em `owner: product` ou migra futuramente para `architecture`.
2. Confirmar se `CONTRATO_PAINEL_PRINCIPAL_FE09A06.md` deve permanecer `supporting` ou subir para `canonical` quando a implementação amadurecer.
3. Confirmar a próxima wave para os contratos/metamapas FE-09A ainda `WORKING`.
4. Confirmar se `docs/05-functional-specifications/**` merece uma órbita documental futura própria ou continua fora da rota crítica.

## 22. Critérios do Gate

| Critério | Resultado |
|---|---|
| 1. Documentos críticos possuem metadados consistentes? | SIM |
| 2. Rota principal possui hubs suficientes? | SIM |
| 3. README conduz corretamente? | SIM |
| 4. Arquitetura transversal é navegável? | SIM |
| 5. Planejamento Estratégico possui fonte canônica única? | SIM |
| 6. SK-PE possui definição canônica única? | SIM |
| 7. Documentos históricos estão distinguíveis? | SIM |
| 8. Canonicidade está clara? | SIM |
| 9. Supporting está claro? | SIM |
| 10. `_audit` está fora da rota normativa? | SIM |
| 11. Órfãos críticos foram reduzidos? | SIM |
| 12. Duplicidades críticas foram classificadas? | SIM |
| 13. Relações usam IDs? | SIM |
| 14. Nenhuma supersession foi inventada? | SIM |
| 15. PT-BR está correto? | SIM |
| 16. UTF-8 está correto? | SIM |
| 17. Agentic DX consegue reconstruir contexto essencial? | SIM |
| 18. Nenhum código foi alterado? | SIM |
| 19. Não houve migração cega/em massa? | SIM |
| 20. Modelo continua simples e operacional? | SIM |

## 23. Recomendação final

Classificação final:

`READY TO CLOSE PHASE 3`

Justificativa:

- a rota principal agora possui entrypoint, hub arquitetural e hub metodológico coerentes;
- Planejamento Estratégico e SK-PE ganharam fonte canônica única e explícita;
- históricos críticos deixaram de competir semanticamente com documentos vigentes;
- a aplicação continuou controlada, sem registry central, sem supersession fictícia e sem migração cega.

GATE FINAL:

`APPROVED / CLOSED`
