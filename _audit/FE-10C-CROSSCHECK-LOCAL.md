# FE-10C - Crosscheck Local Experiência Sparkoop × skpe-saas

## 1. Estado do repositório

- Path auditado: `C:\Users\robso\OneDrive\DevKit\skpe-saas`
- Git root: `C:/Users/robso/OneDrive/DevKit/skpe-saas`
- Remote: `origin https://github.com/sparkooptech/skpe-saas.git`
- Branch atual: `feature/formulacao-estrategica-operacional`
- HEAD: `4da31f5680293551d924c8ab3633af8cb2f6d547`
- `origin/HEAD`: `refs/remotes/origin/feature/formulacao-estrategica-operacional`
- `origin/main`: `f32a47612af8d209b96f542d808b73ee3b020401`
- `git status -sb`: checkout limpo
- Arquivos modificados: nenhum
- Arquivos não rastreados: nenhum
- Modo de execução: READ-ONLY
- Fonte transversal acessível: `C:\Users\robso\OneDrive\DevKit\projetos\docs`

Leitura operacional:

- O repositório estava seguro para investigação.
- `origin/HEAD` não aponta para `main`; ele aponta para a branch de trabalho atual. Isso não bloqueia a auditoria, mas reduz a clareza de baseline.

## 2. Documentação transversal lida

- `C:\Users\robso\OneDrive\DevKit\projetos\docs\EXPERIENCIA_SPARKOOP.md`
- `C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\frontend-experience\README.md`
- `C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\frontend-experience\agentic-entry.md`
- `C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\architecture\frontend-experience-standard.md`
- `C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\frontend-experience\07-golden-patterns.md`
- `C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\frontend-experience\09-maturity-baseline.md`
- `C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\frontend-experience\13-next-phase-compliance-baseline.md`
- `C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\frontend-experience\compliance\baseline-v0.1.md`

Leitura transversal relevante:

- `EXPERIENCIA_SPARKOOP.md` confirma que a fonte canônica permanece em `docs/ecosystem/frontend-experience/` e que a descoberta deve ser proporcional ao risco.
- `agentic-entry.md` classifica este trabalho como `DISCOVERY`, não `DIRECT`, porque há decisões relevantes de shell, layout e governança ainda abertas.
- O FES é a norma transversal aplicável.
- O baseline de compliance anterior é útil como apoio interpretativo, mas não como prova de conformidade do `skpe-saas`.

## 3. Documentação local FE-09.A lida

### TRANSVERSAL ou CONSISTENT WITH TRANSVERSAL

- `docs/03-methodology/CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`
  - Alinhado ao FES em shell, contexto, scroll owner e estratégia mobile.
  - Classificação: `CANDIDATE FOR TRANSVERSAL`
- `docs/03-methodology/CONTRATO_FUNDACAO_RESPONSIVA_TIPOGRAFICA_FE09A02_2.md`
  - Regras base úteis para largura, legibilidade, controles e tabelas largas.
  - Classificação: `CANDIDATE FOR TRANSVERSAL`
- `docs/03-methodology/ARQUITETURA_INFORMACAO_E_NAVEGACAO_FE09A.md`
  - Boa separação entre workspace, SK-PE, monitoramento, governança e administração.
  - Classificação: `PRODUCT-SPECIFIC` com partes `CANDIDATE FOR TRANSVERSAL`
- `docs/03-methodology/MATRIZ_ROTAS_CONTEXTO_FE09A.md`
  - Forte em rotas explícitas e contexto visível.
  - Classificação: `PRODUCT-SPECIFIC` e `CONSISTENT WITH TRANSVERSAL`
- `docs/03-methodology/PLANO_REFATORACAO_INCREMENTAL_FE09A.md`
  - Roadmap incremental coerente com adoção segura do shell e extração do cockpit.
  - Classificação: `PRODUCT-SPECIFIC`

### DRIFT ou OBSOLETE parcial

- `docs/03-methodology/MAPA_COMPONENTES_FRONTEND_FE09A.md`
  - A arquitetura proposta inclui `api/`, `shared/components/`, `SkpeWorkspaceLayout.tsx` e outras extrações que ainda não existem na implementação real.
  - Classificação: `DRIFT`
- `docs/03-methodology/RELATORIO_CONSOLIDADO_FE09A_A7_HARDENING.md`
  - Registra build, lint e validações manuais aprovadas em fase anterior, mas o checkout atual não possui `node_modules`, então essa evidência não é reproduzível localmente nesta execução.
  - Classificação: `OBSOLETE` como prova local imediata; `PRODUCT-SPECIFIC` como histórico

### ADRs relevantes

- `docs/00-governanca/ADR-001-supabase-web-como-ambiente-de-desenvolvimento.md`
  - Afeta DX e auditabilidade local, não o shell diretamente.
  - Classificação: `PRODUCT-SPECIFIC`
