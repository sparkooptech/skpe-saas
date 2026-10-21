import { useEffect, useMemo, useState } from 'react'
import { ApplicationShell } from '../../components/application-shell/ApplicationShell'
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
  catalog_version_id: string | null
  reference_year: number | null
  status: string
  current_phase_code: string
  progress: number
  created_at: string
}

type Metrics = { responses: number; interviews: number; evidence: number; findings: number }
type Phase = { code: string; title: string; description: string; statusKey: string }
type Interview = { id: string; code: string; title: string; interviewee_name: string | null; interviewee_role: string | null; status: string; channel: string; scheduled_start: string | null }
type EvidenceAsset = { id: string; title: string; evidence_type: string; validation_status: string; reliability_level: string; reference_date: string | null }
type EvidenceCorrelation = { id: string; evidence_asset_id: string; usage_type: string; validation_status: string }
type CatalogVersion = { id: string; code: string; version_code: string; name: string; framework_code: string }
type Question = { id: string; code: string; axis_name: string | null; criterion_name: string | null; question_text: string; display_order: number }
type Response = { id: string; question_id: string; classification: string; response_status: string; answer_text: string | null; confidence_level: string; maturity_level: string | null; score: number | null }
type Finding = { id: string; finding_type: string; title: string; description: string; priority: string; status: string; recommendation: string | null; question_id: string | null }

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

const EVIDENCE_TYPES: Record<string,string> = {
  document:'Documento', dataset:'Base de dados', indicator:'Indicador', self_assessment:'Autoavaliação',
  assisted_diagnosis:'Diagnóstico assistido', action_plan:'Plano de ação', interview:'Entrevista', workshop:'Oficina',
  bmc:'BMC', vpc:'VPC', benchmark:'Benchmark', market_study:'Estudo de mercado', legal_reference:'Referência legal',
  image:'Imagem', audio:'Áudio', video:'Vídeo', other:'Outro',
}

const EVIDENCE_STATUS: Record<string,string> = {
  pending:'Pendente', under_review:'Em revisão', validated:'Validada', rejected:'Rejeitada', outdated:'Desatualizada', superseded:'Substituída',
}

const RELIABILITY: Record<string,string> = {
  not_assessed:'Não avaliada', very_low:'Muito baixa', low:'Baixa', moderate:'Moderada', high:'Alta', very_high:'Muito alta',
}

const CLASSIFICATION: Record<string,string> = {
  confirmed:'Confirmada', reported:'Relatada', gap:'Lacuna', not_applicable:'Não aplicável', not_evaluated:'Não avaliada',
}

const FINDING_TYPES: Record<string,string> = {
  strength:'Força', gap:'Lacuna', opportunity:'Oportunidade', risk:'Risco', observation:'Observação',
}

const PRIORITIES: Record<string,string> = { low:'Baixa', medium:'Média', high:'Alta', critical:'Crítica' }

const INITIATIVE_CLASSES: Record<string,string> = {
  initiative:'Iniciativa', program:'Programa', project:'Projeto', structuring_action:'Ação estruturante',
  process:'Processo', sprint:'Sprint', task:'Tarefa', work:'Trabalho',
}

const EXECUTION_MODELS: Record<string,string> = {
  project_management:'Gestão de Projetos', sipoc:'SIPOC', sprint:'Sprint', task:'Tarefas', custom:'Personalizado',
}

const TACTICAL_CAPABILITIES: Record<string,string> = {
  kanban:'Kanban', pdca:'PDCA', '5w2w':'5W2W', risks:'Riscos',
}

function tacticalDefaults(initiativeClass: string) {
  switch (initiativeClass) {
    case 'program': return { categoryCode:'strategic', primaryModelCode:'project_management', capabilities:['kanban','5w2w','risks'] }
    case 'project': return { categoryCode:'strategic', primaryModelCode:'project_management', capabilities:['kanban','5w2w','risks'] }
    case 'structuring_action': return { categoryCode:'strategic', primaryModelCode:'task', capabilities:['kanban','pdca','5w2w'] }
    case 'process': return { categoryCode:'process', primaryModelCode:'sipoc', capabilities:['pdca','5w2w','risks'] }
    case 'sprint': return { categoryCode:'operational', primaryModelCode:'sprint', capabilities:['kanban','pdca','risks'] }
    case 'task': return { categoryCode:'operational', primaryModelCode:'task', capabilities:['kanban','5w2w'] }
    case 'work': return { categoryCode:'operational', primaryModelCode:'task', capabilities:['kanban','5w2w'] }
    default: return { categoryCode:'operational', primaryModelCode:'task', capabilities:['kanban','5w2w'] }
  }
}

