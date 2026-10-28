# CNTCOOP — Homologação SK-DA — Evidências, Checklist e LB0

Data: 27/10/2026  
Organização: CNTCOOP  
Jornada: DA 2026  
OI: 227/2026  
Ambiente: HOMOL / Hostinger

## 1. Decisão de arquitetura — evidências

O SK-DA continua usando o Core transversal de evidências como fonte única dos ativos documentais.

O Checklist documental da Jornada não cria uma segunda cópia do documento e não substitui o Core. Ele passa a representar a classificação contextual do ativo no Diagnóstico Assistido.

Cada correlação entre Jornada e evidência pode registrar, em metadata:

- `checklist_group_code`;
- `checklist_group_title`.

Grupos vigentes:

- Diagnósticos anteriores de Governança;
- Diagnósticos anteriores de Gestão;
- Planos de ação e acompanhamento;
- Autoavaliação vigente;
- Governança e quadro social;
- Gestão e resultados;
- Entrevistas e verificações;
- Outras evidências.

A regra de fallback é `Outras evidências` quando não existir classificação explícita.

## 2. Regra de apresentação

Documentos classificados deixam de ser repetidos em uma lista genérica abaixo do Checklist.

O ativo é apresentado dentro do grupo do Checklist correspondente, preservando:

- identidade única no Core;
- situação de integração ao DA;
- confiabilidade da fonte;
- quantidade de questões correlacionadas;
- itens ainda em análise.

Ativos existentes no Core sem grupo explícito aparecem em `Outras evidências`.

## 3. Autoavaliação vigente

Ao usar `Importar AA existente`, o registro é classificado explicitamente no grupo `autoavaliacao`.

A Autoavaliação continua sendo tratada como declaração formal da Organização e baseline declarado do ciclo, sem conversão automática em achado ou validação diagnóstica.

O fluxo permanece:

Autoavaliação declarada → evidências → inteligência → hipótese → entrevista/validação → achado.

## 4. Correção do erro de vínculo transversal

Foi observado erro de PostgREST ao concluir o vínculo transversal:

`Could not find the function public.link_sparks_evidence_module_context(...) in the schema cache`.

A função já existe no banco. A falha foi de atualização do schema cache do PostgREST local.

A migration de reconciliação passa a emitir:

`NOTIFY pgrst, 'reload schema';`

após as alterações de banco, para recarregar o catálogo de RPCs exposto pelo PostgREST.

Importante: quando esse erro ocorreu, o ativo documental e a correlação com o DA já podiam ter sido persistidos. A operação de reenvio deve permanecer idempotente e não criar duplicação do ativo.

## 5. LB0 contratual e plano vigente

A OI 227/2026 é a autoridade contratual da Jornada CNTCOOP.

A primeira agenda contratual estruturada deve ser preservada como LB0.

O plano vigente pode ser replanejado, sem apagar a LB0.

A proteção transversal de baseline continua ativa. Foi criada apenas uma exceção governada para inicialização única de baseline quando:

- a ação pertence ao SK-DA;
- a baseline ainda está nula;
- a origem é `contractual_schedule` ou `parent_contractual_schedule`.

Após a inicialização, a baseline volta a ser imutável.

## 6. Agenda CNTCOOP usada na reconciliação

- 19/10/2026 — preparação/off-line;
- 24/10/2026 — preparação/ajustes;
- 26/10/2026 — entrevistas Teams;
- 27/10/2026 — entrevistas Teams;
- 28/10/2026 — entrevistas Teams;
- 29/10/2026 — entrevistas Teams;
- 31/10/2026 — consolidação/off-line.

Total contratado: 25h.

## 7. Gates de validação

Antes de homologar:

1. `git diff --check`;
2. build TypeScript/Vite;
3. aplicação das migrations com `ON_ERROR_STOP=1`;
4. deploy do SHA exato;
5. smoke público;
6. inventário read-only da CNTCOOP;
7. confirmação de LB0 e plano vigente na EAP;
8. confirmação do vínculo da AA 2026 e classificação no grupo correto.

## 8. Testes legados

A suíte contém contratos estáticos antigos do SK-DA que já estavam desalinhados com a arquitetura transversal vigente. Esses testes não devem ser usados para forçar regressão do código para implementações já substituídas.

A correção atual deve ser validada pelos gates de build, banco, deploy, smoke e inventário real, sem mascarar os testes legados pendentes de atualização.