- `docs/03-methodology/ADR-FE09-A02-B4_AVATAR_TRANSVERSAL_E_MODULO_ASSEMBLEAR.md`
  - Mostra intenção de primitive transversal visual com governança futura.
  - Classificação: `CONSISTENT WITH TRANSVERSAL`

## 4. Regras FES recuperadas

Regras principais aplicáveis a shell, layout, responsividade, navegação, overlays, estados e acessibilidade.

| Regra FES | Resumo | MUST/SHOULD | Arquivo/Linha | Implicação prática |
|---|---|---|---|---|
| `LAY-001` | conteúdo não pode causar overflow estrutural horizontal em `>=1024px` | `MUST` | `frontend-experience-standard.md:137-152` | o shell não pode depender de scroll global para sobreviver |
| `LAY-002` | cada tela deve ter um único dono do scroll principal | `MUST` | `frontend-experience-standard.md:154-169` | precisa haver um owner inequívoco do scroll; páginas internas não devem criar viewport concorrente |
| `LAY-003` | containment antes de densidade; usar `min-w-0` quando necessário | `MUST` / `SHOULD` | `frontend-experience-standard.md:171-188` | sidebars, headers, cards e grids devem suportar compressão sem explodir |
| `LAY-004` | page header deve expor contexto, título, resumo e ação primária | `MUST` | `frontend-experience-standard.md:190-205` | superfícies principais precisam começar com contexto antes da ação |
| `LAY-005` | sidebar precisa de estratégia explícita para tablet/mobile; não pode esmagar conteúdo | `MUST` / `MUST NOT` | `frontend-experience-standard.md:207-224` | collapse, drawer ou modo temporário são obrigatórios |
| `RSP-001` | toda superfície deve declarar se é responsive, adaptive ou híbrida | `MUST` | `frontend-experience-standard.md:241-256` | docs e implementação precisam mostrar intenção, não apenas “não quebrou” |
| `RSP-002` | usar os cinco viewports oficiais | `MUST` | `frontend-experience-standard.md:258-273` | 1440x900, 1280x800, 1024x768, 768x1024 e 390x844 são baseline mínimo |
| `RSP-003` | em `390x844`, a tarefa principal deve continuar executável | `MUST` | `frontend-experience-standard.md:275-290` | mobile não pode ser apenas degradação passiva |
| `RSP-004` | dialogs, sheets e drawers devem respeitar viewport e ter scroll interno | `MUST` | `frontend-experience-standard.md:292-307` | overlays precisam de `max-height`, contenção e foco coerente |
| `RSP-005` | master-detail em tablet/mobile tende a exigir adaptação de modo | `SHOULD` | `frontend-experience-standard.md:309-324` | lista + detalhe lado a lado não deve ser simplesmente comprimido |
| `NAV-001` | usuário deve entender onde está e o que pode fazer antes de aprofundar a navegação | `MUST` | `frontend-experience-standard.md:328-343` | headers, breadcrumbs e seletores de contexto são estruturais, não cosméticos |
| `NAV-002` | retorno deve preservar filtros, seleção e posição quando reduzir retrabalho | `MUST` | `frontend-experience-standard.md:345-360` | back/forward e restauração local importam para produtividade |
| `NAV-003` | deep links devem abrir contexto suficiente | `SHOULD` | `frontend-experience-standard.md:362-377` | rota profunda precisa mostrar contexto ao chegar |
| `NAV-004` | não esconder contexto crítico em hardcode invisível ao usuário | `MUST NOT` | `frontend-experience-standard.md:379-394` | organização, projeto, formulação e estado precisam ser visíveis |
| `OVR-001` | overlay deve ser mecanismo estrutural, não improviso local | `MUST` | `frontend-experience-standard.md:644-659` | modais, drawers e sheets devem ser primitives claras e previsíveis |
| `OVR-002` | overlay precisa de semântica, foco e saída previsíveis | `MUST` | `frontend-experience-standard.md:661-678` | `role`, `aria-*`, fechamento e foco precisam ser explícitos |
| `OVR-003` | overlay não pode substituir fluxo principal sem justificativa | `MUST NOT` | `frontend-experience-standard.md:680-695` | detalhes pesados e formulários complexos não devem virar improviso modal por padrão |
| `STA-001` | componentes dependentes de dados devem prever loading, empty, error e retry | `MUST` | `frontend-experience-standard.md:733-748` | shell e superfícies devem sobreviver a estados ruins |
| `A11Y-001` | acessibilidade estrutural é obrigatória | `MUST` | `frontend-experience-standard.md:841-857` | semântica, foco e leitura estrutural não são opcionais |
| `A11Y-003` | dialogs e overlays precisam de semântica acessível completa | `MUST` | `frontend-experience-standard.md:877-893` | `aria-labelledby` e, quando aplicável, descrição acessível, foco e fechamento |
| `A11Y-006` | foco visível e navegabilidade por teclado devem permanecer estáveis | `MUST` | `frontend-experience-standard.md:931-947` | listas interativas e menus precisam operar por teclado |

Leitura cruzada de baseline:

