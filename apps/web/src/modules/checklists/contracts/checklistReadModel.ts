import type { ChecklistExecutionStatus, ChecklistItemStatus } from './checklistEngine'

/** Read model for a module-neutral checklist screen. No direct table access is implied. */
export interface ChecklistExecutionSummary {
  id: string
  organizationId: string
  moduleCode: string
  templateVersionId: string
  targetType: string
  targetId: string
  status: ChecklistExecutionStatus
  createdAt: string
}

export interface ChecklistExecutionItemView {
  id: string
  templateItemId: string
  code: string
  name: string
  description: string | null
  required: boolean
  displayOrder: number
  status: ChecklistItemStatus
  assignedUserId: string | null
  dueDate: string | null
  justification: string | null
  evidenceCount: number
}

export interface ChecklistExecutionView {
  execution: ChecklistExecutionSummary
  items: readonly ChecklistExecutionItemView[]
}

export interface ChecklistProgress {
  total: number
  resolved: number
  pending: number
  blocked: number
  requiredPending: number
  percent: number
}

export function calculateChecklistProgress(items: readonly ChecklistExecutionItemView[]): ChecklistProgress {
  const resolvedStatuses: ReadonlySet<ChecklistItemStatus> = new Set(['fulfilled', 'not_applicable', 'partially_fulfilled', 'not_fulfilled'])
  const total = items.length
  const resolved = items.filter((item) => resolvedStatuses.has(item.status)).length
  const blocked = items.filter((item) => item.status === 'blocked').length
  const requiredPending = items.filter((item) => item.required && (
    item.status !== 'fulfilled' && (item.status !== 'not_applicable' || (item.justification?.trim().length ?? 0) < 10)
  )).length
  return { total, resolved, pending: total - resolved, blocked, requiredPending, percent: total === 0 ? 0 : Math.round(100 * resolved / total) }
}

export const checklistStatusLabels: Record<ChecklistExecutionStatus, string> = {
  draft: 'Rascunho',
  in_progress: 'Em execução',
  under_review: 'Em revisão',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const checklistItemStatusLabels: Record<ChecklistItemStatus, string> = {
  not_started: 'Não iniciado',
  in_progress: 'Em andamento',
  fulfilled: 'Atendido',
  partially_fulfilled: 'Parcialmente atendido',
  not_fulfilled: 'Não atendido',
  not_applicable: 'Não aplicável',
  blocked: 'Bloqueado',
}
