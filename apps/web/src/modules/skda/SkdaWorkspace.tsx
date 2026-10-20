import { useEffect, useMemo, useState } from 'react'
import { TransversalWorkspace } from '../../components/application-shell/TransversalWorkspace'
import { supabase } from '../../lib/supabase'
import './SkdaWorkspace.css'

type Props = {
  organizationId: string
  organizationName: string
  organizationCode: string
  userRoleCode: string
  userRoleName: string
  onReturnToModules: () => void
}

type Diagnosis = {
  id: string
  code: string
  name: string
  description: string | null
  diagnosis_type: string
  reference_year: number | null
  status: string
  current_phase_code: string
  progress: number
  created_at: string
}

type Metrics = { responses: number; interviews: number; evidence: number; findings: number }
type Phase = { code: string; title: string; description: string; statusKey: string }
type Interview = { id: string; code: string; title: string; interviewee_name: string | null; interviewee_role: string | null; status: string; channel: string; scheduled_start: string | null }

const EMPTY: Metrics = { responses: 0, interviews: 0, evidence: 0, findings: 0 }

const PHASES: Phase[] = [
  { code:'DA-00', title:'Abertura e configuração', description:'Define ciclo, escopo, metodologia, responsáveis e catálogo de questões.', statusKey:'preparation' },
  { code:'DA-01', title:'Evidências', description:'Correlaciona evidências transversais ao diagnóstico sem duplicar documentos.', statusKey:'evidence' },
  { code:'DA-02', title:'Entrevistas', description:'Planeja, registra e valida entrevistas e falas relevantes.', statusKey:'interviews' },
  { code:'DA-03', title:'Avaliação por questão', description:'Classifica respostas, maturidade, confiança e validação por questão.', statusKey:'assessment' },
  { code:'DA-04', title:'Achados e lacunas', description:'Consolida forças, lacunas, oportunidades, riscos e observações.', statusKey:'assessment' },
  { code:'DA-05', title:'Recomendações e devolutiva', description:'Transforma achados em recomendações priorizadas e prepara a devolutiva.', statusKey:'validation' },
  { code:'DA-06', title:'Gestão tática', description:'Converte recomendações aprovadas em iniciativas com fato gerador rastreável.', statusKey:'validation' },
]

const STATUS: Record<string,string> = {
  draft:'Rascunho', preparation:'Preparação', evidence:'Evidências',
  interviews:'Entrevistas', assessment:'Avaliação', validation:'Validação',
  completed:'Concluído', archived:'Arquivado',
}

const TYPES: Record<string,string> = {
  pdgc:'PDGC / Avaliacoop', maturity:'Maturidade', custom:'Personalizado', other:'Outro',
}

