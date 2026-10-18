import { supabase } from '../../../lib/supabase'
import {
  validateChecklistExecutionCommand,
  type ChecklistExecutionCommand,
  type ChecklistExecutionStatus,
  type ChecklistItemAssessmentCommand,
} from '../contracts/checklistEngine'

export function toChecklistExecutionRpcArgs(command: ChecklistExecutionCommand) {
  const errors = validateChecklistExecutionCommand(command)
  if (command.targetType !== 'organization' && command.targetType !== 'sparks_initiative') errors.push('Destino ainda não habilitado no backend.')
  if (errors.length) throw new Error(errors.join('; '))
  return {
    target_organization_id: command.organizationId,
    target_module_code: command.moduleCode,
    target_template_version_id: command.templateVersionId,
    target_type: command.targetType,
    target_id: command.targetId,
    target_idempotency_key: command.idempotencyKey.trim(),
    change_reason: command.changeReason.trim(),
  }
}

function requireReason(reason: string) {
  if (reason.trim().length < 10) throw new Error('Informe uma justificativa de pelo menos 10 caracteres.')
  return reason.trim()
}

function requireUuid(value: string, field: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${field} deve ser um UUID válido.`)
  }
  return value
}

async function callChecklistRpc(name: string, args: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  if (typeof data !== 'string') throw new Error('Resposta inesperada da operação de checklist.')
  return data
}

export async function createChecklistExecution(command: ChecklistExecutionCommand): Promise<string> {
  return callChecklistRpc('create_sparks_checklist_execution', toChecklistExecutionRpcArgs(command))
}

export async function assessChecklistItem(command: ChecklistItemAssessmentCommand): Promise<string> {
  if (command.evidenceAssetIds.length > 0) throw new Error('Vincule evidências separadamente para preservar a auditoria.')
  return callChecklistRpc('assess_sparks_checklist_item', {
    target_execution_id: requireUuid(command.executionId, 'Execução'),
    target_template_item_id: requireUuid(command.templateItemId, 'Item'),
    target_status: command.status,
    target_assigned_user_id: command.assignedUserId ? requireUuid(command.assignedUserId, 'Responsável') : null,
    target_due_date: command.dueDate,
    target_justification: command.justification,
    change_reason: requireReason(command.changeReason),
  })
}

export async function attachChecklistEvidence(executionItemId: string, evidenceAssetId: string, reason: string): Promise<string> {
  return callChecklistRpc('attach_sparks_checklist_evidence', {
    target_execution_item_id: requireUuid(executionItemId, 'Item'),
    target_evidence_asset_id: requireUuid(evidenceAssetId, 'Evidência'),
    change_reason: requireReason(reason),
  })
}

export async function transitionChecklistExecution(executionId: string, status: ChecklistExecutionStatus, reason: string): Promise<string> {
  return callChecklistRpc('transition_sparks_checklist_execution', {
    target_execution_id: requireUuid(executionId, 'Execução'),
    target_status: status,
    change_reason: requireReason(reason),
  })
}
