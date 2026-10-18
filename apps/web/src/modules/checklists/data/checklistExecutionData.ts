import { supabase } from '../../../lib/supabase'
import { validateChecklistExecutionCommand, type ChecklistExecutionCommand } from '../contracts/checklistEngine'

export function toChecklistExecutionRpcArgs(command: ChecklistExecutionCommand) {
  const errors = validateChecklistExecutionCommand(command)
  if (command.targetType !== 'organization' && command.targetType !== 'sparks_initiative') errors.push('Target not yet supported by backend')
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

export async function createChecklistExecution(command: ChecklistExecutionCommand): Promise<string> {
  const { data, error } = await supabase.rpc('create_sparks_checklist_execution', toChecklistExecutionRpcArgs(command))
  if (error) throw new Error(error.message)
  if (typeof data !== 'string') throw new Error('Unexpected checklist execution response')
  return data
}
