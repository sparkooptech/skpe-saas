# Relatorio Fase 0.1 - Decisoes Estruturantes

FRONTMATTER MODEL: PENDING PHASE 1

## 1. Contexto

A Fase 0 concluiu que o repositorio esta `READY WITH CONDITIONS`, mas depende de cinco decisoes humanas antes da Fase 1:

1. entrypoint oficial para agentes;
2. schema minimo de frontmatter;
3. vocabulario minimo de status;
4. politica minima de precedencia e supersession;
5. papel operacional de `_audit/**`.

Esta Fase 0.1 nao aplica frontmatter, nao altera entrypoint, nao migra documentos existentes e nao reclassifica oficialmente historicos. O objetivo aqui e apenas produzir base decisoria minima para um piloto controlado.

## 2. Evidencias reutilizadas da Fase 0

FACT:

- `README.md` existe e e facilmente descobrivel na raiz, mas e curto para orientar precedencia.
- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md` e hoje o melhor candidato a guardrail de agente dentro do repositorio.
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md` e o documento mais maduro em metadata, status e semantica transversal.
- `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md` e o definidor funcional mais forte do SK-PE.
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md` se apresenta como contrato canonico, mas sem frontmatter.
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md` representa o melhor exemplo atual de rastreabilidade formal localizada.
- Apenas 6 de 72 arquivos Markdown em `docs/**` possuem frontmatter no topo.
- `_audit/**` contem fatos uteis, mas tambem paths absolutos, dependencia de maquina e referencias externas ao repositorio.

INFERENCE: ja existe massa critica suficiente para recomendar o minimo necessario, sem expandir escopo para ontologia, automacao ou migracao ampla.

## 3. Entry Point

### Alternativas avaliadas

#### A. `README.md` como entrypoint principal

Vantagens:

- discoverability maxima;
- compativel com praticamente qualquer agente ou humano;
- zero criacao de novo artefato obrigatorio.

Riscos:

- hoje e curto demais;
- tende a virar pseudo-master-document se acumular tudo;
- nao diferencia sozinho Plataforma SPARKs, SK-PE, governanca e historico com profundidade suficiente.

#### B. `AGENTS.md` na raiz como entrypoint especifico para agentes

Vantagens:

- intencao explicita para agentes;
- separa publico humano geral de publico agentico.

Riscos:

- hoje nao existe `AGENTS.md` no repositorio;
- cria nova superficie concorrente ao `README.md` e aos guardrails;
- aumenta risco de duplicacao e drift entre roteador humano e roteador de agente;
- pode privilegiar um ecossistema de agentes em detrimento de outros.

#### C. Documento de governanca em `docs/00-governanca` apontado por README/guardrail

Vantagens:

- posiciona a governanca no lugar semanticamente correto;
- separa descoberta na raiz de detalhamento em `docs`;
- reduz pressao para transformar o `README.md` em documento-monstro.

Riscos:

- sozinho perde discoverability;
- depende de ponte clara a partir da raiz.

#### D. Combinacao minima de roteador raiz + documentos especializados

Modelo:

- `README.md` como roteador de descoberta;
- documento especializado de governanca como primeiro destino agentico;
- documentos especializados seguintes por dominio: arquitetura, requisito, contrato, relatorio.

Vantagens:

- melhor progressive disclosure;
- baixo risco de pseudo-standard unico;
- compativel com futuros modulos;
- preserva diferenca entre Plataforma SPARKs e SK-PE;
- reduz duplicacao porque cada documento responde por um papel claro.

Riscos:

- exige disciplina editorial;
- depende de declaracao futura explicita de ordem de leitura.

### Recomendacao

RECOMMENDED:

`D. combinacao minima de roteador raiz + documentos especializados`

Implementacao futura minima sugerida:

- `README.md` permanece como primeiro ponto de descoberta;
- ele deve apontar explicitamente para um entrypoint de governanca em `docs/00-governanca`;
- esse entrypoint de governanca deve encaminhar para documentos especializados por contexto.

Fallback:

`C. documento de governanca em docs/00-governanca apontado por README/guardrail`

INFERENCE: esta opcao oferece a melhor combinacao entre discoverability, progressive disclosure, compatibilidade com futuros modulos e menor risco de duplicacao.

HUMAN DECISION REQUIRED:

- o roteador especializado deve ser um novo documento de governanca ou o proprio `AGENT_EXECUTION_GUARDRAILS.md`.

