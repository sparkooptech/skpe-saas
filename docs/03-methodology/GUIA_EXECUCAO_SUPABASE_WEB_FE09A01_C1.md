---
id: guia-execucao-supabase-web-fe09a01-c1
title: Guia de Execução no Supabase Web - FE-09.A.01-C1
domain: methodology
type: guide
status: historical
owner: methodology
language: pt-BR
encoding: UTF-8
canonicality: supporting
canonical: false
related:
  - sparks-agent-execution-guardrails
  - req-skpe-fe-010
criticality: medium
---

# Guia de Execução no Supabase Web — FE-09.A.01-C1

## Enquadramento

Este guia é preservado como contexto técnico e histórico de uma execução específica.

Ele não autoriza assumir projeto, banco, ambiente, script auxiliar ou estado atual sem validação prévia do contexto vigente. Também não redefine regras de execução Git, que permanecem governadas exclusivamente por `sparks-agent-execution-guardrails`.

## Ordem obrigatória

1. Abra o SQL Editor do projeto `skpe-saas-dev`.
2. Execute integralmente `supabase/migrations/20260731123000_localize_ui_catalog_capabilities_and_guardrails.sql`.
3. Execute `supabase/verification/verificar_fe09a01_c1_localizacao_capacidades.sql`.
4. Confirme que `descricoes_suspeitas_em_ingles = 0` ou analise cada exceção antes de continuar.
5. Execute `scripts/fe09a01-c1/CORRECAO_CONTROLADA_JORNADA_COOTAQUARA.sql`.
6. Recarregue a aplicação com `Ctrl+F5`.

## Resultados esperados

- perfil Visualizador sem Administração do SK-PE no menu;
- acesso direto à seção administrativa redirecionado para Visão Geral;
- rótulos de perfis, situações e eventos em Português do Brasil;
- Governança e Macrofase 1 da COOTAQUARA concluídas e validadas;
- Macrofase 2 em andamento, etapa atual PEM-02.03;
- Kit de Entregas disponível em Artefatos e evidências;
- tabelas e painéis sem truncamento silencioso, com rolagem horizontal quando necessária.

## Regra de integridade

O script da COOTAQUARA não marca a prontidão dos artefatos como atendida sem documentos reais. O cadastro dos artefatos canônicos deverá ser tratado por importação controlada ou registro das versões correspondentes.
