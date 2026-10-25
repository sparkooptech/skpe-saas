import { Fragment, useEffect, useMemo, useState } from 'react'
import { ApplicationShell } from '../../components/application-shell/ApplicationShell'
import { OrganizationBrandingLogo } from '../../components/organization-branding/OrganizationBrandingLogo'
import { TransversalWorkspace } from '../../components/application-shell/TransversalWorkspace'
import { MetricCard } from '../../components/design-system'
import { supabase } from '../../lib/supabase'
import { AgendaSection } from '../skpe/features/agenda/AgendaSection'
import { JourneyEventManageDialog } from '../skpe/features/journey/JourneyEventManageDialog'
import './SkdaWorkspace.css'

type Props = {
  organizationId: string
  organizationName: string
  organizationCode: string
  organizationLogoStoragePath?: string | null
  workspaceOrganizations: Array<{ id:string; code:string; name:string }>
  workspaceModules: Array<{ code:string; name:string; description:string | null; available:boolean }>
  activeModuleCode: string
  onSwitchOrganization?: (organizationId:string) => void | Promise<void>
  onSwitchModule?: (moduleCode:string) => void | Promise<void>
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
type EvidenceAsset = { id: string; title: string; evidence_type: string; validation_status: string; reliability_level: string; reference_date: string | null; current_version_id: string | null }
type EvidenceVersionText = { id: string; evidence_asset_id: string; extracted_text: string | null }
type ContractMeetingProposal = { date: string; start: string; durationHours: number; location: string | null }
type ContractIntakeProposal = { assetId: string; sourceTitle: string; sourceText: string; startedOn: string; plannedEndOn: string; contractedHours: number; meetings: ContractMeetingProposal[]; scopeLabel: string | null }
type EvidenceCorrelation = { id: string; evidence_asset_id: string; usage_type: string; validation_status: string }
type EvidenceQuestionIntelligence = { id:string; evidence_asset_id:string; question_id:string; document_intake_status:string; evidence_coverage_status:string; practice_state:string; relevance_score:number|null; adequacy_score:number|null; sufficiency_score:number|null; reliability_score:number|null; actuality_score:number|null; coverage_score:number|null; confidence_score:number|null; gap_description:string|null; complement_needed:string|null; improvement_suggestion:string|null; interview_question_suggestion:string|null; self_assessment_guidance:string|null; diagnostic_hypothesis:string|null; analysis_status:string; source_excerpt:string|null; source_locator:string|null }
type SelfAssessmentSnapshot = { id: string; source_label: string | null; source_date: string | null; content_hash: string | null; metadata: Record<string, unknown> }
type SelfAssessmentMetric = { id:string; block_code:'GOVERNANCA'|'GESTAO'; metric_kind:'overall_index'|'criterion'|'history'|'benchmark'; metric_code:string; metric_name:string; reference_year:number|null; comparator_code:string; comparator_label:string|null; metric_value:number; unit:string; source_label:string|null; source_reference:string|null; metadata?:Record<string,unknown>|null }
type CatalogVersion = { id: string; code: string; version_code: string; name: string; framework_code: string }
type Question = { id: string; code: string; axis_name: string | null; criterion_name: string | null; question_text: string; guidance: string | null; display_order: number }
type Response = { id: string; question_id: string; classification: string; response_status: string; answer_text: string | null; rationale: string | null; confidence_level: string; maturity_level: string | null; score: number | null; evaluated_at: string | null; validated_at: string | null }
type AssessmentDraft = { classification: string; answerText: string; rationale: string; confidenceLevel: string; score: string }
type Finding = { id: string; finding_type: string; title: string; description: string; priority: string; status: string; recommendation: string | null; question_id: string | null; interview_id: string | null; owner_user_id: string | null; due_date: string | null }
type InitiativeOrigin = { initiative_id: string; source_entity_id: string }
type LinkedInitiative = { id: string; code: string; name: string; initiative_class: string; status: string; progress: number; sourceFindingId: string }
type EvolutionRow = {
  diagnosis_id: string
  diagnosis_code: string
  reference_year: number | null
  diagnosis_status: string
  question_id: string
  response_id: string | null
  response_status: string | null
  score: number | null
  validated_practice_count: number
  validated_evidence_count: number
  open_gap_count: number
}
type JourneyExecutionAction = {
  id: string
  parent_action_id: string | null
  code: string
  name: string
  status: string
  progress: number
  baseline_start_date: string | null
  baseline_due_date: string | null
  planned_start_date: string | null
  planned_due_date: string | null
  started_at: string | null
  completed_at: string | null
  metadata: Record<string, unknown>
}
type JourneyArtifact = {
  id: string
  artifact_code: string
  title: string
  purpose: string | null
  macrophase_code: string | null
  status: string
  current_version_number: number
  planned_due_date: string | null
  metadata: Record<string, unknown>
}
type ActionFollowup = {
  diagnosis_id: string
  reference_year: number | null
  finding_id: string
  finding_title: string
  cycle_number: number | null
  initiative_id: string | null
  initiative_name: string | null
  initiative_status: string | null
  initiative_progress: number | null
  followup_state: string
  execution_completed: boolean
}

const DA_EVIDENCE_CHECKLIST = [
  { code:'historico-governanca', title:'Diagnósticos anteriores de Governança', hint:'Relatórios, devolutivas e resultados por ciclo' },
  { code:'historico-gestao', title:'Diagnósticos anteriores de Gestão', hint:'Relatórios, devolutivas e resultados por ciclo' },
  { code:'planos-acao', title:'Planos de ação e acompanhamento', hint:'Planos anteriores, responsáveis, prazos e execução' },
  { code:'autoavaliacao', title:'Autoavaliação vigente', hint:'Respostas, comentários e relatórios oficiais' },
  { code:'governanca', title:'Governança e quadro social', hint:'Estatuto, regimentos, atas, políticas e registros' },
  { code:'gestao', title:'Gestão e resultados', hint:'Estratégia, processos, indicadores e controles' },
  { code:'entrevistas', title:'Entrevistas e verificações', hint:'Atas, gravações, transcrições e complementos' },
  { code:'complementar', title:'Outras evidências', hint:'Documentos não previstos no checklist inicial' },
] as const

const EMPTY: Metrics = { responses: 0, interviews: 0, evidence: 0, findings: 0 }

const PHASES: Phase[] = [
  { code:'DA-00', title:'Preparação e abertura', description:'Constitui a Jornada, absorve Autoavaliações, histórico, benchmarks e fontes, organiza o inventário e prepara o aprofundamento.', statusKey:'preparation' },
  { code:'DA-01', title:'Entrevistas e diagnóstico', description:'Executa entrevistas orientadas pelas questões, amplia evidências, avalia requisitos, PDCL e maturidade e consolida o diagnóstico.', statusKey:'interviews' },
  { code:'DA-02', title:'Recomendações e priorização', description:'Converte lacunas e oportunidades em recomendações e prioriza as poucas ações de maior impacto.', statusKey:'validation' },
  { code:'DA-03', title:'Plano de Ação e devolutiva', description:'Organiza ações por ciclos, realiza a devolutiva, pactua execução e preserva o follow-up entre ciclos.', statusKey:'validation' },
]

const PHASE_MEGAPHASES: Record<string, readonly string[]> = {
  'DA-00':['MF0','MF1','MF2','MF3'],
  'DA-01':['MF4','MF5','MF6','MF7'],
  'DA-02':['MF8'],
  'DA-03':['MF9','MF10'],
}

const normalizeJourneyPhaseCode = (code: string | null | undefined) =>
  PHASES.some((phase) => phase.code === code) ? code! : 'DA-00'

const PDGC_WORKLOAD_REFERENCES = {
  PP:{
    code:'PP',
    name:'Primeiros Passos',
    totalHours:34,
    technicalInstitutionalHours:17,
    organizationHours:17,
    studyHours:6,
    technicalAlignmentHours:2,
    returnPreparationHours:7,
    actionPlanHours:2,
  },
  CE:{
    code:'CE',
    name:'Compromisso com a Excelência',
    totalHours:42,
    technicalInstitutionalHours:19,
    organizationHours:23,
    studyHours:7,
    technicalAlignmentHours:2,
    returnPreparationHours:8,
    actionPlanHours:2,
  },
  RE:{
    code:'RE',
    name:'Rumo à Excelência',
    totalHours:49,
    technicalInstitutionalHours:23,
    organizationHours:26,
    studyHours:8,
    technicalAlignmentHours:2,
    returnPreparationHours:10,
    actionPlanHours:3,
  },
  EX:{
    code:'EX',
    name:'Excelência',
    totalHours:59,
    technicalInstitutionalHours:27,
    organizationHours:32,
    studyHours:10,
    technicalAlignmentHours:2,
    returnPreparationHours:12,
    actionPlanHours:3,
  },
} as const

type PdgcWorkloadCode = keyof typeof PDGC_WORKLOAD_REFERENCES

const normalizePdgcWorkloadCode = (value: unknown): PdgcWorkloadCode | null => {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLocaleUpperCase('pt-BR')
  if (normalized === 'PP' || normalized.includes('PRIMEIROS')) return 'PP'
  if (normalized === 'CE' || normalized.includes('COMPROMISSO')) return 'CE'
  if (normalized === 'RE' || normalized.includes('RUMO')) return 'RE'
  if (normalized === 'EX' || normalized.includes('EXCELÊNCIA') || normalized.includes('EXCELENCIA')) return 'EX'
  return null
}

const toIsoContractDate = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

const normalizeSearchText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const formatCatalogName = (value: string) =>
  value
    .replace(/Excel.ncia/gi, 'Excelência')
    .replace(/Diagn.stico/gi, 'Diagnóstico')
    .replace(/Avalia..o/gi, 'Avaliação')

const sha256Hex = async (file: File) => {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

const storageSafeFileName = (value: string) =>
  value.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'evidencia'

const inferEvidenceFileMetadata = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const evidenceType =
    ['xls','xlsx','csv'].includes(extension) ? 'dataset'
      : ['png','jpg','jpeg','webp'].includes(extension) ? 'image'
        : ['mp3','wav','m4a','ogg'].includes(extension) ? 'audio'
          : ['mp4','mov','webm'].includes(extension) ? 'video'
            : 'document'
  const title = file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim()
  const isoMatch = file.name.match(/(20\d{2})[-_.](0?[1-9]|1[0-2])[-_.]([0-2]?\d|3[01])/)
  const brMatch = file.name.match(/([0-2]?\d|3[01])[-_.](0?[1-9]|1[0-2])[-_.](20\d{2})/)
  const referenceDate = isoMatch
    ? `${isoMatch[1]}-${isoMatch[2].padStart(2,'0')}-${isoMatch[3].padStart(2,'0')}`
    : brMatch
      ? `${brMatch[3]}-${brMatch[2].padStart(2,'0')}-${brMatch[1].padStart(2,'0')}`
      : ''
  return { title, evidenceType, referenceDate }
}

const selectOrganizationContractSection = (text: string, organizationName: string) => {
  const sections = text.split(/(?=Turma\s*:)/i)
  const organizationKey = normalizeSearchText(organizationName)
  const organizationTokens = organizationKey.split(/\s+/).filter((token) => token.length >= 4)
  const matched = sections.find((section) => {
    const normalized = normalizeSearchText(section)
    return organizationTokens.some((token) => normalized.includes(token))
  })
  return matched ?? text
}

const parseContractIntakeProposal = (
  asset: EvidenceAsset,
  extractedText: string,
  organizationName: string,
): ContractIntakeProposal | null => {
  const searchable = normalizeSearchText(`${asset.title}\n${extractedText.slice(0, 2500)}`)
  const isContractualSource =
    /ordem de (instrutoria|servico|serviços)|\boi\b|\bos\b|contrato|proposta aprovada/.test(searchable)

  if (!isContractualSource) return null

  const sourceText = selectOrganizationContractSection(extractedText, organizationName)
  const meetings: ContractMeetingProposal[] = []
  const meetingPattern = /Data:\s*(\d{2}\/\d{2}\/\d{4})\.\s*In[ií]cio:\s*(\d{2}:\d{2})\.\s*Carga hor[aá]ria:\s*(\d{1,2})h(\d{2})min\.[\s\S]*?Local de realiza[cç][aã]o:\s*([^\r\n]+)/gi

  for (const match of sourceText.matchAll(meetingPattern)) {
    const hours = Number(match[3]) + Number(match[4]) / 60
    meetings.push({
      date:toIsoContractDate(match[1]),
      start:match[2],
      durationHours:hours,
      location:match[5]?.trim() || null,
    })
  }

  if (meetings.length === 0) return null

  const sortedDates = meetings.map((item) => item.date).filter(Boolean).sort()
  const scopeMatch = extractedText.match(/\d{4}\/\d{4}\s*-\s*([^\r\n]+)/)
  const contractedHours = meetings.reduce((total, item) => total + item.durationHours, 0)

  return {
    assetId:asset.id,
    sourceTitle:asset.title,
    sourceText,
    startedOn:sortedDates[0] ?? '',
    plannedEndOn:sortedDates.at(-1) ?? '',
    contractedHours,
    meetings,
    scopeLabel:scopeMatch?.[1]?.trim() || null,
  }
}

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

const ARTIFACT_STATUS: Record<string,string> = {
  planned:'Planejado', in_preparation:'Em preparação', in_review:'Em validação',
  submitted:'Submetido', validated:'Validado', validated_with_reservations:'Validado com ressalvas',
  rejected:'Rejeitado', superseded:'Substituído', archived:'Arquivado', waived:'Dispensado',
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

const EVIDENCE_SOURCE_TYPES: Record<string,string> = {
  internal:'Interna', external:'Externa', public:'Pública', market:'Mercado', benchmark:'Benchmark',
  regulatory:'Regulatória', partner:'Parceiro', other:'Outra',
}

const EVIDENCE_CONFIDENTIALITY: Record<string,string> = {
  public:'Pública', internal:'Interna', restricted:'Restrita', confidential:'Confidencial',
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
  const [showEvidenceCreate, setShowEvidenceCreate] = useState(false)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [evidenceForm, setEvidenceForm] = useState({
    title:'',
    description:'',
    evidenceType:'document',
    sourceType:'internal',
    confidentialityLevel:'internal',
    referenceDate:'',
    interviewId:'',
    changeReason:'Evidência identificada durante a Jornada de Diagnóstico Assistido.',
  })
  const [evidenceAssets, setEvidenceAssets] = useState<EvidenceAsset[]>([])
  const [evidenceVersionTexts, setEvidenceVersionTexts] = useState<EvidenceVersionText[]>([])
  const [appliedContractAssetId, setAppliedContractAssetId] = useState<string | null>(null)
  const [evidenceCorrelations, setEvidenceCorrelations] = useState<EvidenceCorrelation[]>([])
  const [evidenceQuestionIntelligence, setEvidenceQuestionIntelligence] = useState<EvidenceQuestionIntelligence[]>([])
  const [selfAssessmentSnapshots, setSelfAssessmentSnapshots] = useState<SelfAssessmentSnapshot[]>([])
  const [selfAssessmentMetrics, setSelfAssessmentMetrics] = useState<SelfAssessmentMetric[]>([])
  const [catalogs, setCatalogs] = useState<CatalogVersion[]>([])
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [assessmentDrafts, setAssessmentDrafts] = useState<Record<string,AssessmentDraft>>({})
  const [findings, setFindings] = useState<Finding[]>([])
  const [linkedInitiatives, setLinkedInitiatives] = useState<LinkedInitiative[]>([])
  const [evolutionRows, setEvolutionRows] = useState<EvolutionRow[]>([])
  const [actionFollowup, setActionFollowup] = useState<ActionFollowup[]>([])
  const [journeyEap, setJourneyEap] = useState<JourneyExecutionAction[]>([])
  const [journeyArtifacts, setJourneyArtifacts] = useState<JourneyArtifact[]>([])
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

  const activeDiagnosis = useMemo(
    () => diagnoses.find((item) => !['completed','archived'].includes(item.status)) ?? null,
    [diagnoses],
  )

  const hasActiveJourney = Boolean(activeDiagnosis)

  const formatDiagnosisBusinessTitle = (diagnosis: Diagnosis) => {
    const metadata = diagnosis.metadata ?? {}
    const maturityCode = typeof metadata.maturity_level_code === 'string' ? metadata.maturity_level_code.trim() : ''
    const modelCode = typeof metadata.model_code === 'string' ? metadata.model_code.trim() : ''
    const year = diagnosis.reference_year ? String(diagnosis.reference_year) : ''

    if (maturityCode && modelCode && year) return `DA - ${maturityCode}/${modelCode} - ${year}`
    if (modelCode && year) return `DA - ${modelCode} - ${year}`
    if (year) return `DA - Em configuração - ${year}`
    return 'DA - Em configuração'
  }

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

  const evolutionChartSeries = useMemo(() => {
    const byYear = new Map<number, { diagnosisId:string; label:string; aaValues:number[]; daScore:number|null; current:boolean }>()

    for (const diagnosis of diagnoses) {
      if (!diagnosis.reference_year) continue
      const metadata = diagnosis.metadata ?? {}
      const aaValues = [metadata.governance_index,metadata.management_index]
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value >= 0 && value <= 100)
      const validatedScores = evolutionRows
        .filter((row) => row.diagnosis_id === diagnosis.id && row.response_status === 'validated' && row.score != null)
        .map((row) => Number(row.score))
        .filter((value) => Number.isFinite(value))
      byYear.set(diagnosis.reference_year,{
        diagnosisId:diagnosis.id,
        label:String(diagnosis.reference_year),
        aaValues,
        daScore:validatedScores.length > 0 ? validatedScores.reduce((sum,value)=>sum+value,0)/validatedScores.length : null,
        current:diagnosis.id===selectedId,
      })
    }

    for (const metric of selfAssessmentMetrics) {
      if (!metric.reference_year || metric.comparator_code!=='COOPERATIVA' || !['overall_index','history'].includes(metric.metric_kind)) continue
      if (!Number.isFinite(Number(metric.metric_value)) || Number(metric.metric_value) < 0 || Number(metric.metric_value) > 100) continue
      const current = byYear.get(metric.reference_year) ?? {
        diagnosisId:`aa-history-${metric.reference_year}`,
        label:String(metric.reference_year),
        aaValues:[],
        daScore:null,
        current:false,
      }
      const sourceKind = String(metric.metadata?.source_kind ?? '').toUpperCase()
      // A source report from a prior DA is not an AA. Preserve the reported origin.
      if (sourceKind === 'DA_REPORTED') {
        current.daScore = current.daScore == null ? Number(metric.metric_value) : current.daScore
      } else {
        current.aaValues.push(Number(metric.metric_value))
      }
      if (selected?.reference_year===metric.reference_year) current.current=true
      byYear.set(metric.reference_year,current)
    }

    return [...byYear.entries()]
      .sort(([yearA],[yearB])=>yearA-yearB)
      .map(([,item])=>({
        diagnosisId:item.diagnosisId,
        label:item.label,
        aaScore:item.aaValues.length > 0 ? item.aaValues.reduce((sum,value)=>sum+value,0)/item.aaValues.length : null,
        daScore:item.daScore,
        current:item.current,
      }))
  }, [diagnoses,evolutionRows,selectedId,selected?.reference_year,selfAssessmentMetrics])

  const evolutionBenchmarks = useMemo(() => {
    const latest = new Map<string,SelfAssessmentMetric>()
    selfAssessmentMetrics.filter((metric) => metric.metric_kind === 'benchmark'
      && Number.isFinite(Number(metric.metric_value))
      && /RAMO|NACIONAL|NATIONAL/.test(metric.comparator_code.toUpperCase()))
      .sort((a,b) => (a.reference_year ?? 0) - (b.reference_year ?? 0))
      .forEach((metric) => latest.set(metric.block_code + ':' + metric.comparator_code,metric))
    return [...latest.values()]
  },[selfAssessmentMetrics])

  const evolutionChartPoint = (index: number, score: number | null) => {
    const count = Math.max(1,evolutionChartSeries.length)
    const x = count === 1 ? 50 : 8 + (index * 84 / (count - 1))
    const y = score == null ? null : 92 - (Math.max(0,Math.min(100,score)) * .78)
    return { x, y }
  }

  // Preserve each official block and source type; never average Governance and Management.
  const evolutionBlockSeries = (['GOVERNANCA','GESTAO'] as const).flatMap((block) =>
    (['AA','DA'] as const).map((kind) => ({
      block,kind,
      values:evolutionChartSeries.map((cycle,index) => {
        const metric = selfAssessmentMetrics.find((item) => item.block_code === block
          && item.reference_year === Number(cycle.label)
          && item.comparator_code === 'COOPERATIVA'
          && ['history','overall_index'].includes(item.metric_kind)
          && (String(item.metadata?.source_kind ?? '').toUpperCase() === 'DA_REPORTED') === (kind === 'DA'))
        const score = metric && Number.isFinite(Number(metric.metric_value)) ? Number(metric.metric_value) : null
        return { ...evolutionChartPoint(index,score),score }
      }),
    })))

  const actionFollowupSummary = useMemo(() => {
    const counts = {
      total:actionFollowup.length,
      completed:0,
      inProgress:0,
      overdue:0,
      notStarted:0,
      blocked:0,
      awaitingConversion:0,
    }
    actionFollowup.forEach((item) => {
      if (item.followup_state === 'completed') counts.completed += 1
      else if (item.followup_state === 'in_progress') counts.inProgress += 1
      else if (item.followup_state === 'overdue') counts.overdue += 1
      else if (item.followup_state === 'not_started') counts.notStarted += 1
      else if (item.followup_state === 'blocked') counts.blocked += 1
      else if (item.followup_state === 'awaiting_conversion') counts.awaitingConversion += 1
    })
    return counts
  }, [actionFollowup])

  const selfAssessmentRadar = useMemo(() => {
    const metricsFor = (block: 'GOVERNANCA' | 'GESTAO') => selfAssessmentMetrics
      .filter((item) => item.block_code === block && item.metric_kind === 'criterion' && item.comparator_code === 'COOPERATIVA')
      .sort((a,b) => a.metric_code.localeCompare(b.metric_code,'pt-BR'))
      .map((item) => ({ axis:item.metric_name, score:Math.max(0,Math.min(100,Number(item.metric_value))) }))

    const normalized = {
      GOVERNANCA:metricsFor('GOVERNANCA'),
      GESTAO:metricsFor('GESTAO'),
    }
    if (normalized.GOVERNANCA.length > 0 || normalized.GESTAO.length > 0) return normalized

    const raw = selected?.metadata?.self_assessment_radar
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { GOVERNANCA:[], GESTAO:[] } as Record<'GOVERNANCA' | 'GESTAO', Array<{ axis:string; score:number }>>

    const normalize = (value: unknown) => Array.isArray(value)
      ? value.flatMap((item) => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) return []
          const axis = typeof (item as { axis?: unknown }).axis === 'string' ? (item as { axis:string }).axis.trim() : ''
          const score = Number((item as { score?: unknown }).score)
          return axis && Number.isFinite(score) ? [{ axis, score:Math.max(0, Math.min(100, score)) }] : []
        })
      : []

    const source = raw as Record<string, unknown>
    return {
      GOVERNANCA:normalize(source.GOVERNANCA),
      GESTAO:normalize(source.GESTAO),
    }
  }, [selected?.metadata, selfAssessmentMetrics])

  const selfAssessmentReference = useMemo(() => {
    const build = (block: 'GOVERNANCA' | 'GESTAO') => ({
      current:selfAssessmentMetrics.filter((item) => item.block_code===block && item.metric_kind==='overall_index' && item.comparator_code==='COOPERATIVA').sort((a,b)=>(b.reference_year??0)-(a.reference_year??0))[0] ?? null,
      history:selfAssessmentMetrics.filter((item) => item.block_code===block && item.metric_kind==='history').sort((a,b)=>(a.reference_year??0)-(b.reference_year??0)),
      benchmarks:selfAssessmentMetrics.filter((item) => item.block_code===block && item.metric_kind==='benchmark').sort((a,b)=>Number(b.metric_value)-Number(a.metric_value)),
    })
    return { GOVERNANCA:build('GOVERNANCA'), GESTAO:build('GESTAO') }
  }, [selfAssessmentMetrics])

  const radarPolygon = (values: Array<number | null>) => {
    if (values.length < 3) return ''
    return values.map((rawValue, index) => {
      const value = rawValue == null ? 0 : Math.max(0, Math.min(100, rawValue))
      const angle = (-Math.PI / 2) + (index * 2 * Math.PI / values.length)
      const radius = 72 * (value / 100)
      return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`
    }).join(' ')
  }

  const buildRadarSeries = (block: 'GOVERNANCA' | 'GESTAO') => {
    const baseline = selfAssessmentRadar[block]
    const byAxis = new Map(maturityByAxis.map((item) => [item.axis.toLocaleLowerCase('pt-BR'), item.score]))
    const diagnosis = baseline.map((item) => ({
      axis:item.axis,
      score:byAxis.get(item.axis.toLocaleLowerCase('pt-BR')) ?? null,
    }))
    return {
      baseline,
      diagnosis,
      aaPoints:radarPolygon(baseline.map((item) => item.score)),
      daPoints:radarPolygon(diagnosis.map((item) => item.score)),
      daAvailable:diagnosis.some((item) => item.score != null),
    }
  }

  const governanceRadar = buildRadarSeries('GOVERNANCA')
  const managementRadar = buildRadarSeries('GESTAO')

  const hasAdministrativeOverride = props.isPlatformSuperAdmin || props.isOrganizationAdmin
  const canManage = hasAdministrativeOverride || ['administrator','coordinator'].includes(props.userRoleCode)
  const canEditInterviews = hasAdministrativeOverride || ['administrator','coordinator','interviewer'].includes(props.userRoleCode)
  const canLinkEvidence = hasAdministrativeOverride || ['administrator','coordinator','diagnostician','interviewer'].includes(props.userRoleCode)
  const canRegisterEvidence = hasAdministrativeOverride || ['administrator','coordinator','diagnostician','interviewer'].includes(props.userRoleCode)
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
      setShowEvidenceCreate(false)
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
          .select('id,code,axis_name,criterion_name,question_text,guidance,display_order' as never)
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
    setActivePhaseCode('OVERVIEW')
  }, [selected?.id])

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
      if (!selectedId) { setEvidenceAssets([]); setEvidenceVersionTexts([]); setEvidenceCorrelations([]); setEvidenceQuestionIntelligence([]); setSelfAssessmentSnapshots([]); setSelfAssessmentMetrics([]); return }
      const [assetsResult, correlationsResult, intelligenceResult, snapshotsResult, metricsResult] = await Promise.all([
        supabase
          .from('sparks_evidence_assets' as never)
          .select('id,title,evidence_type,validation_status,reliability_level,reference_date,current_version_id' as never)
          .eq('organization_id', props.organizationId)
          .is('archived_at', null)
          .order('updated_at', { ascending:false }),
        supabase
          .from('skda_evidence_correlations' as never)
          .select('id,evidence_asset_id,usage_type,validation_status' as never)
          .eq('diagnosis_id', selectedId),
        supabase
          .from('skda_evidence_question_intelligence' as never)
          .select('id,evidence_asset_id,question_id,document_intake_status,evidence_coverage_status,practice_state,relevance_score,adequacy_score,sufficiency_score,reliability_score,actuality_score,coverage_score,confidence_score,gap_description,complement_needed,improvement_suggestion,interview_question_suggestion,self_assessment_guidance,diagnostic_hypothesis,analysis_status,source_excerpt,source_locator' as never)
          .eq('diagnosis_id', selectedId),
        supabase
          .from('skda_self_assessment_snapshots' as never)
          .select('id,source_label,source_date,content_hash,metadata' as never)
          .eq('diagnosis_id', selectedId)
          .order('source_date', { ascending:true, nullsFirst:false }),
        supabase
          .from('skda_self_assessment_metrics' as never)
          .select('id,block_code,metric_kind,metric_code,metric_name,reference_year,comparator_code,comparator_label,metric_value,unit,source_label,source_reference,metadata' as never)
          .eq('organization_id', props.organizationId)
          .order('reference_year', { ascending:true, nullsFirst:false }),
      ])
      const loadedAssets = (assetsResult.data ?? []) as unknown as EvidenceAsset[]
      setEvidenceAssets(loadedAssets)
      const versionIds = loadedAssets.map((asset) => asset.current_version_id).filter((id): id is string => Boolean(id))
      if (versionIds.length > 0) {
        const { data: versionData } = await supabase
          .from('sparks_evidence_versions' as never)
          .select('id,evidence_asset_id,extracted_text' as never)
          .in('id', versionIds)
        setEvidenceVersionTexts((versionData ?? []) as unknown as EvidenceVersionText[])
      } else {
        setEvidenceVersionTexts([])
      }
      setEvidenceCorrelations((correlationsResult.data ?? []) as unknown as EvidenceCorrelation[])
      setEvidenceQuestionIntelligence((intelligenceResult.data ?? []) as unknown as EvidenceQuestionIntelligence[])
      setSelfAssessmentSnapshots((snapshotsResult.data ?? []) as unknown as SelfAssessmentSnapshot[])
      setSelfAssessmentMetrics((metricsResult.data ?? []) as unknown as SelfAssessmentMetric[])
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
      const [evolutionResult, actionResult] = await Promise.all([
        supabase
          .from('skda_organization_evolution_matrix' as never)
          .select('diagnosis_id,diagnosis_code,reference_year,diagnosis_status,question_id,response_id,response_status,score,validated_practice_count,validated_evidence_count,open_gap_count' as never)
          .eq('organization_id', props.organizationId)
          .order('reference_year', { ascending:true, nullsFirst:false }),
        supabase
          .from('skda_action_followup_longitudinal' as never)
          .select('diagnosis_id,reference_year,finding_id,finding_title,cycle_number,initiative_id,initiative_name,initiative_status,initiative_progress,followup_state,execution_completed' as never)
          .eq('organization_id', props.organizationId)
          .order('reference_year', { ascending:true, nullsFirst:false }),
      ])
      setEvolutionRows((evolutionResult.data ?? []) as unknown as EvolutionRow[])
      setActionFollowup((actionResult.data ?? []) as unknown as ActionFollowup[])
    }
    void run()
  }, [props.organizationId, selectedId, responses, findings, actionPlanAllocations, linkedInitiatives])

  useEffect(() => {
    const run = async () => {
      if (!selected?.execution_initiative_id) {
        setJourneyEap([])
        setJourneyArtifacts([])
        return
      }
      const [actionsResult, artifactsResult] = await Promise.all([
        supabase
          .from('sparks_initiative_actions' as never)
          .select('id,parent_action_id,code,name,status,progress,baseline_start_date,baseline_due_date,planned_start_date,planned_due_date,started_at,completed_at,metadata' as never)
          .eq('organization_id', props.organizationId)
          .eq('initiative_id', selected.execution_initiative_id)
          .eq('source_module_code', 'SK-DA')
          .order('code', { ascending:true }),
        supabase
          .from('sparks_methodology_artifacts' as never)
          .select('id,artifact_code,title,purpose,macrophase_code,status,current_version_number,planned_due_date,metadata' as never)
          .eq('organization_id', props.organizationId)
          .eq('project_id', selected.execution_initiative_id)
          .eq('module_code', 'SK-DA')
          .order('artifact_code', { ascending:true }),
      ])
      setJourneyEap((actionsResult.data ?? []) as unknown as JourneyExecutionAction[])
      setJourneyArtifacts((artifactsResult.data ?? []) as unknown as JourneyArtifact[])
    }
    void run()
  }, [props.organizationId, selected?.id, selected?.execution_initiative_id, selected?.started_on, selected?.planned_end_on, selected?.lead_user_id])

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
      ...(contractIntakeProposal && appliedContractAssetId === contractIntakeProposal.assetId ? {
        contracted_hours:contractIntakeProposal.contractedHours,
        contractual_source_evidence_asset_id:contractIntakeProposal.assetId,
        contractual_source_title:contractIntakeProposal.sourceTitle,
        contractual_schedule_proposal:contractIntakeProposal.meetings,
        contractual_intake_status:'applied_pending_approval',
      } : {}),
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

  const applyContractIntakeProposal = () => {
    if (!contractIntakeProposal) return
    setOpeningForm((current) => ({
      ...current,
      referenceYear:contractIntakeProposal.startedOn
        ? contractIntakeProposal.startedOn.slice(0,4)
        : current.referenceYear,
      startedOn:contractIntakeProposal.startedOn || current.startedOn,
      plannedEndOn:contractIntakeProposal.plannedEndOn || current.plannedEndOn,
      scopeStatement:contractIntakeProposal.scopeLabel
        ? `${contractIntakeProposal.scopeLabel}. ${current.scopeStatement}`.trim()
        : current.scopeStatement,
      methodologyNotes:[
        current.methodologyNotes,
        `Fonte contratual identificada automaticamente: ${contractIntakeProposal.sourceTitle}.`,
        `Carga contratada identificada: ${contractIntakeProposal.contractedHours}h.`,
        'Datas e blocos abaixo são proposta de linha de base e permanecem sujeitos à aprovação/adequação da Organização.',
      ].filter(Boolean).join('\n'),
    }))
    setAppliedContractAssetId(contractIntakeProposal.assetId)
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

  const createAndLinkEvidence = async () => {
    if (!selected || !canRegisterEvidence) return
    if (!evidenceForm.title.trim() && !evidenceFile) {
      setError('Informe o título ou selecione o arquivo da evidência.')
      return
    }
    if (evidenceForm.changeReason.trim().length < 10) {
      setError('Informe uma justificativa com pelo menos 10 caracteres.')
      return
    }

    setSaving(true)
    setError('')

    let contentHash: string | null = null
    let storagePath: string | null = null
    let assetId: string | null = null

    if (evidenceFile) {
      contentHash = await sha256Hex(evidenceFile)
      const { data: duplicateData } = await supabase
        .from('sparks_evidence_assets' as never)
        .select('id' as never)
        .eq('organization_id', props.organizationId)
        .eq('content_hash', contentHash)
        .is('archived_at', null)
        .maybeSingle()

      assetId = (duplicateData as unknown as { id?: string } | null)?.id ?? null

      if (!assetId) {
        const safeName = storageSafeFileName(evidenceFile.name)
        storagePath = `${props.organizationId}/${selected.id}/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from('sparks-evidence')
          .upload(storagePath, evidenceFile, {
            cacheControl:'3600',
            contentType:evidenceFile.type || 'application/octet-stream',
            upsert:false,
          })

        if (uploadError) {
          setSaving(false)
          setError(`Não foi possível enviar o arquivo ao Core de Evidências: ${uploadError.message}`)
          return
        }
      }
    }

    if (!assetId) {
      const { data: registeredAssetId, error: registerError } = await supabase.rpc(
        'register_sparks_evidence_asset_for_module' as never,
        {
          target_organization_id:props.organizationId,
          target_module_code:'SK-DA',
          evidence_title:evidenceForm.title.trim() || evidenceFile?.name || 'Evidência',
          evidence_description:evidenceForm.description.trim() || null,
          target_evidence_type:evidenceForm.evidenceType,
          target_source_type:evidenceForm.sourceType,
          target_reference_date:evidenceForm.referenceDate || null,
          target_validity_date:null,
          target_confidentiality_level:evidenceForm.confidentialityLevel,
          target_content_hash:contentHash,
          target_file_name:evidenceFile?.name ?? null,
          target_mime_type:evidenceFile?.type || null,
          target_file_size_bytes:evidenceFile?.size ?? null,
          target_storage_bucket:storagePath ? 'sparks-evidence' : null,
          target_storage_path:storagePath,
          change_reason:evidenceForm.changeReason.trim(),
        } as never,
      )

      if (registerError || !registeredAssetId) {
        setSaving(false)
        setError(registerError?.message ?? 'Não foi possível registrar a evidência no Core.')
        return
      }
      assetId = registeredAssetId as unknown as string
    }

    const { data: assetData, error: assetError } = await supabase
      .from('sparks_evidence_assets' as never)
      .select('id,title,evidence_type,validation_status,reliability_level,reference_date,current_version_id' as never)
      .eq('id', assetId as never)
      .eq('organization_id', props.organizationId)
      .single()

    if (assetError || !assetData) {
      setSaving(false)
      setError(assetError?.message ?? 'A evidência foi registrada, mas não pôde ser recarregada.')
      return
    }

    const targetInterview = evidenceForm.interviewId
      ? interviews.find((item) => item.id === evidenceForm.interviewId)
      : null

    const { data: correlationData, error: correlationError } = await supabase
      .from('skda_evidence_correlations' as never)
      .upsert({
        organization_id:props.organizationId,
        diagnosis_id:selected.id,
        evidence_asset_id:assetId,
        target_type:targetInterview ? 'interview' : 'diagnosis',
        target_id:targetInterview?.id ?? selected.id,
        usage_type:targetInterview ? 'context' : 'support',
        relevance_level:'important',
        analyst_interpretation:targetInterview
          ? `Evidência identificada ou confirmada durante a entrevista ${targetInterview.code} · ${targetInterview.title}.`
          : 'Evidência identificada durante a Jornada de Diagnóstico Assistido.',
        validation_status:'pending',
        metadata:{
          source:targetInterview ? 'interview' : 'diagnosis',
          interview_id:targetInterview?.id ?? null,
          interview_code:targetInterview?.code ?? null,
          file_uploaded:Boolean(evidenceFile),
          intelligence_pipeline:'SK-DOC>SK-KM>SK-DA',
        },
      } as never, { onConflict:'diagnosis_id,evidence_asset_id,target_type,target_id' })
      .select('id,evidence_asset_id,usage_type,validation_status' as never)
      .single()

    if (correlationError || !correlationData) {
      setSaving(false)
      setError(correlationError?.message ?? 'A evidência foi registrada no Core, mas a correlação com o DA não foi concluída.')
      return
    }

    const { error: queueError } = await supabase.rpc(
      'queue_skda_evidence_question_intelligence' as never,
      {
        target_organization_id:props.organizationId,
        target_diagnosis_id:selected.id,
        target_evidence_asset_id:assetId,
      } as never,
    )

    if (!queueError) {
      const { data: intelligenceData } = await supabase
        .from('skda_evidence_question_intelligence' as never)
        .select('id,evidence_asset_id,question_id,document_intake_status,evidence_coverage_status,practice_state,relevance_score,adequacy_score,sufficiency_score,reliability_score,actuality_score,coverage_score,confidence_score,gap_description,complement_needed,improvement_suggestion,interview_question_suggestion,self_assessment_guidance,diagnostic_hypothesis,analysis_status,source_excerpt,source_locator' as never)
        .eq('diagnosis_id', selected.id)
        .eq('evidence_asset_id', assetId)
      const queuedRows = (intelligenceData ?? []) as unknown as EvidenceQuestionIntelligence[]
      setEvidenceQuestionIntelligence((current) => [
        ...current.filter((item) => item.evidence_asset_id !== assetId),
        ...queuedRows,
      ])
    }

    setSaving(false)

    if (queueError) {
      setError(`A evidência foi registrada e vinculada, mas a análise por questão não pôde ser enfileirada: ${queueError.message}`)
    }

    const asset = assetData as unknown as EvidenceAsset
    const correlation = correlationData as unknown as EvidenceCorrelation
    setEvidenceAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)])
    setEvidenceCorrelations((current) => [...current.filter((item) => item.id !== correlation.id), correlation])
    setMetrics((current) => ({ ...current, evidence:current.evidence + (current.evidence > 0 && evidenceAssets.some((item) => item.id === asset.id) ? 0 : 1) }))
    setEvidenceFile(null)
    setEvidenceForm({
      title:'',
      description:'',
      evidenceType:'document',
      sourceType:'internal',
      confidentialityLevel:'internal',
      referenceDate:'',
      interviewId:'',
      changeReason:'Evidência identificada durante a Jornada de Diagnóstico Assistido.',
    })
    setShowEvidenceCreate(false)
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
    if (hasActiveJourney) {
      setError('Existe uma Jornada DA em andamento. Conclua ou encerre o ciclo atual antes de iniciar uma nova Jornada.')
      return
    }
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

  const primary = (
    <div>
      <div className="skda-section-title">
        <div>
          <span>Histórico de ciclos</span>
          <h2>Jornadas de Diagnóstico Assistido</h2>
          <small>Consulte os ciclos de Diagnóstico Assistido da organização e acompanhe sua evolução ao longo do tempo.</small>
        </div>
        <div className="skda-section-title-actions">
          <strong>{diagnoses.length}</strong>
          {canManage && <button type="button" className="skda-primary" disabled={hasActiveJourney} title={hasActiveJourney ? 'Existe uma Jornada em andamento. Conclua ou encerre o ciclo atual antes de iniciar uma nova.' : 'Iniciar nova Jornada DA'} onClick={() => setShowCreate(true)}>{hasActiveJourney ? 'Jornada em andamento' : 'Nova Jornada DA'}</button>}
        </div>
      </div>
      {error && <div className="skda-alert">{error}</div>}
      {loading ? <div className="skda-empty">Carregando Jornadas DA...</div> :
       diagnoses.length === 0 ? <div className="skda-empty"><h3>Nenhuma Jornada DA iniciada</h3><p>Inicie a Jornada DA {new Date().getFullYear()} para abrir o ciclo de diagnóstico da organização.</p>{canManage && <button type="button" className="skda-primary" onClick={() => setShowCreate(true)}>Iniciar Jornada DA {new Date().getFullYear()}</button>}</div> :
       <div className="skda-list">
        {diagnoses.map((item) => (
          <button type="button" key={item.id} className={item.id===selectedId?'skda-diagnosis active':'skda-diagnosis'} onClick={() => setSelectedId(item.id)}>
            <div><strong>{formatDiagnosisBusinessTitle(item)}</strong><span>{TYPES[item.diagnosis_type] ?? item.diagnosis_type}</span></div>
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
  const contractIntakeProposal = useMemo(() => {
    for (const asset of evidenceAssets) {
      const version = evidenceVersionTexts.find((item) => item.evidence_asset_id === asset.id)
      if (!version?.extracted_text) continue
      const proposal = parseContractIntakeProposal(asset, version.extracted_text, props.organizationName)
      if (proposal) return proposal
    }
    return null
  }, [evidenceAssets, evidenceVersionTexts, props.organizationName])
  const catalogLocked = metrics.responses > 0
  const currentMegaphaseCode = selected?.current_megaphase_code ?? 'MF0'
  const workloadLevelCode = normalizePdgcWorkloadCode(
    selected?.metadata?.maturity_level_code
      ?? selectedCatalog?.name
      ?? selectedCatalog?.code,
  )
  const workloadReference = workloadLevelCode
    ? PDGC_WORKLOAD_REFERENCES[workloadLevelCode]
    : null
  const contractedHours = [
    selected?.metadata?.contracted_hours,
    selected?.metadata?.workload_hours,
    selected?.metadata?.total_contracted_hours,
  ]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0) ?? null
  const workloadGap = workloadReference && contractedHours
    ? contractedHours - workloadReference.totalHours
    : null
  const assistedSelfAssessmentActive = selected?.metadata?.self_assessment_mode === 'assisted'

  const startAssistedSelfAssessment = async () => {
    if (!selected) return
    setSaving(true)
    setError('')
    const nextMetadata = {
      ...(selected.metadata ?? {}),
      self_assessment_mode:'assisted',
      self_assessment_status:'in_progress',
      self_assessment_started_at:new Date().toISOString(),
      self_assessment_engine:'evidence_question_intelligence',
    }
    const { error: updateError } = await supabase
      .from('skda_diagnoses' as never)
      .update({ metadata:nextMetadata, current_phase_code:'DA-00' } as never)
      .eq('id', selected.id)
      .eq('organization_id', props.organizationId)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setActivePhaseCode('DA-00')
    await loadDiagnoses()
  }

  const openSelfAssessmentImport = () => {
    setEvidenceFile(null)
    setEvidenceForm((current) => ({
      ...current,
      evidenceType:'self_assessment',
      sourceType:'external',
      title:'',
      description:'Autoavaliação da Organização para absorção como baseline da Jornada.',
      changeReason:'Autoavaliação importada como declaração da Organização e baseline da Jornada DA.',
    }))
    setShowEvidenceCreate(true)
  }

  const secondary = selected ? (
    <div className="skda-detail">
      {isOverview && <>
      <div className="skda-metrics">
        <MetricCard label="Questões avaliadas" value={metrics.responses} helper={String(assessmentCoverage) + '% da cobertura'} />
        <MetricCard label="Entrevistas" value={metrics.interviews} helper="registradas na jornada" />
        <MetricCard label="Evidências correlacionadas" value={metrics.evidence} helper="ativos do Core vinculados" />
        <MetricCard label="Achados" value={metrics.findings} helper="forças, lacunas, riscos e oportunidades" />
      </div>
      {selfAssessmentSnapshots.length === 0 && <div className="skda-aa-entry-callout">
        <div>
          <span className="skda-eyebrow">Autoavaliação</span>
          <h3>{assistedSelfAssessmentActive ? 'Autoavaliação Assistida em andamento' : 'Autoavaliação ainda não importada'}</h3>
          <p>Você pode importar uma AA existente ou iniciar uma Autoavaliação Assistida. No modo assistido, o SPARKs usa as mesmas questões e evidências para explicar o padrão esperado da prática, apontar lacunas, solicitar complementos e orientar a construção segura da resposta da Organização.</p>
        </div>
        <div className="skda-aa-entry-actions">
          {canRegisterEvidence && <button type="button" onClick={openSelfAssessmentImport}>Importar AA existente</button>}
          {canManage && <button type="button" className="skda-primary" disabled={saving || assistedSelfAssessmentActive} onClick={() => void startAssistedSelfAssessment()}>{assistedSelfAssessmentActive ? 'AA Assistida iniciada' : 'Iniciar Autoavaliação Assistida'}</button>}
        </div>
      </div>}
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
            <span>Fase atual</span><b>{PHASES.find((phase) => phase.code === normalizeJourneyPhaseCode(selected.current_phase_code))?.title ?? 'Preparação e abertura'} · {STATUS[selected.status] ?? selected.status}</b>
          </div>
          <div className="skda-phase-strip" aria-label="Etapas da Jornada DA">
            {PHASES.map((phase) => (
              <span key={phase.code} className={phase.code === normalizeJourneyPhaseCode(selected.current_phase_code) ? 'active' : ''}>
                {phase.title}
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
        {[
          { key:'governance', title:'Governança', series:governanceRadar, reference:selfAssessmentReference.GOVERNANCA },
          { key:'management', title:'Gestão', series:managementRadar, reference:selfAssessmentReference.GESTAO },
        ].map(({ key,title,series,reference }) => <article key={key} className="skda-executive-card skda-radar-card">
          <div className="skda-executive-card-head">
            <div><span>Maturidade</span><h3>{title} · AA × DA</h3></div>
            <strong>{series.baseline.length > 0 ? 'AA com índice' : selfAssessmentSnapshots.some((snapshot) => snapshot.metadata?.block === (key === 'governance' ? 'GOVERNANCA' : 'GESTAO')) ? 'AA importada · índice pendente' : 'AA pendente'}</strong>
          </div>
          {series.baseline.length === 0 ? (
            <p className="skda-radar-empty">{selfAssessmentSnapshots.some((snapshot) => snapshot.metadata?.block === (key === 'governance' ? 'GOVERNANCA' : 'GESTAO')) ? `As respostas declaradas de ${title.toLocaleLowerCase('pt-BR')} já foram importadas, mas as pontuações por critério ainda não estão integradas aos indicadores do sistema. O radar exige essas pontuações com fonte e regra de cálculo verificadas; não serão inferidas das alternativas A–D.` : `Autoavaliação ainda não importada para ${title.toLocaleLowerCase('pt-BR')}.`}</p>
          ) : <div className="skda-radar-wrap">
            <svg viewBox="0 0 200 200" role="img" aria-label={`Comparação entre Autoavaliação e Diagnóstico Assistido · ${title}`}>
              <circle cx="100" cy="100" r="72" className="skda-radar-grid" />
              <circle cx="100" cy="100" r="48" className="skda-radar-grid" />
              <circle cx="100" cy="100" r="24" className="skda-radar-grid" />
              <polygon points={series.aaPoints} className="skda-radar-value-aa" />
              {series.daAvailable && <polygon points={series.daPoints} className="skda-radar-value-da" />}
            </svg>
            <div className="skda-radar-detail">
              <div className="skda-radar-legend"><span><i className="aa" />Autoavaliação</span><span><i className="da" />Diagnóstico Assistido</span></div>
              <dl>{series.baseline.map((item, index) => <div key={item.axis}><dt>{item.axis}</dt><dd><b>{item.score.toFixed(0)}%</b><span>{series.diagnosis[index]?.score == null ? 'DA —' : 'DA ' + series.diagnosis[index]?.score + '%'}</span></dd></div>)}</dl>
              {!series.daAvailable && <p>O DA ainda não possui pontuação validada para este eixo. A AA permanece como baseline até a validação das questões.</p>}
            </div>
          </div>}
          {(reference.current || reference.history.length > 0 || reference.benchmarks.length > 0) && <div className="skda-aa-reference">
            <div>
              <small>Índice atual</small>
              <strong>{reference.current && reference.current.reference_year === selected?.reference_year ? Number(reference.current.metric_value).toFixed(2)+'%' : 'Índice do ciclo não integrado'}</strong>
            </div>
            <div>
              <small>Ciclo anterior</small>
              <strong>{reference.history.length > 0 ? Number(reference.history.at(-1)?.metric_value ?? 0).toFixed(2)+'%' : 'Não informado na fonte'}</strong>
            </div>
            <div className="skda-aa-benchmarks">
              <small>Referenciais comparativos da AA</small>
              <div>{reference.benchmarks.map((benchmark) => <span key={benchmark.id}><b>{benchmark.comparator_label || benchmark.comparator_code}</b> {Number(benchmark.metric_value).toFixed(2)}%</span>)}</div>
            </div>
          </div>}
        </article>)}
      </div>
      </>}

      {isOverview && <section className="skda-evolution-overview">
        <div className="skda-phase-workspace-head">
          <div>
            <span className="skda-eyebrow">Evolução contínua</span>
            <h3>Trajetória da organização</h3>
            <small>Leitura gráfica da evolução entre a Autoavaliação de entrada e o Diagnóstico Assistido validado ao longo dos ciclos.</small>
          </div>
          <span>{evolutionChartSeries.length} ciclo(s)</span>
        </div>
        {evolutionChartSeries.length === 0 ? (
          <p className="skda-phase-empty">A trajetória será exibida assim que existir ao menos um ciclo de Diagnóstico Assistido.</p>
        ) : (
          <>
            <div className="skda-evolution-chart">
              <div className="skda-evolution-axis">
                <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Evolução da Autoavaliação e do Diagnóstico Assistido por ciclo">
                {[14,33.5,53,72.5,92].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} className="skda-evolution-gridline" />)}
                {evolutionBenchmarks.map((benchmark) => {
                  const y = evolutionChartPoint(0,Number(benchmark.metric_value)).y
                  return y == null ? null : <line key={benchmark.id} x1="5" x2="95" y1={y} y2={y} stroke={benchmark.comparator_code.toUpperCase().includes('RAMO') ? '#b7791f' : '#7c3aed'} strokeWidth=".35" strokeDasharray="2 1.5" />
                })}
                {evolutionBlockSeries.map((series) => {
                  const color = series.block === 'GOVERNANCA' ? (series.kind === 'AA' ? '#2563eb' : '#047857') : (series.kind === 'AA' ? '#9333ea' : '#d97706')
                  const points = series.values.filter((point) => point.score != null).map((point) => `${point.x},${point.y}`).join(' ')
                  return <g key={`${series.block}-${series.kind}`}>
                    {series.values.filter((point) => point.score != null).length > 1 && <polyline points={points} fill="none" stroke={color} strokeWidth=".55" vectorEffect="non-scaling-stroke" />}
                    {series.values.filter((point) => point.score != null).map((point) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y!} r="1.65" fill={color}><title>{`${series.block === 'GOVERNANCA' ? 'Governança' : 'Gestão'} · ${series.kind}: ${point.score?.toFixed(2)}%`}</title></circle>)}
                  </g>
                })}

              </svg>
              <div className="skda-evolution-labels">
                {evolutionChartSeries.map((item) => <div key={item.diagnosisId} className={item.current ? 'is-current' : ''}>
                  <strong>{item.label}</strong>

                </div>)}
              </div>
            </div>
            <div className="skda-evolution-legend">
              <span><i style={{background:'#2563eb'}} />Governança · AA</span>
              <span><i style={{background:'#047857'}} />Governança · DA</span>
              <span><i style={{background:'#9333ea'}} />Gestão · AA</span>
              <span><i style={{background:'#d97706'}} />Gestão · DA</span>
              {evolutionBenchmarks.map((benchmark) => <span key={benchmark.id} title={benchmark.source_reference ?? undefined}><i style={{ background:benchmark.comparator_code.toUpperCase().includes('RAMO') ? '#b7791f' : '#7c3aed' }} />{benchmark.block_code === 'GOVERNANCA' ? 'Governança' : 'Gestão'} · {benchmark.comparator_label || benchmark.comparator_code} ({benchmark.reference_year ?? 's/ano'}): {Number(benchmark.metric_value).toFixed(2)}%</span>)}
              {evolutionBenchmarks.length === 0 && <span>BMKs do ramo e nacional: aguardando fontes oficiais e ano de referência</span>}
            </div>
            <div className="skda-artifact-grid">
              {(['GOVERNANCA','GESTAO'] as const).map((block) => <article key={block}>
                <strong>{block === 'GOVERNANCA' ? 'Governança' : 'Gestão'} · índices por origem</strong>
                <div style={{display:'grid',gridTemplateColumns:`64px repeat(${evolutionChartSeries.length}, minmax(0,1fr))`,gap:'8px',marginTop:'12px'}}>
                  <span>Ano</span>{evolutionChartSeries.map((cycle) => <b key={cycle.label}>{cycle.label}</b>)}
                  {(['AA','DA'] as const).map((kind) => <Fragment key={kind}>
                    <b>{kind}</b>
                    {evolutionChartSeries.map((cycle) => {
                      const metric = selfAssessmentMetrics.find((item) => item.block_code === block
                        && item.reference_year === Number(cycle.label)
                        && item.comparator_code === 'COOPERATIVA'
                        && ['history','overall_index'].includes(item.metric_kind)
                        && (String(item.metadata?.source_kind ?? '').toUpperCase() === 'DA_REPORTED') === (kind === 'DA'))
                      return <span key={`${kind}-${cycle.label}`}><b>{metric ? `${Number(metric.metric_value).toFixed(2)}%` : '—'}</b></span>
                    })}
                  </Fragment>)}
                </div>
              </article>)}
            </div>

          </>
        )}
      </section>}

      {isOverview && <section className="skda-pdcl-overview">
        <div className="skda-phase-workspace-head">
          <div>
            <span className="skda-eyebrow">Metodologia em ação</span>
            <h3>PDCL da Jornada DA</h3>
            <small>O diagnóstico não é uma sequência linear de telas: evidências, entrevistas, avaliação, checagem e aprendizado retroalimentam a própria compreensão da organização.</small>
          </div>
          <span>Projeto e EAP automáticos</span>
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
              <small>Acompanhe etapas, atividades, evidências e entregas de cada MegaFase.</small>
            </div>
            <span>{currentMegaphaseCode}</span>
          </div>
          <div className="skda-megaphase-tree">
            {MEGAPHASES.map((megaphase, megaphaseIndex) => {
              const phaseForMegaphase = PHASES.find((phase) => PHASE_MEGAPHASES[phase.code]?.includes(megaphase.code)) ?? null
              const action = journeyEap.find((item) => item.code === megaphase.code && !item.parent_action_id)
              const stages = action
                ? journeyEap
                    .filter((item) => item.parent_action_id === action.id)
                    .sort((a,b) => Number(a.metadata?.display_order ?? 0) - Number(b.metadata?.display_order ?? 0) || a.code.localeCompare(b.code,'pt-BR'))
                : []
              const artifacts = journeyArtifacts.filter((item) => item.macrophase_code === megaphase.code)
              const previousCode = megaphaseIndex > 0 ? MEGAPHASES[megaphaseIndex-1].code : null
              const inheritedArtifacts = previousCode
                ? journeyArtifacts.filter((item) => item.macrophase_code === previousCode && ['validated','validated_with_reservations','submitted','in_review'].includes(item.status))
                : []
              const ownerId = typeof action?.metadata?.responsible_user_id === 'string' ? action.metadata.responsible_user_id : selected.lead_user_id
              const owner = organizationUsers.find((user) => user.user_id === ownerId)
              const formatRange = (start: string | null | undefined, end: string | null | undefined) => start || end
                ? `${start ? new Date(start+'T00:00:00').toLocaleDateString('pt-BR') : '—'} → ${end ? new Date(end+'T00:00:00').toLocaleDateString('pt-BR') : '—'}`
                : 'A validar'
              const actualEnd = action?.completed_at ? action.completed_at.slice(0,10) : null
              const actualStart = action?.started_at ? action.started_at.slice(0,10) : null
              const statusLabel = action?.status === 'in_progress' ? 'Em andamento' : action?.status === 'completed' ? 'Concluída' : action?.status === 'blocked' ? 'Bloqueada' : action?.status === 'on_hold' ? 'Em espera' : 'Planejada'
              return <details key={megaphase.code} open={megaphase.code === currentMegaphaseCode} className={megaphase.code === currentMegaphaseCode ? 'is-current' : ''}>
                <summary>
                  <div className="skda-megaphase-identity">
                    <span>{megaphase.code}</span>
                    <div><strong>{megaphase.title}</strong>{phaseForMegaphase && <em>{phaseForMegaphase.title}</em>}<small>{megaphase.workPattern}</small></div>
                  </div>
                  <div className="skda-megaphase-summary-metrics">
                    <span title={action?.baseline_start_date || action?.baseline_due_date ? formatRange(action?.baseline_start_date,action?.baseline_due_date) : 'Aguardando confirmação do cronograma da OS autorizadora.'}><small>LB0 contratual</small><b>{action?.metadata?.baseline_validation_status === 'validated' ? 'Validada' : 'A validar'}</b></span>
                    <span><small>Plano</small><b>{formatRange(action?.planned_start_date,action?.planned_due_date)}</b></span>
                    <span><small>Realizado</small><b>{formatRange(actualStart,actualEnd)}</b></span>
                    <span><small>Responsável</small><b>{owner?.user_display_name || owner?.user_email || 'A definir'}</b></span>
                    <span><small>Artefatos</small><b>{artifacts.length}</b></span>
                    <span><small>Situação</small><b>{statusLabel}</b></span>
                  </div>
                  <span className="skda-megaphase-chevron" aria-hidden="true">⌄</span>
                </summary>
                <div className="skda-megaphase-drill">
                  <section className="skda-megaphase-inputs">
                    <div className="skda-megaphase-subhead"><span>Entradas da MegaFase</span><strong>{megaphaseIndex === 0 ? 'Fontes autorizadoras e baseline' : 'Herança validada da MegaFase anterior'}</strong></div>
                    <div className="skda-input-chips">
                      {megaphaseIndex === 0 && <>
                        <span title="Acesse a abertura da Jornada para registrar a OS autorizadora e validar a linha de base."><button type="button" onClick={() => setActivePhaseCode('DA-00')}>OS autorizadora / LB0</button></span>
                        <span title="Cadastre ou consulte as Autoavaliações e respectivas evidências."><button type="button" onClick={() => setActivePhaseCode('DA-00')}>Autoavaliações disponíveis</button></span>
                        <span title="Acesse o inventário de evidências e documentos da organização."><button type="button" onClick={() => setActivePhaseCode('DA-00')}>Fontes e contexto inicial</button></span>
                      </>}
                      {inheritedArtifacts.map((artifact) => <span key={artifact.id} title="Entregável cadastrado. A abertura do documento depende de uma versão vinculada ao repositório."><button type="button" disabled>{artifact.title}</button></span>)}
                      <span title="Acesse o repositório transversal para cadastrar, consultar e correlacionar evidências desta Jornada."><button type="button" onClick={() => setActivePhaseCode('DA-00')}>Consultar evidências</button></span>
                      {canRegisterEvidence && <span title="Abra o cadastro de evidências da organização; disponível em todas as MegaFases."><button type="button" onClick={() => {setEvidenceFile(null);setShowEvidenceCreate(true)}}>Adicionar evidência</button></span>}
                    </div>
                  </section>
                  <section className="skda-stage-list">
                    <div className="skda-megaphase-subhead"><span>Etapas e atividades</span><strong>{stages.length} etapa(s)</strong></div>
                    {stages.length === 0 ? <p>Estrutura operacional ainda não carregada.</p> : stages.map((stage) => {
                      const activities = Array.isArray(stage.metadata?.activities)
                        ? stage.metadata.activities.filter((item): item is string => typeof item === 'string')
                        : []
                      const stageStatus = stage.status === 'in_progress' ? 'Em andamento' : stage.status === 'completed' ? 'Concluída' : stage.status === 'blocked' ? 'Bloqueada' : 'Planejada'
                      return <article key={stage.id}>
                        <div className="skda-stage-title"><span>{stage.code}</span><strong>{stage.name}</strong><b>{stageStatus}</b></div>
                        <ul>{activities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
                        <div className="skda-input-chips">
                          <span title="Abra a área de trabalho desta etapa para consultar e correlacionar evidências."><button type="button" onClick={() => setActivePhaseCode(['MF4','MF5','MF6','MF7'].includes(megaphase.code) ? 'DA-01' : 'DA-00')}>Acessar área de trabalho</button></span>
                          <span title="Consulte as evidências transversais da organização."><button type="button" onClick={() => setActivePhaseCode('DA-00')}>Consultar evidências</button></span>
                          {canRegisterEvidence && <span title="Registre uma nova evidência relacionada a esta etapa."><button type="button" onClick={() => {setEvidenceFile(null);setShowEvidenceCreate(true)}}>Adicionar evidência</button></span>}
                        </div>
                      </article>
                    })}
                  </section>
                  <section className="skda-artifact-list">
                    <div className="skda-megaphase-subhead"><span>KIT de condução da MegaFase</span><strong>Pacote metodológico previsto · não gerado</strong></div>
                    <div className="skda-input-chips">
                      {['Apresentação da MegaFase (PPTX)','Roteiro detalhado por slide e perguntas de facilitação','Prompt completo para AI','Instrumentos, formulários e matrizes de trabalho','Checklist de evidências e critérios de aceite','Relatório, decisões e pendências','Plano de Ação 5W2H e follow-up entre ciclos','Pacote de entrega e handoff à próxima MegaFase'].map((item) =>
                        <span key={item} title="Ainda não disponível. É necessário gerar o artefato, vinculá-lo à MegaFase e registrar sua versão antes de abrir."><button type="button" disabled>{item}</button></span>
                      )}
                    </div>
                    <p>Este é o contrato mínimo do KIT, ainda pendente de geração, vinculação documental, versionamento e aprovação. Os artefatos efetivamente cadastrados aparecem abaixo.</p>
                    <div className="skda-megaphase-subhead"><span>Artefatos e entregáveis cadastrados</span><strong>{artifacts.length} previsto(s)</strong></div>
                    {artifacts.length === 0 ? <p>Entregáveis metodológicos ainda não estruturados.</p> : <div className="skda-artifact-grid">{artifacts.map((artifact) => <article key={artifact.id}>
                      <div><small>{artifact.artifact_code}</small><strong>{artifact.title}</strong><span>{artifact.purpose || 'Entregável metodológico da Jornada.'}</span><span title="A validar: vincule uma versão documental ao entregável para habilitar sua abertura."><button type="button" disabled>Abrir entregável</button></span></div>
                      <div className="skda-artifact-state"><b>{ARTIFACT_STATUS[artifact.status] ?? artifact.status}</b><span>v{artifact.current_version_number || 0}</span>{artifact.planned_due_date && <small>Previsto: {new Date(artifact.planned_due_date+'T00:00:00').toLocaleDateString('pt-BR')}</small>}</div>
                    </article>)}</div>}
                  </section>
                </div>
              </details>
            })}
          </div>

        </div>
      </section>}

      {isOverview && <section className="skda-followup-summary skda-followup-at-end">
        <div className="skda-executive-card-head">
          <div><span>Follow-up entre ciclos</span><h3>Execução das ações priorizadas</h3></div>
          <strong>{actionFollowupSummary.total}</strong>
        </div>
        {actionFollowupSummary.total === 0 ? (
          <p>Nenhuma ação longitudinal registrada ainda. O acompanhamento será ativado quando recomendações validadas forem priorizadas e acompanhadas nos ciclos seguintes.</p>
        ) : (
          <div className="skda-followup-grid">
            <div><span>Concluídas</span><strong>{actionFollowupSummary.completed}</strong></div>
            <div><span>Em andamento</span><strong>{actionFollowupSummary.inProgress}</strong></div>
            <div><span>Vencidas</span><strong>{actionFollowupSummary.overdue}</strong></div>
            <div><span>Não iniciadas</span><strong>{actionFollowupSummary.notStarted}</strong></div>
            <div><span>Bloqueadas</span><strong>{actionFollowupSummary.blocked}</strong></div>
            <div><span>Aguardando conversão</span><strong>{actionFollowupSummary.awaitingConversion}</strong></div>
          </div>
        )}
      </section>}

      {isAgenda && <section className="skda-agenda-host">
        <AgendaSection organizationId={props.organizationId} moduleCode="SK-DA" moduleLabel="SK-DA" />
      </section>}

      {activePhase && <div className="skda-journey">
        <div className="skda-journey-head"><div><span>Jornada metodológica</span><h3>Preparação → Entrevistas e avaliação → Devolutiva → Plano de Ação</h3></div><b>{Number(selected.progress).toFixed(0)}%</b></div>
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
              <span>{phase.title}</span>
            </button>
          ))}
        </div>
        <section className="skda-phase-panel" role="tabpanel">
          <div><span>Fase da Jornada</span><h3>{activePhase.title}</h3></div>
          <p>{activePhase.description}</p>
          {activePhase.code === 'DA-00' && <div className="skda-phase-substeps" aria-label="Etapas internas da Preparação e abertura">
            <span>1. Leitura da AA</span>
            <span>2. Histórico e benchmarks</span>
            <span>3. Evidências de entrada</span>
            <span>4. Agenda e uso das horas</span>
          </div>}
          {activePhase.code === 'DA-01' && <div className="skda-phase-substeps" aria-label="Etapas internas das Entrevistas e diagnóstico">
            <span>1. Governança</span>
            <span>2. Gestão</span>
            <span>3. Avaliação por questão</span>
            <span>4. Achados e lacunas</span>
          </div>}
          <div className="skda-phase-summary">
            {activePhase.code === 'DA-00' && <><span>Preparação</span><strong>{selfAssessmentSnapshots.length} AA · {metrics.evidence} evidência(s)</strong></>}
            {activePhase.code === 'DA-01' && <><span>Entrevistas e diagnóstico</span><strong>{metrics.interviews} entrevista(s) · {metrics.responses} questão(ões) · {metrics.findings} achado(s)</strong></>}
            {activePhase.code === 'DA-02' && <><span>Recomendações e priorização</span><strong>{findings.filter((finding) => Boolean(finding.recommendation)).length} recomendação(ões)</strong></>}
            {activePhase.code === 'DA-03' && <><span>Plano de Ação e devolutiva</span><strong>Ciclos 1 · 2 · 3</strong></>}
          </div>
          {activePhase.code === 'DA-00' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><div><h4>Configuração da Jornada DA</h4><small>Defina o ciclo, escopo, metodologia, responsável e catálogo da jornada.</small></div><span>{selectedCatalog ? selectedCatalog.framework_code : 'Não definido'}</span></div>
            {contractIntakeProposal && <div className="skda-contract-intake">
              <div className="skda-phase-workspace-head">
                <div>
                  <h4>Fonte contratual identificada</h4>
                  <small>{contractIntakeProposal.sourceTitle}</small>
                </div>
                <span>{contractIntakeProposal.contractedHours}h identificadas</span>
              </div>
              <div className="skda-contract-summary-grid">
                <article><small>Início sugerido</small><strong>{new Date(contractIntakeProposal.startedOn+'T00:00:00').toLocaleDateString('pt-BR')}</strong></article>
                <article><small>Conclusão sugerida</small><strong>{new Date(contractIntakeProposal.plannedEndOn+'T00:00:00').toLocaleDateString('pt-BR')}</strong></article>
                <article><small>Blocos contratados</small><strong>{contractIntakeProposal.meetings.length}</strong></article>
                <article><small>Status</small><strong>{appliedContractAssetId === contractIntakeProposal.assetId ? 'Aplicada ao rascunho' : 'Aguardando análise'}</strong></article>
              </div>
              <div className="skda-contract-meeting-list">
                {contractIntakeProposal.meetings.map((meeting, index) => <article key={meeting.date+'-'+meeting.start+'-'+index}>
                  <div><small>Bloco {index+1}</small><strong>{new Date(meeting.date+'T00:00:00').toLocaleDateString('pt-BR')} · {meeting.start}</strong><span>{meeting.location || 'Local a confirmar'}</span></div>
                  <b>{meeting.durationHours}h</b>
                </article>)}
              </div>
              <div className="skda-evidence-loop-note"><strong>Regra de aprovação</strong><span>Esses dados foram extraídos do documento contratual e constituem uma proposta de linha de base. A Organização pode aprovar ou adequar datas, horários e distribuição antes da consolidação do cronograma.</span></div>
              {canManage && <div className="skda-opening-actions"><button type="button" className="skda-primary" onClick={applyContractIntakeProposal}>Aplicar sugestão à abertura</button></div>}
            </div>}
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
              <div className="skda-phase-workspace-head"><h4>Catálogo metodológico</h4><span>{selectedCatalog ? formatCatalogName(selectedCatalog.name) : 'Não selecionado'}</span></div>
              {catalogs.length === 0 ? <p className="skda-phase-empty">Nenhum catálogo publicado está disponível. A jornada pode ser aberta, mas a avaliação por questão depende de um catálogo publicado.</p> : <label className="skda-inline-field"><span>Versão do catálogo</span><select value={selected.catalog_version_id ?? ''} disabled={!canManage || saving || catalogLocked} onChange={(e) => void assignCatalog(e.target.value)}><option value="">Selecione...</option>{catalogs.map((catalog) => <option key={catalog.id} value={catalog.id}>{formatCatalogName(catalog.name)} · {catalog.version_code}</option>)}</select>{catalogLocked && <small>Catálogo bloqueado após o início da avaliação para preservar a rastreabilidade das respostas.</small>}</label>}
            </div>
            <div className="skda-workload-proposal">
              <div className="skda-phase-workspace-head">
                <div>
                  <h4>Dimensionamento da Jornada DA</h4>
                  <small>O nível do instrumento define o rito metodológico de referência. A OI/OS define a carga efetivamente contratada. O SPARKs deve adaptar o plano sem eliminar silenciosamente etapas essenciais.</small>
                </div>
                <span>{workloadReference ? workloadReference.name : 'Nível a identificar'}{contractedHours ? ' · '+contractedHours+'h contratadas' : ''}</span>
              </div>

              {workloadReference ? <>
                <div className="skda-workload-grid">
                  <article className="is-organization">
                    <div><small>Referência oficial do nível</small><strong>{workloadReference.name}</strong><span>Carga total prevista pela metodologia de referência.</span></div>
                    <b>{workloadReference.totalHours}h</b>
                  </article>
                  <article className="is-organization">
                    <div><small>Com a Organização</small><strong>Entrevistas, análise assistida e devolutiva</strong><span>Horas que exigem participação da cooperativa e devem compor sua agenda/cronograma.</span></div>
                    <b>{workloadReference.organizationHours}h</b>
                  </article>
                  <article className="is-internal">
                    <div><small>Trabalho técnico e institucional</small><strong>Preparação, análise e consolidação</strong><span>Estudo prévio {workloadReference.studyHours}h · alinhamentos técnicos {workloadReference.technicalAlignmentHours}h · preparação da devolutiva {workloadReference.returnPreparationHours}h · plano de melhoria {workloadReference.actionPlanHours}h.</span></div>
                    <b>{workloadReference.technicalInstitutionalHours}h</b>
                  </article>
                </div>
                {contractedHours && workloadGap !== null && <div className="skda-evidence-loop-note">
                  <strong>{workloadGap < 0 ? 'Adaptação obrigatória' : workloadGap > 0 ? 'Capacidade adicional disponível' : 'Carga aderente ao referencial'}</strong>
                  <span>{workloadGap < 0
                    ? `A contratação possui ${Math.abs(workloadGap)}h a menos que o referencial de ${workloadReference.totalHours}h. O plano deve explicitar quais ganhos de eficiência, automações e reagrupamentos permitirão executar o mesmo rito com menor esforço, preservando entrevistas, evidências, avaliação, devolutiva e Plano de Ação.`
                    : workloadGap > 0
                      ? `A contratação possui ${workloadGap}h além do referencial. O excedente pode ampliar análise, validações, evidências ou follow-up conforme necessidade.`
                      : 'A carga contratada coincide com o dimensionamento metodológico de referência.'}</span>
                </div>}
              </> : <div className="skda-evidence-loop-note"><strong>Nível de maturidade ainda não identificado</strong><span>Defina o nível do instrumento para que o SPARKs recupere automaticamente o dimensionamento metodológico de referência antes de propor a agenda.</span></div>}

              <div className="skda-workload-grid skda-workload-reference-grid">
                {Object.values(PDGC_WORKLOAD_REFERENCES).map((reference) => <article key={reference.code} className={workloadLevelCode === reference.code ? 'is-current-reference' : ''}>
                  <div><small>{reference.code} · referência PDGC</small><strong>{reference.name}</strong><span>{reference.technicalInstitutionalHours}h técnicas/institucionais · {reference.organizationHours}h com a Organização</span></div>
                  <b>{reference.totalHours}h</b>
                </article>)}
              </div>
              <div className="skda-evidence-loop-note"><strong>Regra de planejamento</strong><span>A agenda apresentada à Organização contém apenas os blocos que exigem sua participação. Estudo, análise documental, alinhamentos técnicos, preparação de devolutiva, lançamentos e construção do Plano de Ação permanecem no plano interno/institucional. A OI/OS é o teto contratual e qualquer reprogramação deve preservar justificativa e histórico.</span></div>
            </div>
            <div className="skda-intake-evidence">
              <div className="skda-phase-workspace-head">
                <div>
                  <h4>Evidências de entrada e Autoavaliações</h4>
                  <small>A Fase 0 inventaria o que foi recebido antes de qualquer conclusão do diagnóstico. Autoavaliações são preservadas como declaração histórica da organização, não como validação automática.</small>
                </div>
                <span>{selfAssessmentSnapshots.length} snapshot(s)</span>
              </div>
              <div className="skda-evidence-loop-note"><strong>Regra de evidência</strong><span>O que a organização declarou, o que as evidências efetivamente sustentam e o que o DA valida permanecem separados e rastreáveis.</span></div>
              {selfAssessmentSnapshots.length === 0 ? <p className="skda-phase-empty">Nenhuma Autoavaliação foi importada para este ciclo. A preparação pode continuar com inventário documental, entrevistas iniciais e outras fontes disponíveis.</p> : <div className="skda-intake-snapshots">
                {selfAssessmentSnapshots.map((snapshot) => {
                  const block = typeof snapshot.metadata?.block === 'string' ? snapshot.metadata.block : 'AUTOAVALIAÇÃO'
                  const normalizationStatus = typeof snapshot.metadata?.normalization_status === 'string' ? snapshot.metadata.normalization_status : 'preserved'
                  return <article key={snapshot.id}>
                    <div>
                      <small>{block === 'GOVERNANCA' ? 'Governança Cooperativa' : block === 'GESTAO' ? 'Gestão' : 'Autoavaliação'}</small>
                      <strong>{snapshot.source_label || 'Autoavaliação importada'}</strong>
                      <span>{snapshot.source_date ? new Date(snapshot.source_date+'T00:00:00').toLocaleDateString('pt-BR') : 'Data não informada'} · Snapshot imutável</span>
                    </div>
                    <div className="skda-intake-status">
                      <b>Declaração preservada</b>
                      <span>{normalizationStatus === 'staging' ? 'Estruturação em andamento' : 'Estruturada'}</span>
                    </div>
                  </article>
                })}
              </div>}
            </div>
            {canManage && <div className="skda-opening-actions"><button type="button" className="skda-primary" disabled={saving} onClick={()=>void saveOpeningConfiguration()}>{saving?'Salvando...':'Salvar abertura da jornada'}</button></div>}
          </div>}
          {activePhase.code === 'DA-00' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head">
              <div><h4>Evidências disponíveis no Core</h4><small>Registre novas evidências no Core ou correlacione ativos já existentes com esta Jornada DA.</small></div>
              <div className="skda-phase-workspace-actions">
                <span>{evidenceAssets.length} ativo(s)</span>
                {canRegisterEvidence && <button type="button" className="skda-primary" onClick={() => { setEvidenceFile(null); setShowEvidenceCreate(true) }}>Adicionar e analisar evidência</button>}
              </div>
            </div>
            <div className="skda-evidence-checklist">
              <h4>Checklist documental da Jornada</h4>
              <p>Importe documentos históricos, materiais solicitados e outras evidências. A classificação é orientativa e não impede novos registros.</p>
              <div className="skda-evidence-checklist-grid">
                {DA_EVIDENCE_CHECKLIST.map((item) => (
                  <article key={item.code}>
                    <strong>{item.title}</strong>
                    <small>{item.hint}</small>
                    {canRegisterEvidence && <button type="button" onClick={() => {
                      setEvidenceFile(null)
                      setEvidenceForm((current) => ({
                        ...current,
                        title:'',
                        description:item.title + ' — ' + item.hint,
                        changeReason:'Importação documental orientada pelo checklist da Jornada SK-DA.',
                      }))
                      setShowEvidenceCreate(true)
                    }}>Importar evidência</button>}
                  </article>
                ))}
              </div>
            </div>
            {evidenceAssets.length === 0 ? <p className="skda-phase-empty">Nenhuma evidência transversal disponível para esta organização.</p> : <div className="skda-evidence-list">
              {evidenceAssets.map((asset) => {
                const correlation = evidenceCorrelations.find((item) => item.evidence_asset_id === asset.id)
                const intelligenceRows = evidenceQuestionIntelligence.filter((item) => item.evidence_asset_id === asset.id)
                const proposedCount = intelligenceRows.filter((item) => ['proposed','validated'].includes(item.analysis_status)).length
                const pendingCount = intelligenceRows.filter((item) => ['pending','queued','processing'].includes(item.analysis_status)).length
                return <article key={asset.id}>
                  <div><small>{EVIDENCE_TYPES[asset.evidence_type] ?? asset.evidence_type}</small><strong>{asset.title}</strong><span>{EVIDENCE_STATUS[asset.validation_status] ?? asset.validation_status} · Confiabilidade: {RELIABILITY[asset.reliability_level] ?? asset.reliability_level}</span>{intelligenceRows.length > 0 && <span>Análise por questão: {intelligenceRows.length} vínculo(s) · {pendingCount} em análise · {proposedCount} proposta(s)</span>}</div>
                  <div>{correlation ? <b>Vinculada ao diagnóstico</b> : canLinkEvidence ? <button type="button" className="skda-primary" disabled={saving} onClick={() => void linkEvidence(asset)}>Vincular</button> : <span>Disponível</span>}</div>
                </article>
              })}
            </div>}
          </div>}
          {activePhase.code === 'DA-01' && <div className="skda-phase-workspace">
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
                  {canRegisterEvidence && <button type="button" className="skda-primary" onClick={() => { setEvidenceForm((current) => ({ ...current, interviewId:interview.id })); setShowEvidenceCreate(true) }}>Registrar evidência</button>}
                </div>
              </article>)}
            </div>}
          </div>}
          {activePhase.code === 'DA-01' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><div><h4>Avaliação por questão</h4><small>Registre a constatação, classifique, atribua nota e confiança e submeta à validação conforme o papel.</small></div><span>{selectedCatalog ? selectedCatalog.name : 'Catálogo não definido'}</span></div>
            <div className="skda-assessment-method-note"><strong>Maturidade</strong><span>A escala de maturidade não está publicada no catálogo atual. O campo não será preenchido artificialmente; quando a escala metodológica estiver no catálogo, a avaliação passará a derivá-la daqui.</span></div>
            {!selected.catalog_version_id ? <p className="skda-phase-empty">Defina o catálogo na fase DA-00 antes de iniciar a avaliação.</p> : questions.length === 0 ? <p className="skda-phase-empty">O catálogo selecionado ainda não possui questões disponíveis.</p> : <div className="skda-question-list skda-assessment-list">
              {questions.map((question) => {
                const response = responses.find((item) => item.question_id === question.id)
                const intelligenceRows = evidenceQuestionIntelligence.filter((item) => item.question_id === question.id)
                const proposedRows = intelligenceRows.filter((item) => item.analysis_status === 'proposed' || item.analysis_status === 'validated')
                const queuedRows = intelligenceRows.filter((item) => item.analysis_status === 'queued' || item.analysis_status === 'processing' || item.analysis_status === 'pending')
                const draft = assessmentDrafts[question.id] ?? { classification:'not_evaluated', answerText:'', rationale:'', confidenceLevel:'not_assessed', score:'' }
                return <article key={question.id} className="skda-assessment-card">
                  <div className="skda-question-copy"><small>{question.code}{question.axis_name ? ' · '+question.axis_name : ''}</small><strong>{question.question_text}</strong>{question.criterion_name && <span>{question.criterion_name}</span>}</div>
                  {assistedSelfAssessmentActive && question.guidance && <div className="skda-aa-guidance"><strong>Orientação metodológica da questão</strong><span>{question.guidance}</span></div>}
                  <div className="skda-assessment-status"><span>Estado</span><b>{RESPONSE_STATUS[response?.response_status ?? 'draft'] ?? response?.response_status}</b>{response?.validated_at && <small>Validada em {new Date(response.validated_at).toLocaleString('pt-BR')}</small>}</div>
                  {intelligenceRows.length > 0 && <div className="skda-question-intelligence">
                    <div className="skda-question-intelligence-head">
                      <strong>Inteligência de evidências</strong>
                      <span>{intelligenceRows.length} evidência(s) · {queuedRows.length} em análise · {proposedRows.length} proposta(s)</span>
                    </div>
                    {proposedRows.length === 0 ? <p>As evidências vinculadas estão na fila de análise por requisitos desta questão.</p> : proposedRows.map((item) => <article key={item.id}>
                      <div className="skda-question-intelligence-state">
                        <b>{item.evidence_coverage_status === 'covers' ? 'Contempla' : item.evidence_coverage_status === 'partially_covers' ? 'Contempla parcialmente' : item.evidence_coverage_status === 'does_not_cover' ? 'Não contempla' : item.evidence_coverage_status === 'needs_complement' ? 'Necessita complemento' : 'Em análise'}</b>
                        {item.confidence_score != null && <span>Confiança {Number(item.confidence_score).toFixed(0)}%</span>}
                      </div>
                      {item.diagnostic_hypothesis && <p><strong>Hipótese:</strong> {item.diagnostic_hypothesis}</p>}
                      {item.gap_description && <p><strong>Lacuna:</strong> {item.gap_description}</p>}
                      {item.complement_needed && <p><strong>Complemento necessário:</strong> {item.complement_needed}</p>}
                      {item.improvement_suggestion && <p><strong>Melhoria sugerida:</strong> {item.improvement_suggestion}</p>}
                      {assistedSelfAssessmentActive && item.self_assessment_guidance && <p><strong>Orientação para AA:</strong> {item.self_assessment_guidance}</p>}
                      {item.interview_question_suggestion && <p><strong>Pergunta sugerida para entrevista:</strong> {item.interview_question_suggestion}</p>}
                    </article>)}
                  </div>}
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
          {activePhase.code === 'DA-01' && <div className="skda-phase-workspace">
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
          {activePhase.code === 'DA-02' && <div className="skda-phase-workspace">
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
          {activePhase.code === 'DA-03' && <div className="skda-phase-workspace">
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
      active:PHASES.some((phase) => phase.code === activePhaseCode) && activePhaseCode !== 'DA-03' || isAgenda,
      disabled:!selected,
      children:[
        {
          id:'journey-opening',
          label:'Preparação e abertura',
          icon:<span aria-hidden="true">◌</span>,
          active:activePhaseCode === 'DA-00',
          onActivate:() => setActivePhaseCode('DA-00'),
        },
        {
          id:'journey-diagnosis',
          label:'Entrevistas e diagnóstico',
          icon:<span aria-hidden="true">⌕</span>,
          active:activePhaseCode === 'DA-01',
          onActivate:() => setActivePhaseCode('DA-01'),
        },
        {
          id:'journey-return',
          label:'Recomendações e priorização',
          icon:<span aria-hidden="true">◇</span>,
          active:activePhaseCode === 'DA-02',
          onActivate:() => setActivePhaseCode('DA-02'),
        },
        {
          id:'journey-agenda',
          label:'Agenda',
          icon:<span aria-hidden="true">▣</span>,
          active:isAgenda,
          onActivate:() => setActivePhaseCode('AGENDA'),
        },
      ],
    },
    {
      id:'action-plan',
      label:'Plano de Ação',
      icon:<span aria-hidden="true">✓</span>,
      active:activePhaseCode === 'DA-03',
      disabled:!selected,
      onActivate:() => setActivePhaseCode('DA-03'),
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
        <div className="skda-pe-identity">
          <OrganizationBrandingLogo
            organizationId={props.organizationId}
            organizationName={props.organizationName}
            logoStoragePath={props.organizationLogoStoragePath}
            className="skda-pe-organization-logo"
          />
          <div className="skda-pe-organization-switcher">
            {props.workspaceOrganizations.length > 1 && props.onSwitchOrganization ? (
              <select
                aria-label="Selecionar organização"
                value={props.organizationId}
                onChange={(event) => void props.onSwitchOrganization?.(event.target.value)}
                title="Selecionar organização"
              >
                {props.workspaceOrganizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>{organization.name}</option>
                ))}
              </select>
            ) : <strong>{props.organizationName}</strong>}
          </div>
          <div className="skda-pe-module-switcher" aria-label="Módulos disponíveis">
            {props.workspaceModules.map((module) => (
              <button
                key={module.code}
                type="button"
                className={module.code === props.activeModuleCode ? 'is-active' : ''}
                disabled={!module.available}
                title={module.description ? `${module.name} — ${module.description}` : module.name}
                onClick={() => module.available && void props.onSwitchModule?.(module.code)}
              >
                <span className="skda-pe-module-label">{module.name || module.code}</span>
              </button>
            ))}
          </div>
        </div>
      }
      contextItems={[]}
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
        primary={
          <div className="skda-dashboard-page">
            {isOverview && <section className="skda-diagnosis-switcher">{primary}</section>}
            {secondary}
          </div>
        }
      />
    </ApplicationShell>
    {validationFindingId && <div className="skda-modal-backdrop">
      <section className="skda-modal" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Recomendações e priorização</p><h2>Aceitar recomendação</h2></div><button type="button" onClick={() => setValidationFindingId(null)}>×</button></div>
        <p>Registre a justificativa da validação executiva. A recomendação aceita ficará elegível para priorização no Plano de Ação e, quando aplicável, conversão em iniciativa transversal.</p>
        <div className="skda-form-grid"><label className="wide"><span>Justificativa *</span><textarea rows={5} value={validationReason} onChange={(e)=>setValidationReason(e.target.value)}/></label></div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setValidationFindingId(null)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void acceptRecommendation()}>{saving?'Validando...':'Aceitar recomendação'}</button></div>
      </section>
    </div>}
    {showTacticalCreate && selected && <div className="skda-modal-backdrop">
      <section className="skda-modal skda-modal-wide" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Plano de Ação e devolutiva</p><h2>Criar iniciativa transversal</h2></div><button type="button" onClick={() => setShowTacticalCreate(false)}>×</button></div>
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
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Entrevistas e diagnóstico</p><h2>Registrar achado</h2></div><button type="button" onClick={() => setShowFindingCreate(false)}>×</button></div>
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
    {showEvidenceCreate && selected && <div className="skda-modal-backdrop">
      <section className="skda-modal skda-modal-wide" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Evidência transversal da Jornada</p><h2>Adicionar e analisar evidência</h2></div><button type="button" onClick={() => setShowEvidenceCreate(false)}>×</button></div>
        <p>O arquivo será gravado e versionado no Core transversal de Evidências, deduplicado por hash e enfileirado para análise por questão. O SK-DA preserva a correlação metodológica sem duplicar o documento.</p>
        <div className="skda-evidence-upload"><label><span>Arquivo da evidência</span><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp" onChange={(event)=>{
          const file=event.target.files?.[0] ?? null
          if (file && file.size > 50 * 1024 * 1024) {
            event.currentTarget.value=''
            setEvidenceFile(null)
            setError('O arquivo excede o limite de 50 MB do Core de Evidências.')
            return
          }
          setError('')
          setEvidenceFile(file)
          if (file) {
            const inferred = inferEvidenceFileMetadata(file)
            setEvidenceForm((current)=>({
              ...current,
              title:current.title.trim() || inferred.title,
              evidenceType:current.evidenceType === 'document' ? inferred.evidenceType : current.evidenceType,
              referenceDate:current.referenceDate || inferred.referenceDate,
            }))
          }
        }}/><small>{evidenceFile ? `${evidenceFile.name} · ${(evidenceFile.size/1024/1024).toFixed(2)} MB` : 'PDF, Word, Excel, CSV, texto ou imagem · até 50 MB'}</small></label></div>
        <div className="skda-form-grid">
          <label className="wide"><span>Título *</span><input value={evidenceForm.title} onChange={(e)=>setEvidenceForm(v=>({...v,title:e.target.value}))} placeholder="Ata, relatório, indicador, registro ou evidência identificada"/></label>
          <label><span>Tipo</span><select value={evidenceForm.evidenceType} onChange={(e)=>setEvidenceForm(v=>({...v,evidenceType:e.target.value}))}>{Object.entries(EVIDENCE_TYPES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Origem</span><select value={evidenceForm.sourceType} onChange={(e)=>setEvidenceForm(v=>({...v,sourceType:e.target.value}))}>{Object.entries(EVIDENCE_SOURCE_TYPES).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Confidencialidade</span><select value={evidenceForm.confidentialityLevel} onChange={(e)=>setEvidenceForm(v=>({...v,confidentialityLevel:e.target.value}))}>{Object.entries(EVIDENCE_CONFIDENTIALITY).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Data de referência</span><input type="date" value={evidenceForm.referenceDate} onChange={(e)=>setEvidenceForm(v=>({...v,referenceDate:e.target.value}))}/></label>
          <label className="wide"><span>Entrevista de origem</span><select value={evidenceForm.interviewId} onChange={(e)=>setEvidenceForm(v=>({...v,interviewId:e.target.value}))}><option value="">Não surgiu de entrevista específica</option>{interviews.map((interview)=><option key={interview.id} value={interview.id}>{interview.code} · {interview.title}</option>)}</select></label>
          <label className="wide"><span>Descrição / contexto</span><textarea rows={4} value={evidenceForm.description} onChange={(e)=>setEvidenceForm(v=>({...v,description:e.target.value}))} placeholder="O que esta evidência demonstra, como surgiu e por que é relevante para o diagnóstico."/></label>
          <label className="wide"><span>Justificativa do registro *</span><textarea rows={3} value={evidenceForm.changeReason} onChange={(e)=>setEvidenceForm(v=>({...v,changeReason:e.target.value}))}/></label>
        </div>
        <div className="skda-tactical-note"><strong>SK-DOC + SK-KM + SK-DA</strong><span>Após o registro, a evidência entra na fila de inteligência para ser confrontada com as questões do catálogo: relevância, suficiência, confiabilidade, lacunas, complemento necessário, orientação para Autoavaliação e perguntas sugeridas para entrevistas.</span></div>
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setShowEvidenceCreate(false)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createAndLinkEvidence()}>{saving?'Processando...':'Gravar, vincular e analisar'}</button></div>
      </section>
    </div>}
    {showInterviewCreate && selected && <div className="skda-modal-backdrop">
      <section className="skda-modal" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Entrevistas e diagnóstico</p><h2>Planejar entrevista</h2></div><button type="button" onClick={() => setShowInterviewCreate(false)}>×</button></div>
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
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Entrevistas e diagnóstico</p><h2>Registrar realização</h2></div><button type="button" onClick={() => setRealizationInterviewId(null)}>×</button></div>
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