- O baseline transversal anterior já marcou `LAY-005`, `RSP-003`, `OVR-*` e `A11Y-*` como áreas de maior fragilidade sistêmica em outros produtos, então o shell do `skpe-saas` deve ser avaliado com rigor extra.

## 5. ApplicationShell - A/B/C/D

**Classificação: B. pronto com pequenos ajustes**

### Evidência principal

- Estrutura explícita com `header`, `sidebar`, `content` e `footer` em [ApplicationShell.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.tsx:33)
- Viewport e grid do shell em [ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:1)
- Content area como scroll owner em [ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:191)
- Estratégia mobile com drawer e backdrop em [ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:218)

### Leitura arquitetural

- Responsabilidade: boa. O componente é claramente um shell composicional, não um módulo de negócio.
- Composição: boa. Recebe `brand`, `contextItems`, `userArea`, `navigationItems`, `children` e `footer`, o que reduz acoplamento de domínio.
- Header: bom. Já prevê contexto atual e área de usuário.
- Sidebar: boa base. Já prevê colapso e versão mobile temporária.
- Content: bom. Já assume `overflow: auto`, o que casa com `LAY-002`.
- Contexto: suficiente para módulo transversal; não depende de organização específica.
- Navegação: boa base, mas usa apenas botões e `onActivate`; não controla `aria-expanded`, `aria-controls` ou trigger mobile no próprio shell.
- Mobile: razoável. Há drawer/backdrop, mas o acionamento de abertura ainda depende do consumidor.
- Viewport/scroll: forte no componente isolado, com `height: 100vh`, `overflow: hidden` no shell e `overflow: auto` no content.
- Acessibilidade: parcial. Há `aria-current`, `aria-label` e botão de fechar menu, mas o shell não modela sozinho foco de drawer nem relação trigger/painel.
- Dependência de módulo ou organização: baixa.
- Reúso: alto.
- Acoplamentos: baixos dentro do componente; o problema está no ecossistema ainda não usá-lo.

### Pequenos ajustes necessários

- trocar parte da lógica rígida baseada em `100vh` por estratégia `100dvh`/fallback mais uniforme em desktop mobile híbrido;
- introduzir contrato explícito para trigger mobile, `aria-expanded` e `aria-controls`;
- explicitar melhor semântica do nav/sidebar para cenários colapsados e temporários;
- validar foco inicial e retorno de foco quando o drawer fecha.

### Veredito

- O `ApplicationShell` **não precisa de refatoração estrutural antes de virar piloto**.
- O principal gap não é o componente em si; é a **não adoção** dele pelas superfícies principais.

## 6. Viewport / scroll / containment

### Atual

Perguntas objetivas:

- Quem hoje controla o viewport?
  - Não há owner único global consolidado.
  - `App.css` define bases com `#root` e vários blocos com `min-height: 100vh` em [App.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/App.css:20), [App.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/App.css:87) e [App.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/App.css:1486).
  - `SkpeCockpit.css` também define shell próprio com `min-height: 100vh` e sidebar com `height: 100vh` em [SkpeCockpit.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.css:2) e [SkpeCockpit.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.css:9).
  - `ApplicationShell.css` define outro viewport owner potencial em [ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:1).

- Quem deveria controlar?
  - Um shell transversal único, preferencialmente `ApplicationShell`, com uma única content area rolável.

- Quem hoje controla o scroll?
  - No portal/plataforma, parte do scroll ocorre no fluxo normal da página.
  - No SK-PE, há disputa entre `.skpe-shell`, `.skpe-main`, navegação lateral e correções globais em `responsive-stabilization.css`.
  - Em `ApplicationShell`, o owner seria `.application-shell-content`.

- Quem deveria controlar?
  - A content area do shell.
  - Tabelas largas e overlays devem ter scroll local.

- Existem owners concorrentes?
  - Sim.
  - `ApplicationShell.css` assume que o shell controla tudo.
  - `SkpeCockpit.css` constrói outro shell.
  - `responsive-stabilization.css` injeta exceções com `!important` para neutralizar viewports internos do SK-PE em [responsive-stabilization.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/responsive-stabilization.css:329).

- Páginas internas recriam viewport?
  - Sim, especialmente o cockpit SK-PE e alguns painéis/admin side panels.

- Onde há `100vh`, `100dvh`, `min-height:100vh`, `overflow:auto`, `overflow:hidden`?
  - `ApplicationShell.css`: `min-height: 100vh`, `height: 100vh`, `overflow: hidden`, `overflow: auto`, `height: 100dvh`
  - `App.css`: vários `min-height: 100vh`
  - `SkpeCockpit.css`: `min-height: 100vh`, `height: 100vh`
  - `responsive-stabilization.css`: exceções com `height: 100vh !important`, `height: 100dvh !important`, `overflow: hidden !important`
  - `PlatformAdmin.css` e `MethodologyArtifactsSection.css`: overlays e painéis com `position: fixed` e `overflow: auto`

