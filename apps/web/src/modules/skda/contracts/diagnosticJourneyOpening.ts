import { validateDiagnosticJourneyOpening, type DiagnosticJourneyOpeningCommand } from './diagnosticJourney.ts'

/** DA journeys are operational SPARKs initiatives, never SK-PE strategic projects. */
export interface DiagnosticInitiativeCreationPlan {
  target_organization_id: string
  target_initiative_class: 'project'
  target_category_code: 'operational'
  target_name: string
  target_proposal_origin: 'module'
  target_source_module_code: 'SK-DA'
  target_proposal_source_reference: string
  change_reason: string
}

export function planDiagnosticInitiative(command: DiagnosticJourneyOpeningCommand): DiagnosticInitiativeCreationPlan {
  const errors = validateDiagnosticJourneyOpening(command)
  if (errors.length > 0) throw new Error(errors.join('; '))
  const key = command.idempotencyKey.trim()
  return {
    target_organization_id: command.organizationId,
    target_initiative_class: 'project',
    target_category_code: 'operational',
    target_name: `Jornada DA - ${command.kind}`,
    target_proposal_origin: 'module',
    target_source_module_code: 'SK-DA',
    target_proposal_source_reference: key,
    change_reason: command.changeReason.trim(),
  }
}

/** Not an orchestration API: creating the initiative and journey requires one server transaction. */
export function diagnosticJourneyOpeningRequiresAtomicRpc(): true {
  return true
}
