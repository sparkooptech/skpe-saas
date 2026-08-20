# MUST PILOT 01 - ARCH-ADJUSTMENT

## Arquivos alterados

- `apps/web/src/components/application-shell/ApplicationShell.tsx`
- `apps/web/src/components/application-shell/ApplicationShell.css`
- `apps/web/src/modules/skpe/SkpeCockpit.tsx`
- `apps/web/src/modules/skpe/app/SkpeWorkspace.tsx`
- `apps/web/src/responsive.css`

## O que saiu de SkpeCockpit

Saiu de `SkpeCockpit` a responsabilidade de instanciar diretamente o componente `ApplicationShell`.

Antes:

- `SkpeCockpit` importava `ApplicationShell`
- `SkpeCockpit` renderizava `<ApplicationShell>...</ApplicationShell>` diretamente no branch do `overview`

Depois:

- `SkpeCockpit` nao instancia mais o shell
- `SkpeCockpit` apenas fornece o payload do piloto via `renderOverviewShell`
- o componente continua dono apenas da semantica de modulo e do conteudo do `overview`

## Onde ficou a composição do shell

A composicao do shell ficou em `SkpeWorkspace.tsx`, na fronteira de aplicacao/workspace existente.

Implementacao:

- `SkpeWorkspace` agora importa `ApplicationShell`
- `SkpeWorkspace` define `renderOverviewShell(payload)`
- `SkpeWorkspace` injeta esse render prop no `SkpeCockpit`

Isso move a hospedagem estrutural do shell para fora do cockpit sem criar nova camada conceitual.

## Confirmacao de que ApplicationShell continua agnóstico

Confirmado.

`ApplicationShell.tsx` continua:

- sem imports de SK-PE
- sem rotas de SK-PE
- sem labels de Planejamento Estrategico
- sem contexto de Formulação
- sem dependencias de `SkpeWorkspace` ou `SkpeCockpit`

As alteracoes nele permanecem genericas:

- `navigationId`
- id no `aside`
- botao explicito de fechar drawer

## Confirmacao de que semântica SK-PE ficou no módulo

Confirmado.

A semantica especifica de SK-PE permaneceu no modulo:

- labels de navegacao em `SkpeCockpit.tsx`
- contexto `Formulação` em `SkpeCockpit.tsx`
- `navigationLabel="Navegação de Planejamento Estratégico"` em `SkpeCockpit.tsx`
- mapeamento de rotas SK-PE em `SkpeWorkspace.tsx`

O shell continua apenas recebendo dados estruturais.

## Diff quantitativo

### Diff atual

- `ApplicationShell.css`: `+66 / -1`
- `ApplicationShell.tsx`: `+16 / -1`
- `SkpeCockpit.tsx`: `+246 / -4`
- `SkpeWorkspace.tsx`: `+78 / -3`
- `responsive.css`: `+2 / -2`

Resumo:

- `5 arquivos` modificados
- `408 insercoes`
- `11 remocoes`

### Leitura do diff

- `ApplicationShell.tsx` e `ApplicationShell.css`
  - continuam sendo alteracoes genericas e reutilizaveis
- `SkpeCockpit.tsx`
  - ainda carrega a maior parte do diff porque continua fornecendo o payload de shell do piloto
  - mas nao hospeda mais estruturalmente o `ApplicationShell`
- `SkpeWorkspace.tsx`
  - passou a ser a fronteira de composicao do shell
- `responsive.css`
  - manteve apenas o ajuste foundational ja existente

## package-lock.json

Status:

- a alteracao incidental de `apps/web/package-lock.json` foi descartada

Confirmacao:

- nao ha diff restante em `apps/web/package-lock.json`
- nao restou mudanca real de dependencia
- nao restou mudanca de versao

## Build

Resultado: `PASS`

Comando executado:

- `npm run build` em `apps/web`

Observacao:

- `tsc -b` e `vite build` concluiram com sucesso

## Lint

Resultado: `PASS COM WARNINGS PREEXISTENTES`

Comando executado:

- `npm run lint` em `apps/web`

Observacao:

- nao surgiram erros bloqueantes do ajuste
- permaneceram warnings antigos de hooks / fast-refresh fora do escopo desta iteracao

## Git status final

```text
## feature/formulacao-estrategica-operacional...origin/feature/formulacao-estrategica-operacional
 M apps/web/src/components/application-shell/ApplicationShell.css
 M apps/web/src/components/application-shell/ApplicationShell.tsx
 M apps/web/src/modules/skpe/SkpeCockpit.tsx
 M apps/web/src/modules/skpe/app/SkpeWorkspace.tsx
 M apps/web/src/responsive.css
?? _audit/
```

## Veredito final

`PRONTO PARA RUNTIME VALIDATION`

Justificativa:

- o `ApplicationShell` continua agnostico
- a composicao estrutural do shell saiu do `SkpeCockpit`
- a hospedagem do shell foi movida para `SkpeWorkspace`
- a semantica SK-PE permaneceu no modulo
- o comportamento funcional e o mapeamento de rotas foram preservados
- `responsive-stabilization.css` nao foi tocado
- `build` e `lint` passaram dentro do criterio desta etapa