- Onde `min-width:0` / `min-height:0` são necessários?
  - Em shell content, headers, cards e grids comprimíveis.
  - O projeto já espalha isso fortemente em `responsive.css`, `responsive-stabilization.css`, `ApplicationShell.css`, `App.css`, `PlatformAdmin.css` e `SkpeCockpit.css`.

- Existe overflow horizontal estrutural?
  - Não encontrei prova estática de overflow estrutural inevitável no shell.
  - Encontrei forte evidência de **prevenção corretiva extensiva** para evitar esse problema.

- Conteúdo largo está contido localmente?
  - Em boa parte das tabelas, sim.
  - Em `responsive.css`, a estratégia geral é conter tabelas localmente com wrappers em [responsive.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/responsive.css:8).
  - Em artefatos e administração, há wrappers próprios; isso é bom.

### Atual - diagrama textual

```text
html/body/#root
  ->
App.css / App.tsx criam shell do portal
  ->
SK-PE cria shell próprio em SkpeCockpit
  ->
responsive-stabilization corrige conflitos com !important
  ->
overlays criam seus próprios scroll containers

Resultado:
- viewport owner implícito e concorrente
- scroll owner parcialmente disputado
- containment razoável, mas sustentado por estabilização corretiva
```

### Recomendado

```text
html/body/#root
  ->
ApplicationShell transversal
    - header fixo estrutural
    - sidebar estrutural
    - footer estrutural
    - content area = único scroll owner principal
  ->
surface module
    - sem recriar viewport
    - sem overflow estrutural global
    - tabelas largas com wrappers locais
    - overlays com scroll próprio

Resultado:
- viewport owner único
- scroll owner explícito
- containment previsível
- menos necessidade de !important corretivo
```

### Recomendado - pontos práticos

- `ApplicationShell` deve controlar o viewport.
- `application-shell-content` deve controlar o scroll vertical principal.
- superfícies como `SkpeCockpit`, `PlatformAdmin` e `MyWorkspacePage` devem se comportar como **conteúdo do shell**, não como shells paralelos.

## 7. Responsividade

### Classificação de camadas

#### FOUNDATIONAL

- `responsive.css:1-15`
  - reset estrutural útil: `html, body, #root`, `box-sizing`, mídia, wrappers
- `responsive.css:54-186`
  - fundação tipográfica e de largura coerente com `CONTRATO_FUNDACAO_RESPONSIVA_TIPOGRAFICA_FE09A02_2.md`
- `ApplicationShell.css`
  - base boa de grid, drawer e content area

#### INTENTIONAL

- wrappers de tabela e toolbar em `responsive.css`
- collapse para grids menores em `responsive.css`
- adaptação do shell em `ApplicationShell.css` para `max-width: 960px`

#### REMEDIATION

- `responsive-stabilization.css:329-357`
  - neutraliza viewport concorrente do SK-PE para devolver ownership ao shell
- vários blocos com `!important` para topbar, content, heights e overflow em `responsive-stabilization.css`

#### PATCH

- exceções densas para `.topbar`, `.platform-content`, `.skpe-shell` e outras superfícies específicas em `responsive-stabilization.css`
- ajustes pontuais em ícones, padding e larguras com `!important`

#### OBSOLETE

- não há bloco inteiramente descartável provado nesta leitura, mas há trechos que só existem para compensar o shell atual e podem desaparecer se o shell transversal for adotado

#### CANDIDATE TO ABSORB INTO SHELL

- regras de viewport owner e scroll owner hoje em `responsive-stabilization.css`
- parte da estratégia mobile da sidebar do SK-PE
- parte da normalização do header/contexto

### Resposta explícita

**A responsividade atual está baseada majoritariamente em fundação coerente ou em estabilizações corretivas acumuladas?**

**Resposta: híbrida, mas com peso já alto de estabilizações corretivas acumuladas nas áreas de shell/layout.**

Leitura:

- existe fundação coerente real em `responsive.css` e no contrato FE-09.A.02.2;
- porém a normalização de shell/viewport/scroll do SK-PE depende fortemente de `responsive-stabilization.css` com exceções e `!important`;
- isso indica que a fundação existe, mas **não venceu completamente a competição entre shells locais**.

## 8. Navegação

### Navegação global da plataforma

- Vive em `App.tsx` com topbar, seleção de organização, módulos e administração.
- Evidência: parsing de rota em `parsePlatformRoute` consumido por `App.tsx`.

### Navegação entre módulos

- Ainda controlada no portal principal em `App.tsx`.
- Boa separação conceitual entre organização e módulo.

### Navegação por organização

- Existe no portal e também reaparece dentro do SK-PE e da administração.
- A organização é visível em vários headers, o que é positivo para `NAV-004`.

### Navegação interna do SK-PE

- É controlada por `SkpeCockpit.tsx`, com menu lateral próprio e troca de seções locais.
- Evidência: navegação lateral em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5414)

### Navegação contextual

