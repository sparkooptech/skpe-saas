import { diagnosticJourneyKinds, type DiagnosticJourney } from './diagnosticJourney.ts'

/** Only accepts the known governed read shape; never treats arbitrary JSON as a journey. */
export function parseDiagnosticJourney(value: unknown): DiagnosticJourney {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Resposta DA invalida.')
  const row = value as Record<string, unknown>
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  for (const field of ['id','organizationId','instrumentId','assessmentCycleId','initiativeId','consultantUserId'] as const) {
    if (typeof row[field] !== 'string' || !uuid.test(row[field])) throw new Error(`Campo DA invalido: ${field}`)
  }
  if (!diagnosticJourneyKinds.includes(row.kind as DiagnosticJourney['kind'])) throw new Error('Modalidade DA invalida.')
  if (!['draft','preparation','in_progress','validation','completed','cancelled'].includes(String(row.status))) throw new Error('Situacao DA invalida.')
  for (const field of ['checklistExecutionId','organizationRepresentativeUserId'] as const) {
    if (row[field] !== null && (typeof row[field] !== 'string' || !uuid.test(row[field]))) throw new Error(`Campo DA invalido: ${field}`)
  }
  if (typeof row.representativeIsProvisional !== 'boolean') throw new Error('Papel organizacional DA invalido.')
  return row as unknown as DiagnosticJourney
}
