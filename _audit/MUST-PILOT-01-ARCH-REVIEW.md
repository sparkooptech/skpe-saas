# MUST PILOT 01 - Architecture Review

## 1. Resumo do diff

Arquivos analisados no diff nao commitado:

- `apps/web/src/components/application-shell/ApplicationShell.tsx`
- `apps/web/src/components/application-shell/ApplicationShell.css`
- `apps/web/src/modules/skpe/app/SkpeWorkspace.tsx`
- `apps/web/src/modules/skpe/SkpeCockpit.tsx`
- `apps/web/src/responsive.css`
- `apps/web/package-lock.json`

Resumo quantitativo do diff atual:

- `apps/web/package-lock.json`: `+38 / -38`
- `ApplicationShell.css`: `+66 / -1`
- `ApplicationShell.tsx`: `+16 / -1`
- `SkpeCockpit.tsx`: `+227 / -4`
- `SkpeWorkspace.tsx`: `+56 / -3`
- `responsive.css`: `+2 / -2`

Total: `405 insercoes / 49 remocoes`

Leitura arquitetural do diff:

- o `ApplicationShell` continua genericamente modelado
- a maior parte do escopo novo nao entrou no shell, e sim na integracao do `overview` dentro de `SkpeCockpit`
- houve expansao de responsabilidade estrutural no `SkpeCockpit`, ainda que sem refatoracao ampla do arquivo

## 2. Agnosticidade do ApplicationShell

### Pergunta 1
`O ApplicationShell continua agnostico ao dominio?`

Veredito: `PASS`

Justificativa:

- a API do shell continua composta por primitives genericas: `brand`, `contextItems`, `userArea`, `navigationItems`, `navigationLabel`, `navigationId`, `children`, `footer`, `collapsed`, `mobileOpen`, `onToggleCollapsed`, `onCloseMobile` em [ApplicationShell.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.tsx:19)
- nao ha tipo, prop, rota, label nem import de `SK-PE` dentro do arquivo do shell
- a adicao de `navigationId` em [ApplicationShell.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.tsx:25) e estrutural/generica
- o botao explicito de fechar drawer em [ApplicationShell.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/components/application-shell/ApplicationShell.tsx:87) e comportamento transversal

Observacao:

- o shell continua agnostico, mas o piloto nao prova sozinho uma integracao igualmente agnostica, porque a montagem do shell foi concentrada dentro do `SkpeCockpit`

### Pergunta 2
`Alguma prop, label, rota, navegacao, contexto ou comportamento especifico do SK-PE foi incorporado ao ApplicationShell?`

Resposta curta:

- `No componente ApplicationShell`: nao
- `Na forma como ele passou a ser alimentado no piloto`: sim

Evidencias:

- contexto com semantica SK-PE em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5421)
  - `Projeto`
  - `Formulação`
  - `Seção`
  - `Perfil`
- uso explicito de `formulationId` no contexto do shell em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5431)
- navegacao interna SK-PE montada como `ApplicationShellNavigationItem[]` em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5446)
  - `Visão Geral`
  - `Jornada Estratégica`
  - `Iniciativas`
  - `Artefatos e evidências`
  - `Governança`
- label do drawer com semantica de modulo em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5592)
  - `Navegação de Planejamento Estratégico`
- branding e subtitulo especificos do piloto em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5521) e [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5524)
  - `Plataforma SPARKs`
  - `Meu Espaço de Trabalho`
- id de drawer ainda com prefixo de modulo em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5502) e [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5591)
  - `skpe-application-shell-navigation`
- roteamento especifico de secoes SK-PE em [SkpeWorkspace.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/app/SkpeWorkspace.tsx:30) e [SkpeWorkspace.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/app/SkpeWorkspace.tsx:40)

## 3. Plataforma x modulo

Separacao atual entre camadas:

- `Plataforma SPARKs`: aparece corretamente como identidade geral no branding do shell
- `contexto organizacional transversal`: aparece via `organizationCode`, `organizationDisplayName`, avatar e perfil do usuario
- `modulo atual`: aparece no `navigationLabel` e na lista de navegacao do `SkpeCockpit`
- `navegacao interna SK-PE`: foi corretamente mantida fora do `ApplicationShell`, mas ainda montada dentro do `SkpeCockpit`
- `conteudo MyWorkspacePage`: continua encapsulado em `OverviewSection` e em seguida dentro de `ApplicationShell`

Diagnostico:

- a fronteira `shell generico` x `conteudo de modulo` esta conceitualmente correta
- a fronteira `container do modulo` x `conteudo do overview` nao ficou ideal, porque o `SkpeCockpit` passou a montar o shell inteiro em vez de apenas fornecer conteudo e callbacks
- nao houve vazamento de dominio para dentro do arquivo `ApplicationShell`, mas houve concentracao de semantica de modulo em torno dele

## 4. Navegacao e contexto

`A separacao esta correta entre Plataforma SPARKs, contexto organizacional transversal, modulo atual, navegacao interna SK-PE e conteudo MyWorkspacePage?`

Veredito: `PARCIALMENTE`

O que ficou correto:

- `ApplicationShell` nao conhece SK-PE
- `MyWorkspacePage` nao precisou ser redesenhada
- a navegacao continua sendo passada como dados (`navigationItems`)
- `SkpeWorkspace` ficou responsavel pelo acoplamento de rota contextual em [SkpeWorkspace.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/app/SkpeWorkspace.tsx:93)

O que ficou menos limpo:

- o `SkpeCockpit` passou a assumir responsabilidade estrutural de shell em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5490)
- o bloco de montagem do shell mistura:
  - identidade da plataforma
  - contexto organizacional
  - contexto de planejamento estrategico
  - navegacao interna do modulo
  - controle de drawer/collapse
- `Formulação` no header do shell amarra o piloto a um vocabulário de dominio em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5431)

## 5. Analise das 405 insercoes

### Distribuicao por arquivo

- `package-lock.json`: `38`
- `ApplicationShell.css`: `66`
- `ApplicationShell.tsx`: `16`
- `SkpeCockpit.tsx`: `227`
- `SkpeWorkspace.tsx`: `56`
- `responsive.css`: `2`

### Estruturais

- `ApplicationShell.tsx`: `16`
  - `navigationId`
  - id no `aside`
  - botao explicito de fechar drawer
- `SkpeCockpit.tsx`: maior parte das `227`
  - estado `shellMobileOpen`
  - `useRef` para retorno de foco
  - composicao do shell
  - contexto e navegacao especificos do piloto
  - branch nova de render para `overview`
- `SkpeWorkspace.tsx`: `56`
  - mapeamento entre rota SK-PE e `CockpitSection`
  - update de URL contextual ao navegar entre secoes

### CSS

- `ApplicationShell.css`: `66`
  - `application-shell-menu-button`
  - `application-shell-close-button`
  - `application-shell-page`
  - ajustes de drawer e padding responsivo
- `responsive.css`: `2`
  - inclusao de `.application-shell`, `.application-shell-content`, `.application-shell-page` na fundacao

### Roteamento

- `SkpeWorkspace.tsx`: todo o bloco `ROUTED_COCKPIT_SECTIONS` / `COCKPIT_ROUTE_SECTIONS` em [SkpeWorkspace.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/app/SkpeWorkspace.tsx:30)
- logica `handleNavigateSection` com `platformRoutes.skpe(...)` em [SkpeWorkspace.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/app/SkpeWorkspace.tsx:96)

### Existe expansao de escopo escondida?

Veredito: `SIM, MAS LIMITADA`

Nao houve refatoracao ampla nem migracao de outras superficies. Ainda assim, houve uma expansao real alem de "apenas encaixar o shell":

- o `SkpeCockpit` ganhou uma nova responsabilidade de composicao estrutural do shell
- `SkpeWorkspace` ganhou sincronizacao de rotas contextualizadas entre secoes
- isso continua controlado, mas nao e somente "troca de wrapper"

## 6. SkpeCockpit - escopo real

`As alteracoes foram realmente minimas?`

Veredito: `PARCIAL`

Motivo:

- em termos de superficie de produto, sim: so o `overview` foi migrado
- em termos de arquitetura local do arquivo, nao foi minimo no sentido estrito: `SkpeCockpit.tsx` recebeu `+227 / -4`, que e a maior parte do diff

Nova responsabilidade estrutural adicionada:

- decidir quando o `overview` sai do shell legado e entra no `ApplicationShell` em [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5490)
- montar `brand`, `contextItems`, `userArea`, `navigationItems`, `navigationLabel`, `navigationId`, `collapsed`, `mobileOpen`, `onToggleCollapsed`, `onCloseMobile`

Isso nao equivale a uma refatoracao ampla, mas equivale a introduzir uma responsabilidade estrutural nova no cockpit.

## 7. responsive.css - transversalidade

`As alteracoes sao fundacionais e reutilizaveis?`

Veredito: `SIM`

Justificativa:

