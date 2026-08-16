# Relatório Fase 2.2 - Piloto Controlado de Relações e Primeiro Hub

PILOTO DE RELAÇÕES E HUB: VALIDATION

## 1. Objetivo

Testar em documentos reais o modelo aprovado na Fase 2.1, provando utilidade prática para `parent`, `related`, `governed_by`, inversas derivadas e progressive disclosure com um único hub de baixo risco.

## 2. Modelo herdado

Modelo aprovado para piloto:

- `parent`: `ADOPT NOW`
- `related`: `ADOPT NOW`
- `supersedes`: `ADOPT NOW`
- `governed_by`: `CONDITIONAL`, autorizado para piloto controlado
- `superseded_by`: `DERIVED ONLY`
- `children`: `DERIVED ONLY`
- `depends_on`: `DEFER`

Regras preservadas:

- relações canônicas apontam para IDs;
- `parent` possui cardinalidade `zero ou um`;
- `related` não exige espelhamento manual obrigatório;
- `supersedes` só pode ser aplicado com evidência real;
- `governed_by` só deve entrar quando agregar autoridade distinta de topologia.

## 3. Seleção do hub

Hub selecionado:

`Hub de Arquitetura Transversal da Plataforma SPARKs`

Justificativa:

- há pelo menos dois documentos com semântica arquitetural transversal e baixa ambiguidade:
  - `adr-plat-biz-001`
  - `shell-app-transversal-contract-fe09a03`
- o espaço é transversal e de baixo risco, alinhado à preferência da F2.2;
- a escolha evita transformar toda a topologia em SK-PE;
- o hub não duplica o `README.md`, porque o README continua sendo a entrada geral do repositório;
- o hub é compatível com o padrão raiz, que usa hubs enxutos para progressive disclosure.

## 4. Alternativas consideradas

### Hub de Governança

Pontos fortes:

- guardrail e roadmap são fortemente associados;
- baixa ambiguidade do domínio de Governança.

Motivo para não escolher:

- exigiria transformar o espaço de Governança no primeiro experimento topológico, quando a pergunta mais operacional do corpus atual é arquitetura transversal + shell.

### Hub de Planejamento Estratégico

Pontos fortes:

- alta relevância semântica para o SK-PE;
- forte volume de requisitos.

Motivo para não escolher:

- aumentaria o risco de colapsar Plataforma SPARKs em SK-PE cedo demais;
- a preferência de desempate da fase favorece um hub transversal de baixo risco.

### Hub de Application Shell

Pontos fortes:

- contrato transversal forte;
- aderente ao teste de `governed_by`.

Motivo para não escolher:

- o corpus atual ainda não oferece um segundo filho tão inequívoco quanto o ADR transversal;
- o espaço “arquitetura transversal” acomoda melhor o contrato sem forçar um hub excessivamente estreito.

## 5. Hub criado

Arquivo criado:

`docs/02-arquitetura/README.md`

ID do hub:

`sparks-platform-architecture-hub`

Características do hub:

- frontmatter completo compatível com o modelo aprovado;
- objetivo claro;
- fronteira semântica;
- child links humanos;
- related links humanos;
- rota curta de leitura.

## 6. `parent`

Relações `parent` aplicadas:

- `adr-plat-biz-001` → `sparks-platform-architecture-hub`
- `shell-app-transversal-contract-fe09a03` → `sparks-platform-architecture-hub`

Resultado:

- `parent` funcionou bem com um hub real;
- os dois documentos possuem pertencimento topológico claro ao espaço arquitetural transversal;
- não foi necessário criar múltiplos `parent`;
- o piloto permaneceu pequeno.

## 7. `children` derivado

`children` não foi persistido no frontmatter de nenhum arquivo.

Filhos derivados do hub:

- `adr-plat-biz-001`
- `shell-app-transversal-contract-fe09a03`

Conclusão:

- a projeção humana de `Child Links` no corpo do hub é útil;
- a verdade continua morando em `parent`, nos documentos-filho;
- o risco de drift permanece aceitável porque o hub lista apenas dois filhos claros.

## 8. `related`

Relações `related` persistidas pelo piloto:

- `skpe-saas-readme` → `sparks-platform-architecture-hub`

Relações `related` já existentes e preservadas:

- `adr-plat-biz-001` → `req-skpe-fe-001`
- `shell-app-transversal-contract-fe09a03` → `sparks-agent-execution-guardrails`

Resultado:

- `related` ajudou a descoberta sem virar relação genérica para tudo;
- o README continuou como entrada geral e passou a apontar lateralmente para o hub;
- o ADR e o contrato preservaram relações laterais reais já existentes.

## 9. `governed_by`

Relação aplicada:

- `shell-app-transversal-contract-fe09a03` → `sparks-agent-execution-guardrails`

Evidência utilizada:

- o contrato define a fundação do shell transversal;
- o guardrail contém regras governantes explícitas sobre `ApplicationShell`, separação entre shell transversal e domínio, composição em `SkpeWorkspace`, não recriação de shell concorrente e limites de execução arquitetural;
- portanto, o contrato pertence topologicamente ao hub de arquitetura, mas é governado normativamente pelo guardrail.

Conclusão:

`governed_by` provou valor distinto de `parent`: `SIM`

## 10. `supersedes`

Busca controlada realizada:

- termos como `substitui`, `substituído por`, `revoga`, `supersedes` e equivalentes foram investigados no corpus;
- nenhuma ocorrência comprovou supersession documental explícita entre dois documentos do corpus piloto ou do espaço escolhido.

Resultado:

`REAL SUPERSESSION CASE FOUND: Não`

Consequência:

- `supersedes` permanece semanticamente aprovado;
- não foi validado empiricamente nesta Wave;
- nenhuma relação fictícia foi criada.

## 11. `superseded_by` derivado

`superseded_by` não foi persistido em nenhum documento.

Resultado:

- a decisão `DERIVED ONLY` foi preservada;
- como não houve caso real de supersession, a derivação também não foi exercitada empiricamente.

## 12. IDs

Todas as relações persistidas usam IDs estáveis:

- `sparks-platform-architecture-hub`
- `adr-plat-biz-001`
- `shell-app-transversal-contract-fe09a03`
- `sparks-agent-execution-guardrails`

Nenhuma relação usou:

- path físico;
- caminho relativo de máquina;
- URL absoluta local.

## 13. Wikilinks

O hub usa `[[document-id]]` apenas como projeção de navegação humana no corpo.

Regra preservada:

- frontmatter = fonte canônica da relação;
- wikilinks = projeção de leitura e progressive disclosure.

## 14. Documentos alterados

Arquivos alterados nesta F2.2:

- `docs/00-governanca/ROADMAP_GOVERNANCA_DOCUMENTAL_AGENTICA.md`
- `docs/00-governanca/RELATORIO_FASE_2_2_PILOTO_RELACOES_HUB.md`
- `docs/02-arquitetura/README.md`
- `README.md`
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`

Documentos existentes alterados para relações:

- `README.md`
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`

Total:

- hub criado: `1`
- documentos existentes alterados: `3`

## 15. Grafo resultante

```text
skpe-saas-readme
  related -> sparks-platform-architecture-hub

sparks-platform-architecture-hub
  children (derivado) -> adr-plat-biz-001
  children (derivado) -> shell-app-transversal-contract-fe09a03
  related -> skpe-saas-readme
  related -> sparks-agent-execution-guardrails

adr-plat-biz-001
  parent -> sparks-platform-architecture-hub
  related -> req-skpe-fe-001

shell-app-transversal-contract-fe09a03
  parent -> sparks-platform-architecture-hub
  governed_by -> sparks-agent-execution-guardrails
  related -> sparks-agent-execution-guardrails
```

## 16. Planejamento Estratégico / SK-PE

As definições foram preservadas:

- `Planejamento Estratégico` = capacidade/espaço temático;
- `SK-PE` = módulo especialista.

Resultado do piloto:

- o hub criado não força a topologia do repositório para dentro do SK-PE;
- a arquitetura transversal continua separada do espaço temático de Planejamento Estratégico;
- não foi criado `vertical`.

## 17. ADR PE/PN

Resultado:

- o ADR PE/PN recebeu `parent` no hub arquitetural transversal;
- não recebeu múltiplos `parent`;
- o caráter compartilhado PE/PN continuou representado semanticamente pelo conteúdo e pelo `domain: business-architecture`;
- para futuros hubs específicos de PE ou PN, a relação recomendada continua sendo `related`, não múltiplos `parent`.

## 18. Testes Agentic DX

### Cenário A - agente chega pelo README

Resultado:

- `related` no README já aponta para o hub;
- o agente consegue sair da entrada geral para a órbita arquitetural com baixa ambiguidade.

### Cenário B - agente abre um documento-filho

Resultado:

- `parent` no ADR e no contrato revela imediatamente o contexto topológico;
- a resposta ficou mais curta do que a busca por pasta ou inferência textual.

### Cenário C - agente encontra uma política governante

Resultado:

- o contrato agora consegue distinguir:
  - `parent` = onde pertence;
  - `governed_by` = qual norma o governa.

### Cenário D - agente encontra um documento historical

Resultado:

- não houve supersession real comprovada;
- portanto, o modelo consegue responder “não há substituto comprovado”, em vez de inventar sucessor;
- a ausência de `supersedes` continua sendo sinal de cautela, não de falha.

### Cenário E - agente procura documentos semanticamente próximos

Resultado:

- `related` ajudou a navegação;
- não houve explosão de relações genéricas;
- o ruído permaneceu baixo.

## 19. Riscos de drift

- o corpo do hub contém `Child Links`, que exigirão atualização manual se novos filhos forem aprovados;
- `governed_by` ainda foi testado em um único caso;
- o domínio `architecture` do novo hub ainda merece confirmação humana como vocabulário estável;
- supersession continua sem validação empírica real.

## 20. Compatibilidade com padrão raiz

Compatibilidade observada:

- hub enxuto e de navegação;
- `parent` no documento-filho;
- `children` apenas como projeção humana no corpo;
- `related` como relação lateral;
- IDs como alvo canônico;
- uso de wikilinks apenas para leitura humana.

Conclusão:

- o piloto é conceitualmente compatível com o padrão raiz;
- não copiou fisicamente a árvore de `products/**`;
- herdou o mecanismo sem criar sistema documental concorrente.

## 21. Ajustes recomendados

- confirmar o domínio `architecture` do hub como vocabulário aprovado;
- decidir na F2.3 se `governed_by` já sai do estado de piloto controlado;
- escolher um segundo caso controlado para `governed_by`, se necessário;
- manter `supersedes` aprovado, porém ainda pendente de validação empírica;
- só expandir hubs depois de confirmar que este primeiro hub realmente melhora navegação prática.

## 22. Human Decisions Required

- confirmar o hub de arquitetura transversal como primeiro hub oficial;
- confirmar `architecture` como valor estável de `domain` para hubs arquiteturais;
- confirmar se um único caso de `governed_by` já é suficiente para fechamento do modelo;
- decidir se a próxima etapa precisa buscar mais um caso empírico de supersession ou se a ausência atual é aceitável.

## 23. Recomendação para F2.3

Prosseguir para uma etapa curta de fechamento do modelo de relações, com foco em:

- validar se este primeiro hub deve ser mantido como padrão inicial;
- decidir o destino de `governed_by` após o piloto controlado;
- decidir se a ausência de supersession real bloqueia algo ou apenas permanece registrada;
- preparar o fechamento formal da Fase 2 sem abrir migração em massa.

## 24. Gate

READY FOR RELATIONSHIP MODEL CLOSURE
