---
id: sparks-platform-architecture-hub
title: Hub de Arquitetura Transversal da Plataforma SPARKs
domain: architecture
type: hub
status: active
owner: architecture
language: pt-BR
encoding: UTF-8
canonicality: canonical
canonical: true
criticality: high
related:
  - skpe-saas-readme
  - sparks-agent-execution-guardrails
tags:
  - arquitetura
  - plataforma
  - navegacao
---

# Hub de Arquitetura Transversal da Plataforma SPARKs

## Objetivo

Organizar a entrada mínima para decisões, contratos e regras arquiteturais transversais da Plataforma SPARKs sem transformar este hub em documento mestre.

## Fronteira semântica

Pertence a este espaço:

- arquitetura transversal da Plataforma;
- decisões arquiteturais compartilhadas entre módulos;
- contratos estruturais que definem fundações reutilizáveis.

Não pertence a este espaço:

- requisitos metodológicos detalhados do SK-PE;
- relatórios históricos de auditoria;
- detalhes operacionais de implementação que já vivem em documentos especializados.

## Leitura inicial recomendada

1. [[skpe-saas-readme]] para entrada geral no repositório.
2. [[sparks-platform-architecture-hub]] para localizar o espaço arquitetural transversal.
3. [[adr-plat-biz-001]] para a decisão compartilhada PE/PN.
4. [[shell-app-transversal-contract-fe09a03]] para a fundação de shell transversal.
5. [[sparks-agent-execution-guardrails]] quando a tarefa envolver limites governantes de execução e arquitetura.

## Child Links

- [[adr-plat-biz-001]]
- [[shell-app-transversal-contract-fe09a03]]

## Related Links

- [[skpe-saas-readme]]
- [[sparks-agent-execution-guardrails]]

## Progressive Disclosure

- Use este hub para descobrir a órbita arquitetural transversal.
- Use o ADR quando a dúvida envolver arquitetura de negócio compartilhada entre módulos.
- Use o contrato quando a dúvida envolver shell, layout estrutural e fundações reutilizáveis.
- Use o guardrail quando a dúvida envolver regra governante de execução ou limites arquiteturais operacionais.
