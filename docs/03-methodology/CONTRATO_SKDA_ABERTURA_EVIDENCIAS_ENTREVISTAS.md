---
id: SKDA-MET-001
title: Contrato Canônico de Abertura, Evidências, Checklist e Entrevistas do SK-DA
version: 1.2.0
status: canonical
canonical: true
domain: sk-da
owner: SPARKOOP
created_at: 2026-10-28
updated_at: 2026-10-30
dependencies:
  - docs/07-homologacao/SKDA_MATRIZ_EVIDENCIAS_ESPERADAS_QUESTAO_20261028.md
---

# Contrato Canônico de Abertura, Evidências, Checklist e Entrevistas do SK-DA

## 1. Premissa metodológica obrigatória

**A Matriz de Evidências Esperadas por Questão é a fonte-mãe da preparação do Diagnóstico Assistido.**

Nenhum Checklist de Abertura, roteiro/caderno de entrevista, solicitação de evidência ou preparação diagnóstica por questão deve ser produzido de forma independente quando a matriz estiver disponível ou puder ser construída. O trabalho deve partir do delta entre resposta declarada, evidência já disponível, evidência necessária para sustentação e capacidade/evidência necessária para evolução.

Esta premissa é obrigatória para agentes, Skills, automações, artefatos e implementações do SK-DA. Exceções devem ser explicitamente justificadas e não podem virar novo padrão metodológico.

A Matriz de Evidências Esperadas por Questão é a fonte governada da qual devem derivar:

1. Checklist de Evidências do Kit de Abertura;
2. roteiro/caderno de entrevistas;
3. Matriz questão x evidência apresentada;
4. mapa de lacunas e hipóteses;
5. plano posterior de ação e evolução.

Checklist e entrevista não devem ser reconstruídos como artefatos independentes.

## 2. Duas matrizes, dois papéis

**Matriz de Evidências Esperadas**: prescritiva/orientadora. Registra o que sustenta cada alternativa A-D e, quando menor que D, o que pode sustentar a evolução até D.

**Matriz questão x evidência**: diagnóstica. Registra o que a organização efetivamente apresentou, cobertura, suficiência, confiabilidade, lacunas e complementos.

## 3. Dimensões de investigação

Toda questão pode exigir evidências nas dimensões:

- existência;
- institucionalização;
- execução;
- recorrência e abrangência;
- controle e resultados;
- aprendizado e melhoria.

Documento aprovado não comprova execução. Declaração não comprova resultado. Modelo não comprova adoção institucional.

## 4. Delta da resposta

Para cada questão, calcular conceitualmente:

- **delta de sustentação**: lacuna entre a resposta autodeclarada e a evidência necessária para sustentá-la;
- **delta de evolução**: lacuna entre a situação evidenciada e o atendimento pleno D, quando aplicável.

A resposta D autodeclarada não encerra a investigação: vigência, execução, abrangência, resultado e melhoria ainda precisam ser comprovados.

## 5. Regra do Checklist de Abertura

Cada linha do checklist deve representar uma expectativa de evidência e trazer, quando aplicável:

- questão e alternativa autodeclarada;
- dimensão;
- evidência esperada;
- evidência já localizada;
- status DISPONIVEL/AUSENTE/NAO_APLICAVEL;
- validação VALIDADO/A_VALIDAR/DESATUALIZADO;
- responsável;
- período/versão;
- ramo/atividade/contexto;
- autoridade da recomendação;
- finalidade SUSTENTAR_RESPOSTA/EVOLUIR_ATE_D/AMBAS;
- questões adicionais apoiadas;
- limite de suficiência.

Priorizar evidências reutilizáveis em várias questões para reduzir carga sobre a organização.

### 5.1 Descoberta inteligente de evidências em pastas

Quando a organização disponibilizar uma pasta organizada de documentos, o SK-DA deve permitir varredura recursiva como mecanismo de intake progressivo. A estrutura da pasta, o nome do arquivo e, quando tecnicamente possível, o conteúdo do documento podem ser usados para sugerir classificação, questões relacionadas e novas categorias documentais relevantes.

