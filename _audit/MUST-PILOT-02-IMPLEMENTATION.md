# MUST PILOT 02 — Implementation

## 1. Estado inicial

- Repositório: `C:\Users\robso\OneDrive\DevKit\skpe-saas`
- Branch: `feature/formulacao-estrategica-operacional`
- HEAD inicial: `d01b11ee58138706afb24c89fd9e7e7b481348be`
- `git status -sb` inicial: apenas `?? _audit/`
- `git diff --stat` inicial: sem diff de código
- `package-lock.json`: sem alteração inicial e sem alteração final

## 2. Arquivos analisados

- `apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.tsx`
- `apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.css`
- `apps/web/src/modules/skpe/SkpeCockpit.tsx`
- `apps/web/src/modules/skpe/SkpeCockpit.css`
- `apps/web/src/modules/skpe/app/SkpeWorkspace.tsx`
- `apps/web/src/components/application-shell/ApplicationShell.tsx`
- `apps/web/src/components/application-shell/ApplicationShell.css`
- `apps/web/src/responsive.css`
- `apps/web/src/responsive-stabilization.css`
- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
- `_audit/MUST-PILOT-02-TYPOGRAPHY-PROTOTYPE-LAB.md`
- Prototype Lab em `projetos/docs/ecosystem/frontend-experience/mockups/dashboards/skpe-methodology-artifacts-prototype-lab`

## 3. Drift encontrado

### Estrutural

- `FACT`: `ApplicationShell` já era o owner correto de viewport e scroll principal quando usado. Evidência: [ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:231).
- `FACT`: `MethodologyArtifactsSection` ainda era renderizada no caminho legado `skpe-shell > skpe-main`, não no shell transversal. Evidência: [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:6040).
- `FACT`: o legado `skpe-shell` recriava viewport próprio com `height: 100vh` / `100dvh`, `overflow: hidden` e `skpe-main` com `overflow-y: auto`. Evidência: [SkpeCockpit.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.css:3598).

### Scroll ownership

- `FACT`: o botão “voltar ao topo” acionava múltiplos owners em cascata: `document.scrollingElement`, `document.documentElement`, `document.body`, `window`, `.application-shell-content` e `.skpe-main`. Evidência anterior e mantida no diagnóstico: `scrollToPageTop` em `SkpeCockpit`.
- `INFERENCE`: isso era o drift principal de ownership para o piloto 02.

### Tipografia

- `FACT`: a família real do app continua `Manrope + Inter`, sem Montserrat. Evidência: [main.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/main.tsx:4), [App.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/App.css:1).
- `FACT`: havia pesos altos e labels comprimidas na superfície de artifacts e no contexto do shell. Evidências: [ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:95), [MethodologyArtifactsSection.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.css:1).

## 4. Alterações realizadas

### Código

- `SkpeCockpit.tsx`
  - passei `artifacts` a usar o mesmo caminho estrutural do `ApplicationShell` já homologado para `overview`
  - limitei o `scrollToPageTop` a um único owner por vez, priorizando:
    - `.application-shell-content` para superfícies hospedadas pelo shell
    - `.skpe-main` para o caminho legado
    - `window` como fallback

- `ApplicationShell.css`
  - adicionei `.application-shell-page-fluid` para permitir superfícies densas sem dupla camada de padding estrutural
  - fiz ajuste tipográfico leve em labels de contexto e navegação

- `MethodologyArtifactsSection.css`
  - reduzi peso e tracking em labels e botões
  - aumentei levemente legibilidade de badges/status
  - mantive família tipográfica e estrutura visual

### Governança

