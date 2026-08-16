---
id: sparks-canonical-document-governance-policy
title: Política de Governança Documental Canônica
domain: governance
type: policy
status: active
owner: governance
language: pt-BR
encoding: UTF-8
canonicality: canonical
canonical: true
criticality: high
related:
  - roadmap-governanca-documental-agentic-dx
  - relatorio-final-governanca-documental-agentica
  - skpe-saas-readme
  - sparks-platform-architecture-hub
  - skpe-strategic-planning-hub
tags:
  - governanca
  - politica
  - documentacao
  - agentic-dx
---

# Política de Governança Documental Canônica

## 1. Propósito

Estabelecer a fonte normativa definitiva para criação, manutenção, leitura, promoção, arquivamento e precedência documental do repositório `skpe-saas`.

## 2. Escopo

Esta política governa o corpus documental normativo e de apoio mantido na raiz do repositório e em `docs/**`.

Esta política não transforma `_audit/**` em rota normativa, não altera código-fonte e não reabre decisões já aprovadas nas Fases 1 a 4.

## 3. Princípios

- Reutilizar antes de adaptar.
- Adaptar antes de estender.
- Manter uma única fonte canônica por conceito.
- Não inventar autoridade documental sem evidência explícita.
- Favorecer progressive disclosure por hubs, não por documentos-mestre gigantes.
- Manter o modelo simples, explícito e rastreável.
- Preservar alinhamento com o padrão documental já aprovado no ecossistema SPARKs.

## 4. Modelo de metadados

CORE obrigatório:

- `id`
- `title`
- `domain`
- `type`
- `status`
- `owner`
- `language`
- `encoding`

Campos condicionais aprovados:

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

Campos deferidos:

- `depends_on`

Campos não adotados neste modelo:

- `vertical`
- `related_to`
- `updated_at`
- `scope` como CORE
- `registry` central

Esta política formaliza a decisão definitiva do modelo mínimo sem reabrir migração cega ou redesign semântico.

## 5. Owners

Owners aprovados:

- `platform`
- `governance`
- `architecture`
- `methodology`
- `product`
- `operations`

`owner` deve identificar a órbita responsável pela manutenção do documento, e não necessariamente a pessoa autora do texto.

Não inventar `owner` quando não houver evidência suficiente. Na dúvida, manter a decisão humana como necessária antes de promover o documento.

`Planejamento Estratégico` permanece com fonte canônica própria no hub metodológico aprovado, sem confusão semântica com o módulo especialista SK-PE.

## 6. Domains

`domain` representa o espaço semântico principal do documento.

Exemplos aprovados no corpus:

- `governance`
- `navigation`
- `architecture`
- `strategic-planning`

`domain` não deve ser usado para forçar exclusividade temática artificial em documentos transversais ou compartilhados.

## 7. Status

Vocabulário oficial de `status`:

- `draft`
- `active`
- `historical`

Regras:

- `draft` indica documento ainda em elaboração ou validação.
- `active` indica documento vigente para uso corrente.
- `historical` indica documento preservado por rastreabilidade, sem papel normativo primário corrente.

`status` não substitui `canonicality`.

## 8. Canonicidade

Vocabulário oficial de `canonicality`:

- `canonical`
- `supporting`
- `working`

Regras:

- `canonical` identifica a fonte primária de verdade de um conceito.
- `supporting` identifica material vigente de apoio, navegação, detalhamento ou operacionalização sem autoridade primária do conceito.
- `working` identifica material útil em amadurecimento, ainda não promovido para rota estável.

`canonical` como booleano redundante pode ser mantido quando houver evidência suficiente e coerente com `canonicality`.

Esta seção formaliza a canonicidade para evitar ambiguidade entre autoridade documental, apoio ativo e material em amadurecimento.

## 9. Relações

Relações aprovadas:

