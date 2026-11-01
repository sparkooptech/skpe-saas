# ADR — Arquitetura SPARKs: Plataforma, Módulos Metodológicos e Gestão Tática

**Data:** 20/10/2026
**Status:** Aprovado arquiteturalmente
**Escopo:** Plataforma SPARKs, SK-DA, SK-PE, SK-PN e futuras capacidades integradas

## 1. Decisão central

A Plataforma SPARKs adota quatro camadas conceituais complementares:

1. **Plataforma / Transversal** — objetos que existem independentemente dos módulos.
2. **Serviços Transversais** — motores reutilizáveis por diferentes módulos.
3. **Módulos Metodológicos** — semântica e método próprios de PE, DA, PN, BPM, JUR etc.
4. **Gestão Tática / Operacional** — execução organizacional por meio de Iniciativas.

## 2. Regra de pertencimento

Um objeto é transversal quando mantém sentido para a organização mesmo com todos os módulos desligados.

Exemplos:
- organização;
- pessoa;
- usuário;
- vínculo;
- área;
- documento/evidência física;
- arquivo e versão;
- indicador cadastral;
- auditoria;
- iniciativa.

O módulo guarda o significado metodológico, a interpretação e a correlação daquele objeto.

Exemplos:
- documento = transversal;
- análise do documento para uma questão do DA = SK-DA;
- relação de uma evidência com um OE = SK-PE;
- interpretação jurídica de um documento = SK-JUR.

## 3. Evidências

O objeto físico/documental é transversal e deve existir uma única vez.

O SK-DA mantém sua própria correlação metodológica em `skda_evidence_correlations`, incluindo:
- alvo metodológico;
- finalidade de uso;
- relevância;
- adequação;
- suficiência;
- confiabilidade;
- interpretação do analista;
- validação.

Não duplicar o arquivo ou os metadados documentais no domínio do módulo.

## 4. Jornada

A capacidade de executar jornadas é transversal.

Cada módulo possui seus próprios templates e semântica de Jornada:
- Jornada SK-PE;
- Jornada SK-DA;
- Jornada SK-PN;
- outras futuras.

O motor é compartilhado; a metodologia pertence ao módulo.

## 5. Diagnóstico Assistido

O objeto metodológico principal do SK-DA é o **Diagnóstico**, não Projeto.

Modelo:
- `skda_diagnoses`;
- `skda_questions`;
- `skda_responses`;
- `skda_interviews`;
- `skda_evidence_correlations`;
- `skda_findings`.

Não criar `skda_projects` como eixo do módulo.

Quando um Diagnóstico precisar ser operacionalizado por um projeto, ele se vincula à Gestão Tática por uma Iniciativa com `initiative_class = 'project'`.

## 6. Gestão Tática / Operacional

O objeto central é `sparks_initiatives`.

Uma Iniciativa pode assumir tipos já suportados pelo modelo, entre eles:
- `project`;
- `process`;
- `sprint`;
- `task`;
- demais classes vigentes.

Projeto é um tipo de Iniciativa, não uma entidade superior à Iniciativa.

## 7. Tipo versus modelo de execução

Separar:
- **o que a iniciativa é**: `initiative_class`;
- **como ela é gerenciada**: perfil de execução.

Tabela transversal:
`sparks_initiative_execution_profiles`

Modelos principais inicialmente previstos:
- `project_management`;
- `sipoc`;
- `sprint`;
- `task`;
- `custom`.

Capacidades adicionais podem ser habilitadas por perfil, por exemplo:
- Kanban;
- PDCA;
- 5W2H;
- riscos;
- cronograma;
- custos;
- benefícios;
- backlog;
- marcos.

## 8. Fato gerador

Uma Iniciativa pode possuir múltiplos fatos geradores.

Tabela transversal:
`sparks_initiative_origins`

Cada origem pode registrar:
- módulo de origem;
- entidade de origem;
- referência de origem;
- tipo de gatilho;
- impacto;
- peso de contribuição;
- origem primária;
- justificativa.

Isso permite rastrear cadeias como:

DA: Questão → Lacuna → Recomendação → Iniciativa
PE: OE → OKR → KR → Iniciativa
BPM: Processo → Problema → Melhoria → Iniciativa
JUR: Norma/Risco → Obrigação → Iniciativa

Uma mesma Iniciativa pode atender simultaneamente fatos geradores de diferentes módulos.

## 9. Gestão por impacto e origem

A Gestão Tática deve permitir filtros e priorização por:
- organização;
- módulo de origem;
- tipo de fato gerador;
- classe de iniciativa;
- modelo de execução;
- impacto estratégico;
- criticidade;
- peso;
- risco;
- responsável;
- status;
- prazo.

O objetivo é preservar não apenas **o que está sendo executado**, mas também **por que está sendo executado**.

## 10. Relação com PE, DA e PN

PE, DA e PN não devem possuir sistemas independentes de projetos/tarefas.

Eles geram fatos geradores e, quando necessário, convertem decisões em Iniciativas da camada tática.

A camada tática é compartilhada e pode receber iniciativas originadas de qualquer módulo.

## 11. Diretriz Hostinger

Toda nova capacidade deve nascer **Hostinger-first**.

Não criar nova dependência do Supabase Cloud.

Durante a transição:
- PostgreSQL/PostgREST de negócio → Hostinger;
- Auth/Storage/Functions ainda podem existir temporariamente atrás do gateway;
- nenhuma nova função do DA deve gravar diretamente no banco Supabase Cloud.

## 12. Regra de evolução arquitetural

Sempre que surgir uma melhoria que:
- reduza duplicação;
- preserve causalidade;
- aumente reutilização;
- fortaleça rastreabilidade;
- facilite integração entre módulos;
- reduza dependência tecnológica;

ela deve ser apresentada para decisão antes de consolidar uma arquitetura inferior.

A arquitetura do SPARKs é evolutiva, porém governada.
