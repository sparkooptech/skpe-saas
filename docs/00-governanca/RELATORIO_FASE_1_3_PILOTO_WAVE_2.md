# Relatório Fase 1.3 - Piloto Wave 2

MODELO DE METADADOS: VALIDATION

## 1. Objetivo

Executar a Wave 2 do piloto controlado de metadados em documentos com maior influência sobre navegação, Governança de execução e arquitetura transversal, testando especialmente:

- a robustez semântica de `owner`;
- a calibragem de `domain`;
- a viabilidade do modelo em documento de entrada;
- a viabilidade do modelo em guardrail;
- a viabilidade do modelo em contrato transversal;
- a prontidão para fechamento da Fase 1.

## 2. Estado herdado da Wave 1

A Wave 1 validou o modelo em:

- ADR compartilhado PE + PN;
- requisito metodológico;
- relatório de auditoria.

Achados herdados mais relevantes:

- `owner` ainda carecia de catálogo mínimo;
- `domain` funcionava, mas com risco de virar alias de módulo;
- `parent` ainda dependia de hubs não formalizados;
- `canonicality` e `canonical` conseguiam distinguir autoridade sem depender do nome do arquivo.

## 3. Documentos da Wave 2

Documentos alterados nesta onda:

1. `README.md`
2. `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
3. `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`

Observação crítica:

`AGENT_EXECUTION_GUARDRAILS.md` já possuía alteração preexistente de outra frente. O diff foi inspecionado antes da edição. A mudança preexistente foi preservada integralmente e a intervenção desta fase ficou restrita ao frontmatter.

## 4. README

Decisão aplicada:

- `id: skpe-saas-readme`
- `title: SK-PE SaaS`
- `domain: navigation`
- `type: entrypoint`
- `status: active`
- `owner: platform`
- `language: pt-BR`
- `encoding: UTF-8`
- `canonicality: supporting`
- `canonical: false`

Leitura semântica:

- o README atua como discovery entrypoint do repositório;
- ele não foi tratado como documento mestre;
- `domain: navigation` representou melhor sua função do que um domínio de módulo, produto ou Planejamento Estratégico.

## 5. Guardrail

Decisão aplicada:

- `id: sparks-agent-execution-guardrails`
- `title: Guardrails de Execução — Plataforma SPARKs`
- `domain: governance`
- `type: policy`
- `status: active`
- `owner: governance`
- `language: pt-BR`
- `encoding: UTF-8`
- `canonicality: canonical`
- `canonical: true`
- `version: 1.0.2`
- `updated: 2026-08-15`

Decisão sobre `type`:

`policy` ficou mais coerente que `guardrail` porque representa papel documental conhecido sem criar um tipo excessivamente idiossincrático. O documento continua sendo um guardrail em linguagem natural, mas sua natureza documental foi modelada como política.

## 6. Contrato transversal

Decisão aplicada:

- `id: shell-app-transversal-contract-fe09a03`
- `title: Contrato Canônico — Shell Aplicacional Transversal da Plataforma SPARKs`
- `domain: application-shell`
- `type: contract`
- `status: active`
- `owner: architecture`
- `language: pt-BR`
- `encoding: UTF-8`
- `canonicality: canonical`
- `canonical: true`
- `related: [sparks-agent-execution-guardrails]`

Leitura semântica:

- o documento é transversal;
- não foi empurrado para domínio de Planejamento Estratégico;
- `application-shell` funcionou como família semântica mais precisa que `architecture` puro, preservando `type: contract` para a natureza documental.

## 7. Resultado do CORE

O CORE funcionou nos três documentos da Wave 2.

Conclusões:

- o README conseguiu receber o núcleo mínimo sem virar documento mestre;
- o guardrail conseguiu receber o núcleo mínimo sem perder sua função de Governança de execução;
- o contrato transversal conseguiu receber o núcleo mínimo sem confundir arquitetura transversal com módulo específico.

## 8. Calibração de owner

Regra candidata confirmada:

> `owner` representa a responsabilidade institucional durável pela manutenção e Governança do documento.

Resultados observados:

- `platform` funcionou melhor para o README do que `SK-PE`, porque o documento é de borda do repositório;
- `governance` funcionou melhor para o guardrail do que o nome de um módulo ou equipe circunstancial;
- `architecture` funcionou melhor para o contrato transversal do shell do que `platform`, porque o documento governa uma fundação arquitetural específica.

Conclusão:

`owner` não deve ser automaticamente o assunto, o módulo, a pasta ou a organização beneficiária. Nesta Wave 2, valores institucionais curtos mostraram maior consistência que os valores usados na Wave 1.

## 9. Catálogo mínimo candidato de owners

Proposta mínima candidata:

- `governance`
- `architecture`
- `platform`
- `methodology`
- `product`
- `operations`

Observação:

o catálogo continua proposição controlada, não taxonomia final.

## 10. Calibração de domain

Regra candidata confirmada:

> `domain` representa a família semântica principal do conhecimento tratado pelo documento.

Resultados da Wave 2:

- README: `navigation`
- guardrail: `governance`
- contrato: `application-shell`

Conclusão:

`domain` funcionou melhor quando descreveu a família semântica do conhecimento, e pior quando aproximado de módulo, pasta ou tipo.

## 11. Regra candidata de domain

Regras operacionais propostas:

1. `domain` não deve ser nome de módulo por default.
2. `domain` não deve repetir `type`.
3. `domain` pode ser transversal quando o conhecimento for transversal.
4. `domain` não deve ser preenchido apenas para satisfazer o CORE sem evidência semântica.
5. `Planejamento Estratégico` permanece capacidade/espaço temático de negócio, não rótulo automático para todo documento do repositório.

## 12. Lifecycle

Aplicação da Wave 2:

- README: `active`
- guardrail: `active`
- contrato: `active`

Resultado:

o vocabulário `draft / active / historical` continuou suficiente e não exigiu retorno a `approved`.

## 13. Canonicidade

Aplicação da Wave 2:

- README: `canonicality: supporting`, `canonical: false`
- guardrail: `canonicality: canonical`, `canonical: true`
- contrato: `canonicality: canonical`, `canonical: true`

Resultado:

- o README ficou corretamente abaixo de um futuro hub especializado;
- o guardrail permaneceu autoridade vigente de execução;
- o contrato pôde ser tratado como canônico por conteúdo normativo explícito, e não apenas pelo termo `Canônico` no título.

## 14. Relações

Aplicação da Wave 2:

- README: sem `parent` e sem `related`
- guardrail: sem `parent` e sem `related`
- contrato: `related` com o guardrail

Resultado:

- a omissão de `parent` continuou correta por ausência de hub formalizado;
- `related` foi suficiente no contrato porque existe vínculo operacional direto e explícito com a Governança de execução do shell.

## 15. Entry point / progressive disclosure

Resultado do teste:

- o README pode atuar como discovery entrypoint;
- ele não precisa virar documento mestre para cumprir esse papel;
- relações de navegação mais ricas devem continuar para a futura fase de hubs e progressive disclosure.

## 16. PT-BR

Todos os conteúdos criados ou alterados nesta execução foram mantidos em Português (Brasil), com valores técnicos canônicos em inglês somente quando próprios do frontmatter.

## 17. UTF-8

Todos os arquivos alterados nesta execução foram validados como UTF-8.

Também foi executada varredura de mojibake com os marcadores definidos para a fase.

## 18. Compatibilidade com padrão raiz

Compatibilidade geral:

- alta para `id`, `title`, `domain`, `type`, `status`, `owner`, `canonicality`, `canonical`, `related`;
- boa para `language` e `encoding` como disciplina local reforçada;
- ainda incompleta para `parent`, pela ausência de hubs formalizados.

## 19. Comparação Wave 1 × Wave 2

Wave 1:

- testou ADR, requisito e relatório;
- mostrou fragilidade em `owner` e calibragem ainda inicial de `domain`.

Wave 2:

- testou entrypoint, guardrail e contrato transversal;
- mostrou que owners institucionais curtos são mais estáveis;
- mostrou que `domain` precisa nomear família semântica, não módulo.

## 20. Problemas ainda abertos

1. o catálogo de owners ainda precisa aprovação formal;
2. a regra final de `domain` ainda precisa consolidação institucional;
3. `parent` continua dependente da futura fase de hubs;
4. ainda não há fechamento formal sobre como unificar a nomenclatura dos types a médio prazo.

## 21. Human Decisions Required

1. Aprovar ou ajustar o catálogo mínimo candidato de owners.
2. Confirmar se `policy` entra como type aprovado.
3. Confirmar se `navigation`, `governance` e `application-shell` entram como domains aprovados.
4. Confirmar se documentos como o README devem permanecer `supporting` mesmo quando forem discovery entrypoint oficial.
5. Confirmar o critério de Canonicidade para contratos transversais.

## 22. Recomendação de fechamento da Fase 1

RECOMMENDED:

fechar a Fase 1 após uma consolidação final das decisões humanas sobre:

- catálogo mínimo de owners;
- regra de domain;
- type `policy`;
- critério de Canonicidade para contratos transversais.

A estrutura do modelo já se mostrou estável o suficiente. O que permanece aberto agora é calibração editorial fina.

## 23. Gate

Classificação final:

`READY TO CLOSE PHASE 1 WITH DECISION CONFIRMATIONS`

Justificativa:

- o modelo funcionou em documento de entrada, guardrail e contrato transversal;
- `owner` e `domain` agora têm regra candidata mais nítida;
- os bloqueios restantes são de decisão, não de estrutura do modelo.
