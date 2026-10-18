/** SPARKs CORE-CHK-001: module-neutral checklist contracts. */
export type ChecklistTargetType = 'sparks_initiative' | 'skda_journey' | 'skpe_project' | 'organization'
export type ChecklistExecutionStatus = 'draft' | 'in_progress' | 'under_review' | 'completed' | 'cancelled'
export type ChecklistItemStatus = 'not_started' | 'in_progress' | 'fulfilled' | 'partially_fulfilled' | 'not_fulfilled' | 'not_applicable' | 'blocked'
export type ChecklistTemplateVersionStatus = 'draft' | 'published' | 'retired'

export interface ChecklistExecutionCommand {
  organizationId: string
  moduleCode: string
  templateVersionId: string
  targetType: ChecklistTargetType
  targetId: string
  idempotencyKey: string
  changeReason: string
}

export interface ChecklistItemAssessmentCommand {
  executionId: string
  templateItemId: string
  status: ChecklistItemStatus
  assignedUserId: string | null
  dueDate: string | null
  justification: string | null
  evidenceAssetIds: readonly string[]
  changeReason: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TARGETS: ReadonlySet<string> = new Set(['sparks_initiative', 'skda_journey', 'skpe_project', 'organization'])

/** UX safeguard only. Server RPCs MUST revalidate tenant, permissions and target identity. */
export function validateChecklistExecutionCommand(command: ChecklistExecutionCommand): string[] {
  const errors: string[] = []
  if (!UUID.test(command.organizationId)) errors.push('organizationId must be a UUID')
  if (!UUID.test(command.templateVersionId)) errors.push('templateVersionId must be a UUID')
  if (!UUID.test(command.targetId)) errors.push('targetId must be a UUID')
  if (!TARGETS.has(command.targetType)) errors.push('targetType is unsupported')
  if (!/^[A-Z][A-Z0-9-]{1,31}$/.test(command.moduleCode)) errors.push('moduleCode is invalid')
  if (!command.idempotencyKey.trim() || command.idempotencyKey.length > 160) errors.push('idempotencyKey is invalid')
  if (command.changeReason.trim().length < 10) errors.push('changeReason must have at least 10 characters')
  return errors
}

export function resolveChecklistEvidenceTarget(command: Pick<ChecklistExecutionCommand, 'moduleCode' | 'targetType' | 'targetId'>) {
  return { moduleCode: command.moduleCode, targetType: command.targetType, targetId: command.targetId } as const
}