export function SkdaWorkspace(props: Props) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showInterviewCreate, setShowInterviewCreate] = useState(false)
  const [activePhaseCode, setActivePhaseCode] = useState('DA-00')
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [interviewForm, setInterviewForm] = useState({ code:'', title:'', intervieweeName:'', intervieweeRole:'', channel:'teams', scheduledStart:'' })
  const [form, setForm] = useState({
    code:'', name:'', description:'', diagnosisType:'pdgc',
    referenceYear:String(new Date().getFullYear()),
  })

  const selected = useMemo(
    () => diagnoses.find((item) => item.id === selectedId) ?? null,
    [diagnoses, selectedId],
  )

  const canManage = ['administrator','coordinator'].includes(props.userRoleCode)
  const canEditInterviews = ['administrator','coordinator','diagnostician','interviewer'].includes(props.userRoleCode)

  const loadDiagnoses = async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('skda_diagnoses' as never)
      .select('id,code,name,description,diagnosis_type,reference_year,status,current_phase_code,progress,created_at' as never)
      .eq('organization_id', props.organizationId)
      .is('archived_at', null)
      .order('created_at', { ascending:false })

    if (loadError) {
      setDiagnoses([])
      setError(loadError.message)
      setLoading(false)
      return
    }

    const rows = (data ?? []) as unknown as Diagnosis[]
    setDiagnoses(rows)
    setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null)
    setLoading(false)
  }

  useEffect(() => { void loadDiagnoses() }, [props.organizationId])

  useEffect(() => {
    setActivePhaseCode(selected?.current_phase_code ?? 'DA-00')
  }, [selected?.id, selected?.current_phase_code])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) { setInterviews([]); return }
      const { data } = await supabase
        .from('skda_interviews' as never)
        .select('id,code,title,interviewee_name,interviewee_role,status,channel,scheduled_start' as never)
        .eq('diagnosis_id', selectedId)
        .order('scheduled_start', { ascending:true, nullsFirst:false })
      setInterviews((data ?? []) as unknown as Interview[])
    }
    void run()
  }, [selectedId])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) { setMetrics(EMPTY); return }
      const result = await Promise.all([
        supabase.from('skda_responses' as never).select('id' as never,{count:'exact',head:true}).eq('diagnosis_id',selectedId),
        supabase.from('skda_interviews' as never).select('id' as never,{count:'exact',head:true}).eq('diagnosis_id',selectedId),
        supabase.from('skda_evidence_correlations' as never).select('id' as never,{count:'exact',head:true}).eq('diagnosis_id',selectedId),
        supabase.from('skda_findings' as never).select('id' as never,{count:'exact',head:true}).eq('diagnosis_id',selectedId),
      ])
      setMetrics({
        responses:result[0].count ?? 0, interviews:result[1].count ?? 0,
        evidence:result[2].count ?? 0, findings:result[3].count ?? 0,
      })
    }
    void run()
  }, [selectedId])

  const createInterview = async () => {
    if (!selected || !interviewForm.code.trim() || !interviewForm.title.trim()) {
      setError('Informe código e título da entrevista.')
      return
    }

    setSaving(true)
    setError('')
    const { error: saveError } = await supabase
      .from('skda_interviews' as never)
      .insert({
        organization_id:props.organizationId,
        diagnosis_id:selected.id,
        code:interviewForm.code.trim().toUpperCase(),
        title:interviewForm.title.trim(),
        interviewee_name:interviewForm.intervieweeName.trim() || null,
        interviewee_role:interviewForm.intervieweeRole.trim() || null,
        channel:interviewForm.channel,
        scheduled_start:interviewForm.scheduledStart ? new Date(interviewForm.scheduledStart).toISOString() : null,
        status:'planned',
      } as never)

    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    setInterviewForm({ code:'', title:'', intervieweeName:'', intervieweeRole:'', channel:'teams', scheduledStart:'' })
    setShowInterviewCreate(false)
    const { data } = await supabase
      .from('skda_interviews' as never)
      .select('id,code,title,interviewee_name,interviewee_role,status,channel,scheduled_start' as never)
      .eq('diagnosis_id', selected.id)
      .order('scheduled_start', { ascending:true, nullsFirst:false })
    setInterviews((data ?? []) as unknown as Interview[])
    setMetrics((current) => ({ ...current, interviews:(data ?? []).length }))
  }

  const createDiagnosis = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError('Informe código e nome do diagnóstico.')
      return
    }

    setSaving(true)
    setError('')
    const { data, error: saveError } = await supabase
      .from('skda_diagnoses' as never)
      .insert({
        organization_id:props.organizationId,
        code:form.code.trim().toUpperCase(),
        name:form.name.trim(),
        description:form.description.trim() || null,
        diagnosis_type:form.diagnosisType,
        reference_year:form.referenceYear ? Number(form.referenceYear) : null,
        status:'preparation', current_phase_code:'DA-00', progress:0,
      } as never)
      .select('id' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    setForm({ code:'', name:'', description:'', diagnosisType:'pdgc', referenceYear:String(new Date().getFullYear()) })
    setShowCreate(false)
    await loadDiagnoses()
    const created = data as unknown as { id?: string } | null
    if (created?.id) setSelectedId(created.id)
  }

  const header = (
    <div className="skda-header">
      <div>
        <button type="button" className="skda-back" onClick={props.onReturnToModules}>← Módulos</button>
        <p className="skda-eyebrow">SK-DA · Diagnóstico Assistido</p>
        <h1>{props.organizationName}</h1>
        <p>{props.organizationCode} · {props.userRoleName}</p>
      </div>
      {canManage && <button type="button" className="skda-primary" onClick={() => setShowCreate(true)}>Novo diagnóstico</button>}
    </div>
  )

  const primary = (
    <div>
      <div className="skda-section-title">
        <div><span>Diagnósticos</span><h2>Jornada ativa da organização</h2></div>
        <strong>{diagnoses.length}</strong>
      </div>
      {error && <div className="skda-alert">{error}</div>}
      {loading ? <div className="skda-empty">Carregando diagnósticos...</div> :
       diagnoses.length === 0 ? <div className="skda-empty"><h3>Nenhum diagnóstico iniciado</h3><p>Crie a primeira instância para iniciar a Jornada do SK-DA.</p></div> :
       <div className="skda-list">
        {diagnoses.map((item) => (
          <button type="button" key={item.id} className={item.id===selectedId?'skda-diagnosis active':'skda-diagnosis'} onClick={() => setSelectedId(item.id)}>
            <div><small>{item.code}</small><strong>{item.name}</strong><span>{TYPES[item.diagnosis_type] ?? item.diagnosis_type}{item.reference_year ? ' · '+item.reference_year : ''}</span></div>
            <div className="skda-diagnosis-meta"><b>{STATUS[item.status] ?? item.status}</b><span>{Number(item.progress).toFixed(0)}%</span></div>
          </button>
        ))}
       </div>}
    </div>
  )

  const activePhase = PHASES.find((phase) => phase.code === activePhaseCode) ?? PHASES[0]

  const secondary = selected ? (
    <div className="skda-detail">
      <p className="skda-eyebrow">Diagnóstico selecionado</p>
      <h2>{selected.name}</h2>
      <p>{selected.description || 'Sem descrição informada.'}</p>
      <div className="skda-phase"><span>Fase atual</span><strong>{selected.current_phase_code}</strong><small>{STATUS[selected.status] ?? selected.status}</small></div>
      <div className="skda-metrics">
        <article><span>Questões avaliadas</span><strong>{metrics.responses}</strong></article>
        <article><span>Entrevistas</span><strong>{metrics.interviews}</strong></article>
        <article><span>Evidências correlacionadas</span><strong>{metrics.evidence}</strong></article>
        <article><span>Achados</span><strong>{metrics.findings}</strong></article>
      </div>
      <div className="skda-journey">
        <div className="skda-journey-head"><div><span>Jornada operacional</span><h3>DA-00 → DA-06</h3></div><b>{Number(selected.progress).toFixed(0)}%</b></div>
        <div className="skda-phase-nav" role="tablist" aria-label="Fases do Diagnóstico Assistido">
          {PHASES.map((phase) => (
            <button
              key={phase.code}
              type="button"
              role="tab"
              aria-selected={activePhase.code === phase.code}
              className={activePhase.code === phase.code ? 'active' : ''}
              onClick={() => setActivePhaseCode(phase.code)}
            >
              <small>{phase.code}</small>
              <span>{phase.title}</span>
            </button>
          ))}
        </div>
        <section className="skda-phase-panel" role="tabpanel">
          <div><span>{activePhase.code}</span><h3>{activePhase.title}</h3></div>
          <p>{activePhase.description}</p>
          <div className="skda-phase-summary">
            {activePhase.code === 'DA-01' && <><span>Evidências correlacionadas</span><strong>{metrics.evidence}</strong></>}
            {activePhase.code === 'DA-02' && <><span>Entrevistas registradas</span><strong>{metrics.interviews}</strong></>}
            {activePhase.code === 'DA-03' && <><span>Questões avaliadas</span><strong>{metrics.responses}</strong></>}
            {activePhase.code === 'DA-04' && <><span>Achados registrados</span><strong>{metrics.findings}</strong></>}
            {activePhase.code === 'DA-05' && <><span>Fonte metodológica</span><strong>Achados</strong></>}
            {activePhase.code === 'DA-06' && <><span>Destino da execução</span><strong>Iniciativas</strong></>}
            {activePhase.code === 'DA-00' && <><span>Estado</span><strong>{STATUS[selected.status] ?? selected.status}</strong></>}
          </div>
          {activePhase.code === 'DA-02' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Entrevistas do diagnóstico</h4>{canEditInterviews && <button type="button" className="skda-primary" onClick={() => setShowInterviewCreate(true)}>Nova entrevista</button>}</div>
            {interviews.length === 0 ? <p className="skda-phase-empty">Nenhuma entrevista registrada.</p> : <div className="skda-interview-list">
              {interviews.map((interview) => <article key={interview.id}>
                <div><small>{interview.code}</small><strong>{interview.title}</strong><span>{interview.interviewee_name || 'Entrevistado não informado'}{interview.interviewee_role ? ' · '+interview.interviewee_role : ''}</span></div>
                <div><b>{interview.status === 'planned' ? 'Planejada' : interview.status}</b><span>{interview.scheduled_start ? new Date(interview.scheduled_start).toLocaleString('pt-BR') : 'Sem data'}</span></div>
              </article>)}
            </div>}
          </div>}
        </section>
      </div>
    </div>
  ) : undefined

  return <>
    <TransversalWorkspace className="skda-workspace" header={header} primary={primary} secondary={secondary} />
    {showInterviewCreate && selected && <div className="skda-modal-backdrop">
      <section className="skda-modal" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">DA-02 · Entrevistas</p><h2>Registrar entrevista</h2></div><button type="button" onClick={() => setShowInterviewCreate(false)}>×</button></div>
        <div className="skda-form-grid">
          <label><span>Código *</span><input value={interviewForm.code} onChange={(e)=>setInterviewForm(v=>({...v,code:e.target.value}))} placeholder="ENT-001"/></label>
          <label><span>Canal</span><select value={interviewForm.channel} onChange={(e)=>setInterviewForm(v=>({...v,channel:e.target.value}))}><option value="teams">Teams</option><option value="meet">Google Meet</option><option value="presential">Presencial</option><option value="other">Outro</option></select></label>
          <label className="wide"><span>Título *</span><input value={interviewForm.title} onChange={(e)=>setInterviewForm(v=>({...v,title:e.target.value}))} placeholder="Entrevista com a Diretoria"/></label>
          <label><span>Entrevistado</span><input value={interviewForm.intervieweeName} onChange={(e)=>setInterviewForm(v=>({...v,intervieweeName:e.target.value}))}/></label>
          <label><span>Cargo / papel</span><input value={interviewForm.intervieweeRole} onChange={(e)=>setInterviewForm(v=>({...v,intervieweeRole:e.target.value}))}/></label>
          <label className="wide"><span>Data e hora previstas</span><input type="datetime-local" value={interviewForm.scheduledStart} onChange={(e)=>setInterviewForm(v=>({...v,scheduledStart:e.target.value}))}/></label>
        </div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setShowInterviewCreate(false)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createInterview()}>{saving?'Salvando...':'Registrar entrevista'}</button></div>
      </section>
    </div>}
    {showCreate && <div className="skda-modal-backdrop">
      <section className="skda-modal" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Nova instância</p><h2>Criar Diagnóstico Assistido</h2></div><button type="button" onClick={() => setShowCreate(false)}>×</button></div>
        <div className="skda-form-grid">
          <label><span>Código *</span><input value={form.code} onChange={(e)=>setForm(v=>({...v,code:e.target.value}))} placeholder="DA-2026-001"/></label>
          <label><span>Ano</span><input type="number" min="2000" max="2100" value={form.referenceYear} onChange={(e)=>setForm(v=>({...v,referenceYear:e.target.value}))}/></label>
          <label className="wide"><span>Nome *</span><input value={form.name} onChange={(e)=>setForm(v=>({...v,name:e.target.value}))} placeholder="Diagnóstico PDGC 2027"/></label>
          <label><span>Tipo</span><select value={form.diagnosisType} onChange={(e)=>setForm(v=>({...v,diagnosisType:e.target.value}))}><option value="pdgc">PDGC / Avaliacoop</option><option value="maturity">Maturidade</option><option value="custom">Personalizado</option><option value="other">Outro</option></select></label>
          <label className="wide"><span>Descrição</span><textarea rows={4} value={form.description} onChange={(e)=>setForm(v=>({...v,description:e.target.value}))}/></label>
        </div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setShowCreate(false)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createDiagnosis()}>{saving?'Criando...':'Criar diagnóstico'}</button></div>
      </section>
    </div>}
  </>
}
