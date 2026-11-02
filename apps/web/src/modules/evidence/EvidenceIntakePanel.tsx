import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Props = { organizationId: string; projectId: string; onEvidenceChanged: () => void }
type IntakeSource = {
  id: string
  source_type: string
  source_url: string
  source_label: string
  include_subfolders: boolean
  status: string
  scan_status: string
  last_scan_at: string | null
  last_scan_summary: Record<string, unknown> | null
}
type Candidate = {
  id: string
  source_id: string
  file_name: string
  external_url: string | null
  external_path: string | null
  relevance_score: number | null
  suggested_axis_codes: string[] | null
  suggested_compliance_level: number | null
  suggested_quality_score: number | null
  suggested_completeness_score: number | null
  suggested_currentness_score: number | null
  suggested_reliability_score: number | null
  suggested_overall_score: number | null
  candidate_status: string
  analysis: Record<string, unknown> | null
}
type ChecklistRow = {
  item_id: string
  item_code: string
  item_name: string
}
type RankedRequirement = { id?: string; code?: string; parentId?: string | null; score?: number }
type ReviewState = { checklistItemId: string; complianceLevel: string; notes: string; reason: string }

const complianceLabels: Record<string, string> = {
  '0': '0 · Não atende',
  '1': '1 · Evidência inicial / insuficiente',
  '2': '2 · Atende parcialmente',
  '3': '3 · Atende',
  '4': '4 · Boa prática',
  '5': '5 · Prática madura',
}