- a mudanca em [responsive.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/responsive.css:6) apenas inclui o `ApplicationShell` e seus containers no mesmo contrato de `min-width:0` / `max-width:100%`
- a mudanca em [responsive.css](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/responsive.css:7) apenas inclui `application-shell-content` na governanca de `overflow-x:auto`

`Existe seletor excessivamente especifico do SK-PE colocado como regra transversal?`

Resposta:

- nas linhas alteradas, nao
- o arquivo como um todo ja e fortemente povoado por seletores de modulos, mas o diff novo nao adiciona novo seletor SK-PE especifico na camada transversal

## 8. package-lock.json

### Diff exato

O diff atual so mexe em metadados `libc` de pacotes opcionais ja existentes:

- entradas novas de `"libc": ["glibc"]` e `"libc": ["musl"]`
- trocas `glibc <-> musl`
- remocoes da chave `libc` em alguns blocos opcionais

Nao ha no diff:

- nova dependencia
- remocao de dependencia
- alteracao de versao
- mudanca de script
- mudanca de resolved/integrity

### Determinacao

Veredito: `DESCARTAR ALTERAÇÃO INCIDENTAL`

Justificativa:

- o diff e tipico de regravacao de `package-lock.json` por resolver metadados de plataforma durante `npm install`
- nao representa intencao arquitetural nem necessidade funcional do piloto

## 9. Riscos

### Finding 1
[SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5421) faz o `SkpeCockpit` montar contexto e navegacao especificos do modulo para alimentar o shell. Isso preserva a agnosticidade do `ApplicationShell`, mas desloca a responsabilidade transversal para um container de dominio. Risco: repetir esse padrao em `SK-PN`, `SK-PCM` e `SK-JUR` pode criar varias integracoes ad hoc em vez de um contrato mais uniforme de shell host.

### Finding 2
[SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5431) expõe `Formulação` como item estrutural de contexto do shell do piloto. Isso e correto para SK-PE, mas nao e contexto transversal da plataforma. Risco: o primeiro piloto pode ser homologado como "shell transversal" sem separar claramente o que e contexto de plataforma e o que e contexto do modulo.

### Finding 3
[SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5446) e [SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5592) fixam labels e navegacao de Planejamento Estrategico junto da composicao do shell. Isso nao contamina o componente base, mas torna a prova arquitetural apenas parcial. Risco: outros modulos precisarem copiar este mesmo bloco e divergirem entre si.

### Finding 4
[SkpeCockpit.tsx](C:/Users/robso/OneDrive/DevKit/skpe-saas/apps/web/src/modules/skpe/SkpeCockpit.tsx:5490) cria uma branch estrutural exclusiva para `overview`. Risco: o cockpit passa a conviver com dois modelos estruturais de host, o que pode elevar custo de manutencao enquanto o rollout do shell transversal ainda nao foi consolidado.

## 10. Runtime pendente

Gate de runtime permanece pendente por instrucao desta revisao.

Nenhuma validacao visual/comportamental foi tentada aqui.

## 11. Veredito

### Respostas objetivas

1. `O ApplicationShell continua agnostico ao dominio?`
   `PASS`

2. `Alguma prop, label, rota, navegacao, contexto ou comportamento especifico do SK-PE foi incorporado ao ApplicationShell?`
   - no componente `ApplicationShell`: nao
   - na integracao piloto ao redor dele: sim, conforme evidencias acima

3. `A separacao esta correta entre Plataforma SPARKs, contexto organizacional transversal, modulo atual, navegacao interna SK-PE e conteudo MyWorkspacePage?`
   - `PARCIALMENTE`

4. `O ApplicationShell poderia hospedar, sem alteracao conceitual, SK-PN, SK-PCM e SK-JUR?`
   - `SIM COM AJUSTES`

Justificativa:

- o componente `ApplicationShell` pode hospedar outros modulos sem mudanca conceitual
- o que precisa de ajuste nao e o shell em si, e a estrategia de integracao
- hoje o piloto prova melhor "shell generico + montagem especifica dentro do cockpit SK-PE" do que "host transversal uniformizado para modulos"

### Veredito final

`APROVADO COM AJUSTES`

Racional:

- o `ApplicationShell` permaneceu transversal e agnostico
- nao houve contaminacao direta do componente base com semantica de Planejamento Estrategico
- porem a integracao piloto concentrou semantica estrutural de modulo no `SkpeCockpit`, entao a homologacao como "primeira prova do shell transversal da Plataforma SPARKs" deve ser lida como prova parcial, nao ainda como padrao de integracao plenamente generalizado