Regras obrigatórias:

- deduplicar arquivos pelo hash do conteúdo antes de criar novos ativos no Core;
- preservar o caminho relativo de origem como metadado de rastreabilidade;
- classificar automaticamente apenas como sugestão, sempre pendente de validação humana;
- permitir que o usuário revise ou altere a categoria sugerida antes da importação;
- associar automaticamente apenas questões com aderência suficiente, sem marcar cobertura ou suficiência como validada;
- reconhecer evidências relevantes mesmo quando não previstas originalmente no checklist;
- tratar saúde econômico-financeira como domínio potencial do eixo Resultados quando houver balanços, DRE/DSP, balancetes, DFC, orçamento, indicadores, liquidez, solvência, margens, sobras, reservas, FATES ou equivalentes;
- não inferir resultado organizacional apenas pela existência de documento financeiro; a análise deve verificar período, série, memória de cálculo, tendência, meta/parâmetro, causas, decisão e efeito quando aplicável;
- arquivos cujo conteúdo não possa ser lido na triagem inicial devem permanecer elegíveis à ingestão e análise posterior, sem falsa classificação de suficiência.

A descoberta automática deve reduzir a carga da cooperativa e ampliar cobertura documental, nunca transformar associação algorítmica em evidência validada.

### 5.2 Artefatos assistidos e iniciativa-base da Jornada

Os artefatos governados do SK-DA não devem abrir vazios quando a Jornada já possuir informações suficientes para compor um rascunho. Ao abrir um artefato ainda sem versão, a aplicação deve pré-preencher conteúdo, resumo da versão e justificativa a partir dos dados governados já existentes, preservando a possibilidade de edição pelo usuário e exigindo validação humana antes de qualquer avanço de estado.

O Termo de Abertura da Jornada deve ser pré-preenchido, no mínimo, com organização, ciclo, escopo, premissas metodológicas, período, carga registrada, liderança, governança, entregas, riscos/premissas e referência à iniciativa transversal que executa a Jornada.

A Jornada DA deve possuir uma iniciativa-base transversal do tipo Projeto, distinta das iniciativas posteriores derivadas de achados e recomendações. Essa iniciativa:

- representa a execução e coordenação da própria Jornada;
- deve permanecer vinculada ao diagnóstico por `execution_initiative_id`;
- deve possuir EAP coerente com as MegaFases MF0..MF10;
- deve aparecer no Plano de Ação como iniciativa-base da Jornada, separada dos Ciclos 1..3;
- não deve ser artificialmente alocada a um Ciclo 1..3, pois esses ciclos representam ações de desenvolvimento derivadas do diagnóstico;
- deve preservar origem SK-DA e rastreabilidade transversal para a Gestão Tática/Operacional.

## 6. Regra das Entrevistas

As seis dimensões funcionam como grade de controle, não como questionário repetitivo.

Para cada questão, o roteiro deve apresentar:

1. enunciado oficial integral e alternativas A-D;
2. resposta autodeclarada e resposta histórica;
3. evidências já localizadas;
4. evidências para sustentar a resposta atual;
5. se menor que D, evidências/capacidades para avançar até D;
6. lacunas abertas por dimensão;
7. pergunta central;
8. perguntas de aprofundamento apenas para lacunas abertas;
9. evidências específicas a solicitar;
10. conexões sistêmicas;
11. saída esperada.

Perguntar por casos recentes e verificáveis: quem, quando, registro, frequência, abrangência, indicador, decisão e efeito.

Não induzir alteração de resposta. Investigar capacidade e evidência.

### 6.1 Planejamento é proposição; execução é factual

O cronograma de entrevistas pode sugerir blocos, eixos e quantidade esperada de questões por encontro, mas não deve fixar rigidamente a execução. O ritmo real depende da profundidade necessária, da disponibilidade e da competência dos participantes, das evidências apresentadas e das lacunas que surgirem durante a conversa.

