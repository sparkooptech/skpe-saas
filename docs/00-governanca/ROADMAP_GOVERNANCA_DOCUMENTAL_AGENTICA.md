---
id: roadmap-governanca-documental-agentic-dx
title: Roadmap - Governança Documental Canônica e Agentic DX
domain: governance
type: roadmap
status: active
owner: governance
language: pt-BR
encoding: UTF-8
canonicality: supporting
canonical: false
related:
  - skpe-saas-readme
  - sparks-agent-execution-guardrails
---

# Roadmap - Governança Documental Canônica e Agentic DX

FRONTMATTER MODEL: APPROVED IN PHASE 1

## Objetivo

Estabelecer uma trilha controlada para reduzir ambiguidade documental, melhorar rastreabilidade e tornar o consumo do repositório por agentes de IA mais seguro, sem alterar código-fonte ou comportamento da aplicação.

## Problema que estamos resolvendo

Hoje o repositório contém documentação relevante e densa, mas distribuída entre múltiplas pastas, gêneros documentais e estilos de metadata. Existe evidência de documentos fortes e atuais, porém ainda não existe um mecanismo repositório-wide suficientemente claro para um agente descobrir, com baixa ambiguidade:

- por onde começar;
- quais documentos são autoritativos;
- o que é transversal de Plataforma SPARKs e o que é específico de SK-PE;
- quais ativos são históricos, de auditoria, de execução ou normativos;
- como resolver precedência em caso de conflito;
- como rastrear uma decisão até sua origem.

## Restrições

Esta iniciativa não altera código-fonte ou comportamento da aplicação.

Não executar mudanças funcionais, migrações, testes destrutivos, refatorações amplas ou reclassificação silenciosa de documentos históricos.

## Estado inicial

FACT: o repositório possui corpus documental relevante na raiz, em `docs/**`, em `_audit/**` e em READMEs pontuais sob `apps/` e `supabase/functions/`.

FACT: existem documentos com frontmatter YAML no topo, mas apenas em pequena parcela do corpus relevante.

FACT: existem pelo menos três famílias documentais distintas convivendo no repositório:

- governança/arquitetura/plataforma;
- metodologia, contratos, matrizes, requisitos e relatórios de implementação do SK-PE;
- auditoria/fechamento e blocos funcionais de portabilidade/importação.

INFERENCE: a base atual é suficiente para iniciar uma governança documental incremental, desde que a Fase 1 trate precedência, minimização de metadata e separação entre documentos normativos e históricos.

## Princípios

- canonicidade;
- rastreabilidade;
- semântica;
- contexto;
- não invenção;
- progressive disclosure;
- Anti-Monster.

## Fases

### FASE 0 - Inventário e diagnóstico

Objetivo:
inventariar e compreender antes de alterar.

Saída:
diagnóstico + inventário + riscos + mapa preliminar.

Gate:
baseline documental conhecido.

Estado atual:
DONE

Atividade adicional:
F0.1 - Decisões estruturantes

Gate:
GATE FASE 0 - APPROVED

Data do gate:
2026-08-15

Decisões aprovadas:

- entrypoint oficial para agentes;
- schema mínimo de frontmatter;
- vocabulário mínimo de status;
- política mínima de precedência e supersession;
- papel operacional de `_audit/**`.

Entregas principais:

- inventário e diagnóstico documental da Fase 0;
- roadmap canônico da iniciativa;
- relatório Fase 0;
- relatório Fase 0.1 com decisões estruturantes;
- aprovação formal das decisões D01 a D06.

Pendências transferidas para fases posteriores:

- materializar o entrypoint especializado em `docs/00-governanca`;
- executar piloto de frontmatter;
- formalizar relações documentais mínimas;
- validar o piloto Agentic DX;
- preparar migração controlada posterior.

Próximo estágio:
FASE 1 - Crosswalk com padrão documental raiz

### FASE 1 - Modelo mínimo de metadados

Objetivo:
definir o menor frontmatter suficiente.

Saída candidata:
schema mínimo e regras de uso.

Gate:
modelo aprovado antes de migração.

Estado atual:
DONE

Atividade de fechamento:
F1.4 - Normalização e fechamento do modelo de metadados - VALIDATION

Gate:
GATE FASE 1 - APPROVED

Resultado consolidado:

- CORE aprovado;
- catálogo inicial de `owner` aprovado;
- vocabulário de `status` e `canonicality` aprovado;
- piloto controlado concluído;
- `language: pt-BR` e `encoding: UTF-8` obrigatórios para o corpus normalizado.

### FASE 2 - Relações e rastreabilidade

Objetivo:
definir como os documentos se conectam.

Investigar relações como:

- `parent`;
- `related`;
- `depends_on`;
- `governed_by`;
- `supersedes`;
- `superseded_by`.

IMPORTANTE:
estes nomes permanecem candidatos até a decisão formal da Fase 2.1.

