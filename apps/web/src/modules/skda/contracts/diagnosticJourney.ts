/** SK-DA native journey contract. CORE initiative and checklist identities are shared. */
export const diagnosticJourneyKinds = ['assisted_diagnosis', 'self_assessment', 'improvement_plan', 'monitoring'] as const
export type DiagnosticJourneyKind = (typeof diagnosticJourneyKinds)[number]
export type DiagnosticJourneyStatus = 'draft' | 'preparation' | 'in_progress' | 'validation' | 'completed' | 'cancelled'

export interface DiagnosticJourney {
  id: string
  organizationId: string
  instrumentId: string
  assessmentCycleId: string
  kind: DiagnosticJourneyKind
  status: DiagnosticJourneyStatus
  initiativeId: string
  checklistExecutionId: string | null
  consultantUserId: string
  organizationRepresentativeUserId: string | null
  representativeIsProvisional: boolean
}

export interface DiagnosticJourneyOpeningCommand {
  organizationId: string
  instrumentId: string
  assessmentCycleId: string
  kind: DiagnosticJourneyKind
  consultantUserId: string
  provisionalRepresentativeUserId: string
  idempotencyKey: string
  changeReason: string
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Frontend checks only. Backend must authorize identities, org and module. */
export function validateDiagnosticJourneyOpening(command: DiagnosticJourneyOpeningCommand): string[] {
  const errors: string[] = []
  for (const key of ['organizationId', 'instrumentId', 'assessmentCycleId', 'consultantUserId', 'provisionalRepresentativeUserId'] as const) {
    if (!UUID.test(command[key])) errors.push(`${key}: UUID inválido`)
  }
  if (!diagnosticJourneyKinds.includes(command.kind)) errors.push('Jornada não reconhecida')
  if (command.idempotencyKey.trim().length === 0 || command.idempotencyKey.trim().length > 160) errors.push('Chave idempotente inválida')
  if (command.changeReason.trim().length < 10) errors.push('Justificativa insuficiente')
  return errors
}

export function mayApproveAsOrganizationRepresentative(journey: DiagnosticJourney, actorUserId: string): boolean {
  return !journey.representativeIsProvisional && journey.organizationRepresentativeUserId === actorUserId
}
