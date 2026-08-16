# Relatório Fase 2.0 - Discovery de Relações e Rastreabilidade

DISCOVERY DE RELAÇÕES: VALIDATION

## 1. Objetivo

Definir o menor modelo documental de relações capaz de melhorar rastreabilidade, precedência e navegação agentic no `skpe-saas`, sem aplicar novos campos aos documentos piloto nesta fase.

## 2. Estado herdado das Fases 0 e 1

As Fases 0 e 1 deixaram como base aprovada:

- modelo CORE de metadados;
- distinção entre `status`, `canonicality` e `canonical`;
- catálogo inicial de `owner`;
- `language: pt-BR` e `encoding: UTF-8` como obrigatórios;
- separação semântica entre `Planejamento Estratégico` e `SK-PE`.

Também foi preservada a ordem mínima de precedência documental:

1. supersession explícita;
2. documento governante explicitamente apontado;
3. compatibilidade de escopo/domínio;
4. vigência;
5. tipo, apenas quando houver regra explícita;
6. decisão humana se ainda houver ambiguidade.

## 3. Padrão raiz observado

O padrão raiz observado em `C:\Users\robso\OneDrive\DevKit\projetos\docs\products` usa uma combinação deliberada de:

- frontmatter com `parent` e `related`;
- corpo com seções `Parent Links`, `Child Links` e `Related Links`;
- hubs de navegação;
- mapas semânticos;
- mapas de canonical sources;
- linguagem explícita de `Index-First Navigation`, `AI Navigation Readiness` e `Obsidian Graph Readiness`.

Exemplos lidos:

- `docs/products/README.md`;
- `docs/products/coliga/README.md`;
- `docs/products/coliga/canonical-sources/coliga-canonical-sources-map.md`;
- `docs/products/produz/navigation/produz-knowledge-map.md`.

Conclusão:

- o grafo documental no padrão raiz não vive apenas no frontmatter;
- há redundância deliberada para consumo humano + IA;
- `parent` representa hierarquia/topologia;
- `related` representa vizinhança semântica lateral;
- os hubs funcionam como roteadores e mapas, não como banco central de verdade.

## 4. Relações atuais no corpus

No corpus atual do `skpe-saas`, antes de qualquer nova aplicação desta fase, foi observado:

- `related` já aplicado no ADR compartilhado, no requisito metodológico e no contrato transversal;
- `depends_on` ainda aparece em relatórios legados de auditoria com forte acoplamento a paths e artefatos operacionais;
- não há uso aprovado de `parent` nos documentos piloto;
- não há uso aprovado de `governed_by`;
- não há uso aprovado de `supersedes`;
- não há uso aprovado de `superseded_by`.

Leitura de referência no corpus local:

- `README.md`;
- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`;
- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`;
- `docs/03-methodology/REQ-SKPE-FE-001_ARQUITETURA_CANONICA_FORMULACAO_ESTRATEGICA.md`;
- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`;
- `docs/auditoria/RELATORIO_FECHAMENTO_C10.md`.

## 5. `parent`

Significado recomendado:

> relação hierárquica ou topológica de pertencimento documental.

`parent` não deve significar:

- afinidade temática;
- autoridade normativa;
- dependência operacional;
- mera proximidade de pasta.

Evidência do padrão raiz:

- hubs de produto apontam para um `parent` no frontmatter;
- o corpo replica esse vínculo em `Parent Links`;
- o hub pai organiza children por navegação explícita.

Conclusão para `skpe-saas`:

- o campo é semanticamente válido;
- porém sua aplicação depende de hubs ou de uma topologia aprovada;
- não deve ser forçado agora nos documentos piloto.

## 6. `related`

Significado recomendado:

> relação semântica não hierárquica.

`related` não implica:

- governança;
- substituição;
- precedência;
- dependência obrigatória.

Resultado no corpus piloto:

- o ADR e o requisito já se conectam lateralmente com segurança;
- o contrato transversal se relaciona corretamente ao guardrail;
- o uso atual não exigiu espelhar a relação no sentido inverso em todos os documentos para continuar útil.

Conclusão:

- `related` já provou utilidade prática;
- é a relação mais madura para continuidade.

## 7. `depends_on`

Significado candidato:

> documento depende semanticamente de outro para ser corretamente interpretado ou aplicado.

Problema observado:

- no corpus legado, `depends_on` aparece acoplado a paths de migrations e artefatos operacionais;
- esse uso mistura dependência documental com dependência técnica de runtime;
- o campo tende a ser superutilizado sempre que um texto “cita” outro artefato.

Conclusão:

- há semântica potencial, mas a prática atual ainda está contaminada por acoplamento técnico;
- não há prova suficiente de que o campo já esteja pronto para adoção canônica no corpus documental normalizado.

## 8. `governed_by`

Significado candidato:

> existe um documento explicitamente governante que estabelece regra ou autoridade sobre este documento ou contexto.

Distinção importante:

- `parent` responde “onde este documento pertence na topologia?”;
- `governed_by` responde “qual documento governa este documento?”.

Exemplo conceitual local:

- o contrato transversal pode ser lido junto ao guardrail;
- nem todo vínculo com guardrail é hierárquico;
- isso sugere que `governed_by` pode agregar semântica distinta de `parent`.

Limite atual:

- o corpus piloto ainda não possui política explícita e estável de “documento governante” aplicada no frontmatter;
- adotar o campo agora em massa criaria risco de classificação inventada.

## 9. `supersedes`

Significado recomendado:

> este documento substitui explicitamente outro documento.

Regra necessária:

- só usar quando a substituição for afirmada explicitamente;
- nunca inferir por data, pasta, número, tema ou impressão de “versão mais nova”.

Vantagem:

- operacionaliza a primeira regra de precedência aprovada na Fase 0;
- mantém uma única fonte canônica no documento que substitui.

Conclusão:

- o campo é forte e útil;
- deve ser adotado somente quando houver decisão humana explícita de substituição.

## 10. `superseded_by`

Significado candidato:

> este documento foi explicitamente substituído por outro.

Problema:

- como campo mantido manualmente, duplica a mesma semântica de `supersedes`;
- introduz risco de drift entre o documento novo e o documento antigo;
- viola o princípio de fonte única quando ambos precisarem ser atualizados.

Conclusão:

- o inverso pode ser inferido futuramente por ferramenta ou apresentado por hub;
- não deve ser mantido como relação canônica primária neste momento.

## 11. Direcionalidade e simetria

Classificação recomendada:

- `parent`: direcional;
- `depends_on`: direcional;
- `governed_by`: direcional;
- `supersedes`: direcional;
- `superseded_by`: direcional, porém redundante;
- `related`: conceitualmente bilateral, mas operacionalmente permitido como unilateral.

Regra proposta:

- relações direcionais devem viver apenas no documento de origem;
- `related` pode ser registrado em um lado só quando isso já resolver a navegação;
- espelhamento manual em ambos os lados só deve acontecer quando houver ganho humano claro e baixo risco de drift.

## 12. IDs e links

Recomendação principal:

> relações em frontmatter devem apontar para `id` estável, não para path físico.

Justificativa:

- resiste a renomeação de arquivos;
- reduz dependência de organização física temporária;
- aproxima o `skpe-saas` do padrão de graph readiness do repositório raiz.

Recomendação complementar:

- quando o corpus adotar links semânticos no corpo, preferir `[[document-id]]` ou mecanismo equivalente baseado em ID canônico;
- paths podem continuar no corpo apenas para referências externas, operacionais ou transitórias;
- relações canônicas não devem depender de path.

## 13. Hubs

Definição recomendada:

> hub é um documento de navegação canônica que organiza entrada, contexto e rotas de leitura para um domínio, capacidade ou camada documental.

Um hub pode ser:

- entrypoint;
- índice;
- roteador;
- agregador;
- mapa de leitura.

Um hub não deve ser:

- documento mestre de tudo;
- banco central de verdade concorrente ao corpus;
- substituto do frontmatter;
- mecanismo para reescrever a autoridade dos documentos filhos.

Conclusão:

- o hub é projeção navegacional do grafo, não a única fonte do grafo;
- a combinação correta é frontmatter distribuído + links no corpo + hubs seletivos.

## 14. Topologia candidata

Topologia conceitual que melhor se ajustou ao corpus real:

1. Plataforma SPARKs
2. Hub transversal da plataforma
3. Domínios ou capacidades transversais
4. Planejamento Estratégico como capacidade/espaço temático
5. SK-PE como documentação especializada do módulo
6. Tipos documentais como ADR, requisito, contrato, política e relatório

Conclusão importante:

- `Planejamento Estratégico` não deve ser rebaixado a sinônimo de módulo;
- `SK-PE` não deve ser promovido a sinônimo da capacidade;
- documentos compartilhados PE/PN pedem topo mais transversal do que uma árvore puramente monovertical.

## 15. Planejamento Estratégico / SK-PE

Definições preservadas:

- `Planejamento Estratégico`: capacidade/espaço temático de negócio.
- descrição: `Constrói planos estratégicos realistas e executivos.`
- `SK-PE`: módulo especialista.
- papel: `Gerente Metodológico do Projeto de Planejamento Estratégico.`

Recomendação de localização futura:

- a definição canônica de `Planejamento Estratégico` deve viver em um hub ou fonte canônica de capacidade;
- a definição canônica do papel do `SK-PE` deve viver em um hub ou documento especializado do módulo;
- essas duas definições devem se relacionar, mas não se fundir.

## 16. Documentos compartilhados PE/PN

Teste principal:

- `docs/02-arquitetura/ADR-PLAT-BIZ-001_DOMINIO_COMPARTILHADO_ARQUITETURA_NEGOCIOS_PE_PN.md`

Conclusão:

- documento compartilhado não deve receber múltiplos `parent` por padrão;
- o melhor modelo é um `parent` topológico mais transversal, quando houver hub aprovado;
- vínculos com PE e PN devem aparecer em `related` ou em hubs/capability maps futuros;
- isso evita duplicação de pertencimento e mantém uma única órbita principal.

## 17. Precedência

Teste da ordem aprovada nas fases anteriores:

1. `supersedes` resolve substituição explícita quando houver.
2. `governed_by` pode resolver autoridade explícita se o campo for adotado no futuro.
3. `domain` + `type` + `canonicality` ajudam a reduzir falsos conflitos.
4. `status` ajuda a distinguir `active`, `draft` e `historical`.
5. `parent` ajuda a separar órbitas topológicas, mas não resolve autoridade sozinho.

Conclusão:

- a precedência mínima pode ser operacionalizada sem banco central;
- o conjunto mais promissor é `supersedes` + possível `governed_by` + metadados de Fase 1;
- `superseded_by` não é necessário para que a ordem funcione.

## 18. Cenários Agentic DX

### Cenário 1

Agente precisa alterar o Application Shell.

Leitura recomendada:

- contrato transversal;
- guardrail;
- ADR relacionado;
- relatório histórico apenas como evidência.

Como o modelo ajuda:

- `domain` separa shell de metodologia;
- `canonicality` diferencia norma de apoio;
- `status: historical` impede que relatório concorra com contrato;
- `related` encurta a travessia lateral.

### Cenário 2

Agente trabalha em Planejamento Estratégico.

Leitura recomendada:

- definição canônica futura da capacidade;
- documentação do módulo SK-PE;
- requisito metodológico;
- ADR compartilhado PE/PN.

Como o modelo ajuda:

- evita colapsar capacidade e módulo;
- permite ligar requisito e ADR por `related`;
- prepara um futuro `parent` para hubs sem inventar `vertical`.

### Cenário 3

Agente encontra documento `historical`.

Como o modelo ajuda:

- `status: historical` indica que o documento não é a rota normativa principal;
- `supersedes` futuro poderá apontar substituição explícita;
- ausência de `supersedes` não autoriza inferir que existe sucessor.

### Cenário 4

Agente encontra dois documentos `canonical`.

Como o modelo ajuda:

- `domain` e `type` ajudam a verificar se tratam problemas diferentes;
- `parent` futuro ajuda a distinguir órbitas;
- `governed_by` futuro pode mostrar se um governa o outro;
- sem evidência explícita, o modelo continua exigindo decisão humana.

### Cenário 5

Agente encontra `_audit/**`.

Como o modelo ajuda:

- relatório histórico deve permanecer evidência, não regra;
- `canonicality: supporting` e `status: historical` evitam falsa autoridade;
- `related` ou `governed_by` futuro podem aproximar evidência e fonte normativa correspondente sem transformar auditoria em autoridade.

## 19. Modelo mínimo recomendado

Modelo mínimo de relações recomendado para a próxima decisão:

- manter `related` como primeira relação ativa e madura;
- preparar `supersedes` para adoção explícita e pontual;
- preparar `parent` para entrada junto com hubs aprovados;
- manter `governed_by` em avaliação controlada;
- não avançar agora com `depends_on` no corpus normalizado;
- rejeitar `superseded_by` como fonte canônica primária.

## 20. Campos adotados

## ADOPT NOW

- `related`

Justificativa:

- já existe no piloto;
- semântica clara;
- baixo risco de invenção;
- compatível com o padrão raiz.

## 21. Campos condicionais

## CONDITIONAL

- `parent`
- `governed_by`
- `supersedes`

Justificativa:

- `parent` depende de topologia/hubs aprovados;
- `governed_by` depende de política explícita de autoridade documental;
- `supersedes` depende de declaração humana explícita de substituição.

## 22. Campos deferidos

## DEFER

- `depends_on`

Justificativa:

- uso legado está contaminado por dependência técnica;
- falta regra documental estável e resistente a path.

## 23. Campos rejeitados

## REJECT

- `superseded_by`

Justificativa:

- duplica o inverso de `supersedes`;
- aumenta risco de drift;
- conflita com a ideia de uma única fonte canônica por conceito.

## 24. Registry - necessário ou não

Conclusão:

> Não é necessário criar registry central nesta fase.

O grafo distribuído por frontmatter + links no corpo + hubs seletivos é suficiente, desde que:

- IDs permaneçam estáveis;
- relações canônicas usem IDs;
- hubs não tentem substituir a autoridade dos documentos;
- a próxima fase aprove a aplicação controlada das relações.

Lacuna remanescente:

- sem hub aprovado, `parent` ainda não tem lugar seguro de ancoragem;
- isso não exige registry, apenas decisão topológica.

## 25. Riscos

- forçar `parent` antes da topologia;
- usar `governed_by` como sinônimo genérico de “vale a pena ler”;
- transformar qualquer referência em `depends_on`;
- espelhar relações em dois lados sem mecanismo de consistência;
- inferir supersession por data, pasta ou sensação de atualidade;
- tentar resolver compartilhamento PE/PN com múltiplos `parent`.

## 26. Human Decisions Required

- aprovar se `governed_by` entra ou permanece em espera até F2.1;
- aprovar se `supersedes` será o único campo canônico de supersession;
- aprovar a topologia mínima necessária antes de usar `parent`;
- aprovar onde ficará a futura fonte canônica de `Planejamento Estratégico`;
- aprovar onde ficará a futura fonte canônica do papel do `SK-PE`.

## 27. Recomendação para F2.1

Executar uma decisão curta e controlada com foco em:

- adoção formal de `related`;
- decisão final sobre `parent`;
- decisão final sobre `governed_by`;
- adoção ou não de `supersedes`;
- definição do primeiro hub necessário, sem expansão prematura;
- teste de um caso real de precedência com documento histórico e documento normativo.

## 28. Gate

READY FOR RELATIONSHIP MODEL DECISION
