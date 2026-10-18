import { supabase } from '../../../lib/supabase'
import { parseDiagnosticJourney } from '../contracts/diagnosticJourneyRead'
import { validateDiagnosticJourneyOpening, type DiagnosticJourney, type DiagnosticJourneyOpeningCommand } from '../contracts/diagnosticJourney'

/** Server RPC owns permissions, module gating, transaction and idempotency. */
export async function openDiagnosticJourney(command: DiagnosticJourneyOpeningCommand): Promise<string> {
  const errors = validateDiagnosticJourneyOpening(command)
  if (errors.length) throw new Error(errors.join('; '))
  const { data, error } = await supabase.rpc('create_skda_journey', {
    target_organization_id: command.organizationId,
    target_instrument_id: command.instrumentId,
    target_assessment_cycle_id: command.assessmentCycleId,
    target_journey_kind: command.kind,
    target_consultant_user_id: command.consultantUserId,
    target_provisional_representative_user_id: command.provisionalRepresentativeUserId,
    target_idempotency_key: command.idempotencyKey.trim(),
    change_reason: command.changeReason.trim(),
  })
  if (error) throw new Error(error.message)
  if (typeof data !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data)) {
    throw new Error('A abertura DA nao retornou identificador valido.')
  }
  return data
}

export async function getDiagnosticJourney(organizationId: string, journeyId: string): Promise<DiagnosticJourney> {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuid.test(organizationId) || !uuid.test(journeyId)) throw new Error('Identificadores DA invalidos.')
  const { data, error } = await supabase.rpc('get_skda_journey', {
    target_organization_id: organizationId,
    target_journey_id: journeyId,
  })
  if (error) throw new Error(error.message)
  const journey = parseDiagnosticJourney(data)
  if (journey.organizationId !== organizationId || journey.id !== journeyId) throw new Error('Resposta DA fora do escopo solicitado.')
  return journey
}
