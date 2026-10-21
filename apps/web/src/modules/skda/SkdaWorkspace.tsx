import { useEffect, useMemo, useState } from 'react'
import { ApplicationShell } from '../../components/application-shell/ApplicationShell'
import { TransversalWorkspace } from '../../components/application-shell/TransversalWorkspace'
import { supabase } from '../../lib/supabase'
import { AgendaSection } from '../skpe/features/agenda/AgendaSection'
import { JourneyEventManageDialog } from '../skpe/features/journey/JourneyEventManageDialog'
import './SkdaWorkspace.css'

type Props = {
  organizationId: string
  organizationName: string
  organizationCode: string
  userRoleCode: string
  userRoleName: string
  userDisplayName: string
  userEmail: string
  userAvatarUrl: string | null
  isOrganizationAdmin: boolean
  isPlatformSuperAdmin: boolean
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
  current_megaphase_code: string
  progress: number
  started_on: string | null
  planned_end_on: string | null
  lead_user_id: string | null
  execution_initiative_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type OrganizationUser = {
  user_id: string
  user_email: string
  user_display_name: string | null
  membership_status: string
  job_title: string | null
}
type Metrics = { responses: number; interviews: number; evidence: number; findings: number }
type Phase = { code: string; title: string; description: string; statusKey: string }
type Interview = { id: string; code: string; title: string; interviewee_name: string | null; interviewee_role: string | null; status: string; channel: string; scheduled_start: string | null; scheduled_end: string | null; actual_start: string | null; actual_end: string | null; event_id: string | null }
type ActionPlanAllocation = { id: string; finding_id: string; initiative_id: string | null; cycle_number: number; sequence_order: number; rationale: string | null }
type ManagedInterviewEvent = { event_id: string; journey_item_code: string; journey_item_title: string; event_type: string; event_title: string; event_description: string | null; starts_at: string | null; ends_at: string | null; all_day: boolean; timezone_name: string; event_status: string; priority: string; location_text: string | null; meeting_reference: string | null; participant_count: number; accepted_count: number; attended_count: number }
type EvidenceAsset = { id: string; title: string; evidence_type: string; validation_status: string; reliability_level: string; reference_date: string | null }
type EvidenceCorrelation = { id: string; evidence_asset_id: string; usage_type: string; validation_status: string }
type CatalogVersion = { id: string; code: string; version_code: string; name: string; framework_code: string }
type Question = { id: string; code: string; axis_name: string | null; criterion_name: string | null; question_text: string; display_order: number }
type Response = { id: string; question_id: string; classification: string; response_status: string; answer_text: string | null; rationale: string | null; confidence_level: string; maturity_level: string | null; score: number | null; evaluated_at: string | null; validated_at: string | null }
type AssessmentDraft = { classification: string; answerText: string; rationale: string; confidenceLevel: string; score: string }
type Finding = { id: string; finding_type: string; title: string; description: string; priority: string; status: string; recommendation: string | null; question_id: string | null; interview_id: string | null; owner_user_id: string | null; due_date: string | null }
type InitiativeOrigin = { initiative_id: string; source_entity_id: string }
type LinkedInitiative = { id: string; code: string; name: string; initiative_class: string; status: string; progress: number; sourceFindingId: string }

const EMPTY: Metrics = { responses: 0, interviews: 0, evidence: 0, findings: 0 }

const PHASES: Phase[] = [
  { code:'DA-00', title:'Abertura e configuração', description:'Define ciclo, escopo, metodologia, responsáveis e catálogo de questões.', statusKey:'preparation' },
  { code:'DA-01', title:'Evidências', description:'Correlaciona evidências transversais ao diagnóstico sem duplicar documentos.', statusKey:'evidence' },
  { code:'DA-02', title:'Entrevistas', description:'Planeja, registra e valida entrevistas e falas relevantes.', statusKey:'interviews' },
  { code:'DA-03', title:'Avaliação por questão', description:'Classifica respostas, maturidade, confiança e validação por questão.', statusKey:'assessment' },
  { code:'DA-04', title:'Achados e lacunas', description:'Consolida forças, lacunas, oportunidades, riscos e observações.', statusKey:'assessment' },
  { code:'DA-05', title:'Recomendações e devolutiva', description:'Transforma achados em recomendações priorizadas e prepara a devolutiva.', statusKey:'validation' },
  { code:'DA-06', title:'Plano de Ação', description:'Prioriza recomendações aprovadas em ciclos e acompanha sua conversão em iniciativas com fato gerador rastreável.', statusKey:'validation' },
]

const MEGAPHASES = [
  { code:'MF0', title:'Constituição e abertura', workPattern:'Abertura governada, kickoff, escopo, papéis e critérios de aplicação.' },
  { code:'MF1', title:'Intake e inventário', workPattern:'Coleta progressiva, inventário de fontes e registro explícito de lacunas.' },
  { code:'MF2', title:'Canonização documental', workPattern:'Organizar fontes, versões, autoridade documental e relação questão–evidência.' },
  { code:'MF3', title:'Histórico e pré-diagnóstico', workPattern:'Construir linha histórica, hipóteses, recorrências e pontos a aprofundar.' },
  { code:'MF4', title:'Entrevistas Governança', workPattern:'Escuta orientada, confronto de hipóteses e coleta de evidências de Governança.' },
  { code:'MF5', title:'Entrevistas Gestão', workPattern:'Escuta orientada, confronto de hipóteses e coleta de evidências de Gestão.' },
  { code:'MF6', title:'Evidências, PDCL e maturidade', workPattern:'Avaliar suficiência das evidências, prática gerencial, PDCL e nível de maturidade.' },
  { code:'MF7', title:'Diagnóstico integrado', workPattern:'Consolidar fatos, evidências, divergências, riscos, forças, oportunidades e lacunas.' },
  { code:'MF8', title:'Priorização 80/20', workPattern:'Priorizar poucas ações de maior impacto sem impedir antecipações deliberadas.' },
  { code:'MF9', title:'Plano por ciclos', workPattern:'Organizar ações aprovadas nos Ciclos 1, 2 e 3 com origem e decisão rastreáveis.' },
  { code:'MF10', title:'Devolutiva e integração', workPattern:'Validar entendimento, pactuar evolução e integrar ações aos demais módulos SPARKs.' },
] as const

const PDCL_STAGES = [
  {
    code:'P',
    title:'Planejar',
    megaphases:['MF0','MF1','MF2','MF3'],
    pattern:'Constituir a Jornada, organizar fontes, conhecer o histórico e planejar o aprofundamento.',
  },
  {
    code:'D',
    title:'Fazer',
    megaphases:['MF4','MF5','MF6'],
    pattern:'Executar entrevistas, ampliar evidências e avaliar a prática e a maturidade observadas.',
  },
  {
    code:'C',
    title:'Verificar',
    megaphases:['MF7','MF8'],
    pattern:'Integrar o diagnóstico, confrontar evidências e priorizar o que mais influencia a evolução.',
  },
  {
    code:'L',
    title:'Aprender',
    megaphases:['MF9','MF10'],
    pattern:'Transformar o aprendizado em Plano de Ação, devolutiva, integração e novo ciclo de evolução.',
  },
] as const

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

const CONFIDENCE_LEVELS: Record<string,string> = {
  not_assessed:'Não avaliada', low:'Baixa', moderate:'Moderada', high:'Alta', very_high:'Muito alta',
}

const RESPONSE_STATUS: Record<string,string> = {
  draft:'Rascunho', review:'Em revisão', validated:'Validada',
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 3v4M17 3v4M3.5 10h17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
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
  const [activePhaseCode, setActivePhaseCode] = useState('OVERVIEW')
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [actionPlanAllocations, setActionPlanAllocations] = useState<ActionPlanAllocation[]>([])
  const [managedInterviewEvent, setManagedInterviewEvent] = useState<ManagedInterviewEvent | null>(null)
  const [realizationInterviewId, setRealizationInterviewId] = useState<string | null>(null)
  const [realizationForm, setRealizationForm] = useState({ actualStart:'', actualEnd:'', notes:'', changeReason:'Registro da realização da entrevista da Jornada DA.' })
  const [evidenceAssets, setEvidenceAssets] = useState<EvidenceAsset[]>([])
  const [evidenceCorrelations, setEvidenceCorrelations] = useState<EvidenceCorrelation[]>([])
  const [catalogs, setCatalogs] = useState<CatalogVersion[]>([])
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [assessmentDrafts, setAssessmentDrafts] = useState<Record<string,AssessmentDraft>>({})
  const [findings, setFindings] = useState<Finding[]>([])
  const [linkedInitiatives, setLinkedInitiatives] = useState<LinkedInitiative[]>([])
  const [openingForm, setOpeningForm] = useState({
    referenceYear:String(new Date().getFullYear()),
    startedOn:'',
    plannedEndOn:'',
    diagnosisType:'pdgc',
    leadUserId:'',
    scopeStatement:'',
    methodologyNotes:'',
  })
  const [interviewForm, setInterviewForm] = useState({ code:'', title:'', channel:'teams', scheduledStart:'', scheduledEnd:'', meetingReference:'', changeReason:'Planejamento da entrevista na Jornada DA.' })
  const [findingForm, setFindingForm] = useState({ findingType:'gap', title:'', description:'', priority:'medium', recommendation:'', questionId:'', interviewId:'', ownerUserId:'', dueDate:'' })
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
    changeReason:'Criação da Jornada DA e do projeto transversal correspondente.',
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

  const hasAdministrativeOverride = props.isPlatformSuperAdmin || props.isOrganizationAdmin
  const canManage = hasAdministrativeOverride || ['administrator','coordinator'].includes(props.userRoleCode)
  const canEditInterviews = hasAdministrativeOverride || ['administrator','coordinator','interviewer'].includes(props.userRoleCode)
  const canLinkEvidence = hasAdministrativeOverride || ['administrator','coordinator','diagnostician','interviewer'].includes(props.userRoleCode)
  const canEditAssessment = hasAdministrativeOverride || ['administrator','coordinator','diagnostician'].includes(props.userRoleCode)
  const canValidateAssessment = hasAdministrativeOverride || ['administrator','coordinator','reviewer'].includes(props.userRoleCode)
  const canEditFindings = hasAdministrativeOverride || ['administrator','coordinator','diagnostician','reviewer'].includes(props.userRoleCode)
  const canValidateFindings = hasAdministrativeOverride || ['administrator','coordinator','reviewer'].includes(props.userRoleCode)
  const canCreateTactical = hasAdministrativeOverride || ['administrator','coordinator'].includes(props.userRoleCode)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || saving) return

      setShowCreate(false)
      setShowInterviewCreate(false)
      setShowFindingCreate(false)
      setShowTacticalCreate(false)
      setValidationFindingId(null)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [saving])

  const loadDiagnoses = async () => {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('skda_diagnoses' as never)
      .select('id,code,name,description,diagnosis_type,catalog_version_id,reference_year,status,current_phase_code,current_megaphase_code,progress,started_on,planned_end_on,lead_user_id,execution_initiative_id,metadata,created_at' as never)
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
      const { data, error: usersError } = await supabase.rpc(
        'get_organization_user_access' as never,
        { target_organization_id:props.organizationId } as never,
      )
      if (usersError) {
        setOrganizationUsers([])
        return
      }
      const unique = new Map<string, OrganizationUser>()
      for (const row of (data ?? []) as unknown as OrganizationUser[]) {
        if (row.membership_status !== 'active') continue
        if (!unique.has(row.user_id)) unique.set(row.user_id, row)
      }
      setOrganizationUsers([...unique.values()].sort((a,b) =>
        (a.user_display_name ?? a.user_email).localeCompare(
          b.user_display_name ?? b.user_email,
          'pt-BR',
        ),
      ))
    }
    void run()
  }, [props.organizationId])

  useEffect(() => {
    if (!selected) return
    const metadata = selected.metadata ?? {}
    setOpeningForm({
      referenceYear:selected.reference_year ? String(selected.reference_year) : '',
      startedOn:selected.started_on ?? '',
      plannedEndOn:selected.planned_end_on ?? '',
      diagnosisType:selected.diagnosis_type,
      leadUserId:selected.lead_user_id ?? '',
      scopeStatement:typeof metadata.scope_statement === 'string' ? metadata.scope_statement : '',
      methodologyNotes:typeof metadata.methodology_notes === 'string' ? metadata.methodology_notes : '',
    })
  }, [selected?.id])

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
          .select('id,question_id,classification,response_status,answer_text,rationale,confidence_level,maturity_level,score,evaluated_at,validated_at' as never)
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
    const next: Record<string,AssessmentDraft> = {}
    questions.forEach((question) => {
      const response = responses.find((item) => item.question_id === question.id)
      next[question.id] = {
        classification:response?.classification ?? 'not_evaluated',
        answerText:response?.answer_text ?? '',
        rationale:response?.rationale ?? '',
        confidenceLevel:response?.confidence_level ?? 'not_assessed',
        score:response?.score == null ? '' : String(response.score),
      }
    })
    setAssessmentDrafts(next)
  }, [questions, responses])

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
        .select('id,finding_type,title,description,priority,status,recommendation,question_id,interview_id,owner_user_id,due_date' as never)
        .eq('diagnosis_id', selectedId)
        .order('created_at', { ascending:false })
      setFindings((data ?? []) as unknown as Finding[])
    }
    void run()
  }, [selectedId])

  useEffect(() => {
    const run = async () => {
      const findingIds = findings.map((finding) => finding.id)
      if (!selectedId || findingIds.length === 0) {
        setLinkedInitiatives([])
        return
      }

      const { data: originData, error: originError } = await supabase
        .from('sparks_initiative_origins' as never)
        .select('initiative_id,source_entity_id' as never)
        .eq('organization_id', props.organizationId)
        .eq('source_module_code', 'SK-DA')
        .eq('source_entity_type', 'skda_finding')
        .in('source_entity_id', findingIds)

      if (originError) {
        setLinkedInitiatives([])
        return
      }

      const origins = (originData ?? []) as unknown as InitiativeOrigin[]
      const initiativeIds = [...new Set(origins.map((origin) => origin.initiative_id))]
      if (initiativeIds.length === 0) {
        setLinkedInitiatives([])
        return
      }

      const { data: initiativeData, error: initiativeError } = await supabase
        .from('sparks_initiatives' as never)
        .select('id,code,name,initiative_class,status,progress' as never)
        .eq('organization_id', props.organizationId)
        .in('id', initiativeIds)

      if (initiativeError) {
        setLinkedInitiatives([])
        return
      }

      const rows = (initiativeData ?? []) as unknown as Array<Omit<LinkedInitiative,'sourceFindingId'>>
      setLinkedInitiatives(rows.map((initiative) => ({
        ...initiative,
        sourceFindingId:origins.find((origin) => origin.initiative_id === initiative.id)?.source_entity_id ?? '',
      })))
    }
    void run()
  }, [selectedId, props.organizationId, findings])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) { setInterviews([]); return }
      const { data } = await supabase
        .from('skda_interviews' as never)
        .select('id,code,title,interviewee_name,interviewee_role,status,channel,scheduled_start,scheduled_end,actual_start,actual_end,event_id' as never)
        .eq('diagnosis_id', selectedId)
        .order('scheduled_start', { ascending:true, nullsFirst:false })
      setInterviews((data ?? []) as unknown as Interview[])
    }
    void run()
  }, [selectedId])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) { setActionPlanAllocations([]); return }
      const { data } = await supabase
        .from('skda_action_plan_allocations' as never)
        .select('id,finding_id,initiative_id,cycle_number,sequence_order,rationale' as never)
        .eq('diagnosis_id', selectedId)
        .order('cycle_number', { ascending:true })
        .order('sequence_order', { ascending:true })
      setActionPlanAllocations((data ?? []) as unknown as ActionPlanAllocation[])
    }
    void run()
  }, [selectedId, findings, linkedInitiatives])

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

  const saveOpeningConfiguration = async () => {
    if (!selected || !canManage) return
    if (openingForm.startedOn && openingForm.plannedEndOn && openingForm.plannedEndOn < openingForm.startedOn) {
      setError('A data prevista de conclusão não pode ser anterior à data de início.')
      return
    }

    setSaving(true)
    setError('')
    const nextMetadata = {
      ...(selected.metadata ?? {}),
      scope_statement:openingForm.scopeStatement.trim() || null,
      methodology_notes:openingForm.methodologyNotes.trim() || null,
    }
    const { error: saveError } = await supabase
      .from('skda_diagnoses' as never)
      .update({
        reference_year:openingForm.referenceYear ? Number(openingForm.referenceYear) : null,
        started_on:openingForm.startedOn || null,
        planned_end_on:openingForm.plannedEndOn || null,
        diagnosis_type:openingForm.diagnosisType,
        lead_user_id:openingForm.leadUserId || null,
        metadata:nextMetadata,
      } as never)
      .eq('id', selected.id)
      .eq('organization_id', props.organizationId)

    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return
    }
    await loadDiagnoses()
  }

  const updateAssessmentDraft = (questionId: string, patch: Partial<AssessmentDraft>) => {
    setAssessmentDrafts((current) => {
      const base = current[questionId] ?? {
        classification:'not_evaluated',
        answerText:'',
        rationale:'',
        confidenceLevel:'not_assessed',
        score:'',
      }
      return {
        ...current,
        [questionId]: { ...base, ...patch },
      }
    })
  }

  const saveAssessment = async (question: Question) => {
    if (!selected || !canEditAssessment) return
    const draft = assessmentDrafts[question.id]
    if (!draft) return
    const score = draft.score.trim() === '' ? null : Number(draft.score)
    if (score != null && (!Number.isFinite(score) || score < 0 || score > 100)) {
      setError('A nota da avaliação deve estar entre 0 e 100.')
      return
    }

    setSaving(true)
    setError('')
    const hadResponse = responses.some((item) => item.question_id === question.id)
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id ?? null
    const { data, error: saveError } = await supabase
      .from('skda_responses' as never)
      .upsert({
        organization_id:props.organizationId,
        diagnosis_id:selected.id,
        question_id:question.id,
        classification:draft.classification,
        answer_text:draft.answerText.trim() || null,
        rationale:draft.rationale.trim() || null,
        score,
        confidence_level:draft.confidenceLevel,
        response_status:'draft',
        evaluated_at:new Date().toISOString(),
        evaluated_by:userId,
        validated_at:null,
        validated_by:null,
      } as never, { onConflict:'diagnosis_id,question_id' })
      .select('id,question_id,classification,response_status,answer_text,rationale,confidence_level,maturity_level,score,evaluated_at,validated_at' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    const saved = data as unknown as Response
    setResponses((current) => [...current.filter((item) => item.question_id !== question.id), saved])
    setMetrics((current) => ({ ...current, responses:hadResponse ? current.responses : current.responses + 1 }))
  }

  const validateAssessment = async (question: Question) => {
    if (!selected || !canValidateAssessment) return
    const response = responses.find((item) => item.question_id === question.id)
    if (!response) {
      setError('Registre a avaliação antes de validá-la.')
      return
    }

    setSaving(true)
    setError('')
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id ?? null
    const { data, error: saveError } = await supabase
      .from('skda_responses' as never)
      .update({
        response_status:'validated',
        validated_at:new Date().toISOString(),
        validated_by:userId,
      } as never)
      .eq('id', response.id)
      .eq('diagnosis_id', selected.id)
      .eq('organization_id', props.organizationId)
      .select('id,question_id,classification,response_status,answer_text,rationale,confidence_level,maturity_level,score,evaluated_at,validated_at' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    const saved = data as unknown as Response
    setResponses((current) => [...current.filter((item) => item.question_id !== question.id), saved])
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
        interview_id:findingForm.interviewId || null,
        owner_user_id:findingForm.ownerUserId || null,
        due_date:findingForm.dueDate || null,
        finding_type:findingForm.findingType,
        title:findingForm.title.trim(),
        description:findingForm.description.trim(),
        priority:findingForm.priority,
        status:'open',
        recommendation:findingForm.recommendation.trim() || null,
      } as never)
      .select('id,finding_type,title,description,priority,status,recommendation,question_id,interview_id,owner_user_id,due_date' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    const created = data as unknown as Finding
    setFindings((current) => [created, ...current])
    setMetrics((current) => ({ ...current, findings:current.findings + 1 }))
    setFindingForm({ findingType:'gap', title:'', description:'', priority:'medium', recommendation:'', questionId:'', interviewId:'', ownerUserId:'', dueDate:'' })
    setShowFindingCreate(false)
  }

  const ensureDiagnosisProject = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    const { error: projectError } = await supabase.rpc(
      'ensure_skda_diagnosis_project' as never,
      {
        target_diagnosis_id:selected.id,
        change_reason:'Vinculação do Projeto transversal à Jornada DA existente.',
      } as never,
    )
    setSaving(false)
    if (projectError) {
      setError(projectError.message)
      return
    }
    await loadDiagnoses()
  }

  const openInterviewParticipants = async (interview: Interview) => {
    if (!interview.event_id) {
      setError('Esta entrevista ainda não possui evento transversal associado.')
      return
    }

    setError('')
    const { data, error: eventError } = await supabase.rpc(
      'get_skda_interview_event_management' as never,
      { target_interview_id:interview.id } as never,
    )

    if (eventError || !data) {
      setError(eventError?.message ?? 'Evento da entrevista não encontrado.')
      return
    }

    setManagedInterviewEvent(data as unknown as ManagedInterviewEvent)
  }

  const recordInterviewRealization = async () => {
    if (!realizationInterviewId || !realizationForm.actualStart) {
      setError('Informe a data e hora reais de início da entrevista.')
      return
    }

    if (realizationForm.changeReason.trim().length < 10) {
      setError('Informe uma justificativa para registrar a realização.')
      return
    }

    setSaving(true)
    setError('')
    const { error: realizationError } = await supabase.rpc(
      'record_skda_interview_realization' as never,
      {
        target_interview_id:realizationInterviewId,
        target_actual_start:new Date(realizationForm.actualStart).toISOString(),
        target_actual_end:realizationForm.actualEnd ? new Date(realizationForm.actualEnd).toISOString() : null,
        target_notes:realizationForm.notes.trim() || null,
        change_reason:realizationForm.changeReason.trim(),
      } as never,
    )
    setSaving(false)

    if (realizationError) {
      setError(realizationError.message)
      return
    }

    setRealizationInterviewId(null)
    setRealizationForm({
      actualStart:'',
      actualEnd:'',
      notes:'',
      changeReason:'Registro da realização da entrevista da Jornada DA.',
    })

    if (selected) {
      const { data } = await supabase
        .from('skda_interviews' as never)
        .select('id,code,title,interviewee_name,interviewee_role,status,channel,scheduled_start,scheduled_end,actual_start,actual_end,event_id' as never)
        .eq('diagnosis_id', selected.id)
        .order('scheduled_start', { ascending:true, nullsFirst:false })
      setInterviews((data ?? []) as unknown as Interview[])
    }
  }

  const assignActionCycle = async (findingId: string, cycleNumber: number) => {
    setSaving(true)
    setError('')
    const { error: cycleError } = await supabase.rpc(
      'set_skda_action_plan_cycle' as never,
      {
        target_finding_id:findingId,
        target_cycle_number:cycleNumber,
        target_rationale:cycleNumber === 1
          ? 'Priorização no primeiro ciclo segundo foco 80×20 do Plano de Ação.'
          : `Priorização deliberada para o Ciclo ${cycleNumber} do Plano de Ação.`,
        change_reason:`Priorização da recomendação no Ciclo ${cycleNumber} do Plano de Ação DA.`,
      } as never,
    )
    setSaving(false)

    if (cycleError) {
      setError(cycleError.message)
      return
    }

    if (selected) {
      const { data } = await supabase
        .from('skda_action_plan_allocations' as never)
        .select('id,finding_id,initiative_id,cycle_number,sequence_order,rationale' as never)
        .eq('diagnosis_id', selected.id)
        .order('cycle_number', { ascending:true })
        .order('sequence_order', { ascending:true })
      setActionPlanAllocations((data ?? []) as unknown as ActionPlanAllocation[])
    }
  }

  const createInterview = async () => {
    if (!selected || !interviewForm.code.trim() || !interviewForm.title.trim()) {
      setError('Informe código e título da entrevista.')
      return
    }

    if (interviewForm.changeReason.trim().length < 10) {
      setError('Informe uma justificativa para o agendamento da entrevista.')
      return
    }

    setSaving(true)
    setError('')
    const { error: saveError } = await supabase.rpc(
      'create_skda_interview_with_event' as never,
      {
        target_diagnosis_id:selected.id,
        target_code:interviewForm.code.trim().toUpperCase(),
        target_title:interviewForm.title.trim(),
        target_channel:interviewForm.channel,
        target_scheduled_start:interviewForm.scheduledStart ? new Date(interviewForm.scheduledStart).toISOString() : null,
        target_scheduled_end:interviewForm.scheduledEnd ? new Date(interviewForm.scheduledEnd).toISOString() : null,
        target_meeting_reference:interviewForm.meetingReference.trim() || null,
        change_reason:interviewForm.changeReason.trim(),
      } as never,
    )

    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    setInterviewForm({
      code:'',
      title:'',
      channel:'teams',
      scheduledStart:'',
      scheduledEnd:'',
      meetingReference:'',
      changeReason:'Planejamento da entrevista na Jornada DA.',
    })
    setShowInterviewCreate(false)
    const { data } = await supabase
      .from('skda_interviews' as never)
      .select('id,code,title,interviewee_name,interviewee_role,status,channel,scheduled_start,scheduled_end,actual_start,actual_end,event_id' as never)
      .eq('diagnosis_id', selected.id)
      .order('scheduled_start', { ascending:true, nullsFirst:false })
    setInterviews((data ?? []) as unknown as Interview[])
    setMetrics((current) => ({ ...current, interviews:(data ?? []).length }))
  }

  const createDiagnosis = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError('Informe código e nome da Jornada DA.')
      return
    }

    if (form.changeReason.trim().length < 10) {
      setError('Informe uma justificativa para criar a Jornada DA.')
      return
    }

    setSaving(true)
    setError('')
    const { data, error: saveError } = await supabase.rpc(
      'create_skda_diagnosis_with_project' as never,
      {
        target_organization_id:props.organizationId,
        target_code:form.code.trim().toUpperCase(),
        target_name:form.name.trim(),
        target_description:form.description.trim() || null,
        target_diagnosis_type:form.diagnosisType,
        target_reference_year:form.referenceYear ? Number(form.referenceYear) : null,
        change_reason:form.changeReason.trim(),
      } as never,
    )

    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    setForm({
      code:`DA-${new Date().getFullYear()}`,
      name:`Jornada DA ${new Date().getFullYear()}`,
      description:'Jornada de Diagnóstico Assistido do ciclo de referência.',
      diagnosisType:'pdgc',
      referenceYear:String(new Date().getFullYear()),
      changeReason:'Criação da Jornada DA e do projeto transversal correspondente.',
    })
    setShowCreate(false)
    await loadDiagnoses()
    const created = data as unknown as { diagnosis_id?: string } | null
    if (created?.diagnosis_id) setSelectedId(created.diagnosis_id)
  }

  const header = (
    <div className="skda-header skda-header-compact">
      <div>
        <p className="skda-eyebrow">Jornada de Diagnóstico Assistido</p>
        <h2>{selected?.name ?? 'Selecione ou inicie uma Jornada DA'}</h2>
        <p>{selected ? `${selected.code} · ${STATUS[selected.status] ?? selected.status}` : 'A metodologia, a Agenda e o Plano de Ação permanecem integrados ao contexto da organização.'}</p>
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

  const activePhase = PHASES.find((phase) => phase.code === activePhaseCode) ?? null
  const isOverview = activePhaseCode === 'OVERVIEW'
  const isAgenda = activePhaseCode === 'AGENDA'
  const selectedCatalog = catalogs.find((catalog) => catalog.id === selected?.catalog_version_id) ?? null
  const catalogLocked = metrics.responses > 0
  const currentMegaphaseCode = selected?.current_megaphase_code ?? 'MF0'

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

      {isOverview && <section className="skda-pdcl-overview">
        <div className="skda-phase-workspace-head">
          <div>
            <span className="skda-eyebrow">Metodologia em ação</span>
            <h3>PDCL da Jornada DA</h3>
            <small>O diagnóstico não é uma sequência linear de telas: evidências, entrevistas, avaliação, checagem e aprendizado retroalimentam a própria compreensão da organização.</small>
          </div>
          <span>{selected.execution_initiative_id ? 'Projeto da Jornada vinculado' : 'Projeto da Jornada pendente'}</span>
        </div>
        <div className="skda-pdcl-cycle">
          {PDCL_STAGES.map((stage) => (
            <article key={stage.code}>
              <div className="skda-pdcl-code">{stage.code}</div>
              <div>
                <strong>{stage.title}</strong>
                <p>{stage.pattern}</p>
                <div className="skda-pdcl-phases">
                  {stage.megaphases.map((megaphaseCode) => {
                    const megaphase = MEGAPHASES.find((item) => item.code === megaphaseCode)
                    return megaphase ? <span key={megaphase.code}>{megaphase.code} · {megaphase.title}</span> : null
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="skda-megaphases">
          <div className="skda-phase-workspace-head">
            <div>
              <span className="skda-eyebrow">Processo metodológico</span>
              <h3>MegaFases e Padrões de Trabalho</h3>
              <small>A MegaFase em andamento permanece expandida. As demais preservam a visão completa da Jornada sem confundir processo metodológico com os workspaces DA-00 a DA-06.</small>
            </div>
            <span>{currentMegaphaseCode}</span>
          </div>
          <div className="skda-megaphase-list">
            {MEGAPHASES.map((megaphase) => {
              const isCurrent = megaphase.code === currentMegaphaseCode
              return <details key={megaphase.code} open={isCurrent} className={isCurrent ? 'is-current' : ''}>
                <summary>
                  <span>{megaphase.code}</span>
                  <strong>{megaphase.title}</strong>
                  <small>{isCurrent ? 'Em andamento' : 'Metodologia'}</small>
                </summary>
                <div>
                  <span>Padrão de Trabalho</span>
                  <p>{megaphase.workPattern}</p>
                  <small>Gate: fatos, evidências, hipóteses, lacunas, divergências, consensos, entregáveis e próximo passo.</small>
                </div>
              </details>
            })}
          </div>
        </div>
        <div className="skda-project-bridge">
          <div>
            <span>Execução da Jornada</span>
            <strong>{selected.execution_initiative_id ? 'Projeto transversal associado' : 'A Jornada ainda precisa ser associada ao seu Projeto transversal'}</strong>
            <small>O diagnóstico continua sendo o objeto metodológico do SK-DA; o Projeto organiza agenda, atividades, responsabilidades e execução sem duplicar o diagnóstico.</small>
          </div>
          {!selected.execution_initiative_id && canManage && <button type="button" className="skda-primary" disabled={saving} onClick={() => void ensureDiagnosisProject()}>{saving ? 'Vinculando...' : 'Criar Projeto da Jornada'}</button>}
        </div>
      </section>}

      {isAgenda && <section className="skda-agenda-host">
        <AgendaSection organizationId={props.organizationId} />
      </section>}

      {activePhase && <div className="skda-journey">
        <div className="skda-journey-head"><div><span>Jornada metodológica</span><h3>DA-00 → DA-06</h3></div><b>{Number(selected.progress).toFixed(0)}%</b></div>
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
            {activePhase.code === 'DA-06' && <><span>Plano de Ação</span><strong>Ciclos 1 · 2 · 3</strong></>}
            {activePhase.code === 'DA-00' && <><span>Estado</span><strong>{STATUS[selected.status] ?? selected.status}</strong></>}
          </div>
          {activePhase.code === 'DA-00' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><div><h4>Configuração da Jornada DA</h4><small>Defina o ciclo, escopo, metodologia, responsável e catálogo da jornada.</small></div><span>{selectedCatalog ? selectedCatalog.framework_code : 'Não definido'}</span></div>
            <div className="skda-opening-grid">
              <label className="skda-inline-field"><span>Ano de referência</span><input type="number" min="2000" max="2100" value={openingForm.referenceYear} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,referenceYear:e.target.value}))}/></label>
              <label className="skda-inline-field"><span>Tipo de diagnóstico</span><select value={openingForm.diagnosisType} disabled={!canManage || saving || catalogLocked} onChange={(e)=>setOpeningForm(v=>({...v,diagnosisType:e.target.value}))}>{Object.entries(TYPES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
              <label className="skda-inline-field"><span>Início da jornada</span><input type="date" value={openingForm.startedOn} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,startedOn:e.target.value}))}/></label>
              <label className="skda-inline-field"><span>Conclusão prevista</span><input type="date" value={openingForm.plannedEndOn} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,plannedEndOn:e.target.value}))}/></label>
              <label className="skda-inline-field skda-opening-wide"><span>Responsável pela jornada</span><select value={openingForm.leadUserId} disabled={!canManage || saving || organizationUsers.length === 0} onChange={(e)=>setOpeningForm(v=>({...v,leadUserId:e.target.value}))}><option value="">Não definido</option>{organizationUsers.map((user)=><option key={user.user_id} value={user.user_id}>{user.user_display_name || user.user_email}{user.job_title ? ' · '+user.job_title : ''}</option>)}</select>{organizationUsers.length === 0 && <small>A lista de usuários não está disponível para este perfil. O responsável pode ser definido posteriormente.</small>}</label>
              <label className="skda-inline-field skda-opening-wide"><span>Escopo da jornada</span><textarea rows={4} value={openingForm.scopeStatement} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,scopeStatement:e.target.value}))} placeholder="Unidades, temas, processos, públicos e limites que serão considerados no diagnóstico."/></label>
              <label className="skda-inline-field skda-opening-wide"><span>Orientações metodológicas</span><textarea rows={4} value={openingForm.methodologyNotes} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,methodologyNotes:e.target.value}))} placeholder="Premissas, critérios de aplicação, adaptações e observações metodológicas específicas desta jornada."/></label>
            </div>
            <div className="skda-catalog-block">
              <div className="skda-phase-workspace-head"><h4>Catálogo metodológico</h4><span>{selectedCatalog ? selectedCatalog.name : 'Não selecionado'}</span></div>
              {catalogs.length === 0 ? <p className="skda-phase-empty">Nenhum catálogo publicado está disponível. A jornada pode ser aberta, mas a avaliação por questão depende de um catálogo publicado.</p> : <label className="skda-inline-field"><span>Versão do catálogo</span><select value={selected.catalog_version_id ?? ''} disabled={!canManage || saving || catalogLocked} onChange={(e) => void assignCatalog(e.target.value)}><option value="">Selecione...</option>{catalogs.map((catalog) => <option key={catalog.id} value={catalog.id}>{catalog.name} · {catalog.version_code}</option>)}</select>{catalogLocked && <small>Catálogo bloqueado após o início da avaliação para preservar a rastreabilidade das respostas.</small>}</label>}
            </div>
            {canManage && <div className="skda-opening-actions"><button type="button" className="skda-primary" disabled={saving} onClick={()=>void saveOpeningConfiguration()}>{saving?'Salvando...':'Salvar abertura da jornada'}</button></div>}
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
            <div className="skda-phase-workspace-head">
              <div><h4>Entrevistas do diagnóstico</h4><small>Entrevistas são eventos da Agenda da Organização. Participantes planejados e presença efetiva são geridos pelo mesmo motor transversal do PE.</small></div>
              {canEditInterviews && <button type="button" className="skda-primary" onClick={() => setShowInterviewCreate(true)}>Nova entrevista</button>}
            </div>
            <div className="skda-evidence-loop-note"><strong>Aprendizado contínuo</strong><span>Uma entrevista pode revelar evidências que não estavam disponíveis no levantamento inicial. Novas evidências podem ser incluídas no Core e correlacionadas ao DA, reabrindo a análise quando necessário.</span></div>
            {interviews.length === 0 ? <p className="skda-phase-empty">Nenhuma entrevista registrada.</p> : <div className="skda-interview-list">
              {interviews.map((interview) => <article key={interview.id}>
                <div>
                  <small>{interview.code} · {interview.event_id ? 'Na Agenda' : 'Sem evento associado'}</small>
                  <strong>{interview.title}</strong>
                  <span>Prevista: {interview.scheduled_start ? new Date(interview.scheduled_start).toLocaleString('pt-BR') : 'não definida'}{interview.scheduled_end ? ' → '+new Date(interview.scheduled_end).toLocaleString('pt-BR') : ''}</span>
                  <span>Realizada: {interview.actual_start ? new Date(interview.actual_start).toLocaleString('pt-BR') : 'não registrada'}{interview.actual_end ? ' → '+new Date(interview.actual_end).toLocaleString('pt-BR') : ''}</span>
                </div>
                <div className="skda-interview-actions">
                  <b>{interview.status === 'planned' ? 'Planejada' : interview.status === 'in_progress' ? 'Em andamento' : interview.status === 'completed' ? 'Realizada' : interview.status}</b>
                  {interview.event_id && <button type="button" onClick={() => void openInterviewParticipants(interview)}>Participantes</button>}
                  {canEditInterviews && <button type="button" onClick={() => {
                    setRealizationInterviewId(interview.id)
                    setRealizationForm((current) => ({
                      ...current,
                      actualStart:interview.actual_start ? new Date(interview.actual_start).toISOString().slice(0,16) : '',
                      actualEnd:interview.actual_end ? new Date(interview.actual_end).toISOString().slice(0,16) : '',
                    }))
                  }}>Registrar realização</button>}
                  <button type="button" onClick={() => setActivePhaseCode('DA-01')}>Revisar evidências</button>
                </div>
              </article>)}
            </div>}
          </div>}
          {activePhase.code === 'DA-03' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><div><h4>Avaliação por questão</h4><small>Registre a constatação, classifique, atribua nota e confiança e submeta à validação conforme o papel.</small></div><span>{selectedCatalog ? selectedCatalog.name : 'Catálogo não definido'}</span></div>
            <div className="skda-assessment-method-note"><strong>Maturidade</strong><span>A escala de maturidade não está publicada no catálogo atual. O campo não será preenchido artificialmente; quando a escala metodológica estiver no catálogo, a avaliação passará a derivá-la daqui.</span></div>
            {!selected.catalog_version_id ? <p className="skda-phase-empty">Defina o catálogo na fase DA-00 antes de iniciar a avaliação.</p> : questions.length === 0 ? <p className="skda-phase-empty">O catálogo selecionado ainda não possui questões disponíveis.</p> : <div className="skda-question-list skda-assessment-list">
              {questions.map((question) => {
                const response = responses.find((item) => item.question_id === question.id)
                const draft = assessmentDrafts[question.id] ?? { classification:'not_evaluated', answerText:'', rationale:'', confidenceLevel:'not_assessed', score:'' }
                return <article key={question.id} className="skda-assessment-card">
                  <div className="skda-question-copy"><small>{question.code}{question.axis_name ? ' · '+question.axis_name : ''}</small><strong>{question.question_text}</strong>{question.criterion_name && <span>{question.criterion_name}</span>}</div>
                  <div className="skda-assessment-status"><span>Estado</span><b>{RESPONSE_STATUS[response?.response_status ?? 'draft'] ?? response?.response_status}</b>{response?.validated_at && <small>Validada em {new Date(response.validated_at).toLocaleString('pt-BR')}</small>}</div>
                  <div className="skda-assessment-fields">
                    <label className="wide"><span>Constatação / resposta</span><textarea rows={3} value={draft.answerText} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{answerText:e.target.value})}/></label>
                    <label><span>Classificação</span><select value={draft.classification} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{classification:e.target.value})}>{Object.entries(CLASSIFICATION).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label><span>Nota (0–100)</span><input type="number" min="0" max="100" step="0.01" value={draft.score} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{score:e.target.value})}/></label>
                    <label><span>Confiança</span><select value={draft.confidenceLevel} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{confidenceLevel:e.target.value})}>{Object.entries(CONFIDENCE_LEVELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="wide"><span>Fundamentação</span><textarea rows={2} value={draft.rationale} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{rationale:e.target.value})}/></label>
                  </div>
                  <div className="skda-assessment-actions">
                    {canEditAssessment && <button type="button" className="skda-primary" disabled={saving} onClick={()=>void saveAssessment(question)}>{saving?'Salvando...':response?.response_status === 'validated' ? 'Salvar e reabrir avaliação' : 'Salvar avaliação'}</button>}
                    {canValidateAssessment && response && response.response_status !== 'validated' && <button type="button" className="skda-secondary-action" disabled={saving} onClick={()=>void validateAssessment(question)}>Validar avaliação</button>}
                  </div>
                </article>
              })}
            </div>}
          </div>}
          {activePhase.code === 'DA-04' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Achados do diagnóstico</h4>{canEditFindings && <button type="button" className="skda-primary" onClick={() => setShowFindingCreate(true)}>Novo achado</button>}</div>
            {findings.length === 0 ? <p className="skda-phase-empty">Nenhum achado registrado.</p> : <div className="skda-finding-list">
              {findings.map((finding) => {
                const owner = organizationUsers.find((user) => user.user_id === finding.owner_user_id)
                return <article key={finding.id}>
                  <div><small>{FINDING_TYPES[finding.finding_type] ?? finding.finding_type} · Prioridade {PRIORITIES[finding.priority] ?? finding.priority}</small><strong>{finding.title}</strong><span>{finding.description}</span></div>
                  <div><b>{finding.status === 'open' ? 'Aberto' : finding.status}</b>{finding.question_id && <span>Origem: questão</span>}{finding.interview_id && <span>Origem: entrevista</span>}{owner && <span>Responsável: {owner.user_display_name || owner.user_email}</span>}{finding.due_date && <span>Prazo: {new Date(finding.due_date+'T00:00:00').toLocaleDateString('pt-BR')}</span>}</div>
                </article>
              })}
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
            <div className="skda-phase-workspace-head">
              <div>
                <h4>Plano de Ação</h4>
                <small>Somente recomendações aprovadas originadas nesta Jornada DA. A execução integral pertence à Gestão Tática/Operacional transversal.</small>
              </div>
              <span>{actionPlanAllocations.length} ação(ões) priorizada(s)</span>
            </div>
            {findings.filter((finding) => finding.status === 'accepted' || finding.status === 'in_action').length === 0 ? <p className="skda-phase-empty">Nenhuma recomendação aprovada está disponível para o Plano de Ação.</p> : <>
              <div className="skda-action-plan-unallocated">
                <div className="skda-phase-workspace-head"><h4>A priorizar</h4><span>Deliberação necessária</span></div>
                {findings.filter((finding) => (finding.status === 'accepted' || finding.status === 'in_action') && !actionPlanAllocations.some((allocation) => allocation.finding_id === finding.id)).length === 0 ? <p className="skda-phase-empty">Todas as recomendações aprovadas já foram alocadas em ciclos.</p> : <div className="skda-finding-list">
                  {findings.filter((finding) => (finding.status === 'accepted' || finding.status === 'in_action') && !actionPlanAllocations.some((allocation) => allocation.finding_id === finding.id)).map((finding) => {
                    const initiative = linkedInitiatives.find((item) => item.sourceFindingId === finding.id)
                    return <article key={finding.id}>
                      <div><small>{FINDING_TYPES[finding.finding_type] ?? finding.finding_type} · {PRIORITIES[finding.priority] ?? finding.priority}</small><strong>{finding.title}</strong><span>{finding.recommendation}</span>{initiative && <div className="skda-linked-initiative"><small>Iniciativa transversal já vinculada</small><strong>{initiative.code} · {initiative.name}</strong></div>}</div>
                      <div className="skda-cycle-actions">
                        <span>Alocar em:</span>
                        {[1,2,3].map((cycle) => <button type="button" key={cycle} disabled={saving} onClick={() => void assignActionCycle(finding.id,cycle)}>Ciclo {cycle}</button>)}
                      </div>
                    </article>
                  })}
                </div>}
              </div>
              <div className="skda-action-cycles">
                {[1,2,3].map((cycle) => {
                  const allocations = actionPlanAllocations.filter((allocation) => allocation.cycle_number === cycle)
                  const title = cycle === 1
                    ? 'Ciclo 1 · Prioridades 80/20 e sustentação'
                    : cycle === 2
                      ? 'Ciclo 2 · Consolidação, expansão e transformação'
                      : 'Ciclo 3 · Excelência'
                  const description = cycle === 1
                    ? 'Prioriza as ações de maior impacto e sustentação. O 80/20 orienta a prioridade, mas não impede antecipar outras ações conforme a capacidade e o apetite da organização.'
                    : cycle === 2
                      ? 'Consolida o primeiro ciclo, amplia capacidades e conduz transformações adicionais com base nos aprendizados já obtidos.'
                      : 'Eleva e institucionaliza capacidades para patamares de excelência, preservando aprendizado e evolução contínua.'
                  return <section key={cycle} className="skda-action-cycle">
                    <div className="skda-action-cycle-head"><div><strong>{title}</strong><small>{description}</small></div><b>{allocations.length}</b></div>
                    {allocations.length === 0 ? <p>Nenhuma ação alocada.</p> : <div className="skda-action-cycle-list">
                      {allocations.map((allocation) => {
                        const finding = findings.find((item) => item.id === allocation.finding_id)
                        const initiative = linkedInitiatives.find((item) => item.sourceFindingId === allocation.finding_id)
                        if (!finding) return null
                        return <article key={allocation.id}>
                          <div><strong>{finding.title}</strong><span>{finding.recommendation}</span>{allocation.rationale && <small>{allocation.rationale}</small>}</div>
                          <div className="skda-finding-actions">
                            <b>{initiative ? 'Na Gestão Tática/Operacional' : 'Ação DA aprovada'}</b>
                            <span>Origem: SK-DA / {finding.title}</span>
                            {initiative ? <span>{initiative.code} · {INITIATIVE_CLASSES[initiative.initiative_class] ?? initiative.initiative_class}</span> : finding.status === 'accepted' && canCreateTactical ? <button type="button" className="skda-primary" onClick={() => openTacticalConversion(finding)}>Criar iniciativa transversal</button> : null}
                            <div className="skda-cycle-reassign">{[1,2,3].filter((target) => target !== cycle).map((target) => <button type="button" key={target} disabled={saving} onClick={() => void assignActionCycle(finding.id,target)}>Mover para Ciclo {target}</button>)}</div>
                          </div>
                        </article>
                      })}
                    </div>}
                  </section>
                })}
              </div>
            </>}
          </div>}
        </section>
      </div>}
    </div>
  ) : undefined

  const shellNavigation = [
    {
      id:'overview',
      label:'Visão Geral',
      icon:<span aria-hidden="true">▦</span>,
      active:activePhaseCode === 'OVERVIEW',
      onActivate:() => setActivePhaseCode('OVERVIEW'),
    },
    {
      id:'journey',
      label:'Jornada DA',
      icon:<span aria-hidden="true">⌁</span>,
      active:PHASES.some((phase) => phase.code === activePhaseCode) && activePhaseCode !== 'DA-06',
      disabled:!selected,
      onActivate:() => setActivePhaseCode(
        PHASES.some((phase) => phase.code === activePhaseCode) && activePhaseCode !== 'DA-06'
          ? activePhaseCode
          : 'DA-00',
      ),
    },
    {
      id:'action-plan',
      label:'Plano de Ação',
      icon:<span aria-hidden="true">✓</span>,
      active:activePhaseCode === 'DA-06',
      disabled:!selected,
      onActivate:() => setActivePhaseCode('DA-06'),
    },
  ]

  const shellPageTitle = isOverview
    ? 'Visão Geral'
    : isAgenda
      ? 'Agenda'
      : activePhase
        ? activePhase.title
        : 'Diagnóstico Assistido'

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
          <div className="skda-shell-avatar" aria-hidden="true">
            {props.userAvatarUrl ? <img src={props.userAvatarUrl} alt="" /> : props.userDisplayName.slice(0,2).toUpperCase()}
          </div>
          <div>
            <strong>{props.userDisplayName}</strong>
            <span>{props.userRoleName}</span>
          </div>
        </div>
      }
      pageTitle={shellPageTitle}
      headerActions={
        <button type="button" onClick={() => setActivePhaseCode('AGENDA')} aria-label="Abrir Agenda transversal" title="Agenda">
          <CalendarIcon />
        </button>
      }
      sidebarFooter={
        <>
          <div className="skda-product-signature">
            <img src="/sparkoop-mascot.png" alt="Mascote SPARKs" />
            <div><strong>SPARKs DA</strong><small>© SPARKOOP</small></div>
          </div>
          <button type="button" onClick={props.onReturnToModules}><span aria-hidden="true">←</span><span>Voltar aos módulos</span></button>
        </>
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
        <p>Registre a justificativa da validação executiva. A recomendação aceita ficará elegível para priorização no Plano de Ação e, quando aplicável, conversão em iniciativa transversal.</p>
        <div className="skda-form-grid"><label className="wide"><span>Justificativa *</span><textarea rows={5} value={validationReason} onChange={(e)=>setValidationReason(e.target.value)}/></label></div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setValidationFindingId(null)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void acceptRecommendation()}>{saving?'Validando...':'Aceitar recomendação'}</button></div>
      </section>
    </div>}
    {showTacticalCreate && selected && <div className="skda-modal-backdrop">
      <section className="skda-modal skda-modal-wide" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">DA-06 · Plano de Ação</p><h2>Criar iniciativa transversal</h2></div><button type="button" onClick={() => setShowTacticalCreate(false)}>×</button></div>
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
          <label className="wide"><span>Entrevista relacionada</span><select value={findingForm.interviewId} onChange={(e)=>setFindingForm(v=>({...v,interviewId:e.target.value}))}><option value="">Sem vínculo direto</option>{interviews.map((interview) => <option key={interview.id} value={interview.id}>{interview.code} · {interview.title}</option>)}</select></label>
          <label><span>Responsável</span><select value={findingForm.ownerUserId} onChange={(e)=>setFindingForm(v=>({...v,ownerUserId:e.target.value}))}><option value="">Não definido</option>{organizationUsers.map((user)=><option key={user.user_id} value={user.user_id}>{user.user_display_name || user.user_email}</option>)}</select></label>
          <label><span>Prazo</span><input type="date" value={findingForm.dueDate} onChange={(e)=>setFindingForm(v=>({...v,dueDate:e.target.value}))}/></label>
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
        <div className="skda-modal-head"><div><p className="skda-eyebrow">DA-02 · Entrevistas</p><h2>Planejar entrevista</h2></div><button type="button" onClick={() => setShowInterviewCreate(false)}>×</button></div>
        <p>A entrevista será criada também como evento da Agenda da Organização. Depois do agendamento, inclua participantes internos e externos pelo gerenciamento do evento.</p>
        <div className="skda-form-grid">
          <label><span>Código *</span><input value={interviewForm.code} onChange={(e)=>setInterviewForm(v=>({...v,code:e.target.value}))} placeholder="ENT-001"/></label>
          <label><span>Canal</span><select value={interviewForm.channel} onChange={(e)=>setInterviewForm(v=>({...v,channel:e.target.value}))}><option value="teams">Teams</option><option value="meet">Google Meet</option><option value="presential">Presencial</option><option value="other">Outro</option></select></label>
          <label className="wide"><span>Título *</span><input value={interviewForm.title} onChange={(e)=>setInterviewForm(v=>({...v,title:e.target.value}))} placeholder="Entrevista com a Diretoria"/></label>
          <label><span>Início previsto</span><input type="datetime-local" value={interviewForm.scheduledStart} onChange={(e)=>setInterviewForm(v=>({...v,scheduledStart:e.target.value}))}/></label>
          <label><span>Término previsto</span><input type="datetime-local" value={interviewForm.scheduledEnd} onChange={(e)=>setInterviewForm(v=>({...v,scheduledEnd:e.target.value}))}/></label>
          <label className="wide"><span>Referência da reunião</span><input value={interviewForm.meetingReference} onChange={(e)=>setInterviewForm(v=>({...v,meetingReference:e.target.value}))} placeholder="Link Teams, Meet, sala ou outra referência"/></label>
          <label className="wide"><span>Justificativa do agendamento *</span><textarea rows={3} value={interviewForm.changeReason} onChange={(e)=>setInterviewForm(v=>({...v,changeReason:e.target.value}))}/></label>
        </div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setShowInterviewCreate(false)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createInterview()}>{saving?'Salvando...':'Agendar entrevista'}</button></div>
      </section>
    </div>}
    {managedInterviewEvent && <JourneyEventManageDialog
      event={managedInterviewEvent}
      onClose={() => setManagedInterviewEvent(null)}
      onChanged={() => setManagedInterviewEvent(null)}
      onParticipantChanged={() => undefined}
    />}

    {realizationInterviewId && <div className="skda-modal-backdrop">
      <section className="skda-modal" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">DA-02 · Entrevistas</p><h2>Registrar realização</h2></div><button type="button" onClick={() => setRealizationInterviewId(null)}>×</button></div>
        <p>Registre quando a entrevista realmente aconteceu. A previsão original permanece preservada na Agenda para comparação.</p>
        <div className="skda-form-grid">
          <label><span>Início realizado *</span><input type="datetime-local" value={realizationForm.actualStart} onChange={(e)=>setRealizationForm(v=>({...v,actualStart:e.target.value}))}/></label>
          <label><span>Término realizado</span><input type="datetime-local" value={realizationForm.actualEnd} onChange={(e)=>setRealizationForm(v=>({...v,actualEnd:e.target.value}))}/></label>
          <label className="wide"><span>Notas da realização</span><textarea rows={4} value={realizationForm.notes} onChange={(e)=>setRealizationForm(v=>({...v,notes:e.target.value}))} placeholder="Participantes adicionais, mudanças de contexto, evidências citadas ou observações relevantes."/></label>
          <label className="wide"><span>Justificativa do registro *</span><textarea rows={3} value={realizationForm.changeReason} onChange={(e)=>setRealizationForm(v=>({...v,changeReason:e.target.value}))}/></label>
        </div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setRealizationInterviewId(null)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void recordInterviewRealization()}>{saving?'Salvando...':'Registrar realização'}</button></div>
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
          <label className="wide"><span>Justificativa de criação *</span><textarea rows={3} value={form.changeReason} onChange={(e)=>setForm(v=>({...v,changeReason:e.target.value}))}/></label>
        </div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setShowCreate(false)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createDiagnosis()}>{saving?'Criando...':'Iniciar Jornada DA'}</button></div>
      </section>
    </div>}
  </>
}