- `MyWorkspacePage` é a melhor superfície atual.
- Usa contexto explícito da organização e painel principal, com CTA para abrir áreas específicas.

### Breadcrumb

- Existe como exigência clara em `MATRIZ_ROTAS_CONTEXTO_FE09A.md:57-67`.
- Não encontrei breadcrumb transversal explícito implantado no shell principal.
- Em `JourneySection`, há breadcrumb semântico da jornada, mas não um breadcrumb transversal de app shell.

### Drill-down da Jornada Estratégica

- Existe estrutura hierárquica real em `JourneySection`.
- Boa aderência a navegação de aprofundamento progressivo.

### Leitura de responsabilidades

#### Já bem separadas

- rota explícita SK-PE em `skpeRoutes.ts`
- contexto do workspace em `SkpeWorkspaceContext`
- superfícies `MyWorkspacePage`, `JourneySection` e `MethodologyArtifactsSection` já têm propósito distinto

#### Duplicadas ou misturadas

- shell do portal em `App.tsx`
- shell do SK-PE em `SkpeCockpit.tsx`
- administração da plataforma com navegação própria em `PlatformAdmin.tsx`
- regras responsivas globais e corretivas disputando layout dessas três camadas

#### Drift entre docs e código

- docs de FE-09.A planejam layout do workspace e extração progressiva do cockpit.
- código já extraiu `JourneySection` e `MethodologyArtifactsSection`, mas ainda mantém `SkpeCockpit.tsx` como monólito de 5310 linhas.
- docs de rotas preveem mais rotas explícitas do que a implementação hoje expõe.

## 9. Overlays

### Inventário

- `UserProfileDialog` com `role="dialog"` e `aria-modal="true"` em `components/user-profile/UserProfileDialog.tsx`
- `PlatformAdmin`:
  - painéis laterais e modais com backdrop
  - evidência: `pa-modal-backdrop`, `pa-side-panel`, `role="dialog"` em [PlatformAdmin.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/platform-admin/PlatformAdmin.tsx:3128)
- `MethodologyArtifactsSection`:
  - drawer lateral de detalhe
  - modal de criação
  - modal de nova versão
  - modal de validação
  - evidência: [MethodologyArtifactsSection.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.tsx:361)
- `SkpeCockpit.css` também embute `record-detail-panel` e `skpe-modal-*` como padrões locais

### Avaliação

- Duplicações: sim
  - há pelo menos três famílias de overlay: perfil, administração, cockpit/artefatos
- Scroll ownership: razoável dentro de cada overlay, com `overflow: auto` local
- Viewport containment: geralmente bom; drawers e modais usam `position: fixed` e limites visuais
- Focus semantics: parcial
  - `UserProfileDialog` é o único overlay com semântica de dialog explicitamente confirmada por grep
  - em artefatos há drawers e modais ricos, mas a marcação está mais próxima de overlay customizado do que primitive acessível comprovada
- `aria`: parcial
  - boa presença de `aria-label` e `aria-labelledby`
  - pouca evidência de `aria-describedby`
- Mobile strategy: existe, mas não está transversalizada
- Fechamento: previsível na maioria dos casos, com backdrop e botão fechar
- Padrão transversal: possível, mas ainda não existe

### Veredito de overlays

- Há base suficiente para uma primitive transversal futura.
- Hoje o estado é **PARTIAL**: bom o bastante para pilotar, não bom o bastante para declarar convergência.

## 10. Superfícies de referência

### `MyWorkspacePage`

Classificação: **CANDIDATO A GOLDEN PATTERN**

Justificativa:

- forte em `NAV-001`, `NAV-004`, `LAY-004`, `STA-001`
- contexto claro, painéis orientados por responsabilidade, estados de loading/feedback explícitos
- boa separação entre síntese, favoritos e painéis contextuais
- ainda depende do shell existente, então não é golden pattern de shell; é golden candidate de **workspace contextual**

### `JourneySection`

Classificação: **PRESERVAR COM AJUSTES**

Justificativa:

- boa estrutura hierárquica e semântica de jornada
- bom potencial para drill-down e progressão metodológica
- precisa se beneficiar do shell transversal e de uma estratégia de breadcrumb/contexto mais uniforme
- o trecho auditado mostra estados básicos, mas não prova sozinho excelência em overlays, mobile e acessibilidade profunda

### `MethodologyArtifactsSection`

Classificação: **PRESERVAR COM AJUSTES**

Justificativa:

- é uma das superfícies mais ricas do produto
- mostra grid, tabela, jornada, readiness, audit trail, drawer e modais
- excelente como evidência de domínio e densidade governada
- não deve virar referência shell/layout sem antes consolidar overlay primitive, semântica de dialog e scroll ownership transversal

## 11. Matriz FES × FE-09.A × código