- `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
  - versão atualizada para `1.0.2`
  - acrescentei regras mínimas comprovadas sobre:
    - superfícies densas herdarem scroll principal do `ApplicationShell`
    - scroll local legítimo não competir com scroll estrutural
    - preferir Prototype Lab para `VISUAL DISCOVERY`
    - `Prototype != production implementation`

## 5. Viewport ownership

- `A. ApplicationShell continua owner do viewport?`
  - `SIM`
- `FACT`: no piloto 02, `MethodologyArtifactsSection` passa a ser hospedada pelo mesmo `ApplicationShell` já usado em `overview`. Evidência: [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5520).
- `FACT`: o caminho legado `skpe-shell` deixa de ser o host estrutural da superfície `artifacts` quando `renderOverviewShell` está disponível.

## 6. Scroll ownership

- `B. application-shell-content é o owner do scroll principal?`
  - `SIM`
- `FACT`: para `artifacts`, o owner principal volta a ser `.application-shell-content`, definido pelo shell transversal. Evidência: [ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:231).
- `FACT`: o botão de scroll-top agora resolve um owner único em vez de disparar vários concorrentes. Evidência: [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5350).
- `D. Existem nested scrolls indevidos?`
  - `NÃO` para a superfície `artifacts` dentro do piloto atual
  - `SIM` continuam existindo scroll owners legados em outras superfícies ainda não migradas, mas isso fica fora do escopo desta execução

## 7. MethodologyArtifactsSection

- `C. MethodologyArtifactsSection recria viewport?`
  - `NÃO`
- `FACT`: a superfície não define `100vh`, `100dvh` nem recria shell próprio; ela continua como conteúdo de módulo com scrolls locais específicos. Evidências: [MethodologyArtifactsSection.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.tsx:322), [MethodologyArtifactsSection.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.css:1).
- `FACT`: a semântica SK-PE permaneceu no módulo, sem vazamento para `ApplicationShell`.

## 8. Overlays

- `E. Scroll local de tabela/drawer/modal continua correto?`
  - `SIM`
- `FACT`: tabela larga continua com `overflow:auto` local em `.skpe-artifacts-table-wrap`.
- `FACT`: drawer continua com painel lateral próprio e `overflow:auto`.
- `FACT`: modais continuam com `max-height:92vh` e `overflow:auto`.
- `INFERENCE`: os overlays foram preservados com ajustes mínimos e sem criação de primitive transversal nova.

## 9. Typography tune

- `F. Houve mudança tipográfica?`
  - `SIM`
- `G. Se houve, quais parâmetros mudaram?`
  - `font-weight`
  - `font-size`
  - `line-height`
  - `letter-spacing`
- `H. Família tipográfica foi preservada?`
  - `SIM`

### Ajustes aplicados

- `ApplicationShell.css`
  - labels de contexto: `0.68rem -> 0.72rem`
  - `font-weight: 750 -> 700`
  - `letter-spacing: 0.04em -> 0.03em`
  - navegação: `font-weight: 720 -> 700`

- `MethodologyArtifactsSection.css`
  - eyebrow: `0.78rem -> 0.8rem`
  - `letter-spacing: .12em -> .08em`
  - `font-weight: 800 -> 700`
  - tabs e botões principais/secundários: `800 -> 700`
  - status/context chips: `0.75rem -> 0.78rem`, com peso `700`
  - cópia e blocos de leitura ganharam `line-height` mais estável

### Limite deliberado

- não houve troca de família
- não houve introdução de `Source Sans 3`
- não houve nova dependência

## 10. Prototype Lab → decisões aplicadas

- `J. O Prototype Lab se mostrou útil para decisão?`
  - `SIM`

Uso real nesta implementação:

- confirmar que a superfície poderia operar sob shell transversal
- sustentar tuning leve de densidade tipográfica
- validar que a decisão correta era arquitetural e não de redesign amplo

Não foi copiado HTML/CSS do protótipo para produção.

## 11. Responsividade

### Verificação estática

- `1440x900`: caminho estrutural adequado para shell + superfície densa
- `1280x800`: sem evidência estática de overflow estrutural novo
- `1024x768`: tabela continua com scroll local previsto
- `768x1024`: sidebar do shell continua podendo colapsar/abrir sem exigir novo viewport
- `390x844`: drawer/modal seguem contidos por regras móveis já existentes

### Runtime

- `AUTOMATED RUNTIME`: `BLOCKED BY ENVIRONMENT`
- Motivo: não havia backend de navegador interativo disponível nesta sessão para validar visualmente a execução real.
- Não foram inventadas evidências automatizadas.

## 12. Build/lint

- `npm run build`: `PASS`
- `npm run lint`: `PASS WITH PRE-EXISTING WARNINGS`

### Warnings de lint

Os warnings emitidos são preexistentes e fora do escopo do MUST PILOT 02. Entre eles:

- hooks com dependências ausentes em `App.tsx`, `JourneySection.tsx`, `PortabilityAdmin.tsx`, `PlatformAdmin.tsx`, `SkpeCockpit.tsx`
- warning de `only-export-components` em `SkpeWorkspaceContext.tsx`
- warning já existente em `MethodologyArtifactsSection.tsx` sobre dependência de `loadAll`

Nenhum erro novo foi introduzido por esta implementação.

## 13. Diff

- `git diff --stat`
  - `4 files changed, 77 insertions(+), 36 deletions(-)`
- Arquivos alterados:
  - `apps/web/src/components/application-shell/ApplicationShell.css`
  - `apps/web/src/modules/skpe/SkpeCockpit.tsx`
  - `apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.css`
  - `docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md`
- `git diff --check`: `PASS`
  - observação: apareceram apenas warnings de conversão `LF -> CRLF`, sem erro de diff

## 14. Guardrail atualizado

- `SIM`
- Arquivo: [AGENT_EXECUTION_GUARDRAILS.md](C:/Users/robso/OneDrive/DevKit/skpe-saas/docs/00-governanca/AGENT_EXECUTION_GUARDRAILS.md:1)
- Versionamento: `1.0.2`
- Escopo do update: mínimo e diretamente comprovado por esta etapa

## 15. Documentação transversal atualizada

- `NÃO` houve nova alteração no repositório transversal `projetos` nesta execução.
- `SIM` foram preservados:
  - o Prototype Lab existente
  - o ajuste anterior em `mockups/README.md`

Decisão desta etapa:

- como o aprendizado novo já foi canonizado no guardrail do repositório da aplicação, não foi necessário ampliar a documentação transversal além do que já existia.

## 16. Limitações

- Journey, PlatformAdmin e demais superfícies legadas não foram migradas nesta rodada
- ainda existem owners legados de scroll no caminho `skpe-shell/skpe-main` para seções fora do piloto
- runtime automatizado não pôde ser executado
- não houve revisão ampla dos warnings de lint existentes

## 17. Maturidade Shell/Layout pós-piloto

- `Shell/Layout`: `7.2 / 10`

### Ganhos

- segunda prova controlada do shell transversal concluída
- `MethodologyArtifactsSection` passou a obedecer o owner estrutural correto
- ownership de scroll ficou mais claro e menos concorrente
- tuning tipográfico reduziu rigidez sem trocar identidade

### O que ainda impede `8/10`

- coexistência com shell legado em outras seções do módulo
- ausência de validação runtime automatizada nesta etapa
- overlays ainda são locais, não harmonizados transversalmente
- warnings técnicos preexistentes continuam no frontend

## 18. Veredito

Classificação final do piloto:

`PASS WITH MINOR LIMITATIONS`

### Respostas objetivas

- `A. ApplicationShell continua owner do viewport?`
  - `SIM`
- `B. application-shell-content é o owner do scroll principal?`
  - `SIM`
- `C. MethodologyArtifactsSection recria viewport?`
  - `NÃO`
- `D. Existem nested scrolls indevidos?`
  - `NÃO` no piloto `artifacts`; `SIM` persistem caminhos legados fora do escopo
- `E. Scroll local de tabela/drawer/modal continua correto?`
  - `SIM`
- `F. Houve mudança tipográfica?`
  - `SIM`
- `G. Se houve, quais parâmetros mudaram?`
  - `font-weight`, `font-size`, `line-height`, `letter-spacing`
- `H. Família tipográfica foi preservada?`
  - `SIM`
- `I. Alguma regra de stabilization pôde ser removida?`
  - `NÃO`
- `J. O Prototype Lab se mostrou útil para decisão?`
  - `SIM`

## 19. Recomendação do próximo gate

Próximo gate recomendado:

`RUNTIME VALIDATION GATE — MUST PILOT 02`

Foco do próximo gate:

1. validar em runtime real os 5 viewports FES
2. verificar visualmente:
   - scroll principal em `application-shell-content`
   - ausência de overflow estrutural
   - tabela com overflow local
   - drawer e modal contidos
3. decidir se o mesmo padrão deve ser repetido em outra superfície densa ou se ainda há ajuste fino em `artifacts`
