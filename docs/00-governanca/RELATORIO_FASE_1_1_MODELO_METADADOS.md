# Relatório Fase 1.1 - Decisão do Modelo de Metadados

MODELO DE METADADOS: VALIDATION

## 1. Objetivo

Formalizar a decisão do modelo de metadados do `skpe-saas` a partir da base já consolidada na Fase 1.0, reutilizando o Padrão documental raiz sempre que ele já resolver o problema e evitando vocabulário paralelo desnecessário.

Esta fase:

- não reaplica a investigação da Fase 1.0;
- não aplica frontmatter a documentos existentes;
- não cria entrypoint;
- não inicia Migração;
- não altera `README.md`, `AGENT_EXECUTION_GUARDRAILS.md`, `_audit/**` ou qualquer código-fonte.

## 2. Base da decisão

Fontes consideradas nesta decisão:

- `docs/00-governanca/RELATORIO_FASE_1_0_CROSSWALK_PADRAO_RAIZ.md`
- `docs/00-governanca/RELATORIO_FASE_0_1_DECISOES_ESTRUTURANTES.md`
- `docs/00-governanca/ROADMAP_GOVERNANCA_DOCUMENTAL_AGENTICA.md`

Síntese reutilizada da Fase 1.0:

- o Padrão raiz usa núcleo estável de identidade, tipo, domínio, estado e stewardship;
- `canonical`, `canonicality` e `status` não são equivalentes;
- `parent` e `related` são relações distintas;
- `related_to`, `updated_at`, `scope` como CORE e `vertical` não foram justificados como linguagem preferencial;
- `Planejamento Estratégico` e `SK-PE` não são sinônimos.

## 3. Decisão do modelo

### 3.1 CORE obrigatório

Decisão:

- `id`
- `title`
- `domain`
- `type`
- `status`
- `owner`
- `language`
- `encoding`

Justificativa:

- esse conjunto é o menor núcleo que preserva identidade, leitura humana, contexto documental, lifecycle, stewardship e portabilidade editorial;
- ele é compatível com o Padrão raiz e suficiente para um piloto controlado;
- `language` e `encoding` entram no CORE local porque o `skpe-saas` precisa reduzir ambiguidade de idioma e prevenir drift de codificação já na camada documental.

### 3.2 Condicionais aprovados

Decisão:

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

Regra geral:

- são campos válidos e compatíveis com o Padrão raiz;
- não são obrigatórios em todos os documentos do primeiro piloto;
- devem ser usados somente quando adicionarem semântica verificável e não decorativa.

### 3.3 Deferidos

Decisão:

- `supersedes`
- `superseded_by`
- `governed_by`
- `depends_on`

Justificativa:

- todos são semanticamente úteis, mas ainda dependem de política mais madura de Relação, precedência, supersessão e governança operacional;
- antecipá-los agora aumentaria o risco de pseudo-precisão.

### 3.4 Rejeitados ou não justificados

Decisão:

- `related_to`
- `updated_at`
- `scope` como CORE
- `vertical`

Justificativa:

- `related_to` perde para `related`, que já é o vocabulário maduro do Padrão raiz;
- `updated_at` perde para `updated`, que já aparece como forma preferencial nos espaços maduros observados;
- `scope` como CORE duplica funções já melhor resolvidas por `domain`, topologia, `parent` e `related`;
- `vertical` continua sem evidência forte de necessidade técnica não duplicada.

## 4. Semântica obrigatória dos campos

### 4.1 `status`

Decisão:

`status` representa o lifecycle documental atual.

Regra:

- não representa sozinho aprovação formal;
- não representa sozinho Canonicidade;
- deve responder à pergunta: qual é o estado atual deste documento no fluxo editorial?

Vocabulário inicial recomendado para o piloto:

- `draft`
- `active`
- `historical`
- `approved`

Observação:

- `approved` permanece permitido porque já existe no corpus e seria artificial bani-lo agora;
- porém ele não substitui a semântica de `canonicality` nem de `canonical`.

### 4.2 `canonicality`

Decisão:

`canonicality` representa a classe de autoridade documental.

Regra:

- deve responder à pergunta: qual é o papel de autoridade deste documento dentro do corpus?

Valores iniciais recomendados:

- `canonical`
- `supporting`
- `historical`
- `working`

### 4.3 `canonical`

Decisão:

`canonical` é o sinal booleano de Canonicidade operacional.

Regra:

- `true` quando o documento for explicitamente tratado como referência canônica vigente;
- `false` quando não for;
- não deve ser inferido apenas pelo tipo do documento.

### 4.4 `domain`

Decisão:

`domain` representa o domínio documental principal ou a família semântica dominante do artefato.

Regra:

- não deve ser usado como sinônimo de módulo;
- não deve ser usado como sinônimo de product space;
- não deve ser usado como substituto automático de `vertical`;
- deve refletir o contexto semântico primário do documento.

### 4.5 `owner`

Decisão:

`owner` é obrigatório no modelo local aprovado.

Regra:

- todo documento com frontmatter deve declarar stewardship explícito;
- `owner` deve apontar para o responsável institucional pelo cuidado do documento, não necessariamente para o autor material da redação;
- não inventar `owner` quando a responsabilidade não estiver clara; nesses casos, registrar decisão humana necessária antes da aplicação.

### 4.6 `id`

Decisão:

`id` é obrigatório e deve ser semanticamente estável.

Regra:

- deve ser globalmente único dentro do corpus governado do `skpe-saas`;
- não deve depender do path físico do arquivo;
- deve continuar válido mesmo se o arquivo for renomeado ou movido;
- deve privilegiar legibilidade e estabilidade, não apenas brevidade.

### 4.7 `parent`

Decisão:

`parent` representa a relação hierárquica principal.

