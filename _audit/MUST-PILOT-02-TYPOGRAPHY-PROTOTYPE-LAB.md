# MUST PILOT 02 — Typography + Prototype Lab Review

## 1. Executive Summary

- `MUST PILOT 02 STATUS`: `SIM COM AJUSTES`
- `Typography recommendation`: `TUNE`
- `Prototype Lab`: criado em `C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\frontend-experience\mockups\dashboards\skpe-methodology-artifacts-prototype-lab`
- `ATUALIZACAO PARA O RICARDO NECESSARIA?`: `SIM`

O `MethodologyArtifactsSection` e um bom candidato para a segunda prova do padrao homologado no MUST PILOT 01 porque ja opera como conteudo de alta densidade dentro do fluxo do modulo e depende de overflow local para tabela, drawer e modal. A composicao homologada do shell permanece na fronteira de workspace, mas ainda existe drift de ownership de scroll no `SkpeCockpit`.

Na tipografia real do app, a fonte principal nao e Montserrat. O app carrega `Manrope` e `Inter`, usando `Manrope` como interface e `Inter` como familia de dados. O principal problema observado nao e a escolha de familia isoladamente, mas a combinacao de pesos altos, uppercase frequente e labels pequenas em varias camadas.

O Prototype Lab foi criado como harness estatico HTML/CSS/JS, sem React, sem npm e sem novo framework, para validar composicao, densidade, tipografia e viewports FES sem tocar no runtime do produto.

## 2. MUST PILOT 02

### FACT

- O shell transversal continua fora da superficie de dominio e segue hospedado em `SkpeWorkspace`, que injeta `ApplicationShell` por `renderOverviewShell`. Evidencia: [apps/web/src/modules/skpe/app/SkpeWorkspace.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/app/SkpeWorkspace.tsx:138).
- O `ApplicationShell` define `application-shell-content` como owner principal de scroll do shell com `overflow: auto`. Evidencia: [apps/web/src/components/application-shell/ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:231).
- O `MethodologyArtifactsSection` e uma superficie autocontida com tabs, filtros, cards, table wrap, readiness, audit, drawer e modais, sem importar o shell. Evidencias: [MethodologyArtifactsSection.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.tsx:322), [MethodologyArtifactsSection.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.css:1).
- O CSS responsivo transversal ja reconhece `.skpe-artifacts-page` e `.skpe-artifacts-table-wrap` como superfícies com contenção e overflow local. Evidencias: [responsive.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/responsive.css:6), [responsive.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/responsive.css:8), [responsive.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/responsive.css:143).

### INFERENCE

- A superficie ja tem densidade suficiente para provar se o shell transversal suporta uma pagina mais pesada que `MyWorkspacePage`.
- O risco principal nao esta no encaixe conceitual com o shell, mas na ergonomia de navegação e leitura em viewports medios e pequenos.

### HYPOTHESIS

- Se migrada para dentro do `ApplicationShell` mantendo a mesma contenção local de tabela, drawer e modal, a superficie tende a funcionar sem alteracao conceitual do shell.
- O comportamento de scroll pode ficar inconsistente se o app continuar usando comandos globais de `window/document` em vez de priorizar o scroll owner do shell.

### RECOMMENDATION

- Levar `MethodologyArtifactsSection` como proxima prova controlada do shell.
- Antes de implementar a migracao real, alinhar o ownership de scroll para evitar comportamento misto entre `window`, `document.scrollingElement`, `.application-shell-content` e `.skpe-main`.
- Preservar overflow local da tabela e largura total do conteudo; nao recriar viewport estrutural da pagina.

### HUMAN DECISION

- Decidir se o segundo piloto deve ser:
  - migracao controlada da superficie inteira para dentro do shell; ou
  - apenas estudo de UX/typography com prototipo antes de mexer no produto.

## 3. Diagnóstico tipográfico

### FACT