A execução deve permitir:

- escolher no início do encontro o bloco Governança ou Gestão;
- filtrar e navegar por eixo;
- avançar e retroceder livremente entre questões sem perda de registros;
- retomar uma questão em encontro posterior;
- registrar data efetiva de execução da questão separadamente da data planejada do encontro;
- corrigir posteriormente a data efetiva com rastreabilidade;
- preservar o histórico de registros por encontro, sem sobrescrever falas, evidências ou pendências anteriores;
- tratar a pauta prevista como referência operacional, nunca como restrição metodológica.

A tela de condução deve priorizar a leitura técnica da questão, aproximando-se do caderno de entrevistas: conteúdo oficial e Autoavaliação de um lado; pergunta central, aprofundamentos, evidências esperadas, lacunas e conexões do outro. O registro de campo deve permanecer acessível sem dominar a tela.

### 6.2 Consolidação pós-entrevistas

Quando entrevistas forem conduzidas total ou parcialmente fora do módulo, a aplicação não deve exigir sua reencenação para permitir o fechamento do DA. Deve existir uma esteira de consolidação pós-entrevistas que permita percorrer as questões oficiais, selecionar o encontro de origem, registrar a constatação consolidada, manter separada a resposta da Autoavaliação, definir a alternativa final do DA, classificar a constatação, registrar confiança e fundamentação e preservar a rastreabilidade.

O modo de consolidação deve:

- trabalhar sobre as mesmas 70 questões oficiais do catálogo vigente, sem criar instrumento paralelo;
- oferecer filtros por Governança/Gestão, eixo/critério e situação da avaliação;
- permitir salvar rascunho e avançar para a próxima questão;
- permitir salvar e validar uma questão na mesma operação quando o usuário possuir competência de validação;
- manter o modo detalhado disponível para revisão de evidências, hipóteses e auditoria;
- permitir ratificação explícita dos encontros realizados a partir da agenda registrada, preservando a possibilidade de correção posterior;
- considerar a fase diagnóstica concluível somente quando todas as questões aplicáveis estiverem avaliadas e validadas por usuário autorizado;
- nunca transformar a alternativa declarada na Autoavaliação em alternativa validada do DA sem ação humana explícita.

## 7. Saídas por questão

Registrar uma ou mais:

- evidência identificada;
- evidência a disponibilizar;
- prática sem formalização;
- documento sem evidência de execução;
- execução sem indicador/resultado;
- evidência parcial/insuficiente;
- contradição entre declaração e evidência;
- lacuna para plano de ação;
- relato a validar;
- não aplicável com justificativa;
- não avaliada por falta de informação/tempo.

A entrevista não atribui nota definitiva. A consolidação de suficiência ocorre após reunião e triangulação das fontes.

## 8. Questões de resultados

Quando o instrumento exigir resultados, buscar conforme aplicável:

- série histórica exigida;
- fórmula/memória de cálculo;
- fonte;
- responsável;
- baseline;
- meta/faixa/nível aceitável;
- tendência;
- análise de desvios/causas;
- decisão;
- efeito posterior.

Relatório isolado não substitui série, memória e análise quando a questão exigir evolução temporal.

## 9. Contexto, ramo e atividade

As expectativas podem ser especializadas por ramo, atividade, processo e contexto organizacional.

Cada item deve indicar autoridade: official, canonical, sparkoop, benchmark ou inference.

Recomendação SPARKOOP, benchmark ou inferência nunca deve ser apresentada como requisito oficial.

## 10. Regra para Agentes e Skills

Agentes, Skills e automações do SK-DA devem:

- usar este contrato antes de gerar checklist ou entrevista;
- derivar perguntas das lacunas da matriz;
- reutilizar evidências entre questões com limite de suficiência explícito;
- marcar CURADORIA_PENDENTE quando não houver base governada;
- nunca inventar evidência oficial;
- preservar rastreabilidade questão -> prática -> fala/transcrição -> evidência -> validação -> melhoria/plano de ação.
