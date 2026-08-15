---
document_id: SPARKS-AGENT-EXECUTION-GUARDRAILS
version: 1.0.0
status: active
scope: skpe-saas
owner: SPARKOOP
last_updated: 2026-08-15
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

## Princípio operacional

> Entender o estado atual → preservar o que está correto → alterar somente o necessário → validar.