- O app importa `@fontsource-variable/manrope` e `@fontsource-variable/inter` em [main.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/main.tsx:4).
- A familia de interface real e `Manrope`; a familia de dados real e `Inter`. Evidencia: [App.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/App.css:1).
- O `body` usa `var(--font-family-interface)`. Evidencia: [App.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/App.css:28).
- Existem fundacoes responsivas para corpo e headings: `--sparks-body-size`, `--sparks-heading-1`, `--sparks-heading-2`. Evidencia: [responsive.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/responsive.css:55).
- O shell usa labels pequenas, uppercase e pesos altos para contexto (`0.68rem`, `font-weight: 750`, `letter-spacing: 0.04em`, `text-transform: uppercase`). Evidencia: [ApplicationShell.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.css:95).
- `MethodologyArtifactsSection` repete o padrao: eyebrow com `0.78rem`, uppercase, `letter-spacing: .12em`, `font-weight: 800`; tabs e botoes com `font-weight: 800`; status com `font-size: .75rem`. Evidencia: [MethodologyArtifactsSection.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/features/artifacts/MethodologyArtifactsSection.css:1).

### INFERENCE

- O desconforto potencial vem mais de densidade tipografica e do excesso de enfase do que de uma familia inadequada.
- `Manrope` funciona bem para interface, mas a combinacao de:
  - muitos pesos `700+`
  - labels pequenas
  - uppercase
  - tracking positivo frequente
  reduz conforto em painéis densos.

### Inconsistências observadas

- Pesos atipicos e repetidos como `720`, `750`, `800`, `850`.
- Uso espalhado de uppercase em eyebrow, contexto, badges e labels curtas.
- Escalas pequenas recorrentes entre `0.68rem` e `0.82rem` em pontos de alta frequencia cognitiva.
- `Inter` fica reservada mais a dados do que a uma hierarquia tipografica sistematizada.

## 4. Comparativo tipográfico

### Configuração atual: `Manrope + Inter`

- `Reading`: boa para UI curta, media para blocos densos.
- `Dashboards`: boa identidade, mas pode endurecer quando combinada com muito peso alto.
- `Tables`: boa com `Inter` para numeros; media para labels e filtros quando tudo fica pesado.
- `Forms`: boa, desde que pesos e uppercase sejam reduzidos.
- `Institutional tone`: forte e contemporanea.
- `Verdict`: `TUNE`

### Inter

- `Reading`: muito boa em UI operacional.
- `Dashboards`: excelente neutralidade e consistencia.
- `Tables`: muito boa para densidade e dados tabulares.
- `Forms`: muito boa.
- `Institutional tone`: mais neutra e menos proprietaria.
- `Verdict`: `TEST FURTHER`

### Source Sans 3

- `Reading`: excelente para leitura prolongada e densidade moderada/alta.
- `Dashboards`: muito boa, com textura mais humana e menos rigida.
- `Tables`: boa, embora um pouco menos “tight” que Inter.
- `Forms`: muito boa.
- `Institutional tone`: equilibrada, menos “tech enterprise”, mais editorial-operacional.
- `Verdict`: `TEST FURTHER`

### System UI

- `Reading`: boa.
- `Dashboards`: robusta e pragmatica.
- `Tables`: boa.
- `Forms`: boa.
- `Institutional tone`: mais fraca para identidade.
- `Verdict`: `KEEP` apenas como fallback, nao como direcao principal.

### Recomendação tipográfica final

`TUNE`

Motivo:

- nao ha evidencia de que a familia atual precise ser substituida imediatamente;
- ha evidencia suficiente de que pesos, uppercase, tracking e labels pequenos precisam ser calibrados;
- `Inter` e `Source Sans 3` merecem teste visual controlado antes de qualquer troca de producao.

## 5. Prototype Lab

### Local escolhido

`C:\Users\robso\OneDrive\DevKit\projetos\docs\ecosystem\frontend-experience\mockups\dashboards\skpe-methodology-artifacts-prototype-lab`

### Por que este local

