import { useEffect, useState, type FormEvent } from 'react'
import type { DiagnosticJourney } from '../contracts/diagnosticJourney'
import { assignDiagnosticOrganizationLead, getDiagnosticJourney, listDiagnosticOrganizationLeadCandidates, type DiagnosticOrganizationLeadCandidate } from '../data/diagnosticJourneyData'

interface Props {
  journey: DiagnosticJourney
  onUpdated: (journey: DiagnosticJourney) => void
}

/** Governed handover panel; server checks active tenant membership. */
export function DiagnosticOrganizationLeadHandover({ journey, onUpdated }: Props) {
  const [representativeUserId, setRepresentativeUserId] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingCandidates, setLoadingCandidates] = useState(true)
  const [candidates, setCandidates] = useState<DiagnosticOrganizationLeadCandidate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    setLoadingCandidates(true)
    setCandidates([])
    listDiagnosticOrganizationLeadCandidates(journey.organizationId)
      .then(rows => { if (active) setCandidates(rows.filter(row => row.userId !== journey.consultantUserId)) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Nao foi possivel carregar os representantes.') })
      .finally(() => { if (active) setLoadingCandidates(false) })
    return () => { active = false }
  }, [journey.organizationId, journey.consultantUserId])
  const closed = journey.status === 'completed' || journey.status === 'cancelled'
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const valid = uuid.test(representativeUserId.trim()) && candidates.some(row => row.userId === representativeUserId.trim())
    && reason.trim().length >= 10

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || closed || !valid) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await assignDiagnosticOrganizationLead({
        organizationId: journey.organizationId,
        journeyId: journey.id,
        representativeUserId: representativeUserId.trim(),
        changeReason: reason.trim(),
      })
      const updated = await getDiagnosticJourney(journey.organizationId, journey.id)
      if (updated.representativeIsProvisional || updated.organizationRepresentativeUserId !== representativeUserId.trim()) {
        throw new Error('A confirmacao da nova lideranca nao corresponde a solicitacao.')
      }
      onUpdated(updated)
      setMessage('Lideranca organizacional atualizada e registrada em auditoria.')
      setRepresentativeUserId('')
      setReason('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Nao foi possivel transferir a lideranca.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="skda-handover-heading">
      <h3 id="skda-handover-heading">Lideranca organizacional do diagnostico</h3>
      <p>{journey.representativeIsProvisional
        ? 'Representante provisorio: a lideranca SPARKOOP acompanha a organizacao ate a designacao formal.'
        : 'Representante organizacional designado. A lideranca tecnica SPARKOOP permanece independente.'}</p>
      <p>Consultor SPARKOOP: {journey.consultantUserId}</p>
      <p>Representante atual: {journey.organizationRepresentativeUserId ?? 'Nao designado'}</p>
      <form onSubmit={submit}>
        <label htmlFor="skda-new-lead">Novo representante da organizacao</label>
        <select id="skda-new-lead" required value={representativeUserId}
          onChange={event => setRepresentativeUserId(event.target.value)} disabled={saving || closed || loadingCandidates}
          aria-describedby="skda-lead-guidance">
          <option value="">Selecione um representante</option>
          {candidates.map(candidate => <option key={candidate.userId} value={candidate.userId}>{candidate.displayName} ({candidate.email})</option>)}
        </select>
        <p id="skda-lead-guidance">Selecione uma pessoa com vinculo ativo. O servidor verificara novamente a autorizacao no momento da transferencia.</p>
        <label htmlFor="skda-lead-reason">Justificativa da designacao</label>
        <textarea id="skda-lead-reason" required minLength={10} value={reason}
          onChange={event => setReason(event.target.value)} disabled={saving || closed} />
        <button type="submit" disabled={saving || closed || !valid}>
          {saving ? 'Registrando designacao...' : 'Confirmar transferencia de lideranca'}
        </button>
      </form>
      {closed && <p>Esta jornada esta encerrada e nao permite substituicao de lideranca.</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