| Regra FES | FE-09.A | Implementação real | Estado | Evidência |
|---|---|---|---|---|
| `LAY-001` | FE-09.A.02.2 exige uso total da largura e tabelas largas com scroll local | wrappers de tabela em `responsive.css` e telas específicas | `PARTIAL` | `responsive.css:8-9`; `MethodologyArtifactsSection.css`; `App.css` wrappers |
| `LAY-002` | contrato do shell exige uma área principal rolável | `ApplicationShell` atende; SK-PE atual disputa ownership com shell próprio e correções | `PARTIAL` | `ApplicationShell.css:191-198`; `responsive-stabilization.css:329-357` |
| `LAY-003` | FE-09.A.02.2 manda usar `min-width:0` em containers flexíveis | uso intenso de `min-width:0` em várias camadas | `PASS` | `responsive.css:2-3`; `ApplicationShell.css`; `App.css`; `PlatformAdmin.css` |
| `LAY-004` | FE-09.A exige cabeçalho persistente com contexto | portal e workspace expõem contexto; breadcrumb transversal ainda incompleto | `PARTIAL` | `ARQUITETURA_INFORMACAO_E_NAVEGACAO_FE09A.md:52-66`; `MyWorkspacePage.tsx:688-739`; `SkpeCockpit.tsx:5652` |
| `LAY-005` | contrato do shell exige drawer em mobile | `ApplicationShell` atende; `SkpeCockpit` usa adaptação própria; base ainda não consolidada | `PARTIAL` | `CONTRATO_SHELL...:32-37`; `ApplicationShell.css:218-267`; `responsive.css:25-42` |
| `RSP-001` | FE-09.A docs declaram intenção responsiva | parte da intenção está documentada, mas a implementação depende de estabilização corretiva | `PARTIAL` | `CONTRATO_FUNDACAO...:5-17`; `responsive.css`; `responsive-stabilization.css` |
| `RSP-003` | mobile deve preservar tarefa principal | há esforço claro para 390px, mas sem prova runtime nesta execução | `PARTIAL` | `RELATORIO_CONSOLIDADO_FE09A_A7_HARDENING.md:53-67`; `responsive.css:40-52` |
| `RSP-004` | overlays devem respeitar viewport e ter scroll interno | drawers/modais geralmente respeitam viewport | `PARTIAL` | `MethodologyArtifactsSection.css`; `PlatformAdmin.css`; `ApplicationShell.css:237-261` |
| `NAV-001` | contexto antes do aprofundamento | workspace e cockpit mostram contexto visível | `PASS` | `ARQUITETURA...:52-78`; `MyWorkspacePage.tsx`; `SkpeCockpit.tsx` |
| `NAV-002` | preservar retrabalho no retorno | FE-09.A hardening afirma back/forward e URL; código usa rota e contexto, mas sem cobertura reproduzível local | `PARTIAL` | `RELATORIO_CONSOLIDADO...:23-38`; `SkpeWorkspace.tsx`; `skpeRoutes.ts` |
| `NAV-003` | deep link com contexto suficiente | docs fortes, implementação parcial | `PARTIAL` | `MATRIZ_ROTAS_CONTEXTO_FE09A.md:12-35`; `skpeRoutes.ts` |
| `NAV-004` | contexto crítico não pode ficar oculto | organização e seção costumam ser visíveis | `PASS` | `MATRIZ_ROTAS_CONTEXTO_FE09A.md:48-55`; `SkpeCockpit.tsx:5652`; `App.tsx:1805` |
| `OVR-001` | overlay como primitive e não improviso | há padrões locais repetidos, não primitive única | `PARTIAL` | `MethodologyArtifactsSection.tsx`; `PlatformAdmin.tsx`; `SkpeCockpit.css` |
| `OVR-002` | overlay com semântica e foco previsíveis | `UserProfileDialog` bom; restante parcial | `PARTIAL` | `UserProfileDialog.tsx:285-303`; overlays customizados sem prova equivalente |
| `STA-001` | loading, empty, error e retry | há loading/empty/error em várias superfícies; retry não é consistente | `PARTIAL` | `MyWorkspacePage.tsx:749-775`; `JourneySection.tsx:773-785`; `MethodologyArtifactsSection.tsx:343-359` |
| `A11Y-003` | dialog com semântica acessível | evidência forte apenas no perfil | `PARTIAL` | `UserProfileDialog.tsx:285-303` |
| `A11Y-006` | foco visível e teclado estáveis | forte uso de `tabIndex`, `role="button"` e handlers de teclado | `PASS` | múltiplos pontos em `App.tsx`, `PlatformAdmin.tsx`, `MethodologyArtifactsSection.tsx`, `MyWorkspacePage.tsx` |

## 12. Scorecard Shell/Layout