- `FACT`: ja existia o `Mockup Bank` em `docs/ecosystem/frontend-experience/mockups`.
- `FACT`: ja existiam subestruturas semanticas em `dashboards/` e `proposals/`.
- `INFERENCE`: a superficie estudada e mais proxima de dashboard/workspace operacional do que de proposta conceitual pura.
- `RECOMMENDATION`: manter o Prototype Lab dentro da arvore existente do `Mockup Bank`, sem criar nova raiz.

### Arquivos criados

- `index.html`
- `styles.css`
- `mock-data.js`
- `app.js`
- `README.md`

### Capacidades do harness

- alternancia tipografica entre `Atual`, `Inter`, `Source Sans 3` e `System UI`
- alternancia de viewports FES:
  - `1440x900`
  - `1280x800`
  - `1024x768`
  - `768x1024`
  - `390x844`
- alternancia entre `Cards`, `Grid` e `Journey`
- alternancia entre `Artefatos`, `Prontidão dos gates` e `Auditoria`
- dados mockados em PT-BR, separados do HTML

## 6. Primeiro protótipo

O primeiro prototipo replica apenas a intencao estrutural da experiencia:

- shell transversal da Plataforma SPARKs
- navegacao de modulo no sidebar
- contexto organizacional no header
- superficie densa de artefatos como conteudo

`FACT`: o prototipo nao tenta copiar o React nem a logica de negocio.

`INFERENCE`: isso o torna suficiente para validar densidade, scroll aparente, leitura, tabs, toolbar, tabela e cards sem criar framework paralelo.

## 7. Relação protótipo → implementação

- `PROTOTYPE != PRODUCTION IMPLEMENTATION`
- o prototipo nao autoriza implementacao
- o prototipo serve para comparar direcoes visuais e ergonomicas
- qualquer implementacao real ainda precisa respeitar:
  - `ApplicationShell` como shell transversal oficial
  - composicao na fronteira de workspace
  - modulo mantendo sua propria semantica
  - FES
  - decisoes humanas posteriores

## 8. Impacto no Ricardo

`ATUALIZACAO PARA O RICARDO NECESSARIA? SIM`

Se a decisao for canonizar esse uso depois, o guardrail deveria receber exatamente:

1. antes de criar nova raiz de prototipos, preferir `docs/ecosystem/frontend-experience/mockups`
2. prototipos HTML/CSS/JS de validacao visual pertencem ao `Mockup Bank`, nao ao frontend de producao
3. `PROTOTYPE != PRODUCTION IMPLEMENTATION`
4. mock data deve ficar separado do HTML
5. o prototipo deve existir para comparar composicao, tipografia, densidade e responsividade antes de alterar o produto

## 9. Recomendações

1. Executar o MUST PILOT 02 real apenas depois de alinhar ownership de scroll no modulo.
2. Testar primeiro um ajuste tipografico de baixo risco:
   - reduzir pesos `750+`
   - reduzir uppercase onde nao agrega semantica
   - subir labels pequenas para a faixa `0.78rem` a `0.875rem`
   - revisar tracking positivo excessivo
3. Usar o Prototype Lab para decidir entre:
   - `Manrope + Inter` calibrado
   - `Inter` dominante
   - `Source Sans 3` dominante
4. Nao alterar o shell transversal nesta etapa.

## 10. Próximo gate

`NEXT GATE`: `VISUAL DECISION + SCROLL OWNERSHIP DECISION`

Pendencias claras:

- decidir se a tipografia atual sera apenas calibrada ou se havera teste controlado de familia dominante
- decidir se o segundo piloto migra a superficie real agora ou somente apos consolidar o ownership de scroll

## Apêndice — Drift estrutural relevante

### FACT

- O `SkpeCockpit` ainda aciona scroll em multiplos owners: `document.scrollingElement`, `document.documentElement`, `document.body`, `window`, `.application-shell-content` e `.skpe-main`. Evidencia: [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5345).

### RECOMMENDATION

- Quando o MUST PILOT 02 for implementado de verdade, normalizar esse comportamento para priorizar o owner de scroll do shell e evitar comandos redundantes/globais.