- `parent`: relação hierárquica ou topológica principal; cardinalidade zero ou um; declarada no documento-filho.
- `related`: relação semântica lateral; não implica autoridade, precedência, dependência ou substituição.
- `governed_by`: relação normativa condicional quando houver autoridade distinta de `parent`.
- `supersedes`: relação explícita, factual e direcional de substituição documental.

Relações derivadas:

- `superseded_by`
- `children`

Relações deferidas:

- `depends_on`

Todas as relações devem apontar para IDs estáveis, nunca para paths físicos como fonte primária.

Cada relação declarada deve ser sustentada por evidência documental explícita.

## 10. Source of Truth

A autoridade documental deve ser inferida pela combinação de:

- metadados explícitos;
- posição semântica no corpus;
- hubs aprovados;
- conteúdo material do documento;
- relações normativas explícitas quando existirem.

Nome de arquivo, pasta, data ou tom assertivo não bastam para criar canonicidade.

## 11. Precedência

Esta política distingue explicitamente duas coisas diferentes:

- ordem geral de confiança e rota de leitura;
- algoritmo canônico de resolução de conflito e precedência.

### 11.1 Ordem geral de confiança e rota de leitura

Como heurística de navegação e leitura, seguir preferencialmente:

1. política canônica aplicável;
2. fonte canônica do conceito;
3. supporting aplicável;
4. working;
5. historical;
6. `_audit/**` e demais trilhas de evidência, nunca como autoridade normativa primária.

Essa ordem orienta leitura, descoberta e navegação. Ela não substitui o algoritmo canônico de resolução de conflito.

### 11.2 Algoritmo canônico de resolução de conflito e precedência

Quando dois ou mais documentos potencialmente conflitarem, aplicar:

1. supersession explícita;
2. `governed_by` aplicável;
3. verificar se existe colisão real de `domain` ou escopo;
4. `status` e vigência;
5. `canonicality`;
6. regra explícita de autoridade por `type`, quando existir;
7. `HUMAN DECISION REQUIRED` se a ambiguidade permanecer.

Deve permanecer explícito que:

- `related` não define precedência;
- `parent` não define autoridade normativa;
- `historical` não significa automaticamente `superseded`;
- documento mais novo não prevalece automaticamente;
- nome, pasta ou versão maior não definem precedência;
- `_audit/**` não é fonte normativa primária.

Wikilinks no corpo são navegação e descoberta, não segunda fonte canônica.

## 12. Hubs

Hubs são entrypoints semânticos, índices de navegação e mecanismos de progressive disclosure.

Hubs:

- não são registry global;
- não são documento mestre totalizante;
- não substituem a fonte canônica específica de cada conceito;
- podem ser `canonical` quando forem a rota principal aprovada daquele espaço semântico.

Hubs oficiais aprovados até esta política:

- `sparks-platform-architecture-hub`
- `skpe-strategic-planning-hub`

## 13. Histórico

Decisões anteriores devem ser preservadas como trilha de maturação.

Quando uma decisão antiga for superada, o histórico deve permanecer acessível, com explicitação da condição superada, e não ser apagado silenciosamente.

## 14. Supersession

`supersedes` só pode ser declarado quando houver evidência factual de que um documento substitui outro.

Nunca inferir supersession por:

- data mais recente;
- nome parecido;
- versão presumida;
- localização em pasta;
- preferência editorial.

Se não houver evidência suficiente, não declarar supersession.

## 15. Tratamento de `_audit`

`_audit/**` permanece fora da rota normativa.

Seu papel é:

- evidência;
- reconciliação;
- trilha de validação;
- suporte investigativo.

Relatórios de auditoria podem informar decisões, mas não governam o corpus como fonte normativa primária.

## 16. Idioma e encoding

Todo documento governado por esta política deve permanecer em:

- `language: pt-BR`
- `encoding: UTF-8`

Mojibake, perda de acentuação e mistura inconsistente de idioma reduzem segurança de consumo humano e agentic e devem ser tratados como defeito documental.