## 4. Frontmatter minimo

### Premissa

INFERENCE: o repositorio ainda nao suporta um schema rico com seguranca. O piloto precisa de um schema minimo que resolva identidade, natureza, vigencia e contexto, sem antecipar rastreabilidade completa.

### CORE OBRIGATORIO

| campo | proposito | cardinalidade | obrigatoriedade | exemplo | risco se ausente | risco de excesso |
|---|---|---|---|---|---|---|
| `id` | identidade documental estavel | 1 | obrigatorio | `sparks-agent-execution-guardrails` | agentes nao conseguem referenciar o documento sem ambiguidade | criar ids ad hoc inconsistentes |
| `title` | titulo canonico legivel e explicito | 1 | obrigatorio | `Guardrails de Execucao - Plataforma SPARKs` | titulo no corpo pode divergir ou ser insuficiente | redundancia se virar slogan longo |
| `type` | distinguir natureza documental | 1 | obrigatorio | `governance`, `adr`, `requirement`, `contract`, `report` | precedencia por tipo fica opaca | taxonomia excessiva e prematura |
| `status` | sinal minimo de vigencia documental | 1 | obrigatorio | `active` | agente nao sabe se o documento vigora ou e historico | inflacao de estados |
| `scope` | distinguir transversal, especifico ou misto | 1 | obrigatorio | `platform`, `skpe`, `cross-module`, `mixed` | plataforma e modulo podem se confundir | microescopos artificiais |
| `updated_at` | registrar ultima atualizacao documental | 1 | obrigatorio | `2026-08-15` | leitura comparativa perde contexto temporal | falsa prioridade por recencia |

### CONDICIONAL

| campo | proposito | cardinalidade | obrigatoriedade | exemplo | risco se ausente | risco de excesso |
|---|---|---|---|---|---|---|
| `version` | controlar versao formal quando houver ciclo versionado | 0..1 | condicional | `1.1.0` | historico de revisao formal fica opaco | versionar documentos que nao precisam |
| `owner` | indicar stewardship documental | 0..1 | condicional | `SPARKOOP` | manutencao fica difusa | ownership burocratico ou desatualizado |
| `domain` | delimitar dominio funcional/arquitetural | 0..1 | condicional | `platform-architecture` | contexto de leitura fica menos preciso | virar taxonomia paralela de negocio |
| `canonical` | marcar explicitamente quando o documento for fonte normativa principal | 0..1 | condicional | `true` | canonicidade fica apenas em texto livre | banalizacao do rotulo canonico |
| `related_to` | apontar relacoes relevantes nao hierarquicas | 0..N | condicional | `req-skpe-fe-001-arquitetura-canonica-formulacao-estrategica` | contextualizacao manual mais cara | lista decorativa sem operacionalidade |
| `depends_on` | indicar dependencia de leitura ou de criterio de entrada | 0..N | condicional | `docs/auditoria/RELATORIO_FECHAMENTO_C9F.md` | rastreabilidade localizada se perde | relacoes viram dumping de links |

### NAO INCLUIR AGORA

- `supersedes`
- `superseded_by`
- `governed_by`
- `module`
- `created_at`
- `source`
- `authors`

Justificativa:

- `supersedes` e `superseded_by` sao desejaveis, mas dependem primeiro de politica minima aprovada.
- `governed_by` ainda carece de semantica estavel no corpus.
- `module` pode ser inferido em varios casos a partir de `scope` e `domain`; traz pouco ganho inicial.
- `created_at` e util, mas menos importante que `updated_at` para o piloto.
- `source` e `authors` hoje tenderiam a variar demais e gerar metadado decorativo.

### Schema minimo proposto

CORE:

- `id`
- `title`
- `type`
- `status`
- `scope`
- `updated_at`

CONDICIONAL:

- `version`
- `owner`
- `domain`
- `canonical`
- `related_to`
- `depends_on`

## 5. Status documental

### Status reais observados no corpus

FACT:

- `active` aparece em `AGENT_EXECUTION_GUARDRAILS.md`;
- `approved` aparece em ADRs e relatorios de auditoria;
- texto livre equivalente aparece em requisitos e contratos como `Aprovado`, `Aprovado para implementacao controlada`, `Implementacao tecnica preparada`, `contrato arquitetural para validacao`;
- `draft`, `candidate`, `superseded`, `validated`, `pending_validation`, `active` tambem aparecem em requisitos, mas em varios casos representam estados de negocio e nao status documental.