function formatScanStatus(value: string) {
  return ({ idle: 'Não varrida', queued: 'Na fila', scanning: 'Varrendo', review_ready: 'Pronta para revisão', completed: 'Concluída', error: 'Erro' } as Record<string, string>)[value] ?? value
}
function rankedRequirements(candidate: Candidate) {
  const raw = candidate.analysis?.ranked_requirements
  return Array.isArray(raw) ? raw as RankedRequirement[] : []
}
export function EvidenceIntakePanel({ organizationId, projectId, onEvidenceChanged }: Props) {
  const [sources, setSources] = useState<IntakeSource[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [checklistRows, setChecklistRows] = useState<ChecklistRow[]>([])
  const [showIntake, setShowIntake] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sourceForm, setSourceForm] = useState({ sourceType: 'sharepoint', url: '', label: '', includeSubfolders: true, reason: '' })
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({})
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [sourceResponse, candidateResponse, checklistResponse] = await Promise.all([
      supabase.from('sparks_evidence_intake_sources').select('id,source_type,source_url,source_label,include_subfolders,status,scan_status,last_scan_at,last_scan_summary').eq('organization_id', organizationId).order('created_at', { ascending: false }),
      supabase.from('sparks_evidence_intake_candidates').select('id,source_id,file_name,external_url,external_path,relevance_score,suggested_axis_codes,suggested_compliance_level,suggested_quality_score,suggested_completeness_score,suggested_currentness_score,suggested_reliability_score,suggested_overall_score,candidate_status,analysis').eq('organization_id', organizationId).in('candidate_status', ['proposed', 'discovered']).order('relevance_score', { ascending: false }),
      supabase.rpc('get_skpe_evidence_checklist', { target_organization_id: organizationId, target_project_id: projectId }),
    ])
    if (sourceResponse.error) throw sourceResponse.error
    if (candidateResponse.error) throw candidateResponse.error
    if (checklistResponse.error) throw checklistResponse.error
    setSources((sourceResponse.data ?? []) as IntakeSource[])
    const nextCandidates = (candidateResponse.data ?? []) as Candidate[]
    setCandidates(nextCandidates)
    setChecklistRows(((checklistResponse.data ?? []) as Array<Record<string, unknown>>).map((row) => ({ item_id: String(row.item_id), item_code: String(row.item_code), item_name: String(row.item_name) })))
  }, [organizationId, projectId])

  useEffect(() => {
    void refresh().catch(() => setMessage('Não foi possível carregar as origens documentais e candidatos.'))
  }, [refresh])
  const checklistByCode = useMemo(() => new Map(checklistRows.map((row) => [row.item_code, row])), [checklistRows])

  function defaultReview(candidate: Candidate): ReviewState {
    const bestCode = rankedRequirements(candidate).find((item) => item.code)?.code ?? ''
    const item = bestCode ? checklistByCode.get(bestCode) : null
    return {
      checklistItemId: item?.item_id ?? '',
      complianceLevel: String(candidate.suggested_compliance_level ?? 0),
      notes: '',
      reason: 'Validação humana da evidência descoberta no intake documental.',
    }
  }

  function reviewFor(candidate: Candidate) {
    return reviews[candidate.id] ?? defaultReview(candidate)
  }

  function updateReview(candidate: Candidate, patch: Partial<ReviewState>) {
    setReviews((current) => ({ ...current, [candidate.id]: { ...reviewFor(candidate), ...patch } }))
  }

  async function scanSource(sourceId: string, reason: string) {
    if (reason.trim().length < 10) { setMessage('Informe uma justificativa com pelo menos 10 caracteres.'); return }
    setLoading(true)
    setMessage('')
    try {
      const { error: queueError } = await supabase.rpc('queue_sparks_evidence_intake_scan', { target_source_id: sourceId, change_reason: reason.trim() })
      if (queueError) throw queueError
      const { data, error: scanError } = await supabase.functions.invoke('evidence-intake-scan', { body: { action: 'scan_source', sourceId } })
      if (scanError) throw scanError
      if (data?.error) throw new Error(String(data.error))
      setMessage(`Varredura concluída: ${data?.discovered ?? 0} documento(s) descoberto(s), ${data?.proposed ?? 0} candidato(s) priorizado(s) para revisão.`)
      await refresh()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Não foi possível concluir a varredura.')
    } finally {
      setLoading(false)
    }
  }
  async function registerAndScanSource() {
    if (!sourceForm.url.trim() || !sourceForm.label.trim()) { setMessage('Informe a URL/caminho e um nome para a origem documental.'); return }
    if (sourceForm.reason.trim().length < 10) { setMessage('Informe uma justificativa com pelo menos 10 caracteres.'); return }
    setLoading(true)
    setMessage('')
    try {
      const { data: sourceId, error: registerError } = await supabase.rpc('register_sparks_evidence_intake_source', {
        target_organization_id: organizationId,
        target_project_id: projectId,
        target_source_type: sourceForm.sourceType,
        target_source_url: sourceForm.url.trim(),
        target_source_label: sourceForm.label.trim(),
        target_include_subfolders: sourceForm.includeSubfolders,
        change_reason: sourceForm.reason.trim(),
      })
      if (registerError) throw registerError
      if (!sourceId) throw new Error('A origem documental não foi registrada.')
      setSourceForm((current) => ({ ...current, reason: '' }))
      await scanSource(String(sourceId), 'Varredura solicitada após cadastro da origem documental.')
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Não foi possível registrar a origem documental.')
      setLoading(false)
    }
  }

  async function acceptCandidate(candidate: Candidate) {
    const review = reviewFor(candidate)
    if (!review.checklistItemId) { setMessage('Selecione o requisito/prática que esta evidência sustenta.'); return }
    if (review.reason.trim().length < 10) { setMessage('Informe uma justificativa de validação com pelo menos 10 caracteres.'); return }
    setReviewingId(candidate.id)
    setMessage('')
    try {
      const { error } = await supabase.rpc('accept_sparks_evidence_intake_candidate', {
        target_candidate_id: candidate.id,
        target_project_id: projectId,
        target_checklist_item_id: review.checklistItemId,
        target_compliance_level: Number(review.complianceLevel),
        target_quality_score: candidate.suggested_quality_score,
        target_completeness_score: candidate.suggested_completeness_score,
        target_currentness_score: candidate.suggested_currentness_score,
        target_reliability_score: candidate.suggested_reliability_score,
        target_overall_score: candidate.suggested_overall_score,
        target_review_notes: review.notes.trim() || null,
        change_reason: review.reason.trim(),
      })
      if (error) throw error
      setMessage('Evidência validada, incorporada ao acervo transversal e associada ao requisito do SK-PE.')
      await refresh()
      onEvidenceChanged()
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Não foi possível incorporar a evidência.')
    } finally {
      setReviewingId(null)
    }
  }
  return (
    <section className="skpe-evidence-intake">
      <header className="skpe-evidence-intake__header">
        <div>
          <span className="skpe-evidence-section__eyebrow">Intake inteligente · SK-DOC → SK-PE</span>
          <h3>Varrer fontes documentais e descobrir evidências</h3>
          <p>Informe uma biblioteca/pasta do SharePoint ou outra URL autorizada. O SPARKs descobre documentos, preserva origem e propõe eixos, requisitos e potencial de atendimento para revisão humana.</p>
        </div>
        <button type="button" className="skpe-evidence-checklist-button" onClick={() => setShowIntake((value) => !value)}>
          {showIntake ? 'Fechar intake' : 'Varrer fonte documental'}
        </button>
      </header>

      <div className="skpe-evidence-intake__rule">
        <strong>Regra de governança:</strong> classificação e pontuação automáticas são apenas sugestões. Nenhum critério é considerado atendido até validação humana. O documento permanece sob autoridade do SK-DOC; o SK-PE registra somente seu uso e suficiência estratégica.
      </div>

      {message ? <div className="skpe-evidence-intake__message" role="status">{message}</div> : null}

      {showIntake ? (
        <div className="skpe-evidence-intake__body">
          <section className="skpe-evidence-intake-source-form">
            <div className="skpe-evidence-intake-source-grid">
              <label><span>Tipo de origem</span><select value={sourceForm.sourceType} onChange={(event) => setSourceForm({ ...sourceForm, sourceType: event.target.value })}><option value="sharepoint">SharePoint</option><option value="web_url">URL direta</option><option value="network_path">Diretório de rede</option><option value="other">Outra origem</option></select></label>
              <label className="wide"><span>URL / caminho *</span><input value={sourceForm.url} onChange={(event) => setSourceForm({ ...sourceForm, url: event.target.value })} placeholder="https://...sharepoint.com/... ou URL autorizada" /></label>
              <label><span>Nome da origem *</span><input value={sourceForm.label} onChange={(event) => setSourceForm({ ...sourceForm, label: event.target.value })} placeholder="Ex.: Acervo institucional" /></label>
              <label className="check"><input type="checkbox" checked={sourceForm.includeSubfolders} onChange={(event) => setSourceForm({ ...sourceForm, includeSubfolders: event.target.checked })} /><span>Incluir subpastas</span></label>
              <label className="wide"><span>Justificativa / contexto *</span><textarea value={sourceForm.reason} onChange={(event) => setSourceForm({ ...sourceForm, reason: event.target.value })} placeholder="Ex.: varredura do acervo institucional para identificar evidências relevantes ao diagnóstico estratégico." /></label>
            </div>
            <button type="button" className="primary" disabled={loading} onClick={() => void registerAndScanSource()}>{loading ? 'Processando...' : 'Registrar origem e varrer'}</button>
          </section>
          {sources.length > 0 ? (
            <section className="skpe-evidence-intake-sources">
              <h4>Origens cadastradas</h4>
              <div className="skpe-evidence-intake-source-list">
                {sources.map((source) => (
                  <article key={source.id}>
                    <div>
                      <strong>{source.source_label}</strong>
                      <span>{source.source_type === 'sharepoint' ? 'SharePoint' : source.source_type === 'web_url' ? 'URL direta' : source.source_type}</span>
                      <small>{source.source_url}</small>
                      <small>Situação da varredura: {formatScanStatus(source.scan_status)}</small>
                    </div>
                    <button type="button" disabled={loading} onClick={() => void scanSource(source.id, 'Nova varredura manual da origem documental cadastrada.')}>Varrer novamente</button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="skpe-evidence-intake-candidates">
            <header>
              <div><span className="skpe-evidence-section__eyebrow">Triagem e validação humana</span><h4>Documentos candidatos a evidência</h4></div>
              <p>{candidates.length} documento(s) aguardando triagem ou validação.</p>
            </header>
            {candidates.length === 0 ? <div className="skpe-evidence-intake-empty">Nenhum candidato pendente. Execute uma varredura para descobrir documentos relevantes.</div> : (
              <div className="skpe-evidence-intake-candidate-list">
                {candidates.map((candidate) => {
                  const review = reviewFor(candidate)
                  const ranked = rankedRequirements(candidate)
                  const suggestedCodes = ranked.filter((item) => item.code).map((item) => String(item.code)).join(' · ')
                  return (
                    <article key={candidate.id}>
                      <div className="skpe-evidence-intake-candidate-main">
                        <div><strong>{candidate.file_name}</strong><small>{candidate.external_path ?? 'Origem sem caminho detalhado'}</small></div>
                        <div className="skpe-evidence-intake-score"><span>Relevância sugerida</span><strong>{candidate.relevance_score == null ? '-' : `${Math.round(candidate.relevance_score)}%`}</strong></div>
                        <div className="skpe-evidence-intake-score"><span>Potencial de atendimento</span><strong>{candidate.suggested_compliance_level ?? 0}/5</strong></div>
                      </div>
                      <div className="skpe-evidence-intake-suggestions">
                        <span><b>Eixos sugeridos:</b> {(candidate.suggested_axis_codes ?? []).join(' · ') || 'A confirmar'}</span>
                        <span><b>Requisitos candidatos:</b> {suggestedCodes || 'A confirmar'}</span>
                        {candidate.external_url ? <a href={candidate.external_url} target="_blank" rel="noreferrer">Abrir documento na origem</a> : null}
                      </div>
                      <div className="skpe-evidence-intake-review-grid">
                        <label className="wide"><span>Requisito / prática validada *</span><select value={review.checklistItemId} onChange={(event) => updateReview(candidate, { checklistItemId: event.target.value })}><option value="">Selecione</option>{checklistRows.map((row) => <option key={row.item_id} value={row.item_id}>{row.item_code} · {row.item_name}</option>)}</select></label>
                        <label><span>Atendimento validado *</span><select value={review.complianceLevel} onChange={(event) => updateReview(candidate, { complianceLevel: event.target.value })}>{Object.entries(complianceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        <label className="wide"><span>Notas da validação</span><textarea value={review.notes} onChange={(event) => updateReview(candidate, { notes: event.target.value })} placeholder="Registre o que a evidência comprova, o que ainda não comprova e eventuais lacunas." /></label>
                        <label className="wide"><span>Justificativa para auditoria *</span><textarea value={review.reason} onChange={(event) => updateReview(candidate, { reason: event.target.value })} /></label>
                      </div>
                      <div className="skpe-evidence-intake-review-actions">
                        <span>A sugestão automática não altera maturidade até esta validação.</span>
                        <button type="button" className="primary" disabled={reviewingId === candidate.id} onClick={() => void acceptCandidate(candidate)}>{reviewingId === candidate.id ? 'Incorporando...' : 'Validar e incorporar'}</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </section>
  )
}
