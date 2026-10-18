# SPARKs CORE-CHK-001 — Gerador Transversal de Checklists

Status: branch de implementação; sem deploy e sem migrações executadas.

## AS-IS verificado

- Catálogo transversal: public.sparks_checklist_templates, sparks_checklist_template_versions e sparks_checklist_template_items.
- O EvidenceManagementWorkspace consulta o modelo fixo SPARKS-PEM00-GERAL.
- O SK-PE possui execução própria via skpe_evidence_checklists e funções associadas.
- Evidências compartilhadas: sparks_evidence_assets, sparks_evidence_links e can_manage_sparks_evidence.
- A interface atual fixa SK-PE e strategic_project; não pode ser reutilizada diretamente no DA.

## Decisão arquitetural

A plataforma é proprietária do mecanismo de checklist; os módulos são proprietários dos modelos metodológicos. Preservar o SK-PE sem alterações incompatíveis. Não confundir respostas de checklist com notas dos instrumentos PDGC.

## Invariantes

1. Cada execução referencia uma versão publicada de modelo, imutável após publicação.
2. Execução possui organização, módulo, tipo de destino, destino, chave idempotente e auditoria.
3. Destino validado no servidor com escopo organizacional. Jornada DA associa iniciativa operacional canônica.
4. Autorização considera habilitação do módulo, vínculo ativo do usuário, permissões e escopo do destino.
5. Evidências reutilizadas do acervo, com validação de destino e organização; sem alteração automática de nota.
6. Repetição de criação com mesma chave e mesmo conteúdo retorna a execução; conteúdo divergente é rejeitado.
7. Versão nova não altera respostas históricas de execução anterior.
8. Responsáveis da consultoria e contratante são papéis distintos, mesmo quando ocupados provisoriamente pelo mesmo usuário.

## Modelo aditivo proposto (não aplicado)

- sparks_checklist_executions: organização, módulo, versão, tipo/destino, status, idempotência, fingerprint e auditoria.
- sparks_checklist_execution_items: execução, item do modelo, situação, responsável, prazo, justificativa.
- sparks_checklist_item_evidence: item de execução, ativo de evidência, finalidade, auditoria.
- sparks_checklist_audit: execução, ação, ator, antes/depois, justificativa, data.

## Ordem de implementação

1. Contratos TypeScript transversais e validação de entrada (primeiro incremento desta branch).
2. Inspecionar permissões/RLS de modelos e produzir migração aditiva com RPCs governadas.
3. Testar isolamento entre organizações, identidade de destino, permissões, versionamento, idempotência, evidências e regressão PE.
4. Construir administração de modelos (rascunho, revisão, publicação, aposentadoria) e execução (atribuição, avaliação, evidências).
5. Habilitar permissões específicas de SK-DA em organização controlada e homologar jornadas.

## Limites desta autorização

Não alterar ou excluir dados/tabelas/funções existentes do SK-PE. Não executar migrações, não realizar deploy e não modificar produção. Alterações permanecem em feat/sparks-core-checklist-engine-da-010 até validação.