export function SkdaWorkspace(props: Props) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<Metrics>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shellCollapsed, setShellCollapsed] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showInterviewCreate, setShowInterviewCreate] = useState(false)
  const [showFindingCreate, setShowFindingCreate] = useState(false)
  const [validationFindingId, setValidationFindingId] = useState<string | null>(null)
  const [validationReason, setValidationReason] = useState('')
  const [showTacticalCreate, setShowTacticalCreate] = useState(false)
  const [activePhaseCode, setActivePhaseCode] = useState('DA-00')
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [evidenceAssets, setEvidenceAssets] = useState<EvidenceAsset[]>([])
  const [evidenceCorrelations, setEvidenceCorrelations] = useState<EvidenceCorrelation[]>([])
  const [catalogs, setCatalogs] = useState<CatalogVersion[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [interviewForm, setInterviewForm] = useState({ code:'', title:'', intervieweeName:'', intervieweeRole:'', channel:'teams', scheduledStart:'' })
  const [findingForm, setFindingForm] = useState({ findingType:'gap', title:'', description:'', priority:'medium', recommendation:'', questionId:'' })
  const [tacticalForm, setTacticalForm] = useState({
    findingId:'', initiativeClass:'project', categoryCode:'strategic', code:'', name:'', description:'',
    priority:'medium', criticality:'medium', primaryModelCode:'project_management', impactLevel:'medium',
    contributionWeight:'100', enabledCapabilities:['kanban','5w2w','risks'] as string[], changeReason:'',
  })
  const [form, setForm] = useState({
    code:`DA-${new Date().getFullYear()}`,
    name:`Jornada DA ${new Date().getFullYear()}`,
    description:'Jornada de Diagnóstico Assistido do ciclo de referência.',
    diagnosisType:'pdgc',
    referenceYear:String(new Date().getFullYear()),
  })

  const selected = useMemo(
    () => diagnoses.find((item) => item.id === selectedId) ?? null,
    [diagnoses, selectedId],
  )

  const assessedResponses = useMemo(
    () => responses.filter((item) => item.classification !== 'not_evaluated'),
    [responses],
  )

  const assessmentCoverage = useMemo(
    () => questions.length > 0
      ? Math.round((assessedResponses.length / questions.length) * 100)
      : 0,
    [assessedResponses.length, questions.length],
  )

  const findingsByType = useMemo(() => {
    const counts: Record<string, number> = {
      strength:0, gap:0, opportunity:0, risk:0, observation:0,
    }
    findings.forEach((finding) => {
      counts[finding.finding_type] = (counts[finding.finding_type] ?? 0) + 1
    })
    return counts
  }, [findings])

  const maturityByAxis = useMemo(() => {
    const grouped = new Map<string, number[]>()
    questions.forEach((question) => {
      const response = responses.find((item) => item.question_id === question.id)
      if (response?.score == null || !Number.isFinite(Number(response.score))) return
      const axis = question.axis_name?.trim() || 'Sem eixo'
      const values = grouped.get(axis) ?? []
      values.push(Number(response.score))
      grouped.set(axis, values)
    })
    return [...grouped.entries()]
      .map(([axis, values]) => ({
        axis,
        score: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      }))
      .slice(0, 6)
  }, [questions, responses])

  const radarPoints = useMemo(() => {
    const count = Math.max(maturityByAxis.length, 3)
    const values = maturityByAxis.length > 0
      ? maturityByAxis.map((item) => Math.max(0, Math.min(100, item.score)))
      : Array.from({ length: count }, () => 0)
    return values.map((value, index) => {
      const angle = (-Math.PI / 2) + (index * 2 * Math.PI / values.length)
      const radius = 72 * (value / 100)
      return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`
    }).join(' ')
  }, [maturityByAxis])

  const canManage = ['administrator','coordinator'].includes(props.userRoleCode)
  const canEditInterviews = ['administrator','coordinator','interviewer'].includes(props.userRoleCode)
  const canLinkEvidence = ['administrator','coordinator','diagnostician','interviewer'].includes(props.userRoleCode)
  const canEditAssessment = ['administrator','coordinator','diagnostician'].includes(props.userRoleCode)
  const canEditFindings = ['administrator','coordinator','diagnostician','reviewer'].includes(props.userRoleCode)
  const canValidateFindings = ['administrator','coordinator','reviewer'].includes(props.userRoleCode)
  const canCreateTactical = ['administrator','coordinator'].includes(props.userRoleCode)

  const loadDiagnoses = async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('skda_diagnoses' as never)
      .select('id,code,name,description,diagnosis_type,catalog_version_id,reference_year,status,current_phase_code,progress,created_at' as never)
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
    const run = async () => {
      const { data } = await supabase
        .from('skda_catalog_versions' as never)
        .select('id,code,version_code,name,framework_code' as never)
        .eq('status', 'published')
        .order('effective_from', { ascending:false, nullsFirst:false })
      setCatalogs((data ?? []) as unknown as CatalogVersion[])
    }
    void run()
  }, [])

  useEffect(() => {
    const run = async () => {
      if (!selected?.catalog_version_id) { setQuestions([]); setResponses([]); return }
      const [questionsResult, responsesResult] = await Promise.all([
        supabase
          .from('skda_questions' as never)
          .select('id,code,axis_name,criterion_name,question_text,display_order' as never)
          .eq('catalog_version_id', selected.catalog_version_id)
          .order('display_order', { ascending:true }),
        supabase
          .from('skda_responses' as never)
          .select('id,question_id,classification,response_status,answer_text,confidence_level,maturity_level,score' as never)
          .eq('diagnosis_id', selected.id),
      ])
      setQuestions((questionsResult.data ?? []) as unknown as Question[])
      setResponses((responsesResult.data ?? []) as unknown as Response[])
    }
    void run()
  }, [selected?.id, selected?.catalog_version_id])

  useEffect(() => {
    setActivePhaseCode(selected?.current_phase_code ?? 'DA-00')
  }, [selected?.id, selected?.current_phase_code])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) { setEvidenceAssets([]); setEvidenceCorrelations([]); return }
      const [assetsResult, correlationsResult] = await Promise.all([
        supabase
          .from('sparks_evidence_assets' as never)
          .select('id,title,evidence_type,validation_status,reliability_level,reference_date' as never)
          .eq('organization_id', props.organizationId)
          .is('archived_at', null)
          .order('updated_at', { ascending:false }),
        supabase
          .from('skda_evidence_correlations' as never)
          .select('id,evidence_asset_id,usage_type,validation_status' as never)
          .eq('diagnosis_id', selectedId),
      ])
      setEvidenceAssets((assetsResult.data ?? []) as unknown as EvidenceAsset[])
      setEvidenceCorrelations((correlationsResult.data ?? []) as unknown as EvidenceCorrelation[])
    }
    void run()
  }, [selectedId, props.organizationId])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) { setFindings([]); return }
      const { data } = await supabase
        .from('skda_findings' as never)
        .select('id,finding_type,title,description,priority,status,recommendation,question_id' as never)
        .eq('diagnosis_id', selectedId)
        .order('created_at', { ascending:false })
      setFindings((data ?? []) as unknown as Finding[])
    }
    void run()
  }, [selectedId])

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

  const assignCatalog = async (catalogVersionId: string) => {
    if (!selected || !canManage) return
    setSaving(true)
    setError('')
    const { error: saveError } = await supabase
      .from('skda_diagnoses' as never)
      .update({ catalog_version_id:catalogVersionId || null } as never)
      .eq('id', selected.id)
      .eq('organization_id', props.organizationId)
    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    await loadDiagnoses()
  }

  const saveClassification = async (question: Question, classification: string) => {
    if (!selected || !canEditAssessment) return
    setSaving(true)
    setError('')
    const hadResponse = responses.some((item) => item.question_id === question.id)
    const { data, error: saveError } = await supabase
      .from('skda_responses' as never)
      .upsert({
        organization_id:props.organizationId,
        diagnosis_id:selected.id,
        question_id:question.id,
        classification,
        response_status:'draft',
      } as never, { onConflict:'diagnosis_id,question_id' })
      .select('id,question_id,classification,response_status,answer_text,confidence_level,maturity_level,score' as never)
      .single()
    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    const saved = data as unknown as Response
    setResponses((current) => [...current.filter((item) => item.question_id !== question.id), saved])
    setMetrics((current) => ({ ...current, responses:hadResponse ? current.responses : current.responses + 1 }))
  }

  const linkEvidence = async (asset: EvidenceAsset) => {
    if (!selected) return
    if (evidenceCorrelations.some((item) => item.evidence_asset_id === asset.id)) return

    setSaving(true)
    setError('')
    const { data, error: saveError } = await supabase
      .from('skda_evidence_correlations' as never)
      .insert({
        organization_id:props.organizationId,
        diagnosis_id:selected.id,
        evidence_asset_id:asset.id,
        target_type:'diagnosis',
        target_id:selected.id,
        usage_type:'support',
        relevance_level:'important',
        validation_status:'pending',
      } as never)
      .select('id,evidence_asset_id,usage_type,validation_status' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    const created = data as unknown as EvidenceCorrelation
    setEvidenceCorrelations((current) => [...current, created])
    setMetrics((current) => ({ ...current, evidence:current.evidence + 1 }))
  }

  const openValidation = (finding: Finding) => {
    setValidationFindingId(finding.id)
    setValidationReason(`Validação da recomendação do achado ${finding.title}.`)
    setError('')
  }

  const acceptRecommendation = async () => {
    if (!validationFindingId || validationReason.trim().length < 10) {
      setError('Informe uma justificativa de validação com pelo menos 10 caracteres.')
      return
    }

    setSaving(true)
    setError('')
    const { error: saveError } = await supabase.rpc(
      'accept_skda_finding_recommendation' as never,
      {
        target_organization_id:props.organizationId,
        target_finding_id:validationFindingId,
        validation_reason:validationReason.trim(),
      } as never,
    )
    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    setFindings((current) => current.map((finding) => finding.id === validationFindingId ? { ...finding, status:'accepted' } : finding))
    setValidationFindingId(null)
    setValidationReason('')
  }

  const openTacticalConversion = (finding: Finding) => {
    const defaults = tacticalDefaults('project')
    setTacticalForm({
      findingId:finding.id,
      initiativeClass:'project',
      categoryCode:defaults.categoryCode,
      code:`TAC-${selected?.code ?? 'DA'}-${finding.id.slice(0,6).toUpperCase()}`,
      name:finding.title,
      description:finding.recommendation ?? finding.description,
      priority:finding.priority,
      criticality:finding.priority,
      primaryModelCode:defaults.primaryModelCode,
      impactLevel:finding.priority,
      contributionWeight:'100',
      enabledCapabilities:defaults.capabilities,
      changeReason:`Conversão da recomendação validada do achado ${finding.title}.`,
    })
    setShowTacticalCreate(true)
    setError('')
  }

  const changeTacticalClass = (initiativeClass: string) => {
    const defaults = tacticalDefaults(initiativeClass)
    setTacticalForm((current) => ({
      ...current,
      initiativeClass,
      categoryCode:defaults.categoryCode,
      primaryModelCode:defaults.primaryModelCode,
      enabledCapabilities:defaults.capabilities,
    }))
  }

  const toggleTacticalCapability = (capability: string) => {
    setTacticalForm((current) => ({
      ...current,
      enabledCapabilities:current.enabledCapabilities.includes(capability)
        ? current.enabledCapabilities.filter((item) => item !== capability)
        : [...current.enabledCapabilities, capability],
    }))
  }

  const createTacticalInitiative = async () => {
    if (!selected || !tacticalForm.findingId || !tacticalForm.code.trim() || !tacticalForm.name.trim()) {
      setError('Informe código e nome da iniciativa.')
      return
    }
    if (tacticalForm.changeReason.trim().length < 10) {
      setError('Informe uma justificativa com pelo menos 10 caracteres.')
      return
    }

    const contributionWeight = Number(tacticalForm.contributionWeight)
    if (!Number.isFinite(contributionWeight) || contributionWeight < 0 || contributionWeight > 100) {
      setError('O peso de contribuição deve estar entre 0 e 100.')
      return
    }

    setSaving(true)
    setError('')
    const { data, error: saveError } = await supabase.rpc(
      'create_skda_tactical_initiative' as never,
      {
        target_organization_id:props.organizationId,
        target_finding_id:tacticalForm.findingId,
        target_initiative_class:tacticalForm.initiativeClass,
        target_category_code:tacticalForm.categoryCode,
        target_code:tacticalForm.code.trim().toUpperCase(),
        target_name:tacticalForm.name.trim(),
        target_description:tacticalForm.description.trim() || null,
        target_priority:tacticalForm.priority,
        target_criticality:tacticalForm.criticality,
        target_primary_model_code:tacticalForm.primaryModelCode,
        target_impact_level:tacticalForm.impactLevel,
        target_contribution_weight:contributionWeight,
        target_enabled_capabilities:tacticalForm.enabledCapabilities,
        target_change_reason:tacticalForm.changeReason.trim(),
      } as never,
    )
    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    if (typeof data !== 'string' || !data) { setError('A conversão não retornou uma iniciativa válida.'); return }

    setFindings((current) => current.map((finding) => finding.id === tacticalForm.findingId ? { ...finding, status:'in_action' } : finding))
    setShowTacticalCreate(false)
    setTacticalForm((current) => ({ ...current, findingId:'' }))
  }

  const createFinding = async () => {
    if (!selected || !findingForm.title.trim() || !findingForm.description.trim()) {
      setError('Informe título e descrição do achado.')
      return
    }

    setSaving(true)
    setError('')
    const { data, error: saveError } = await supabase
      .from('skda_findings' as never)
      .insert({
        organization_id:props.organizationId,
        diagnosis_id:selected.id,
        question_id:findingForm.questionId || null,
        finding_type:findingForm.findingType,
        title:findingForm.title.trim(),
        description:findingForm.description.trim(),
        priority:findingForm.priority,
        status:'open',
        recommendation:findingForm.recommendation.trim() || null,
      } as never)
      .select('id,finding_type,title,description,priority,status,recommendation,question_id' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    const created = data as unknown as Finding
    setFindings((current) => [created, ...current])
    setMetrics((current) => ({ ...current, findings:current.findings + 1 }))
    setFindingForm({ findingType:'gap', title:'', description:'', priority:'medium', recommendation:'', questionId:'' })
    setShowFindingCreate(false)
  }

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

    setForm({
      code:`DA-${new Date().getFullYear()}`,
      name:`Jornada DA ${new Date().getFullYear()}`,
      description:'Jornada de Diagnóstico Assistido do ciclo de referência.',
      diagnosisType:'pdgc',
      referenceYear:String(new Date().getFullYear()),
    })
    setShowCreate(false)
    await loadDiagnoses()
    const created = data as unknown as { id?: string } | null
    if (created?.id) setSelectedId(created.id)
  }

  const header = (
    <div className="skda-header">
      <div>
        <p className="skda-eyebrow">SK-DA · Diagnóstico Assistido</p>
        <h1>Diagnóstico Assistido</h1>
        <p>{props.organizationName} · {props.userRoleName}</p>
      </div>
      {canManage && <button type="button" className="skda-primary" onClick={() => setShowCreate(true)}>Nova Jornada DA</button>}
    </div>
  )

  const primary = (
    <div>
      <div className="skda-section-title">
        <div><span>Jornadas</span><h2>Jornadas de Diagnóstico Assistido</h2></div>
        <strong>{diagnoses.length}</strong>
      </div>
      {error && <div className="skda-alert">{error}</div>}
      {loading ? <div className="skda-empty">Carregando Jornadas DA...</div> :
       diagnoses.length === 0 ? <div className="skda-empty"><h3>Nenhuma Jornada DA iniciada</h3><p>Inicie a Jornada DA {new Date().getFullYear()} para abrir o ciclo de diagnóstico da organização.</p>{canManage && <button type="button" className="skda-primary" onClick={() => setShowCreate(true)}>Iniciar Jornada DA {new Date().getFullYear()}</button>}</div> :
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
  const selectedCatalog = catalogs.find((catalog) => catalog.id === selected?.catalog_version_id) ?? null
  const catalogLocked = metrics.responses > 0

  const secondary = selected ? (
    <div className="skda-detail">
      <p className="skda-eyebrow">Diagnóstico selecionado</p>
      <h2>{selected.name}</h2>
      <p>{selected.description || 'Sem descrição informada.'}</p>
      <div className="skda-phase"><span>Fase atual</span><strong>{selected.current_phase_code}</strong><small>{STATUS[selected.status] ?? selected.status}</small></div>
      <div className="skda-metrics">
        <article><span>Questões avaliadas</span><strong>{metrics.responses}</strong><small>{assessmentCoverage}% da cobertura</small></article>
        <article><span>Entrevistas</span><strong>{metrics.interviews}</strong><small>registradas na jornada</small></article>
        <article><span>Evidências correlacionadas</span><strong>{metrics.evidence}</strong><small>ativos do Core vinculados</small></article>
        <article><span>Achados</span><strong>{metrics.findings}</strong><small>forças, lacunas, riscos e oportunidades</small></article>
      </div>
      <div className="skda-executive-grid">
        <article className="skda-executive-card">
          <div className="skda-executive-card-head">
            <div><span>Evolução da jornada</span><h3>Progresso do diagnóstico</h3></div>
            <strong>{Number(selected.progress).toFixed(0)}%</strong>
          </div>
          <div className="skda-progress-track" aria-label="Progresso do diagnóstico">
            <span style={{ width: `${Math.max(0, Math.min(100, Number(selected.progress) || 0))}%` }} />
          </div>
          <div className="skda-progress-meta">
            <span>Fase atual</span><b>{selected.current_phase_code} · {STATUS[selected.status] ?? selected.status}</b>
          </div>
          <div className="skda-phase-strip" aria-label="Etapas da Jornada DA">
            {PHASES.map((phase) => (
              <span key={phase.code} className={phase.code === selected.current_phase_code ? 'active' : ''}>
                {phase.code}
              </span>
            ))}
          </div>
        </article>
        <article className="skda-executive-card">
          <div className="skda-executive-card-head">
            <div><span>Achados</span><h3>Distribuição atual</h3></div>
            <strong>{metrics.findings}</strong>
          </div>
          <div className="skda-finding-bars">
            {Object.entries(FINDING_TYPES).map(([type,label]) => {
              const value = findingsByType[type] ?? 0
              const width = metrics.findings > 0 ? Math.round((value / metrics.findings) * 100) : 0
              return <div key={type}><span>{label}</span><div><i style={{ width: `${width}%` }} /></div><b>{value}</b></div>
            })}
          </div>
        </article>
        <article className="skda-executive-card skda-radar-card">
          <div className="skda-executive-card-head">
            <div><span>Maturidade</span><h3>Radar por eixo</h3></div>
            <strong>{maturityByAxis.length > 0 ? maturityByAxis.length : '—'}</strong>
          </div>
          <div className="skda-radar-wrap">
            <svg viewBox="0 0 200 200" role="img" aria-label="Radar de maturidade por eixo">
              <circle cx="100" cy="100" r="72" className="skda-radar-grid" />
              <circle cx="100" cy="100" r="48" className="skda-radar-grid" />
              <circle cx="100" cy="100" r="24" className="skda-radar-grid" />
              <polygon points={radarPoints} className="skda-radar-value" />
            </svg>
            {maturityByAxis.length === 0 ? (
              <p>Nenhuma pontuação de maturidade validada ainda. O radar será preenchido a partir das avaliações reais.</p>
            ) : (
              <dl>{maturityByAxis.map((item) => <div key={item.axis}><dt>{item.axis}</dt><dd>{item.score}%</dd></div>)}</dl>
            )}
          </div>
        </article>
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
          {activePhase.code === 'DA-00' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Catálogo metodológico</h4><span>{selectedCatalog ? selectedCatalog.framework_code : 'Não definido'}</span></div>
            {catalogs.length === 0 ? <p className="skda-phase-empty">Nenhum catálogo publicado está disponível. O diagnóstico pode ser aberto, mas a avaliação por questão depende de um catálogo publicado.</p> : <label className="skda-inline-field"><span>Versão do catálogo</span><select value={selected.catalog_version_id ?? ''} disabled={!canManage || saving || catalogLocked} onChange={(e) => void assignCatalog(e.target.value)}><option value="">Selecione...</option>{catalogs.map((catalog) => <option key={catalog.id} value={catalog.id}>{catalog.name} · {catalog.version_code}</option>)}</select>{catalogLocked && <small>Catálogo bloqueado após o início da avaliação para preservar a rastreabilidade das respostas.</small>}</label>}
          </div>}
          {activePhase.code === 'DA-01' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Evidências disponíveis no Core</h4><span>{evidenceAssets.length} ativo(s)</span></div>
            {evidenceAssets.length === 0 ? <p className="skda-phase-empty">Nenhuma evidência transversal disponível para esta organização.</p> : <div className="skda-evidence-list">
              {evidenceAssets.map((asset) => {
                const correlation = evidenceCorrelations.find((item) => item.evidence_asset_id === asset.id)
                return <article key={asset.id}>
                  <div><small>{EVIDENCE_TYPES[asset.evidence_type] ?? asset.evidence_type}</small><strong>{asset.title}</strong><span>{EVIDENCE_STATUS[asset.validation_status] ?? asset.validation_status} · Confiabilidade: {RELIABILITY[asset.reliability_level] ?? asset.reliability_level}</span></div>
                  <div>{correlation ? <b>Vinculada ao diagnóstico</b> : canLinkEvidence ? <button type="button" className="skda-primary" disabled={saving} onClick={() => void linkEvidence(asset)}>Vincular</button> : <span>Disponível</span>}</div>
                </article>
              })}
            </div>}
          </div>}
          {activePhase.code === 'DA-02' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Entrevistas do diagnóstico</h4>{canEditInterviews && <button type="button" className="skda-primary" onClick={() => setShowInterviewCreate(true)}>Nova entrevista</button>}</div>
            {interviews.length === 0 ? <p className="skda-phase-empty">Nenhuma entrevista registrada.</p> : <div className="skda-interview-list">
              {interviews.map((interview) => <article key={interview.id}>
                <div><small>{interview.code}</small><strong>{interview.title}</strong><span>{interview.interviewee_name || 'Entrevistado não informado'}{interview.interviewee_role ? ' · '+interview.interviewee_role : ''}</span></div>
                <div><b>{interview.status === 'planned' ? 'Planejada' : interview.status}</b><span>{interview.scheduled_start ? new Date(interview.scheduled_start).toLocaleString('pt-BR') : 'Sem data'}</span></div>
              </article>)}
            </div>}
          </div>}
          {activePhase.code === 'DA-03' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Avaliação por questão</h4><span>{selectedCatalog ? selectedCatalog.name : 'Catálogo não definido'}</span></div>
            {!selected.catalog_version_id ? <p className="skda-phase-empty">Defina o catálogo na fase DA-00 antes de iniciar a avaliação.</p> : questions.length === 0 ? <p className="skda-phase-empty">O catálogo selecionado ainda não possui questões disponíveis.</p> : <div className="skda-question-list">
              {questions.map((question) => {
                const response = responses.find((item) => item.question_id === question.id)
                return <article key={question.id}>
                  <div className="skda-question-copy"><small>{question.code}{question.axis_name ? ' · '+question.axis_name : ''}</small><strong>{question.question_text}</strong>{question.criterion_name && <span>{question.criterion_name}</span>}</div>
                  <label><span>Classificação</span><select value={response?.classification ?? 'not_evaluated'} disabled={!canEditAssessment || saving} onChange={(e) => void saveClassification(question, e.target.value)}>{Object.entries(CLASSIFICATION).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                </article>
              })}
            </div>}
          </div>}
          {activePhase.code === 'DA-04' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Achados do diagnóstico</h4>{canEditFindings && <button type="button" className="skda-primary" onClick={() => setShowFindingCreate(true)}>Novo achado</button>}</div>
            {findings.length === 0 ? <p className="skda-phase-empty">Nenhum achado registrado.</p> : <div className="skda-finding-list">
              {findings.map((finding) => <article key={finding.id}>
                <div><small>{FINDING_TYPES[finding.finding_type] ?? finding.finding_type} · Prioridade {PRIORITIES[finding.priority] ?? finding.priority}</small><strong>{finding.title}</strong><span>{finding.description}</span></div>
                <div><b>{finding.status === 'open' ? 'Aberto' : finding.status}</b>{finding.question_id && <span>Vinculado a uma questão</span>}</div>
              </article>)}
            </div>}
          </div>}
          {activePhase.code === 'DA-05' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Recomendações para devolutiva</h4><span>{findings.filter((finding) => Boolean(finding.recommendation)).length} recomendação(ões)</span></div>
            {findings.filter((finding) => Boolean(finding.recommendation)).length === 0 ? <p className="skda-phase-empty">Nenhuma recomendação registrada nos achados.</p> : <div className="skda-finding-list">
              {findings.filter((finding) => Boolean(finding.recommendation)).map((finding) => <article key={finding.id}>
                <div><small>{FINDING_TYPES[finding.finding_type] ?? finding.finding_type} · {PRIORITIES[finding.priority] ?? finding.priority}</small><strong>{finding.title}</strong><span>{finding.recommendation}</span></div>
                <div className="skda-finding-actions">
                  <b>{finding.status === 'accepted' ? 'Aceita' : finding.status === 'in_action' ? 'Em ação' : 'Recomendação'}</b>
                  <span>Origem rastreável no achado</span>
                  {finding.status === 'open' && canValidateFindings && <button type="button" onClick={() => openValidation(finding)}>Aceitar recomendação</button>}
                  {finding.status === 'accepted' && canCreateTactical && <button type="button" className="skda-primary" onClick={() => openTacticalConversion(finding)}>Converter em iniciativa</button>}
                </div>
              </article>)}
            </div>}
          </div>}
          {activePhase.code === 'DA-06' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Gestão Tática</h4><span>Fatos geradores preservados</span></div>
            {findings.filter((finding) => finding.status === 'accepted' || finding.status === 'in_action').length === 0 ? <p className="skda-phase-empty">Nenhuma recomendação aceita está disponível para conversão tática.</p> : <div className="skda-finding-list">
              {findings.filter((finding) => finding.status === 'accepted' || finding.status === 'in_action').map((finding) => <article key={finding.id}>
                <div><small>{FINDING_TYPES[finding.finding_type] ?? finding.finding_type} · Impacto sugerido {PRIORITIES[finding.priority] ?? finding.priority}</small><strong>{finding.title}</strong><span>{finding.recommendation}</span></div>
                <div className="skda-finding-actions">
                  <b>{finding.status === 'in_action' ? 'Em Gestão Tática' : 'Pronta para conversão'}</b>
                  <span>Origem: SK-DA / achado</span>
                  {finding.status === 'accepted' && canCreateTactical && <button type="button" className="skda-primary" onClick={() => openTacticalConversion(finding)}>Criar iniciativa</button>}
                </div>
              </article>)}
            </div>}
          </div>}
        </section>
      </div>
    </div>
  ) : undefined

  const shellNavigation = [
    {
      id:'modules',
      label:'Módulos',
      active:false,
      onActivate:props.onReturnToModules,
    },
    ...PHASES.map((phase) => ({
      id:phase.code,
      label:`${phase.code} · ${phase.title}`,
      active:activePhaseCode === phase.code,
      disabled:!selected,
      onActivate:() => setActivePhaseCode(phase.code),
    })),
  ]

  return <>
    <ApplicationShell
      brand={
        <div className="skda-shell-brand">
          <strong>SPARKs</strong>
          <span>Diagnóstico Assistido</span>
        </div>
      }
      contextItems={[
        { label:'Organização', value:props.organizationName },
        { label:'Módulo', value:'SK-DA' },
      ]}
      userArea={
        <div className="skda-shell-user">
          <strong>{props.userRoleName}</strong>
          <span>{props.organizationCode}</span>
        </div>
      }
      navigationItems={shellNavigation}
      navigationLabel="Navegação do Diagnóstico Assistido"
      collapsed={shellCollapsed}
      onToggleCollapsed={() => setShellCollapsed((current) => !current)}
    >
      <TransversalWorkspace
        className="skda-workspace"
        header={header}
        primary={
          <div className="skda-dashboard-page">
            <section className="skda-diagnosis-switcher">{primary}</section>
            {secondary}
          </div>
        }
      />
    </ApplicationShell>
    {validationFindingId && <div className="skda-modal-backdrop">
      <section className="skda-modal" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">DA-05 · Validação</p><h2>Aceitar recomendação</h2></div><button type="button" onClick={() => setValidationFindingId(null)}>×</button></div>
        <p>Registre a justificativa da validação executiva. A recomendação aceita ficará elegível para conversão em Gestão Tática.</p>
        <div className="skda-form-grid"><label className="wide"><span>Justificativa *</span><textarea rows={5} value={validationReason} onChange={(e)=>setValidationReason(e.target.value)}/></label></div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setValidationFindingId(null)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void acceptRecommendation()}>{saving?'Validando...':'Aceitar recomendação'}</button></div>
      </section>
    </div>}
    {showTacticalCreate && selected && <div className="skda-modal-backdrop">
      <section className="skda-modal skda-modal-wide" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">DA-06 · Gestão Tática</p><h2>Converter recomendação em iniciativa</h2></div><button type="button" onClick={() => setShowTacticalCreate(false)}>×</button></div>
        <div className="skda-form-grid">
          <label><span>Classe da iniciativa</span><select value={tacticalForm.initiativeClass} onChange={(e)=>changeTacticalClass(e.target.value)}>{Object.entries(INITIATIVE_CLASSES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Modelo primário de execução</span><select value={tacticalForm.primaryModelCode} onChange={(e)=>setTacticalForm(v=>({...v,primaryModelCode:e.target.value}))}>{Object.entries(EXECUTION_MODELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Código *</span><input value={tacticalForm.code} onChange={(e)=>setTacticalForm(v=>({...v,code:e.target.value}))}/></label>
          <label><span>Categoria</span><input value={tacticalForm.categoryCode === 'strategic' ? 'Estratégica' : tacticalForm.categoryCode === 'process' ? 'Processo' : 'Operacional'} disabled/></label>
          <label className="wide"><span>Nome *</span><input value={tacticalForm.name} onChange={(e)=>setTacticalForm(v=>({...v,name:e.target.value}))}/></label>
          <label className="wide"><span>Descrição</span><textarea rows={3} value={tacticalForm.description} onChange={(e)=>setTacticalForm(v=>({...v,description:e.target.value}))}/></label>
          <label><span>Prioridade</span><select value={tacticalForm.priority} onChange={(e)=>setTacticalForm(v=>({...v,priority:e.target.value}))}>{Object.entries(PRIORITIES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Criticidade</span><select value={tacticalForm.criticality} onChange={(e)=>setTacticalForm(v=>({...v,criticality:e.target.value}))}>{Object.entries(PRIORITIES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Impacto do fato gerador</span><select value={tacticalForm.impactLevel} onChange={(e)=>setTacticalForm(v=>({...v,impactLevel:e.target.value}))}><option value="not_assessed">Não avaliado</option>{Object.entries(PRIORITIES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Peso de contribuição (%)</span><input type="number" min="0" max="100" value={tacticalForm.contributionWeight} onChange={(e)=>setTacticalForm(v=>({...v,contributionWeight:e.target.value}))}/></label>
          <fieldset className="wide skda-capabilities"><legend>Capacidades habilitadas</legend>{Object.entries(TACTICAL_CAPABILITIES).map(([value,label]) => <label key={value}><input type="checkbox" checked={tacticalForm.enabledCapabilities.includes(value)} onChange={() => toggleTacticalCapability(value)}/><span>{label}</span></label>)}</fieldset>
          <label className="wide"><span>Justificativa da conversão *</span><textarea rows={3} value={tacticalForm.changeReason} onChange={(e)=>setTacticalForm(v=>({...v,changeReason:e.target.value}))}/></label>
        </div>
        <div className="skda-tactical-note"><strong>Rastreabilidade preservada</strong><span>A iniciativa será criada junto com o fato gerador SK-DA e o perfil de execução na mesma transação.</span></div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setShowTacticalCreate(false)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createTacticalInitiative()}>{saving?'Convertendo...':'Criar iniciativa'}</button></div>
      </section>
    </div>}
    {showFindingCreate && selected && <div className="skda-modal-backdrop">
      <section className="skda-modal" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">DA-04 · Achados e lacunas</p><h2>Registrar achado</h2></div><button type="button" onClick={() => setShowFindingCreate(false)}>×</button></div>
        <div className="skda-form-grid">
          <label><span>Tipo</span><select value={findingForm.findingType} onChange={(e)=>setFindingForm(v=>({...v,findingType:e.target.value}))}>{Object.entries(FINDING_TYPES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Prioridade</span><select value={findingForm.priority} onChange={(e)=>setFindingForm(v=>({...v,priority:e.target.value}))}>{Object.entries(PRIORITIES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="wide"><span>Questão relacionada</span><select value={findingForm.questionId} onChange={(e)=>setFindingForm(v=>({...v,questionId:e.target.value}))}><option value="">Sem vínculo direto</option>{questions.map((question) => <option key={question.id} value={question.id}>{question.code} · {question.question_text}</option>)}</select></label>
          <label className="wide"><span>Título *</span><input value={findingForm.title} onChange={(e)=>setFindingForm(v=>({...v,title:e.target.value}))} placeholder="Lacuna na formalização do processo"/></label>
          <label className="wide"><span>Descrição *</span><textarea rows={4} value={findingForm.description} onChange={(e)=>setFindingForm(v=>({...v,description:e.target.value}))}/></label>
          <label className="wide"><span>Recomendação</span><textarea rows={4} value={findingForm.recommendation} onChange={(e)=>setFindingForm(v=>({...v,recommendation:e.target.value}))} placeholder="Ação recomendada para tratar o achado"/></label>
        </div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setShowFindingCreate(false)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createFinding()}>{saving?'Salvando...':'Registrar achado'}</button></div>
      </section>
    </div>}
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
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Novo ciclo</p><h2>Iniciar Jornada de Diagnóstico Assistido</h2></div><button type="button" onClick={() => setShowCreate(false)}>×</button></div>
        <div className="skda-form-grid">
          <label><span>Código da jornada *</span><input value={form.code} onChange={(e)=>setForm(v=>({...v,code:e.target.value}))} placeholder="DA-2026"/></label>
          <label><span>Ano de referência</span><input type="number" min="2000" max="2100" value={form.referenceYear} onChange={(e)=>setForm(v=>({...v,referenceYear:e.target.value}))}/></label>
          <label className="wide"><span>Nome da jornada *</span><input value={form.name} onChange={(e)=>setForm(v=>({...v,name:e.target.value}))} placeholder="Jornada DA 2026"/></label>
          <label><span>Tipo</span><select value={form.diagnosisType} onChange={(e)=>setForm(v=>({...v,diagnosisType:e.target.value}))}><option value="pdgc">PDGC / Avaliacoop</option><option value="maturity">Maturidade</option><option value="custom">Personalizado</option><option value="other">Outro</option></select></label>
          <label className="wide"><span>Descrição</span><textarea rows={4} value={form.description} onChange={(e)=>setForm(v=>({...v,description:e.target.value}))}/></label>
        </div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setShowCreate(false)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createDiagnosis()}>{saving?'Criando...':'Iniciar Jornada DA'}</button></div>
      </section>
    </div>}
  </>
}