| Dimensão | Nota | Leitura curta |
|---|---:|---|
| shell transversal | 5.5 | o componente existe, mas o produto ainda usa shells paralelos |
| viewport ownership | 5.0 | há owners concorrentes e exceções corretivas |
| scroll ownership | 5.5 | o alvo arquitetural é claro, mas ainda não está consolidado |
| containment | 7.0 | forte uso de wrappers, `min-width:0` e prevenção de compressão |
| navegação | 7.0 | boa estrutura geral, com drift pontual entre docs e implementação |
| navegação contextual | 7.5 | workspace e cockpit mostram contexto relevante |
| responsividade | 6.0 | melhor que o histórico médio, mas sustentada em parte por patches |
| mobile | 5.5 | estratégia existe, porém não está transversalizada nem comprovada localmente em runtime |
| overlays | 6.0 | múltiplos padrões razoáveis, ainda sem primitive única |
| acessibilidade do shell | 6.0 | bons sinais estáticos, mas sem validação ampla de foco/descrição em todos os overlays |
| manutenibilidade do shell | 4.5 | `SkpeCockpit.tsx`, `PlatformAdmin.tsx` e `App.tsx` ainda são monólitos grandes |
| alinhamento semântico/docs | 6.0 | boa direção, mas com drift entre mapa proposto e código real |

**MATURIDADE SHELL/LAYOUT ATUAL: 6.0 / 10**

Critério:

- a nota não mede maturidade total da plataforma;
- ela mede a frente específica de shell/layout;
- subi a nota porque há componente transversal real, docs locais fortes e várias superfícies já relativamente organizadas;
- segurei a nota em `6.0` porque viewport/scroll ownership ainda não convergiu.

**MATURIDADE APÓS MUST PILOT: 7.3 / 10**

Critério:

- se o piloto provar `ApplicationShell` em uma superfície real e remover parte das estabilizações corretivas do SK-PE, a frente sobe de funcional para madura;
- o salto vem de ownership explícito, não de redesign amplo.

## 13. MUST PILOT

**Classificação: MUST PILOT**

### Objetivo

Provar um shell transversal único com:

- viewport owner único;
- content area como scroll owner principal;
- sidebar com estratégia mobile explícita;
- header contextual;
- sem recriar viewport dentro da superfície piloto.

### Superfície piloto

**Primária:** `MyWorkspacePage`

Motivos:

- é a melhor superfície contextual atual;
- já tem hierarquia, estados e ações claras;
- tem menor acoplamento visual do que o cockpit inteiro;
- permite provar shell sem bloquear o desenvolvimento estrutural do restante do SK-PE.

### Segunda superfície opcional

**Opcional, não indispensável no primeiro passo:** `MethodologyArtifactsSection`

Motivo:

- é boa para validar conteúdo denso, tabela, drawer e modal dentro do shell;
- eu trataria isso como passo 2 do piloto, não como condição de entrada.

### Arquivos provavelmente envolvidos

- `apps/web/src/components/application-shell/ApplicationShell.tsx`
- `apps/web/src/components/application-shell/ApplicationShell.css`
- `apps/web/src/modules/skpe/app/SkpeWorkspace.tsx`
- `apps/web/src/modules/skpe/workspace/MyWorkspacePage.tsx`
- `apps/web/src/responsive.css`
- `apps/web/src/responsive-stabilization.css`
- possivelmente pequenos pontos em `SkpeCockpit.tsx` apenas para integração/roteamento, não para reescrever o cockpit

### Riscos

- regressão de scroll owner;
- conflito com regras `!important` existentes;
- desalinhamento entre navegação do workspace e shell atual;
- tentação de expandir o piloto para todo o cockpit no mesmo passo.

### Critérios de aceite

- `MyWorkspacePage` roda dentro de `ApplicationShell`;
- header, sidebar e footer são estruturais e não rolam com o conteúdo;
- apenas a content area principal rola em desktop;
- em tablet/mobile, a navegação não comprime a content area;
- sem overflow estrutural global nos viewports oficiais;
- notificações, favoritos e painéis continuam acessíveis;
- sem reescrever `JourneySection` ou `MethodologyArtifactsSection`.

### O que fica fora

- redesign visual amplo;
- refatoração completa do `SkpeCockpit`;
- unificação total de overlays;
- extração massiva de RPCs e APIs;
- suíte automatizada nova.

### Como não interromper o desenvolvimento do Ricardo

- limitar o piloto a uma superfície isolada;
- não mexer na semântica de negócio;
- não mover grandes blocos do cockpit nesta primeira prova;
- preservar rotas e contexto existentes;
- usar commit pequeno e reversível quando a fase de implementação começar.

## 14. MUST NEXT / SHOULD / LATER

### MUST NEXT

- integrar `ApplicationShell` ao `MyWorkspacePage`
- reduzir owners concorrentes de viewport/scroll
- remover parte da estabilização corretiva específica do workspace após o piloto
- formalizar trigger mobile e semântica de drawer do shell

### SHOULD

- absorver no shell as regras corretivas estáveis hoje dispersas em `responsive-stabilization.css`
- definir primitive transversal mínima para drawer/modal
- introduzir breadcrumb transversal real para deep links SK-PE
- aproximar `MATRIZ_ROTAS_CONTEXTO_FE09A.md` da implementação real

### LATER