Regra:

- usar quando existir um hub, mapa ou documento-pai semanticamente claro;
- não usar para toda dependência contextual;
- não substituir `related`.

### 4.8 `related`

Decisão:

`related` representa Relação semântica lateral.

Regra:

- usar para documentos semanticamente conectados, mas não hierarquicamente subordinados;
- não usar como lista decorativa de links;
- cada Relação deve ter justificativa clara de navegação, contexto ou precedência.

## 5. Tipos documentais iniciais

Tipos iniciais aprovados para o piloto:

- `governance`
- `adr`
- `requirement`
- `contract`
- `report`
- `entrypoint`
- `hub`
- `map`

Regra:

- o piloto não precisa esgotar toda a taxonomia futura;
- novos tipos podem existir depois, mas só devem entrar quando houver necessidade semântica concreta.

## 6. Campos CORE: avaliação individual

| Campo | Decisão | Justificativa resumida |
|---|---|---|
| `id` | CORE | Identidade estável e referência semântica |
| `title` | CORE | Leitura humana e título canônico |
| `domain` | CORE | Contexto documental primário |
| `type` | CORE | Natureza documental |
| `status` | CORE | Lifecycle editorial |
| `owner` | CORE | Stewardship obrigatório |
| `language` | CORE | Clareza de idioma e consumo por agentes |
| `encoding` | CORE | Integridade editorial e prevenção de mojibake |

## 7. Campos condicionais: avaliação individual

| Campo | Decisão | Regra resumida |
|---|---|---|
| `canonical` | Condicional aprovado | Booleano de Canonicidade operacional |
| `canonicality` | Condicional aprovado | Classe de autoridade |
| `parent` | Condicional aprovado | Hierarquia principal |
| `related` | Condicional aprovado | Relação lateral |
| `criticality` | Condicional aprovado | Só quando impacto/prioridade forem relevantes |
| `semantic_layer` | Condicional aprovado | Quando houver camada editorial clara |
| `created` | Condicional aprovado | Quando a data de criação agregar rastreabilidade |
| `updated` | Condicional aprovado | Quando a data de atualização for mantida com disciplina |
| `tags` | Condicional aprovado | Indexação útil, não decorativa |
| `version` | Condicional aprovado | Quando houver versionamento real do artefato |

## 8. Campos deferidos

| Campo | Decisão | Motivo |
|---|---|---|
| `supersedes` | Deferido | Depende de política formal de supersessão |
| `superseded_by` | Deferido | Depende de política formal de supersessão |
| `governed_by` | Deferido | Depende de semântica de autoridade mais operacionalizada |
| `depends_on` | Deferido | Ainda ambíguo entre leitura, implementação e contexto |

## 9. Campos rejeitados ou não justificados

| Campo | Decisão | Motivo |
|---|---|---|
| `related_to` | Rejeitado | Vocabulário paralelo a `related` |
| `updated_at` | Rejeitado | Diverge da forma madura `updated` |
| `scope` como CORE | Não justificado | Duplica semântica melhor resolvida em outros elementos |
| `vertical` | Não justificado | Sem necessidade técnica comprovada |

## 10. Planejamento Estratégico e SK-PE

### 10.1 Planejamento Estratégico

**Planejamento Estratégico**

> Constrói planos estratégicos realistas e executivos.

Decisão:

- tratar `Planejamento Estratégico` como capacidade/espaço temático de negócio;
- não tratá-lo automaticamente como novo campo técnico;
- representá-lo editorialmente por naming, `domain`, topologia e, se o corpus amadurecer nessa direção, por estrutura compatível com capability.

### 10.2 SK-PE

**SK-PE — Especialista em Planejamento Estratégico**

Papel:

**Gerente Metodológico do Projeto de Planejamento Estratégico.**

O SK-PE:

- estrutura;
- revisa;
- desdobra;
- audita;
- consolida planejamento estratégico institucional;
- preserva rastreabilidade;
- coerência metodológica;
- executabilidade;
- Governança;
- orientação à decisão;
- seleciona skill ou fonte canônica adequada;
- preserva o que já foi validado;
- elimina duplicidades;
- resolve contradições explicitamente;
- mantém uma única fonte canônica por conceito.

Decisão:

- `SK-PE` deve ser tratado como módulo especialista;
- `Planejamento Estratégico` deve ser tratado como o espaço/capacidade sobre o qual o módulo opera;
- não tratar ambos como sinônimos;
- não criar `vertical` para forçar essa distinção.

## 11. Regras de aplicação do piloto futuro

1. Aplicar primeiro o núcleo CORE aprovado.
2. Adicionar campos condicionais somente quando a semântica estiver comprovada no documento concreto.
3. Não adicionar campos deferidos antes da próxima política específica.
4. Não reintroduzir vocabulário rejeitado.
5. Preservar histórico da Fase 0 como histórico, não como schema definitivo.

## 12. Human Decisions Required

1. Confirmar se o vocabulário inicial de `status` deve manter `approved` como valor permitido no piloto.
2. Confirmar o conjunto inicial de valores aceitos para `canonicality` no `skpe-saas`.
3. Confirmar a lista institucional de `owner` permitidos.
4. Confirmar a convenção final de composição de `id`.
5. Confirmar se `language: pt-BR` será obrigatório por padrão para os documentos da iniciativa.
6. Confirmar se `encoding: UTF-8` será obrigatório por política geral do corpus governado.

## 13. Gate

Classificação final:

`READY FOR METADATA PILOT DECISION`

Justificativa:

- já existe base suficiente para decidir o núcleo mínimo obrigatório;
- os campos condicionais já estão classificados;
- os campos deferidos e rejeitados já estão delimitados;
- a próxima decisão legítima é o piloto, não outra rodada ampla de descoberta.