### Distincoes conceituais

INFERENCE:

- `approved` e `active` nao sao a mesma coisa.
- `approved` expressa decisao ou aprovacao formal.
- `active` expressa vigencia operacional atual.

Exemplo util:

- um ADR pode estar `approved` e continuar `active`;
- um relatorio pode estar `approved`, mas nao ser `active` como norma;
- um documento historico pode ter sido `approved` no passado e hoje nao ser vigente.

### Vocabulario minimo proposto

RECOMMENDED:

- `draft`
- `active`
- `historical`

Uso pretendido:

- `draft`: ainda em elaboracao ou sem vigencia aprovada;
- `active`: vigente para consumo normativo;
- `historical`: relevante como registro/evidencia, mas nao normativo vigente.

### Equivalencias provisórias

- `approved` no corpus atual: manter como evidencia historica ou estado legado; na convergencia futura, avaliar se o documento aprovado tambem deve ser marcado como `active` ou `historical`.
- `candidate`: tratar como maturidade/proposta, nao como vigencia.
- `superseded`: tratar como subtipo operacional de historico, nao como status minimo obrigatorio inicial.
- `obsolete` e `deprecated`: nao entram no vocabulario minimo inicial.
- `frozen`: tratar como condicao de edicao ou lifecycle operacional, nao como status documental minimo.
- `canonical`: deve ser atributo separado, nao status.

HUMAN DECISION REQUIRED:

- o corpus final quer manter `approved` como status oficial de primeira classe, ou apenas como evidencia de aprovacao complementada por `active`/`historical`.

## 6. Precedencia

### Pergunta central

Quando dois documentos aparentemente conflitam, como um agente deve descobrir qual prevalece?

### Politica minima proposta

RECOMMENDED:

Resolver precedencia pela seguinte ordem:

1. relacao explicita de supersession, quando existir;
2. documento governante explicitamente apontado pelo entrypoint/governanca;
3. compatibilidade de escopo e dominio com a pergunta do agente;
4. vigencia documental (`active` versus `historical`);
5. tipo documental, apenas quando o proprio corpus ou documento governante atribuir papel diferente;
6. decisao humana quando a ambiguidade permanecer.

### O que nao usar como regra primaria

- data mais recente sozinha;
- nome de arquivo;
- pasta;
- presuncao fixa do tipo `ADR > requisito` ou `requisito > contrato`;
- relatorio recente como substituto automatico de contrato vigente.

### Exemplos baseados no corpus

Exemplo 1:

- pergunta sobre shell transversal do SK-PE.
- `AGENT_EXECUTION_GUARDRAILS.md` e `CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md` convergem e parecem normativos.
- `_audit/MUST-PILOT-*` e `_audit/FE-10C-CROSSCHECK-LOCAL.md` entram apenas como evidencia historica e interpretativa.

Resultado:

- precedencia pratica recai sobre guardrails + contrato;
- `_audit/**` nao governa.

Exemplo 2:

- `README.md` e `REQ-SKPE-FE-001` respondem a "o que e o SK-PE?".
- `README.md` da descoberta inicial.
- `REQ-SKPE-FE-001` detalha o modulo e sua arquitetura funcional.

Resultado:

- nao ha conflito; ha progressive disclosure.

Exemplo 3:

- um relatorio de auditoria recente e um requisito mais antigo diferem em linguagem operacional.

Resultado:

- se o relatorio nao declara supersession nem substitui formalmente o requisito, ele nao vence sozinho;
- ele pode evidenciar drift, implementacao, validacao ou lacuna, mas nao revoga norma por inferencia.

## 7. Supersession

### Politica minima proposta

RECOMMENDED:

- supersession deve ser explicita, nunca presumida por data;
- quando adotada futuramente, deve apontar substituicao identificavel entre documentos;
- um documento superseded continua relevante como historico e evidencia;
- ausencia de `supersedes` significa "nao assuma substituicao".

### Regra operacional para agentes

Se um agente encontrar dois documentos semelhantes:

1. procurar relacao explicita de supersession;
2. se nao houver, verificar se o entrypoint/governanca aponta qual e o governante;
3. se ainda nao houver resposta, usar o documento `active` mais alinhado ao escopo;
4. se ainda houver empate, escalar para decisao humana.

### Distincao importante

- `historical` nao implica que houve supersession formal;
- `superseded` implica historico com substituto conhecido.

