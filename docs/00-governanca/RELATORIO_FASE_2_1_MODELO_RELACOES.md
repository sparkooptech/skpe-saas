# Relatório Fase 2.1 - Modelo Canônico de Relações

MODELO DE RELAÇÕES: VALIDATION

## 1. Objetivo

Definir o menor modelo canônico de relações documentais suficiente para navegação humana, navegação por agentes de IA, precedência, Governança, lineage, supersession, progressive disclosure e proteção contra consumo indevido de histórico.

## 2. Contexto

Base herdada:

- Fase 0 encerrada em `fb6c31d`;
- Fase 1 encerrada em `643508e`;
- Fase 2.0 encerrada com `READY FOR RELATIONSHIP MODEL DECISION`;
- Fase 1 aprovou `status`, `canonicality`, `canonical`, `domain`, `owner`, `language` e `encoding`;
- os seis documentos piloto já fornecem evidência suficiente para testar navegação, historical, lateralidade e distinção entre autoridade e evidência.

Conclusões candidatas herdadas da F2.0:

- `related = ADOPT NOW`
- `parent = CONDITIONAL`
- `governed_by = CONDITIONAL`
- `supersedes = CONDITIONAL`
- `depends_on = DEFER`
- `superseded_by = REJECT`

Nesta F2.1, a decisão sobre `superseded_by` foi reaberta e testada explicitamente.

## 3. Princípios

- cada relação deve possuir uma única responsabilidade semântica clara;
- não usar duas relações diferentes para dizer a mesma coisa;
- relação forte deve substituir relação genérica quando houver evidência;
- relações canônicas devem apontar para IDs estáveis;
- a fonte de verdade da relação deve ser mínima e não duplicada;
- hubs exibem navegação, mas não substituem a verdade canônica distribuída;
- histórico não deve ser confundido com invalidade nem com norma vigente.

## 4. `parent`

Decisão candidata:

`ADOPT NOW`

Semântica:

> relação hierárquica ou topológica principal de pertencimento documental.

Regras:

- declarada no documento-filho;
- não representa autoridade normativa;
- não representa dependência semântica;
- não representa substituição;
- deve existir apenas quando houver um pai topológico claro.

Regra preferencial:

- um único `parent` topológico por documento.

Documentos compartilhados:

- não devem receber múltiplos `parent` por padrão;
- devem preferir um `parent` mais transversal ou nenhum `parent` até que o hub correto exista;
- compartilhamento lateral deve ser resolvido com `related`.

## 5. `related`

Decisão candidata:

`ADOPT NOW`

Semântica:

> relação semântica lateral, não hierárquica e sem implicação automática de autoridade, precedência, dependência, substituição ou Governança.

Regras:

- usar quando a proximidade semântica for real;
- não usar `related` para esconder uma relação mais forte;
- pode existir sem reciprocidade persistida no outro documento.

Evidência local:

- `adr-plat-biz-001` ↔ `req-skpe-fe-001`;
- `shell-app-transversal-contract-fe09a03` → `sparks-agent-execution-guardrails`.

## 6. `governed_by`

Decisão candidata:

`CONDITIONAL`

Semântica:

> documento normativo ou governante que estabelece regras aplicáveis ao documento ou contexto atual.

Distinção operacional:

- `parent` responde onde o documento pertence;
- `governed_by` responde qual documento o governa.

Exemplo conceitual válido:

- um contrato pode futuramente ter `parent` em um hub de arquitetura;
- o mesmo contrato pode ser `governed_by` um guardrail ou política transversal.

Motivo para não elevar a `ADOPT NOW` nesta fase:

- a distinção é clara em teoria;
- porém o corpus piloto ainda não traz casos suficientes já formalizados para evitar invenção em escala.

## 7. `supersedes`

Decisão candidata:

`ADOPT NOW`

Semântica:

> o documento atual substitui explicitamente um ou mais documentos anteriores.

Regras:

- direcional;
- explícito;
- nunca inferido por data, pasta, nome, versão ou similaridade;
- pode apontar para mais de um documento em consolidações reais;
- a decisão de substituição deve existir no conteúdo ou no ato governado de manutenção.

Justificativa:

- é a forma mais limpa de operacionalizar a primeira regra de precedência da Fase 0;
- mantém a fonte de verdade no documento novo, que é onde a substituição passa a ser afirmada.

## 8. `superseded_by`

Decisão candidata:

`DERIVED ONLY`

Teste realizado:

### Modelo A - somente `supersedes`

Vantagens:

- uma única fonte de verdade;
- menor risco de drift.

Problemas:

- se o agente abrir diretamente o documento antigo, ele depende de busca global;
- navegação estática ou offline perde legibilidade imediata;
- Agentic DX piora quando a leitura começa pelo histórico.

### Modelo B - relação espelhada persistida

Vantagens:

- excelente navegação direta a partir do documento antigo;
- facilita resposta local para “o que substituiu isto?”.

Problemas:

- duplica a verdade;
- aumenta custo de manutenção manual;
- cria risco de inconsistência entre novo e antigo.

### Modelo C - espelho derivado

Vantagens:

- mantém a fonte canônica apenas em `supersedes`;
- permite que hubs, buscas e ferramentas futuras exibam `superseded_by`;
- preserva boa navegação sem duplicação persistida.

Conclusão:

- `superseded_by` não deve ser campo canônico obrigatório no arquivo antigo;
- seu melhor papel é relação derivada, não relação primária persistida.

## 9. `depends_on`

Decisão candidata:

`DEFER`

Semântica candidata:

> o documento não pode ser corretamente interpretado ou aplicado sem o outro.

Problema atual:

- o uso legado mistura dependência documental com dependência técnica de runtime, migration e path;
- a regra ainda é difícil de aplicar com consistência baixa em invenção.

Diferença para `related`:

- `related` = afinidade lateral útil;
- `depends_on` = pré-condição real de leitura/aplicação.

Enquanto esse critério ainda não estiver estável no corpus normalizado:

- manter `DEFER`.

## 10. `children`

Decisão candidata:

`DERIVED ONLY`

Semântica:

- filhos de um hub ou documento-topo devem ser inferidos pela busca de documentos cujo `parent` aponta para ele;
- `children` não deve virar campo canônico nesta fase.

Justificativa:

- seria apenas a inversa materializada de `parent`;
- duplicaria a verdade sem necessidade;
- o padrão raiz já mostra `Child Links` no corpo como projeção de navegação, não como obrigação de frontmatter.

## 11. Direcionalidade

| Relação | Direcional? | Origem | Destino | Inversa |
|---|---|---|---|---|
| `parent` | Sim | documento-filho | hub ou pai topológico | `children` derivado |
| `related` | Conceitualmente bilateral, persistência unilateral permitida | documento atual | documento semanticamente próximo | outro `related` opcional ou derivado |
| `governed_by` | Sim | documento governado | documento governante | documentos governados derivados |
| `supersedes` | Sim | documento novo | documento anterior | `superseded_by` derivado |
| `superseded_by` | Sim, se exibido | documento antigo | documento novo | deriva de `supersedes` |
| `depends_on` | Sim | documento dependente | documento necessário | dependents derivados |

## 12. Simetria

Decisão:

- `related` não exige espelhamento obrigatório;
- o espelhamento pode ser desejável em casos curados;
- a regra padrão deve ser: persistência unilateral permitida, simetria navegacional derivável.

Motivo:

- evita manutenção dupla;
- evita drift;
- preserva a semântica lateral.

## 13. Cardinalidade

Regras candidatas:

- `parent`: `zero ou um`
- `related`: `zero ou muitos`
- `governed_by`: `zero ou muitos`
- `supersedes`: `zero ou muitos`
- `superseded_by`: `zero ou muitos`, quando exibido de forma derivada
- `depends_on`: `zero ou muitos`

Justificativa:

- `parent` precisa preservar órbita topológica principal;
- consolidações e Governança podem exigir múltiplos alvos em `supersedes` e `governed_by`;
- relações laterais e dependências reais não devem ser artificialmente limitadas.

## 14. IDs

Regra candidata:

> relações devem referenciar IDs estáveis, nunca paths físicos de máquina.

Formato:

```yaml
related:
  - sparks-agent-execution-guardrails
```

Não usar:

- `C:\...`
- `../...`
- nomes de arquivo como chave semântica principal.

Compatibilidade:

- coerente com o padrão raiz;
- coerente com a futura navegação por `[[document-id]]`.

## 15. Wikilinks e corpo

Regra candidata:

- o frontmatter carrega a relação canônica;
- o corpo pode exibir projeções humanas da navegação;
- não duplicar toda relação no corpo por obrigação mecânica.

Quando o corpo deve exibir:

- `Parent Links`: em hubs e mapas de navegação;
- `Child Links`: em hubs e mapas de navegação;
- `Related Links`: quando isso melhora descoberta humana e Agentic DX.

Quando frontmatter basta:

- documentos especializados cujo papel principal não é navegar o espaço;
- relações simples em que a repetição no corpo não agrega contexto.

## 16. Hubs

Definição candidata:

> hub é um documento de navegação semântica e progressive disclosure que organiza um espaço documental sem concentrar todo o conhecimento do domínio.

Responsabilidades mínimas de um hub:

- orientar ponto de entrada;
- explicitar fronteira semântica;
- organizar rotas de leitura;
- projetar parent/children/related para consumo humano;
- reduzir leitura global indiscriminada.

Um hub não deve ser:

- documento mestre de tudo;
- cópia dos filhos;
- registry global;
- substituto da documentação especializada.

## 17. Source of truth

Fonte canônica proposta por relação:

- `parent`: frontmatter do documento-filho;
- `related`: frontmatter do documento que declara a lateralidade;
- `governed_by`: frontmatter do documento governado;
- `supersedes`: frontmatter do documento novo;
- `superseded_by`: derivado de `supersedes`;
- `depends_on`: frontmatter do documento dependente;
- `children`: derivado pela busca de `parent`.

Regra geral:

- relação direcional mora na origem;
- inversas devem ser derivadas quando possível;
- hubs exibem navegação, mas não substituem a verdade canônica.

## 18. Precedência

Algoritmo documental conceitual:

1. existe `supersedes` explícito?
2. existe `governed_by` aplicável?
3. os `domain` e escopos realmente colidem?
4. qual `status` está vigente?
5. `canonicality` ajuda a separar autoridade atual de apoio?
6. o `type` possui regra de autoridade explícita?
7. ainda ambíguo?
   `HUMAN DECISION REQUIRED`

Resultado:

- `supersedes` resolve substituição;
- `governed_by` resolve autoridade normativa quando houver;
- `status` e `canonicality` filtram histórico e apoio;
- `parent` organiza contexto, mas não decide autoridade sozinho.

## 19. Historical

Regra candidata:

`status: historical` significa:

- documento fora da rota principal vigente;
- ainda potencialmente valioso como evidência, memória institucional ou fechamento.

`historical` não significa automaticamente:

- superseded;
- inválido;
- inútil;
- proibido de leitura.

Portanto, um documento historical pode:

- ter substituto;
- não ter substituto;
- continuar importante para auditoria e lineage.

## 20. Planejamento Estratégico / SK-PE

Definições preservadas:

- `Planejamento Estratégico` = capacidade/espaço temático;
- descrição: `Constrói planos estratégicos realistas e executivos.`
- `SK-PE` = módulo especialista;
- papel: `Gerente Metodológico do Projeto de Planejamento Estratégico.`

Recomendação:

- a definição canônica de `Planejamento Estratégico` deve morar em um hub ou fonte canônica de capacidade;
- a definição canônica do `SK-PE` deve morar em um hub ou documento especializado de módulo;
- essas fontes devem ser relacionadas, mas não fundidas.

## 21. ADR PE/PN

Teste com `adr-plat-biz-001`:

- `parent`: nenhum `parent` ainda, até existir hub transversal realmente aprovado;
- `related`: manter relação lateral com `req-skpe-fe-001` e, futuramente, com hubs PE/PN se existirem;
- `governed_by`: não há evidência suficiente hoje para declarar;
- `domain`: compartilhado semântico em `business-architecture`, sem forçar exclusividade de PE.

Conclusão:

- o ADR compartilhado PE/PN não justifica múltiplos `parent`;
- o melhor tratamento é topologia transversal futura + lateralidade explícita.

## 22. Grafo simulado

Simulação conceitual com IDs reais e candidatos:

```text
skpe-saas-readme
  related -> sparks-agent-execution-guardrails
  related -> adr-plat-biz-001

sparks-governance-hub (candidato)
  children -> sparks-agent-execution-guardrails
  children -> relatorio-fechamento-c10

sparks-architecture-hub (candidato)
  children -> adr-plat-biz-001
  children -> shell-app-transversal-contract-fe09a03

sparks-methodology-hub (candidato)
  children -> req-skpe-fe-001

shell-app-transversal-contract-fe09a03
  related -> sparks-agent-execution-guardrails
  governed_by -> sparks-agent-execution-guardrails (candidato sem aplicação ainda)

adr-plat-biz-001
  related -> req-skpe-fe-001

relatorio-fechamento-c10
  status -> historical
  related -> sparks-agent-execution-guardrails (candidato apenas se uma futura leitura exigir aproximação entre evidência e norma)
```

Observação:

- não há exemplo factual comprovado de `supersedes` no piloto atual;
- por isso, o grafo simulado não inventa supersession real.

## 23. Testes Agentic DX

### A. "Qual documento devo obedecer?"

Resposta esperada:

- primeiro filtrar por `status`;
- depois por `canonicality` e `canonical`;
- depois verificar `governed_by`, quando existir;
- usar `related` apenas para ampliar contexto, não para decidir autoridade.

### B. "Este documento ainda está vigente?"

Resposta esperada:

- `status: active` indica rota vigente;
- `status: historical` indica evidência ou memória, não vigência principal;
- ausência de `supersedes` não prova vigência nem substituição.

### C. "O que substituiu este documento?"

Resposta esperada:

- procurar `supersedes` em documento novo;
- exibir `superseded_by` apenas como relação derivada;
- se não houver supersession explícita, responder que não há substituto comprovado.

### D. "Que documento preciso ler antes deste?"

Resposta esperada:

- `parent` aponta contexto topológico;
- `governed_by` aponta norma aplicável;
- `depends_on` só responderá bem quando sair do estado `DEFER`.

### E. "Qual é o hub/contexto deste documento?"

Resposta esperada:

- `parent`, quando existir, aponta a órbita principal;
- hubs exibem Parent/Child/Related Links para progressive disclosure.

### F. "Que outros documentos são semanticamente relacionados?"

Resposta esperada:

- `related` responde isso diretamente;
- simetria pode ser derivada sem exigir duplicação persistida.

Conclusão:

- o modelo candidato responde melhor A, B, C, E e F;
- D ainda melhora quando `parent` e `governed_by` começarem a ser aplicados em piloto;
- `depends_on` continua insuficientemente estável para responder D com segurança.

## 24. Registry

Decisão candidata:

`Não`

Justificativa:

- relações por ID + hubs + projeções no corpo já formam grafo suficiente;
- o principal problema atual é semântico, não infraestrutural;
- registry agora criaria nova camada de verdade antes da prova do modelo.

## 25. Modelo final candidato

### ADOPT NOW

- `parent`
- `related`
- `supersedes`

### CONDITIONAL

- `governed_by`

### DERIVED ONLY

- `superseded_by`
- `children`

### DEFER

- `depends_on`

### REJECT

- nenhum campo desta lista entra como `REJECT` final em F2.1

Observação:

- a recomendação de F2.0 para `superseded_by = REJECT` foi superada;
- a decisão candidata mais robusta é `DERIVED ONLY`.

## 26. Human Decisions Required

- aprovar formalmente `parent` como relação já integrante do modelo, ainda que a aplicação dependa de hubs aprovados;
- aprovar se `governed_by` entra já no piloto ou permanece em espera curta;
- aprovar `superseded_by` como `DERIVED ONLY`;
- aprovar o primeiro hub transversal necessário para testar `parent`;
- aprovar o primeiro caso real de supersession quando ele surgir.

## 27. Recomendação

Recomendação para a próxima etapa:

- iniciar um piloto de relações com `parent`, `related` e `supersedes`;
- testar `governed_by` em no máximo um ou dois casos com evidência forte;
- manter `superseded_by` apenas como projeção derivada;
- não destravar `depends_on` até que exista critério de aplicação inequívoco;
- manter hubs como documentos de navegação, não como registry.

## 28. Gate

READY FOR RELATIONSHIP PILOT DECISION