- atacar reestruturação ampla do `SkpeCockpit`
- unificar completamente overlays de plataforma, administração e artefatos
- extrair camada `api/` prevista no `MAPA_COMPONENTES_FRONTEND_FE09A.md`
- revisar toda a taxonomia de view modes e grids densos

## 15. Caminho para 10/10

### Atual -> 7

- provar shell transversal em uma superfície real;
- fixar viewport owner único;
- explicitar scroll owner principal;
- garantir estratégia mobile do menu sem esmagamento;
- reduzir necessidade de `!important` corretivo no workspace.

### 7 -> 8

- aplicar o shell a uma segunda superfície densa;
- padronizar page header contextual;
- padronizar breadcrumbs/deep links;
- absorver regras estáveis do hardening para a fundação do shell.

### 8 -> 9

- primitive transversal de overlay com acessibilidade consistente;
- navegação contextual e retorno preservado em fluxos profundos;
- validação cross-device com baseline repetível.

### 9 -> 10

- shell governado, auditável e adotado amplamente;
- docs transversais atualizados com evidência de uso real;
- coverage sólida de a11y, mobile, overlays e deep links;
- manutenção sem necessidade de camadas corretivas extensas.

### Papel do shell na maturidade geral

- o shell não é a plataforma inteira;
- ele é o **multiplicador estrutural** da maturidade;
- quando shell/layout estão frágeis, UX, responsividade, overlays e DX ficam mais caros e menos previsíveis;
- quando shell/layout convergem, o restante do produto evolui com menos regressão.

## 16. Documentação transversal x específica

### TRANSVERSAL

- FES
- `EXPERIENCIA_SPARKOOP.md`
- `agentic-entry.md`

### PRODUCT-SPECIFIC

- `ARQUITETURA_INFORMACAO_E_NAVEGACAO_FE09A.md`
- `MATRIZ_ROTAS_CONTEXTO_FE09A.md`
- `PLANO_REFATORACAO_INCREMENTAL_FE09A.md`
- `ADR-001`

### CANDIDATE FOR TRANSVERSAL

- `CONTRATO_SHELL_APLICACIONAL_TRANSVERSAL_FE09A03.md`
- `CONTRATO_FUNDACAO_RESPONSIVA_TIPOGRAFICA_FE09A02_2.md`
- partes do `MAPA_COMPONENTES_FRONTEND_FE09A.md` sobre componentes transversais

### OBSOLETE

- `RELATORIO_CONSOLIDADO_FE09A_A7_HARDENING.md` como evidência local reproduzível nesta execução
- partes do `MAPA_COMPONENTES_FRONTEND_FE09A.md` que descrevem uma estrutura ainda não materializada

### O que futuramente deveria alimentar `projetos/docs`

- evidência de que `ApplicationShell` é ou não viável como shell transversal real;
- aprendizado sobre viewport owner e scroll owner;
- padrões mínimos de overlay transversal;
- lições sobre fundação responsiva versus estabilização corretiva.

## 17. Riscos

- superestimar a qualidade atual do shell só porque o componente existe;
- subestimar o custo de owners concorrentes de viewport e scroll;
- transformar o piloto em refatoração ampla do cockpit;
- confundir maturidade alta de superfícies específicas com convergência real de shell transversal;
- usar histórico de hardening como substituto de prova local reproduzível.

## 18. Decisões epistemológicas

### FACT

- `ApplicationShell` existe e tem boa estrutura transversal.
- `ApplicationShell` não está adotado nas superfícies principais do produto.
- `SkpeCockpit.tsx`, `PlatformAdmin.tsx` e `App.tsx` continuam grandes e concentram responsabilidades.
- `responsive-stabilization.css` contém correções explícitas para devolver ownership de scroll ao shell.
- overlays existem em múltiplas famílias locais.
- docs FE-09.A e FES convergem bastante em intenção.

### INFERENCE

- o maior gap atual não é de visão arquitetural; é de convergência de implementação.
- a responsividade do produto está acima do histórico médio do ecossistema, mas ainda parcialmente sustentada por remediação.
- `MyWorkspacePage` é a melhor superfície para provar o shell transversal sem parar o produto.

### HYPOTHESIS

- uma vez aplicado ao workspace, o `ApplicationShell` reduzirá materialmente a necessidade de patches em `responsive-stabilization.css`.
- boa parte do custo de manutenção atual vem de dois shells convivendo: o shell planejado e o shell embutido no cockpit.

### HUMAN DECISION REQUIRED

- se o piloto deve ficar estritamente em `MyWorkspacePage` ou se já deve incluir uma segunda superfície densa;
- quanto risco de mudança estrutural é aceitável na primeira onda;
- quando converter os aprendizados locais em documento transversal.

## 19. Recomendação final

**PRONTO PARA MUST PILOT**

Justificativa:

- há contexto transversal suficiente;
- há componente-base suficiente;
- há superfície piloto claramente escolhível;
- os riscos estão localizados;
- a principal ambiguidade remanescente é de escopo do piloto, não de direção arquitetural.