INFERENCE: por isso `superseded` e melhor tratado como relacao/atributo futuro do que como status minimo inicial.

## 8. Papel de `_audit/**`

### O que existe hoje

FACT:

- crosschecks locais;
- pilotos, closures e arch reviews;
- evidencias detalhadas de shell, layout, responsividade e implementacao;
- paths absolutos de maquina;
- referencias a documentacao externa ao repositorio.

### Avaliacao operacional

FACT: `_audit/**` contem fatos uteis.

FACT: `_audit/**` tambem contem inferencias, classificacoes locais e dependencia contextual da maquina/autoria.

INFERENCE: `_audit/**` pode ser consumido por agentes, mas nao como autoridade normativa primaria.

### Recomendacao

RECOMMENDED:

`B + C`

- permitir `_audit/**` como evidencia, nunca como autoridade normativa;
- promover seletivamente conclusoes aprovadas para `docs/**` quando precisarem virar regra ou aprendizado vigente.

Politica minima:

- excluir `_audit/**` do caminho normal de descoberta inicial;
- permitir consulta apenas quando o documento governante ou a investigacao exigir evidencia historica;
- nao usar `_audit/**` para revogar norma em `docs/**`.

## 9. Testes hipoteticos de Agentic DX

### Cenario A

Pedido:

"Implemente uma alteracao no SK-PE relacionada ao shell."

Fluxo recomendado:

1. agente entra por `README.md`;
2. o roteador o envia ao entrypoint de governanca;
3. o entrypoint o manda para `AGENT_EXECUTION_GUARDRAILS.md`;
4. para o dominio especifico, ele le `CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`;
5. para o contexto de modulo, ele le `REQ-SKPE-FE-001` e, se necessario, matrizes/contratos do SK-PE;
6. `_audit/**` entra apenas como evidencia historica de piloto, nao como regra.

Resultado:

INFERENCE: o modelo recomendado funciona, desde que o roteador raiz e o documento de governanca sejam explicitados na Fase 1.

### Cenario B

Um agente encontra dois documentos com recomendacoes diferentes.

Fluxo recomendado:

1. buscar supersession explicita;
2. buscar documento governante apontado;
3. verificar escopo/domínio;
4. preferir documento `active`;
5. persistindo ambiguidade, escalar.

Resultado:

INFERENCE: o agente consegue evitar invencao se a Fase 1 formalizar pelo menos status, escopo e entrypoint.

### Cenario C

Um agente encontra relatorio recente em `_audit/**` e contrato anterior em `docs/**`.

Papel recomendado:

- contrato em `docs/**`: norma ou referencia vigente, se `active`;
- `_audit/**`: evidencia, analise de drift, piloto ou closure local.

Resultado:

INFERENCE: o contrato prevalece; o `_audit` complementa.

## 10. Piloto recomendado

### Avaliacao do conjunto sugerido na Fase 0

Conjunto original:

- `README.md`
- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`
- `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`

INFERENCE: o conjunto continua adequado.

Ele prova:

- entrypoint: `README.md`
- governanca: `AGENT_EXECUTION_GUARDRAILS.md`
- arquitetura: `ADR-PLAT-BIZ-001`
- requisito: `REQ-SKPE-FE-001`
- contrato: `CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`
- relatorio/evidencia: `RELATORIO_FECHAMENTO_C10.md`

Observacao:

- o piloto nao deve incluir `_audit/**`;
- `RELATORIO_FECHAMENTO_C10.md` e um bom representante de relatorio formal com metadata, mas deve entrar no piloto explicitamente como evidencia, nao como norma.

## 11. Matriz de decisoes

| Decisao | Opcoes | Recomendacao | Evidencia | Risco | Human Decision |
|---|---|---|---|---|---|
| Entry point | A, B, C, D | D | README curto + guardrails fortes + corpus especializado | duplicacao se o roteador nao for bem definido | definir se o entrypoint especializado sera novo ou reuso do guardrail |
| Frontmatter minimo | schema rico vs minimo | schema minimo | apenas 6/72 docs com YAML; esquemas divergentes | metadata decorativa e inflada | aprovar campos CORE e CONDICIONAL |
| Status | manter varios vs podar | `draft`, `active`, `historical` | `approved` e `active` coexistem; estados de negocio poluem o corpus | ambiguidade entre aprovacao e vigencia | decidir papel oficial de `approved` |
| Precedencia | data, tipo, status, relacao, governante | relacao explicita + governante + escopo + status | ausencia atual de regra global | agentes ainda podem empatar em casos de fronteira | aprovar ordem minima de resolucao |
| Supersession | implicita vs explicita | explicita | nao ha uso consistente hoje | falsa substituicao por recencia | aprovar introducao futura de `supersedes` |
| `_audit/**` | excluir, permitir, promover seletivamente | evidencia apenas + promocao seletiva | conteudo util, mas com paths locais e contexto externo | pseudo-standard paralelo | aprovar sua exclusao do caminho inicial |

## 12. Riscos

- querer resolver tudo com metadata antes de fixar o entrypoint;
- manter `approved` sem definir relacao com vigencia;
- transformar `_audit/**` em referencia de fato por conveniencia;
- introduzir `supersedes` antes de aprovar a politica;
- confundir status documental com lifecycle de entidades de negocio.

## 13. Human Decisions Resolved

### D01 - Entrypoint

APROVADO:

- modelo `D`;
- `README.md` como descoberta inicial;
- futuro entrypoint especializado em `docs/00-governanca`;
- documentos especializados por contexto;
- `AGENT_EXECUTION_GUARDRAILS.md` nao sera o entrypoint documental principal;
- `AGENTS.md` nao sera criado nesta etapa.

Trade-off preservado:

- mantem alta discoverability sem transformar o guardrail de execucao em roteador documental central.

### D02 - Frontmatter minimo

APROVADO para o piloto:

CORE:

- `id`
- `title`
- `type`
- `status`
- `scope`
- `updated_at`

CONDICIONAL:

- `version`
- `owner`
- `domain`
- `canonical`
- `related_to`
- `depends_on`

FORA DO PRIMEIRO MODELO:

- `supersedes`
- `superseded_by`
- `governed_by`
- `module`
- `created_at`
- `source`
- `authors`

Trade-off preservado:

- o modelo aprovado minimiza inflacao de metadata e adia conceitos ainda imaturos.

### D03 - Status documentais

APROVADO:

- `draft`
- `active`
- `historical`

Tambem aprovado:

- `canonical` e atributo, nao status;
- `approved` nao entra agora como status documental oficial.

Trade-off preservado:

- separa aprovacao formal de vigencia documental.

### D04 - Precedencia

APROVADO:

1. supersession explicita, quando existir;
2. documento governante explicitamente apontado;
3. compatibilidade de escopo e dominio;
4. vigencia documental;
5. tipo documental somente quando houver regra explicita;
6. HUMAN DECISION quando a ambiguidade permanecer.

Tambem aprovado:

- data mais recente nao vence sozinha;
- pasta nao vence sozinha;
- ADR nao vence requisito por axioma;
- requisito nao vence contrato por axioma;
- relatorio recente nao substitui norma por inferencia.

### D05 - Supersession

APROVADO:

- supersession precisa ser explicita;
- nunca presumir por data, nome, diretorio, proximidade textual ou versao isolada;
- `historical != superseded`.

Trade-off preservado:

- evita falsa substituicao automatica antes da maturacao tecnica do modelo.

### D06 - `_audit/**`

APROVADO:

- `_audit/**` e fonte potencial de evidencia;
- nao e autoridade normativa primaria;
- permanece fora do caminho inicial normal de descoberta;
- conclusoes so passam a governar quando promovidas deliberadamente para `docs/**`.

Trade-off preservado:

- preserva valor historico e investigativo sem permitir pseudo-standard paralelo.

## 14. Criterios para fechamento da Fase 0

- entrypoint recomendado validado;
- schema minimo validado;
- vocabulario minimo de status validado;
- politica minima de precedencia validada;
- politica minima para `_audit/**` validada;
- piloto Fase 1/3 confirmado.

## 15. Recomendacao de Gate

RECOMMENDED:

`READY TO CLOSE PHASE 0`

Justificativa:

FACT: a Fase 0 ja entregou baseline e diagnostico.

FACT: a Fase 0.1 agora oferece recomendacoes minimas e coerentes para as cinco decisoes estruturantes, sem antecipar a Fase 1.

INFERENCE: o proximo bloqueio deixa de ser de descoberta e passa a ser apenas de aprovacao humana das recomendacoes.

Atualizacao de gate em 2026-08-15:

FACT: o responsavel pelo produto aprovou o Gate da Fase 0.

Estado final recomendado:

`READY TO CLOSE PHASE 0` -> aprovado e encerrado como `CLOSED`.
