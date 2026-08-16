# Relatório Fase 1.2 - Piloto Controlado de Metadados

MODELO DE METADADOS: VALIDATION

## 1. Objetivo

Executar um piloto controlado do modelo aprovado na Fase 1.1, aplicando frontmatter somente em três documentos do `skpe-saas` para verificar aderência prática, segurança semântica e compatibilidade com o Padrão raiz.

Documentos piloto:

1. `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
2. `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`
3. `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`

## 2. Escopo aplicado

Foi aplicado somente o frontmatter necessário, sem reescrita substantiva do conteúdo.

Campos não utilizados nesta fase:

- `supersedes`
- `superseded_by`
- `governed_by`
- `depends_on`
- `related_to`
- `updated_at`
- `vertical`

## 3. Frontmatter aplicado

### 3.1 ADR compartilhado PE + PN

Arquivo:

`docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`

Frontmatter aplicado:

- `id: adr-plat-biz-001`
- `title: Domínio Compartilhado de Arquitetura de Negócios entre SK-PE e SK-PN`
- `domain: business-architecture`
- `type: adr`
- `status: active`
- `owner: SPARKOOP`
- `language: pt-BR`
- `encoding: UTF-8`
- `canonicality: canonical`
- `canonical: true`
- `criticality: high`
- `related: [req-skpe-fe-001]`
- `tags`
- `semantic_layer: architecture-decision`
- `created: 2026-07-30`
- `updated: 2026-07-30`

Campos omitidos por falta de evidência suficiente:

- `parent`
- `version`

### 3.2 Requisito metodológico SK-PE

Arquivo:

`docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`

Frontmatter aplicado:

- `id: req-skpe-fe-001`
- `title: Arquitetura Canônica da Formulação Estratégica`
- `domain: strategic-planning`
- `type: requirement`
- `status: active`
- `owner: SPARKs PE`
- `language: pt-BR`
- `encoding: UTF-8`
- `canonicality: supporting`
- `canonical: false`
- `related: [adr-plat-biz-001]`

Campos omitidos por falta de evidência suficiente:

- `parent`
- `criticality`
- `semantic_layer`
- `created`
- `updated`
- `tags`
- `version`

### 3.3 Relatório de auditoria C10

Arquivo:

`docs/auditoria/RELATORIO_FECHAMENTO_C10.md`

Frontmatter aplicado:

- `id: relatorio-fechamento-c10`
- `title: Fechamento Técnico C10 — Reconciliação Transversal e Encerramento Integrado`
- `domain: skpe-governance`
- `type: report`
- `status: historical`
- `owner: SPARKs PE`
- `language: pt-BR`
- `encoding: UTF-8`
- `version: 1.1.0`
- `canonicality: supporting`
- `canonical: false`
- `created: 2026-08-14`
- `updated: 2026-08-14`

Campos omitidos por falta de evidência suficiente:

- `parent`
- `related`
- `criticality`
- `semantic_layer`
- `tags`

## 4. Avaliação obrigatória do piloto

### 4.1 O CORE funcionou para os 3 tipos documentais?

Sim.

O núcleo `id`, `title`, `domain`, `type`, `status`, `owner`, `language` e `encoding` foi suficiente para:

- identificar o ADR como decisão arquitetural transversal;
- identificar o requisito metodológico como documento ativo de implementação;
- identificar o relatório C10 como registro histórico de fechamento.

### 4.2 `domain` conseguiu representar corretamente o ADR compartilhado PE + PN?

Sim, com ressalva.

`business-architecture` representou melhor o conceito compartilhado do ADR do que um domínio exclusivo de módulo. A ressalva é que o piloto confirma a necessidade de manter `domain` como domínio documental, não como rótulo de módulo nem como substituto de `vertical`.

### 4.3 `owner` pôde ser definido sem invenção?

Parcialmente.

- no ADR, `SPARKOOP` foi sustentado pelo caráter transversal da Plataforma SPARKs e pelo padrão institucional já observado no corpus;
- no requisito e no relatório C10, `SPARKs PE` foi sustentado pelo contexto explícito do módulo;
- ainda assim, o piloto mostra que o repositório precisa consolidar uma tabela institucional de owners permitidos para reduzir inferência futura.

### 4.4 `status` pôde ser definido com segurança?

Sim.

- ADR: `active`
- requisito: `active`
- relatório C10: `historical`

O piloto confirmou que o vocabulário calibrado `draft/active/historical` é suficiente para distinguir documento vigente de documento de evidência.

### 4.5 `canonicality` e `canonical` puderam ser definidos sem confundir nome do arquivo com autoridade?

Sim.

- o ADR recebeu `canonicality: canonical` e `canonical: true` por evidência combinada de conteúdo normativo, caráter transversal e decisão arquitetural explícita;
- o requisito recebeu `canonicality: supporting` e `canonical: false`, apesar do título forte, justamente para não transformar nome de arquivo em prova de autoridade final;
- o relatório C10 recebeu `canonicality: supporting` e `canonical: false`, preservando seu papel de evidência histórica.

### 4.6 `parent` e `related` foram suficientes?

Parcialmente.

- `related` foi suficiente para amarrar o ADR e o requisito;
- `parent` não foi aplicado porque o piloto ainda não possui hub especializado formalizado com evidência suficiente.

Conclusão:

o modelo já suporta Relação lateral mínima, mas ainda depende do futuro desenho de hubs para explorar hierarquia de forma mais consistente.

### 4.7 `language: pt-BR` e `encoding: UTF-8` trouxeram consistência?

Sim.

Esses campos reforçaram:

- idioma documental explícito;
- intenção editorial uniforme;
- proteção contra drift de codificação e mojibake.

### 4.8 Compatibilidade com o Padrão raiz

Boa compatibilidade.

O piloto reutilizou a linguagem central do Padrão raiz:

- `id`
- `title`
- `domain`
- `type`
- `status`
- `owner`
- `canonicality`
- `canonical`
- `related`
- `created`
- `updated`
- `tags`
- `semantic_layer`

Também manteve a disciplina de não reintroduzir:

- `related_to`
- `updated_at`
- `vertical`

### 4.9 Problemas encontrados no modelo

1. `owner` ainda carece de catálogo institucional explícito.
2. `parent` depende de hub ou mapa ainda não formalizado.
3. `domain` funciona, mas exige cuidado para não virar alias de módulo.
4. o relatório C10 perdeu campos operacionais legados que eram úteis para fechamento local, mas não pertencem ao modelo mínimo desta fase.

### 4.10 Ajustes recomendados

1. Formalizar lista de `owner` permitidos antes da onda 2.
2. Definir convenção controlada de `domain` para documentos transversais, compartilhados e específicos de módulo.
3. Decidir quando campos operacionais de relatórios de auditoria devem migrar para corpo textual em vez de permanecer em frontmatter.
4. Retomar `parent` somente quando o hub documental estiver semanticamente estável.

### 4.11 Human Decisions Required

1. Confirmar se `SPARKOOP` e `SPARKs PE` entram como owners oficiais da política.
2. Confirmar se `business-architecture`, `strategic-planning` e `skpe-governance` entram como domínios aprovados.
3. Confirmar se relatórios de auditoria devem sempre usar `status: historical`.
4. Confirmar se requisitos metodológicos ativos permanecem `supporting` por padrão até decisão explícita de Canonicidade.
5. Confirmar a futura convenção de `parent` quando o hub especializado existir.

## 5. Validação PT-BR e UTF-8

Checklist executado:

- presença de `pt-BR` nos três documentos piloto;
- presença de `UTF-8` nos três documentos piloto;
- varredura pelos quatro marcadores de mojibake definidos para esta fase.

Resultado esperado do piloto:

- PT-BR consistente
- UTF-8 consistente

## 6. Gate

Classificação final:

`READY FOR PILOT WAVE 2`

Justificativa:

- o CORE funcionou nos três tipos documentais;
- o conjunto mínimo foi aplicado sem frontmatter em massa;
- os principais riscos agora são de calibração fina, não de modelo estrutural.
