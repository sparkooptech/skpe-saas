---
id: especificacao-funcional-payload-importacao
title: Especificação Funcional - Payload Completo de Importação
domain: strategic-planning
type: specification
status: active
owner: product
language: pt-BR
encoding: UTF-8
canonicality: working
canonical: false
related:
  - especificacao-funcional-portabilidade-estrategica
  - relatorio-reconciliacao-previa-carga-canonica
criticality: low
---

# Especificação funcional — Payload completo de importação

## Contrato

O payload usa `schema = SPARKS_PE_CANONICAL_IMPORT_PREVIEW` e `schemaVersion = 2.0.0`.

Cada registro possui:

- `sourceSheet`;
- `sourceRow`;
- `entityCode`;
- `externalKey`;
- `fingerprint`;
- `values`.

A chave externa prioriza campos como Código, ID, Elemento, Indicador, Transição e Versão. Quando não há chave funcional, utiliza a linha de origem.

## Segurança

- somente COOTAQUARA;
- nenhuma gravação no banco;
- PMVV como proposta;
- PEM-02.04 bloqueada;
- decisões formais prevalecem sobre resumos desatualizados;
- dados futuros são classificados como proposta, não como avanço autorizado.
