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

/** Explicit handover: server validates active organizational membership and writes audit. */
export async function assignDiagnosticOrganizationLead(command: {
  organizationId: string
  journeyId: string
  representativeUserId: string
  changeReason: string
}): Promise<string> {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (![command.organizationId, command.journeyId, command.representativeUserId].every(value => uuid.test(value))) {
    throw new Error('Identificadores da transferencia DA invalidos.')
  }
  if (command.changeReason.trim().length < 10) throw new Error('Justificativa de transferencia insuficiente.')
  const { data, error } = await supabase.rpc('assign_skda_organization_lead', {
    target_organization_id: command.organizationId,
    target_journey_id: command.journeyId,
    target_representative_user_id: command.representativeUserId,
    change_reason: command.changeReason.trim(),
  })
  if (error) throw new Error(error.message)
  if (data !== command.journeyId) throw new Error('Transferencia DA retornou identificador divergente.')
  return data
}

export interface DiagnosticOrganizationLeadCandidate {
  userId: string
  displayName: string
  email: string
}

/** Authorized tenant directory; never query profiles directly from the browser. */
export async function listDiagnosticOrganizationLeadCandidates(organizationId: string): Promise<DiagnosticOrganizationLeadCandidate[]> {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuid.test(organizationId)) throw new Error('Organizacao DA invalida.')
  const { data, error } = await supabase.rpc('list_skda_organization_lead_candidates', { target_organization_id: organizationId })
  if (error) throw new Error(error.message)
  if (!Array.isArray(data)) throw new Error('Diretorio organizacional DA invalido.')
  return data.map((row: unknown) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Candidato DA invalido.')
    const candidate = row as Record<string, unknown>
    if (typeof candidate.user_id !== 'string' || !uuid.test(candidate.user_id)
      || typeof candidate.display_name !== 'string' || !candidate.display_name.trim()
      || typeof candidate.email !== 'string' || !candidate.email.trim()) throw new Error('Candidato DA invalido.')
    return { userId: candidate.user_id, displayName: candidate.display_name, email: candidate.email }
  })
}
