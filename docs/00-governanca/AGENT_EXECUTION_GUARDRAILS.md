---
id: sparks-agent-execution-guardrails
title: Guardrails de Execução — Plataforma SPARKs
domain: governance
type: policy
status: active
owner: governance
language: pt-BR
encoding: UTF-8
canonicality: canonical
canonical: true
version: 1.0.2
updated: 2026-08-15
---

# Guardrails de Execução — Plataforma SPARKs

Este documento é de leitura obrigatória antes da geração de qualquer código, script PowerShell ou alteração automatizada neste repositório.

## Regras essenciais

1. Trate `skpe-saas` como o embrião da **Plataforma SPARKs**, e não como uma aplicação isolada do SK-PE.

2. O **SK-PE — Planejamento Estratégico** é o primeiro módulo operacional da Plataforma. Soluções transversais devem permanecer reutilizáveis por futuros módulos.

3. Preserve as decisões arquiteturais, semânticas e de governança já existentes no repositório e em `docs`.

4. Antes de criar nova arquitetura, shell, camada, padrão ou abstração, verifique se já existe solução equivalente.

5. Preserve a separação entre:
   - Plataforma;
   - módulos;
   - domínio/regras de negócio;
   - frontend/apresentação;
   - backend/aplicação/API;
   - dados/infraestrutura.

6. `ApplicationShell` é a fundação transversal de shell da Plataforma SPARKs. Semântica específica do SK-PE não deve ser incorporada ao shell transversal.

7. No SK-PE, a composição do shell deve permanecer na fronteira de aplicação/workspace, atualmente `SkpeWorkspace`, e não ser transferida para componentes de domínio como `SkpeCockpit`.

8. Não iniciar Design System, refatorações amplas ou novas camadas arquiteturais sem demanda explícita.

9. Antes de alterar código:
   - leia os arquivos envolvidos;
   - verifique o estado atual;
   - preserve mudanças legítimas existentes;
   - altere somente o necessário.

10. Não utilizar automaticamente:
    - `git reset`;
    - `git clean`;
    - `git stash`;
    - `git rebase`.

11. Commit, push ou abertura de PR somente quando a tarefa solicitar explicitamente.

12. Após alterações de código, execute as validações existentes e pertinentes do projeto, especialmente build e lint.

13. Não alterar dependências ou `package-lock.json` sem necessidade funcional real.

14. Se uma demanda conflitar com decisão arquitetural existente ou exigir expansão relevante de escopo, não improvise. Sinalize a necessidade de decisão.

15. Ao gerar um PS1 para implementação:
    - entregue o script completo;
    - torne-o executável e defensivo;
    - preserve o estado válido do repositório;
    - evite alterações desnecessárias;
    - não dependa de edição manual posterior de arquivos pelo usuário.

## Padrão vigente de Shell e Layout

1. `ApplicationShell` é o shell transversal oficial da Plataforma SPARKs.

2. Nenhum novo módulo, página ou componente deve criar shell global concorrente.

3. No SK-PE, a composição do `ApplicationShell` deve ocorrer na fronteira de aplicação/workspace, atualmente em `SkpeWorkspace`.

4. `SkpeCockpit` e demais componentes de domínio não devem assumir novamente a responsabilidade de:
   - montar o shell global;
   - possuir o viewport da aplicação;
   - possuir o scroll principal;
   - definir navegação global da Plataforma.

5. O `ApplicationShell` deve permanecer agnóstico ao domínio e não deve conter semântica específica de:
   - Formulação Estratégica;
   - Jornada Estratégica;
   - Objetivos Estratégicos — OKRs;
   - Resultados-Chave;
   - Iniciativas;
   - Artefatos metodológicos;
   - demais conceitos específicos do SK-PE.

6. A navegação deve respeitar esta separação:

   Plataforma SPARKs
   → navegação global / organização / usuário / módulo atual

   Módulo SK-PE
   → navegação interna / rotas / contextos / funcionalidades específicas

7. O conteúdo principal deve utilizar o owner de scroll fornecido pelo shell. Páginas internas não devem recriar viewport global com `100vh`, `100dvh` ou equivalente quando isso competir com o shell.

8. Conteúdo largo deve resolver overflow localmente, sem criar novo scroll horizontal estrutural da aplicação.

9. A adoção do `ApplicationShell` nas superfícies existentes será incremental. Não realizar migração ampla sem demanda explícita.

10. Novos módulos da Plataforma, como SK-PN, SK-PCM e SK-JUR, devem poder utilizar o mesmo `ApplicationShell` sem necessidade de incorporar regras específicas do SK-PE.

11. Antes de criar qualquer novo padrão de shell, navegação global, viewport ou scroll estrutural, verificar obrigatoriamente se a necessidade já é atendida pelo `ApplicationShell`.

12. Não reintroduzir composição estrutural do shell no `SkpeCockpit`.

## Princípio operacional

> Ler o estado atual → identificar o padrão canônico vigente → preservar o que já está correto → corrigir apenas o drift → não criar padrão concorrente.