## 17. Regras para agentes

Agentes devem:

- começar pelos hubs e entrypoints aprovados;
- respeitar `status`, `canonicality` e precedência;
- evitar leitura indiscriminada quando um hub já delimita a órbita semântica;
- não promover documento, owner, domain ou relação sem evidência;
- tratar `_audit/**` como evidência, não como regra vigente.

## 18. Regras para humanos

Humanos devem:

- evitar criar documentos concorrentes para o mesmo conceito;
- registrar explicitamente promoções, arquivamentos e supersession quando aprovados;
- preferir atualização controlada de fonte vigente a proliferação de duplicatas;
- preservar rastreabilidade ao revisar documentos antigos.

## 19. Criação de novos documentos

Ao criar novo documento:

1. verificar se já existe fonte canônica ou hub suficiente;
2. confirmar que o novo documento adiciona semântica real;
3. aplicar o CORE obrigatório;
4. usar apenas campos condicionais justificados pelo caso;
5. posicionar o documento na órbita correta por `domain`, `owner` e relações.

## 20. Revisão de documentos

Toda revisão deve checar:

- se o documento continua no domain correto;
- se o owner continua válido;
- se `status` e `canonicality` ainda representam a realidade;
- se há conflito com fonte superior;
- se relações continuam apontando para IDs estáveis.

## 21. Promoção de `working` e `supporting`

Promoção exige evidência explícita de estabilidade e autoridade.

Para promover:

- `working` para `supporting`, deve haver utilidade recorrente e semântica suficientemente estável;
- `supporting` para `canonical`, deve haver decisão clara de fonte primária para o conceito e ausência de concorrência canônica.

Não promover por conveniência editorial.

## 22. Arquivamento e `historical`

Um documento deve migrar para `historical` quando:

- deixar de ser vigente;
- precisar ser preservado apenas por rastreabilidade;
- for substituído explicitamente;
- representar fotografia de etapa encerrada.

Arquivar não significa apagar nem desindexar toda a trilha de contexto.

## 23. Prevenção de duplicidade

Antes de criar documento novo:

- procurar hubs;
- procurar fontes canônicas relacionadas;
- procurar documentos supporting já suficientes;
- verificar se a necessidade é atualização, não criação.

Se dois documentos cobrirem o mesmo conceito, a resolução deve apontar uma única fonte canônica.

## 24. Prevenção de drift

Para reduzir drift:

- manter owners e domains consistentes;
- evitar campos paralelos com vocabulário concorrente;
- revisar hubs quando novas fontes forem aprovadas;
- registrar mudanças estruturais em relatórios ou política quando impactarem a governança.

## 25. Tratamento de conflitos

Quando houver conflito documental:

1. identificar a fonte de maior precedência;
2. registrar a divergência explicitamente;
3. corrigir o documento inferior ou reclassificá-lo;
4. evitar conciliações implícitas ou silenciosas.

Se o conflito envolver autoridade insuficientemente definida, a decisão deve escalar para validação humana.

## 26. Critérios mínimos de qualidade

Um documento governado deve ter, no mínimo:

- título claro;
- escopo inteligível;
- metadados coerentes;
- vocabulário semântico consistente;
- português legível e corretamente acentuado;
- ausência de relações inventadas;
- possibilidade de descoberta por hub, entrypoint ou related adequado.

## 27. Exceções

Exceções ao modelo devem ser raras, explícitas e justificadas.

Exceção tácita, silenciosa ou apenas implícita no conteúdo não é governança aceitável.

## 28. Governança contínua

Após o encerramento da iniciativa inicial, a governança documental passa a ser rotina contínua de manutenção do corpus.

Essa rotina inclui:

- revisão periódica de hubs;
- promoção controlada de documentos maduros;
- arquivamento explícito do que deixou de ser vigente;
- prevenção de drift sem expansão desnecessária do modelo;
- validação contínua de consumo humano e agentic.