Gate:
relações mínimas aprovadas.

Estado atual:
DONE

Atividade de fechamento:
F2.2 - Piloto controlado de relações e primeiro hub - VALIDATION

Gate:
GATE FASE 2 - APPROVED

Resultado consolidado:

- `parent` aprovado como relação hierárquica/topológica principal;
- `related` aprovado como relação lateral semântica;
- `governed_by` validado como relação de autoridade normativa distinta de `parent`;
- `supersedes` aprovado como relação explícita de substituição, sem uso fictício no piloto;
- `superseded_by` mantido como relação derivada;
- `children` mantido como relação derivada;
- `depends_on` mantido em `DEFER`;
- relações canônicas apontando para IDs estáveis;
- wikilinks no corpo tratados como projeção de navegação, não como segunda fonte canônica;
- `docs/02-arquitetura/README.md` aprovado como primeiro hub oficial, com `id: sparks-platform-architecture-hub`;
- `domain: architecture` aprovado para hubs arquiteturais;
- registry central explicitamente não adotado;
- ausência de caso real de supersession não bloqueando o fechamento da fase;
- próxima fase preparada: `FASE 3 - Aplicação Controlada ao Corpus Crítico`.

### FASE 3 - Piloto documental

Objetivo:
aplicar o modelo somente em um pequeno conjunto crítico.

Priorizar candidatos como:

- entrypoint;
- governança;
- arquitetura;
- requisito;
- ADR;
- contrato;
- relatório de validação.

Gate:
agente consegue reconstruir contexto do piloto sem invenção relevante.

Estado atual:
DONE

Atividade de fechamento:
F3 - Aplicação Controlada ao Corpus Crítico

Gate:
GATE FASE 3 - APPROVED

Resultado consolidado:

- corpus crítico governado sem migração cega/em massa;
- `README.md` mantido como discovery entrypoint;
- hub de arquitetura transversal preservado como hub oficial;
- hub de Planejamento Estratégico e metodologia do SK-PE criado como fonte canônica única para Planejamento Estratégico e para o papel do SK-PE;
- `REQ-PLAT-ORG-001` mantido com `owner: product`;
- `CONTRATO_PAINEL_PRINCIPAL_FE09A06.md` mantido como `supporting`, sem promoção artificial para `canonical`;
- documentos FE-09A ainda `working` preservados para tratamento posterior;
- `docs/05-functional-specifications/**` explicitamente deferido para a próxima fase;
- `_audit/**` mantido fora da rota normativa;
- nenhuma supersession fictícia criada.

Próximo estágio:
FASE 4 - Consolidação Documental e Validação Agentic DX

### FASE 4 - Consolidação Documental e Validação Agentic DX

Objetivo:
consolidar o corpus já governado, tratar os espaços ainda `working` ou deferidos e validar o consumo agentic do conjunto resultante.

Incluir:

- ondas;
- critérios;
- documentos prioritários;
- tratamento de históricos;
- tratamento de duplicidades;
- tratamento de documentos substituídos.

Gate:
corpus crítico rastreável.

Estado atual:
DONE

Atividade de fechamento:
F4 - Consolidação Documental e Validação Agentic DX

Gate:
GATE FASE 4 - APPROVED

Resultado consolidado:

- restante documental relevante consolidado sem migração mecânica em massa;
- documentos `working` e `supporting` remanescentes classificados com semântica explícita;
- `docs/05-functional-specifications/**` revisado e classificado por utilidade documental real;
- órfãos relevantes reduzidos sem conexões artificiais;
- Agentic DX validado em 10 cenários reais com `10/10 PASS`;
- teste de precedência documental validado com `PASS`;
- hub específico de portabilidade mantido em `DEFER`;
- duplicate candidates dos blocos `1.10B-5.x` mantidos em `DEFER`;
- guias FE-09A em `working` preservados até evidência real de obsolescência ou estabilização;
- nenhum conflito canônico material bloqueante remanescente;
- `_audit/**` mantido fora da rota normativa;
- nenhum registry central criado;
- nenhuma supersession fictícia criada.

Próximo estágio:
FASE 5 - Governança Definitiva e Encerramento

### FASE 5 - Governança Definitiva e Encerramento

Objetivo:
transformar melhoria em rotina sustentável.

Definir posteriormente:

- criação de novos documentos;
- atualização;
- revisão;
- supersession;
- depreciação;
- arquivamento;
- qualidade mínima;
- prevenção de drift.

Critérios de encerramento da iniciativa inicial:
deixar claro quando poderemos dizer que a implantação foi concluída.

## Backlog controlado

