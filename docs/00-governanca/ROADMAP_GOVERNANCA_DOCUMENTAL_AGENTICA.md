# Roadmap - Governanca Documental Canonica e Agentic DX

FRONTMATTER MODEL: PENDING PHASE 1

## Objetivo

Estabelecer uma trilha controlada para reduzir ambiguidade documental, melhorar rastreabilidade e tornar o consumo do repositorio por agentes de IA mais seguro, sem alterar codigo-fonte ou comportamento da aplicacao.

## Problema que estamos resolvendo

Hoje o repositorio contem documentacao relevante e densa, mas distribuida entre multiplas pastas, generos documentais e estilos de metadata. Existe evidencia de documentos fortes e atuais, porem ainda nao existe um mecanismo repositorio-wide suficientemente claro para um agente descobrir, com baixa ambiguidade:

- por onde comecar;
- quais documentos sao autoritativos;
- o que e transversal de Plataforma SPARKs e o que e especifico de SK-PE;
- quais ativos sao historicos, de auditoria, de execucao ou normativos;
- como resolver precedencia em caso de conflito;
- como rastrear uma decisao ate sua origem.

## Restricoes

Esta iniciativa nao altera codigo-fonte ou comportamento da aplicacao.

Nao executar mudancas funcionais, migracoes, testes destrutivos, refatoracoes amplas ou reclassificacao silenciosa de documentos historicos.

## Estado inicial

FACT: o repositorio possui corpus documental relevante na raiz, em `docs/**`, em `_audit/**` e em READMEs pontuais sob `apps/` e `supabase/functions/`.

FACT: existem documentos com frontmatter YAML no topo, mas apenas em pequena parcela do corpus relevante.

FACT: existem pelo menos tres familias documentais distintas convivendo no repositorio:

- governanca/arquitetura/plataforma;
- metodologia, contratos, matrizes, requisitos e relatorios de implementacao do SK-PE;
- auditoria/fechamento e blocos funcionais de portabilidade/importacao.

INFERENCE: a base atual e suficiente para iniciar uma governanca documental incremental, desde que a Fase 1 trate precedencia, minimizacao de metadata e separacao entre documentos normativos e historicos.

## Principios

- canonicidade;
- rastreabilidade;
- semantica;
- contexto;
- nao invencao;
- progressive disclosure;
- Anti-Monster.

## Fases

### FASE 0 - Inventario e diagnostico

Objetivo:
inventariar e compreender antes de alterar.

Saida:
diagnostico + inventario + riscos + mapa preliminar.

Gate:
baseline documental conhecido.

Estado atual:
DONE

Atividade adicional:
F0.1 - Decisoes estruturantes

Gate:
GATE FASE 0 - APPROVED

Data do gate:
2026-08-15

Decisoes aprovadas:

- entrypoint oficial para agentes;
- schema minimo de frontmatter;
- vocabulario minimo de status;
- politica minima de precedencia e supersession;
- papel operacional de `_audit/**`.

Entregas principais:

- inventario e diagnostico documental da Fase 0;
- roadmap canonico da iniciativa;
- relatorio Fase 0;
- relatorio Fase 0.1 com decisoes estruturantes;
- aprovacao formal das decisoes D01 a D06.

Pendencias transferidas para fases posteriores:

- materializar o entrypoint especializado em `docs/00-governanca`;
- executar piloto de frontmatter;
- formalizar relacoes documentais minimas;
- validar o piloto Agentic DX;
- preparar migracao controlada posterior.

Proximo estagio:
FASE 1 - Modelo minimo de metadados

### FASE 1 - Modelo minimo de metadados

Objetivo:
definir o menor frontmatter suficiente.

Saida candidata:
schema minimo e regras de uso.

Gate:
modelo aprovado antes de migracao.

### FASE 2 - Relacoes e rastreabilidade

Objetivo:
definir como documentos se conectam.

Investigar relacoes como:

- depends_on;
- related_to;
- supersedes;
- superseded_by;
- implements;
- validates;
- derives_from;
- governed_by.

IMPORTANTE:
estes nomes ainda sao candidatos, nao politica aprovada.

Gate:
relacoes minimas aprovadas.

### FASE 3 - Piloto documental

Objetivo:
aplicar o modelo somente em um pequeno conjunto critico.

Priorizar candidatos como:

- entrypoint;
- governanca;
- arquitetura;
- requisito;
- ADR;
- contrato;
- relatorio de validacao.

Gate:
agente consegue reconstruir contexto do piloto sem invencao relevante.

### FASE 4 - Migracao controlada

Objetivo:
estender somente o modelo comprovado.

Incluir:

- ondas;
- criterios;
- documentos prioritarios;
- tratamento de historicos;
- tratamento de duplicidades;
- tratamento de documentos substituidos.

Gate:
corpus critico rastreavel.

### FASE 5 - Validacao Agentic DX

Objetivo:
testar consumo por IA.

Perguntas de validacao:

- agente encontra entrypoint?
- identifica fonte vigente?
- distingue plataforma/modulo?
- distingue fato/historico/decisao?
- segue relacoes?
- evita documento superseded?
- detecta conflito?
- sabe quando precisa de decisao humana?

Gate:
testes documentais satisfatorios.

### FASE 6 - Governanca continua e encerramento

Objetivo:
transformar melhoria em rotina sustentavel.

Definir posteriormente:

- criacao de novos documentos;
- atualizacao;
- revisao;
- supersession;
- depreciacao;
- arquivamento;
- qualidade minima;
- prevencao de drift.

Criterios de encerramento da iniciativa inicial:
deixar claro quando poderemos dizer que a implantacao foi concluida.

## Backlog controlado

| ID | fase | item | problema | prioridade | status | dependencia | evidencia | decisao necessaria | resultado | gate |
|---|---|---|---|---|---|---|---|---|---|---|
| GD-001 | F0 | Consolidar baseline documental | Corpus relevante disperso entre raiz, `docs` e `_audit` | Alta | DONE | Nenhuma | Relatorio Fase 0 | Nao | Baseline mapeado | Baseline conhecido |
| GD-001A | F0.1 | Fechar decisoes estruturantes | Fase 1 depende de cinco decisoes humanas explicitas | Alta | DONE | GD-001 | Relatorio Fase 0.1 | Sim | Base decisoria consolidada | Gate Fase 0 approved |
| GD-002 | F1 | Definir entrypoint oficial para agentes | Agente hoje nao tem trilha inequívoca de leitura inicial | Alta | BACKLOG | GD-001 | README + guardrails + corpus em `docs` | Sim | Entry point definido | Modelo minimo aprovado |
| GD-003 | F1 | Definir schema minimo de frontmatter | Apenas parte pequena do corpus usa YAML e os esquemas divergem | Alta | BACKLOG | GD-001 | 6/72 docs em `docs` com frontmatter no topo | Sim | Schema minimo proposto | Modelo aprovado |
| GD-004 | F1 | Definir semantica oficial de status | `approved`, `active`, texto livre e estados embutidos coexistem | Alta | BACKLOG | GD-001 | Requisitos, auditorias, guardrails e contratos | Sim | Vocabulário minimo aprovado | Modelo aprovado |
| GD-005 | F2 | Definir relacoes documentais minimas | Precedencia e substituicao nao estao operacionalizadas | Alta | BACKLOG | GD-003, GD-004 | `depends_on` pontual; ausencia de `supersedes` formal | Sim | Relacoes minimas aprovadas | Relacoes aprovadas |
| GD-006 | F2 | Separar normativo x historico x auditoria | `_audit` e relatorios podem ser consumidos como regra vigente | Alta | BACKLOG | GD-004 | Relatorios e crosschecks com linguagem normativa | Sim | Politica de classificacao aprovada | Relacoes aprovadas |
| GD-007 | F3 | Rodar piloto em corpus critico | Necessario provar o modelo antes de migracao ampla | Alta | BACKLOG | GD-002, GD-003, GD-005 | Guardrails, ADR, requisito, contrato, relatorio | Nao | Piloto executado | Piloto sem invencao |
| GD-008 | F4 | Migrar corpus prioritario por ondas | Migracao em massa precoce aumenta risco de drift | Media | BACKLOG | GD-007 | Diagnostico F0 | Nao | Ondas controladas definidas | Corpus rastreavel |
| GD-009 | F5 | Validar Agentic DX | Precisa comprovar consumo seguro por agentes | Alta | BACKLOG | GD-007 | Perguntas de validacao da Fase 5 | Nao | Suite documental de validacao | Testes satisfatorios |
| GD-010 | F6 | Institucionalizar rotina | Sem rotina, drift reaparece | Media | BACKLOG | GD-008, GD-009 | Diagnostico F0 | Sim | Politica continua definida | Encerramento formal |

## Riscos

- agentes consumirem relatorios historicos como regra vigente;
- frontmatter ser expandido antes de existir schema minimo aprovado;
- classificacao silenciosa de documentos como canonicos sem decisao humana;
- coexistencia prolongada de multiplos "quase-entrypoints";
- persistencia de paths absolutos dependentes da maquina do autor;
- reuso de vocabulario semantico sem definicao comum de precedencia.

## Decisoes pendentes

- qual sera o entrypoint oficial para agentes;
- qual e o menor schema de frontmatter necessario;
- como distinguir normativo, apoio ativo, historico e auditoria;
- qual vocabulario oficial de status e canonicidade;
- qual e a politica de supersession/substituicao documental;
- como tratar `_audit` na navegacao documental principal.

## Criterios de sucesso

- um agente na raiz do repositorio consegue identificar por onde comecar;
- plataforma e modulo ficam claramente distinguidos;
- documentos prioritarios passam a expor contexto e precedencia minima;
- historicos deixam de competir com normativos no caminho principal;
- relacoes documentais criticas ficam navegaveis sem leitura arbitraria de dezenas de arquivos.

## Criterios de encerramento

- schema minimo aprovado e aplicado ao piloto;
- relacoes minimas aprovadas e testadas;
- entrypoint oficial definido;
- corpus critico do piloto rastreavel;
- validacao Agentic DX aprovada;
- regras continuas de criacao, revisao e arquivamento definidas.

## Historico de gates

| data | gate | estado | evidencia |
|---|---|---|---|
| 2026-08-15 | Baseline documental conhecido | PASS | Relatorio Fase 0 |
| 2026-08-15 | Inicio controlado da iniciativa | PASS | Roadmap criado em `docs/00-governanca` |
| 2026-08-15 | F0.1 decisoes estruturantes em consolidacao | PASS | Relatorio Fase 0.1 |
| 2026-08-15 | GATE FASE 0 | APPROVED | Roadmap + Relatorio Fase 0.1 |
