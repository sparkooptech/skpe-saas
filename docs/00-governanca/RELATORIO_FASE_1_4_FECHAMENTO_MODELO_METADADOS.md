# Relatório Fase 1.4 - Fechamento do Modelo de Metadados

MODELO DE METADADOS: VALIDATION

## 1. Objetivo

Consolidar as decisões finais da Fase 1, normalizar os valores provisórios das Waves 1 e 2, validar o conjunto completo dos seis documentos piloto e preparar o Gate final sem iniciar Fase 2, sem Migração ampla e sem commit.

## 2. Histórico da Fase 1

A Fase 1 foi executada em quatro etapas:

- F1.0: crosswalk com o Padrão documental raiz;
- F1.1: decisão do modelo de metadados;
- F1.2: piloto controlado Wave 1;
- F1.3: piloto Wave 2 com calibração de `owner` e `domain`.

As decisões humanas aprovadas para F1.4 consolidaram:

- catálogo inicial de `owner`;
- vocabulário definitivo de `status`;
- vocabulário definitivo de `canonicality`;
- rejeição de `vertical`, `related_to`, `updated_at` e `scope` como CORE;
- obrigatoriedade de `language: pt-BR` e `encoding: UTF-8`.

## 3. Evidências das Waves 1 e 2

Wave 1 comprovou:

- aplicabilidade do modelo em ADR, requirement e report;
- separação prática entre `status`, `canonicality` e `canonical`;
- utilidade de `related`;
- fragilidade inicial em `owner` e `domain`.

Wave 2 comprovou:

- aplicabilidade do modelo em entrypoint, policy e contract;
- maior estabilidade de `owner` como responsabilidade institucional;
- maior estabilidade de `domain` como família semântica principal;
- preservação do guardrail mesmo com alteração preexistente em outra frente.

## 4. Modelo CORE final

CORE final candidato:

- `id`
- `title`
- `domain`
- `type`
- `status`
- `owner`
- `language`
- `encoding`

## 5. Campos condicionais

- `canonical`
- `canonicality`
- `parent`
- `related`
- `criticality`
- `semantic_layer`
- `created`
- `updated`
- `tags`
- `version`

Regra:

usar somente quando houver semântica comprovável e não decorativa.

## 6. Campos deferidos

- `supersedes`
- `superseded_by`
- `governed_by`
- `depends_on`

Permanecem deferidos para Fase 2 ou posterior.

## 7. Campos rejeitados

- `vertical`
- `related_to`
- `updated_at`
- `scope` como CORE

## 8. Lifecycle

Vocabulário final de `status`:

- `draft`
- `active`
- `historical`

Resultado:

- o piloto completo funcionou sem retornar a `approved`;
- `historical` ficou útil para relatórios de fechamento;
- `active` ficou adequado para entrypoint, guardrail, ADR, requirement e contrato vigente.

## 9. Canonicidade

Vocabulário final de `canonicality`:

- `canonical`
- `supporting`
- `working`

Regra final de `canonical`:

- booleano redundante, porém útil;
- `true` somente quando houver evidência suficiente de autoridade vigente;
- `false` quando o documento não for a fonte canônica principal.

## 10. Regra de owner

Regra final consolidada:

> `owner` representa a responsabilidade institucional durável pela manutenção e Governança do documento.

`owner` não é automaticamente:

- módulo;
- assunto;
- pasta;
- beneficiário;
- nome de pessoa.

## 11. Catálogo inicial de owners

Catálogo inicial aprovado:

- `platform`
- `governance`
- `architecture`
- `methodology`
- `product`
- `operations`

## 12. Regra de domain

Regra final consolidada:

> `domain` representa a família semântica principal do conhecimento tratado pelo documento.

`domain` não é automaticamente:

- módulo;
- owner;
- product space;
- pasta;
- vertical.

## 13. Domains validados

Domains validados no piloto:

- `navigation`
- `governance`
- `business-architecture`
- `strategic-planning`
- `application-shell`

Normalização executada:

- `skpe-governance` foi substituído por `governance` no relatório C10 por misturar módulo com domínio.

## 14. Planejamento Estratégico e SK-PE

Definição preservada:

- `Planejamento Estratégico` = capacidade/espaço temático de negócio.
- descrição: `Constrói planos estratégicos realistas e executivos.`
- `SK-PE` = módulo especialista.
- papel do SK-PE: `Gerente Metodológico do Projeto de Planejamento Estratégico.`

Conclusão:

- os seis pilotos não exigiram `vertical`;
- `domain` não precisou ser convertido em alias de módulo;
- a separação semântica entre capacidade de negócio e módulo permaneceu preservada.

## 15. Relações

Resultado consolidado:

- `parent` e `related` têm papéis distintos;
- `related` já foi suficiente para vínculos laterais necessários no piloto;
- `parent` continua dependente da futura fase de hubs e não deve ser forçado sem evidência.

## 16. PT-BR e UTF-8

Validação executada sobre os arquivos alterados nesta Fase 1:

- pilotos Waves 1 e 2;
- relatórios F1.1, F1.2, F1.3 e F1.4;
- roadmap.

Critério de PT-BR:

- uso de Português (Brasil) com acentuação correta no conteúdo criado ou alterado;
- preservação de valores técnicos canônicos em inglês apenas no frontmatter.

Critério de UTF-8:

- arquivos formalmente válidos em UTF-8;
- varredura pelos marcadores de mojibake definidos para a fase.

## 17. Resultado dos seis documentos piloto

1. `README.md`

- `owner: platform`
- `domain: navigation`
- `status: active`
- `canonicality: supporting`
- `canonical: false`

2. `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`

- `owner: governance`
- `domain: governance`
- `type: policy`
- `status: active`
- `canonicality: canonical`
- `canonical: true`

3. `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`

- `owner: architecture`
- `domain: business-architecture`
- `status: active`
- `canonicality: canonical`
- `canonical: true`

4. `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`

- `owner: methodology`
- `domain: strategic-planning`
- `status: active`
- `canonicality: supporting`
- `canonical: false`

5. `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`

- `owner: architecture`
- `domain: application-shell`
- `status: active`
- `canonicality: canonical`
- `canonical: true`

6. `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`

- `owner: operations`
- `domain: governance`
- `status: historical`
- `canonicality: supporting`
- `canonical: false`

## 18. Normalizações executadas

Wave 1 normalizada:

- ADR: `owner` alterado de `SPARKOOP` para `architecture`
- REQ: `owner` alterado de `SPARKs PE` para `methodology`
- C10: `owner` alterado de `SPARKs PE` para `operations`
- C10: `domain` alterado de `skpe-governance` para `governance`

Wave 2 revalidada sem nova mudança semântica:

- README permaneceu `navigation / entrypoint / platform`
- Guardrail permaneceu `governance / policy / governance`
- Contrato permaneceu `application-shell / contract / architecture`

## 19. Pendências para Fase 2

- formalização de `parent` com hubs;
- política formal de supersessão;
- eventual adoção controlada de `governed_by`;
- aprofundamento de lineage e relações documentais mais ricas;
- estratégia de expansão do piloto sem Migração em massa.

## 20. Tratamento especial do guardrail

Separação de diffs:

- hunk do topo do arquivo: pertence ao frontmatter da Fase 1;
- hunk no corpo com os itens 13 a 16 de shell/layout: já existia como alteração preexistente de outra frente.

Conclusão operacional:

- a alteração preexistente não foi removida nem incorporada semanticamente ao trabalho da Fase 1;
- futuramente, o commit da Governança Documental não deve absorver silenciosamente o hunk do corpo.

Staging seletivo:

SIM, é seguro futuramente usar staging seletivo controlado para o guardrail, porque o diff está naturalmente separado em hunks distintos entre frontmatter e alteração preexistente do corpo.

## 21. Riscos residuais

1. `parent` ainda não foi comprovado por hub formalizado.
2. `policy` como `type` ainda merece confirmação humana final, embora esteja funcional.
3. relatórios históricos podem voltar a competir com normativos se `status` e `canonicality` forem ignorados por futuros agentes.
4. o catálogo de `domain` ainda deve permanecer pequeno para evitar inflar taxonomia.

## 22. Human Decisions restantes

1. Confirmar formalmente `policy` como `type` aprovado.
2. Confirmar o catálogo de `domain` resultante do piloto.
3. Confirmar o critério de Canonicidade para contratos transversais futuros.
4. Confirmar a estratégia de hubs antes da adoção de `parent` em escala maior.

## 23. Critérios do Gate

1. CORE comprovado em seis documentos? `SIM`
2. `owner` semanticamente estável? `SIM`
3. catálogo inicial de owners suficiente? `SIM`
4. `domain` semanticamente estável? `SIM`
5. `domain` não está sendo usado como alias de módulo? `SIM`
6. lifecycle estabilizado? `SIM`
7. `canonicality` estabilizada? `SIM`
8. `canonical` tem função clara? `SIM`
9. `parent`/`related` têm papéis distintos? `PARCIAL`
10. Planejamento Estratégico e SK-PE estão semanticamente separados? `SIM`
11. `vertical` continua desnecessário? `SIM`
12. PT-BR validado? `SIM`
13. UTF-8 validado? `SIM`
14. padrão compatível com `projetos/docs/products`? `SIM`
15. modelo continua pequeno e operacional? `SIM`
16. nenhuma Migração em massa foi iniciada? `SIM`

## 24. Recomendação final

Classificação final:

`READY TO CLOSE PHASE 1`

GATE FINAL:

`APPROVED / CLOSED`

Justificativa:

- o CORE foi comprovado nos seis pilotos;
- `owner` e `domain` foram estabilizados com regras pequenas e operacionais;
- `status`, `canonicality` e `canonical` ficaram semanticamente distintos e funcionais;
- o modelo permaneceu compatível com o Padrão raiz sem criar sistema documental concorrente;
- as pendências restantes são compatíveis com encerramento da Fase 1 e transição planejada, não imediata, para Fase 2.