| ID | fase | item | problema | prioridade | status | dependência | evidência | decisão necessária | resultado | gate |
|---|---|---|---|---|---|---|---|---|---|---|
| GD-001 | F0 | Consolidar baseline documental | Corpus relevante disperso entre raiz, `docs` e `_audit` | Alta | DONE | Nenhuma | Relatório Fase 0 | Não | Baseline mapeado | Baseline conhecido |
| GD-001A | F0.1 | Fechar decisões estruturantes | Fase 1 depende de cinco decisões humanas explícitas | Alta | DONE | GD-001 | Relatório Fase 0.1 | Sim | Base decisória consolidada | Gate Fase 0 approved |
| GD-002 | F1 | Definir entrypoint oficial para agentes | Agente hoje não tem trilha inequívoca de leitura inicial | Alta | BACKLOG | GD-001 | README + guardrails + corpus em `docs` | Sim | Entry point definido | Modelo mínimo aprovado |
| GD-003 | F1 | Definir schema mínimo de frontmatter | Apenas parte pequena do corpus usa YAML e os esquemas divergem | Alta | DONE | GD-001 | Relatórios F1.0 a F1.4 | Sim | Schema mínimo aprovado | Modelo aprovado |
| GD-004 | F1 | Definir semântica oficial de status | `approved`, `active`, texto livre e estados embutidos coexistem | Alta | DONE | GD-001 | Requisitos, auditorias, guardrails e contratos | Sim | Vocabulário mínimo aprovado | Modelo aprovado |
| GD-005 | F2 | Definir relações documentais mínimas | Precedência e substituição ainda não estão operacionalizadas | Alta | DONE | GD-003, GD-004 | F2.0 discovery + corpus piloto | Sim | Relações mínimas aprovadas | Relações aprovadas |
| GD-006 | F2 | Separar normativo x histórico x auditoria | `_audit` e relatórios podem ser consumidos como regra vigente | Alta | BACKLOG | GD-004 | Relatórios e crosschecks com linguagem normativa | Sim | Política de classificação aprovada | Relações aprovadas |
| GD-007 | F3 | Rodar piloto em corpus crítico | Necessário provar o modelo antes de migração ampla | Alta | DONE | GD-002, GD-003, GD-005 | Guardrails, ADR, requisito, contrato, relatório | Não | Piloto executado | Piloto sem invenção |
| GD-008 | F4 | Consolidar corpus prioritário remanescente | Working, supporting e functional specifications ainda precisam de consolidação controlada | Média | DONE | GD-007 | Relatório Fase 3 + docs/05 + satélites FE-09A | Não | Consolidação classificada | Corpus rastreável |
| GD-009 | F4 | Validar Agentic DX em cenários reais | Precisa comprovar consumo seguro por agentes sem leitura indiscriminada | Alta | DONE | GD-007 | Cenários documentais da Fase 4 | Não | Suite documental de validação | Testes satisfatórios |
| GD-010 | F5 | Institucionalizar rotina | Sem rotina, drift reaparece | Média | BACKLOG | GD-008, GD-009 | Diagnóstico F0 | Sim | Política contínua definida | Encerramento formal |

## Riscos

- agentes consumirem relatórios históricos como regra vigente;
- frontmatter ser expandido antes de existir schema mínimo aprovado;
- classificação silenciosa de documentos como canônicos sem decisão humana;
- coexistência prolongada de múltiplos "quase-entrypoints";
- persistência de paths absolutos dependentes da máquina do autor;
- reuso de vocabulário semântico sem definição comum de precedência.

## Decisões pendentes

- qual será o entrypoint oficial para agentes;
- qual é o modelo mínimo de relações necessário;
- como distinguir normativo, apoio ativo, histórico e auditoria;
- qual é a política explícita de supersession/substituição documental;
- se `parent` exige hub aprovado antes de aplicação ampla;
- se `governed_by` agrega semântica suficiente para adoção futura.

## Critérios de sucesso

- um agente na raiz do repositório consegue identificar por onde começar;
- plataforma e módulo ficam claramente distinguidos;
- documentos prioritários passam a expor contexto e precedência mínima;
- históricos deixam de competir com normativos no caminho principal;
- relações documentais críticas ficam navegáveis sem leitura arbitrária de dezenas de arquivos.

## Critérios de encerramento

- schema mínimo aprovado e aplicado ao piloto;
- relações mínimas aprovadas e testadas;
- entrypoint oficial definido;
- corpus crítico do piloto rastreável;
- validação Agentic DX aprovada;
- regras contínuas de criação, revisão e arquivamento definidas.

## Histórico de gates

| data | gate | estado | evidência |
|---|---|---|---|
| 2026-08-15 | Baseline documental conhecido | PASS | Relatório Fase 0 |
| 2026-08-15 | Início controlado da iniciativa | PASS | Roadmap criado em `docs/00-governanca` |
| 2026-08-15 | F0.1 decisões estruturantes em consolidação | PASS | Relatório Fase 0.1 |
| 2026-08-15 | GATE FASE 0 | APPROVED | Roadmap + Relatório Fase 0.1 |
| 2026-08-16 | GATE FASE 1 | APPROVED | Relatório Fase 1.4 |
