import { Fragment, useEffect, useMemo, useState } from 'react'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
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
  userId: string
  userDisplayName: string
  userEmail: string
  userAvatarUrl: string | null
  isOrganizationAdmin: boolean
  isPlatformSuperAdmin: boolean
  platformTheme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenUserProfile?: () => void
  onOpenOrganizationAdmin?: () => void
  onOpenOrganizationUsers?: () => void
  onOpenPlatformAdmin?: () => void
  onLogout?: () => void | Promise<void>
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
  created_by: string | null
}

type OrganizationUser = {
  user_id: string
  user_email: string
  user_display_name: string | null
  user_active: boolean
  membership_status: string
  job_title: string | null
  module_code: string | null
  module_name: string | null
  role_code: string | null
  role_name: string | null
  module_role_status: string | null
}
type Metrics = { responses: number; interviews: number; evidence: number; findings: number }
type Phase = { code: string; title: string; description: string; statusKey: string }
type Interview = { id: string; code: string; title: string; interviewee_name: string | null; interviewee_role: string | null; status: string; channel: string; scheduled_start: string | null; scheduled_end: string | null; actual_start: string | null; actual_end: string | null; event_id: string | null }
type InterviewQuestionRecord = { id:string; interview_id:string; question_id:string; sequence_order:number; status:'pending'|'in_progress'|'completed'|'skipped'; observed_practice:string|null; interview_notes:string|null; evidence_cited:string|null; evidence_requested:string|null; gap_summary:string|null; output_type:string|null; next_action:string|null; execution_date:string|null; started_at:string|null; completed_at:string|null; metadata:Record<string,unknown> }
type InterviewQuestionDraft = { observedPractice:string; interviewNotes:string; evidenceCited:string; evidenceRequested:string; gapSummary:string; outputType:string; nextAction:string; executionDate:string }
type ActionPlanAllocation = { id: string; finding_id: string; initiative_id: string | null; cycle_number: number; sequence_order: number; rationale: string | null }
type ManagedInterviewEvent = { event_id: string; journey_item_code: string; journey_item_title: string; event_type: string; event_title: string; event_description: string | null; starts_at: string | null; ends_at: string | null; all_day: boolean; timezone_name: string; event_status: string; priority: string; location_text: string | null; meeting_reference: string | null; participant_count: number; accepted_count: number; attended_count: number }
type EvidenceAsset = { id: string; title: string; evidence_type: string; validation_status: string; reliability_level: string; reference_date: string | null; current_version_id: string | null }
type EvidenceVersionText = { id: string; evidence_asset_id: string; extracted_text: string | null }
type FolderEvidenceCandidate = { id:string; file:File; relativePath:string; selected:boolean; status:'ready'|'importing'|'imported'|'error'; errorMessage:string|null; groupCode:string; groupTitle:string; groupHint:string; evidenceType:string; referenceDate:string; confidence:number; discoveryTags:string[]; suggestedQuestionIds:string[]; suggestedQuestionCodes:string[]; triageSummary:string; extractedPreview:string }
type ContractMeetingProposal = { date: string; start: string; durationHours: number; location: string | null }
type ContractIntakeProposal = { assetId: string; sourceTitle: string; sourceText: string; startedOn: string; plannedEndOn: string; contractedHours: number; meetings: ContractMeetingProposal[]; scopeLabel: string | null }
type EvidenceCorrelation = { id: string; evidence_asset_id: string; usage_type: string; validation_status: string; metadata: Record<string,unknown> }
type EvidenceQuestionIntelligence = { id:string; evidence_asset_id:string; question_id:string; document_intake_status:string; evidence_coverage_status:string; practice_state:string; relevance_score:number|null; adequacy_score:number|null; sufficiency_score:number|null; reliability_score:number|null; actuality_score:number|null; coverage_score:number|null; confidence_score:number|null; gap_description:string|null; complement_needed:string|null; improvement_suggestion:string|null; interview_question_suggestion:string|null; self_assessment_guidance:string|null; diagnostic_hypothesis:string|null; analysis_status:string; source_excerpt:string|null; source_locator:string|null; metadata:Record<string,unknown> }
type SelfAssessmentSnapshot = { id: string; source_label: string | null; source_date: string | null; content_hash: string | null; metadata: Record<string, unknown> }
type SelfAssessmentMetric = { id:string; block_code:'GOVERNANCA'|'GESTAO'; metric_kind:'overall_index'|'criterion'|'history'|'benchmark'; metric_code:string; metric_name:string; reference_year:number|null; comparator_code:string; comparator_label:string|null; metric_value:number; unit:string; source_label:string|null; source_reference:string|null; metadata?:Record<string,unknown>|null }
type CatalogVersion = { id: string; code: string; version_code: string; name: string; framework_code: string }
type Question = { id: string; code: string; axis_name: string | null; criterion_name: string | null; question_text: string; guidance: string | null; expected_evidence: unknown[] | null; display_order: number }
type Response = { id: string; question_id: string; classification: string; response_status: string; answer_text: string | null; rationale: string | null; confidence_level: string; maturity_level: string | null; score: number | null; declared_alternative_id: string | null; evidenced_alternative_id: string | null; validated_alternative_id: string | null; evaluated_at: string | null; validated_at: string | null; metadata: Record<string,unknown> }
type QuestionAlternative = { id:string; question_id:string; code:string; alternative_text:string; progression_order:number; score_value:number|null }
type QuestionEvidenceExpectation = { expectation_id:string; question_id:string; evidence_key:string; title:string; description:string|null; answer_level:'A'|'B'|'C'|'D'; purpose:'support_declared_answer'|'evolution_to_d'|'both'; necessity:'required'|'recommended'|'alternative'; evidence_dimension:string; evidence_kind:string; branch_code:string|null; activity_scope:string|null; source_authority:string; source_reference:string|null; confidence:string; display_order:number; metadata:Record<string,unknown> }
type InterviewQuestionPrompt = { prompt_id:string; question_id:string; prompt_type:'central'|'deepening'|'evidence_request'|'systemic_connection'|'result_probe'|'delta_probe'; prompt_text:string; branch_code:string|null; activity_scope:string|null; source_authority:string; source_reference:string|null; display_order:number; metadata:Record<string,unknown> }
type SelfAssessmentAnswer = { id:string; snapshot_id:string; question_id:string; declared_alternative_id:string|null; declared_code:string|null; declared_text:string|null; rationale:string|null; metadata:Record<string,unknown> }
type AssessmentDraft = { classification: string; answerText: string; rationale: string; confidenceLevel: string; alternativeId: string }
type Finding = { id: string; finding_type: string; title: string; description: string; priority: string; status: string; recommendation: string | null; question_id: string | null; interview_id: string | null; owner_user_id: string | null; due_date: string | null }
type InitiativeOrigin = { initiative_id: string; source_entity_id: string }
type LinkedInitiative = { id: string; code: string; name: string; initiative_class: string; status: string; progress: number; sourceFindingId: string }
type JourneyInitiative = { id:string; code:string; name:string; description:string|null; initiative_class:string; status:string; progress:number; start_date:string|null; target_end_date:string|null; baseline_start_date:string|null; baseline_target_end_date:string|null; priority:string; criticality:string; source_module_code:string|null }
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
  { code:'financeiro', title:'Saúde econômico-financeira', hint:'Balanços, DRE/DSP, balancetes, DFC, orçamento, solvência, liquidez, margens, sobras e indicadores' },
  { code:'entrevistas', title:'Entrevistas e verificações', hint:'Atas, gravações, transcrições e complementos' },
  { code:'complementar', title:'Outras evidências', hint:'Documentos não previstos no checklist inicial' },
] as const

const EMPTY: Metrics = { responses: 0, interviews: 0, evidence: 0, findings: 0 }
const localDateInputValue = (value = new Date()) => new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0,10)

const INTERVIEW_OUTPUT_TYPES: Record<string,string> = {
  evidence_identified:'Evidência identificada',
  evidence_to_provide:'Evidência a disponibilizar',
  practice_without_formalization:'Prática sem formalização',
  document_without_execution:'Documento sem evidência de execução',
  execution_without_result:'Execução sem indicador/resultado',
  partial_evidence:'Evidência parcial ou insuficiente',
  contradiction:'Contradição entre declaração e evidência',
  action_gap:'Lacuna para Plano de Ação',
  report_to_validate:'Relato ainda a validar',
  not_applicable:'Não aplicável, com justificativa',
  not_evaluated:'Não avaliada por falta de informação/tempo',
}

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


const FOLDER_EVIDENCE_EXTENSIONS = new Set([
  'pdf','doc','docx','xls','xlsx','csv','txt','md','json','xml',
  'ppt','pptx','png','jpg','jpeg','webp','mp3','wav','m4a','ogg','mp4','mov','webm',
])

const decodeXmlEvidenceText = (value:string) =>
  value
    .replace(/<w:tab\/?\s*>/gi,' ')
    .replace(/<a:br\/?\s*>/gi,'\n')
    .replace(/<[^>]+>/g,' ')
    .replace(/&amp;/g,'&')
    .replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'")
    .replace(/\s+/g,' ')
    .trim()

const extractFolderEvidenceText = async (file:File): Promise<string> => {
  const extension=file.name.split('.').pop()?.toLowerCase() ?? ''
  if (file.size > 20 * 1024 * 1024) return ''
  try {
    if (['txt','md','csv','json','xml'].includes(extension)) {
      return (await file.text()).slice(0,12000)
    }
    if (extension === 'xlsx') {
      const workbook=new ExcelJS.Workbook()
      await workbook.xlsx.load(await file.arrayBuffer() as unknown as ExcelJS.Buffer)
      const parts:string[]=[]
      workbook.worksheets.slice(0,6).forEach((sheet) => {
        parts.push(sheet.name)
        let rows=0
        sheet.eachRow((row) => {
          if (rows >= 120 || parts.join(' ').length >= 12000) return
          const values=row.values
          if (Array.isArray(values)) {
            const text=values.slice(1,22).map((value) => {
              if (value == null) return ''
              if (typeof value === 'object' && 'text' in value && typeof value.text === 'string') return value.text
              if (typeof value === 'object' && 'result' in value) return String(value.result ?? '')
              return String(value)
            }).filter(Boolean).join(' | ')
            if (text) parts.push(text)
          }
          rows+=1
        })
      })
      return parts.join('\n').slice(0,12000)
    }
    if (extension === 'docx') {
      const zip=await JSZip.loadAsync(await file.arrayBuffer())
      const documentXml=zip.file('word/document.xml')
      return documentXml ? decodeXmlEvidenceText(await documentXml.async('string')).slice(0,12000) : ''
    }
    if (extension === 'pptx') {
      const zip=await JSZip.loadAsync(await file.arrayBuffer())
      const slideNames=Object.keys(zip.files)
        .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
        .sort((a,b) => {
          const ai=Number(a.match(/slide(\d+)/i)?.[1] ?? 0)
          const bi=Number(b.match(/slide(\d+)/i)?.[1] ?? 0)
          return ai-bi
        })
        .slice(0,20)
      const parts:string[]=[]
      for (const name of slideNames) {
        const entry=zip.file(name)
        if (!entry) continue
        parts.push(decodeXmlEvidenceText(await entry.async('string')))
        if (parts.join(' ').length >= 12000) break
      }
      return parts.join('\n').slice(0,12000)
    }
  } catch {
    return ''
  }
  return ''
}

const folderEvidenceGroup = (relativePath:string, extractedText:string) => {
  const text=normalizeSearchText(relativePath+' '+extractedText.slice(0,12000))
  const test=(pattern:RegExp) => pattern.test(text)

  if (test(/balanco|balancete|\bdre\b|\bdsp\b|demonstracao do resultado|fluxo de caixa|\bdfc\b|liquidez|solvencia|endividamento|capital de giro|fleuriet|dupont|\broa\b|\broe\b|\broic\b|margem|sobras|reservas|\bfates\b|orcamento|financeir|economico/)) {
    return {
      code:'financeiro',
      title:'Saúde econômico-financeira',
      hint:'Balanços, DRE/DSP, balancetes, DFC, orçamento, solvência, liquidez, margens, sobras e indicadores',
      tags:['financeiro','resultados','indicadores'],
      confidence:94,
    }
  }
  if (test(/autoavaliacao|avaliacoop|relatorio governanca 2026|relatorio gestao 2026/)) {
    return { code:'autoavaliacao',title:'Autoavaliação vigente',hint:'Respostas, comentários e relatórios oficiais',tags:['autoavaliacao'],confidence:94 }
  }
  if (test(/diagnostico assistido.*governanca|relatorio governanca 202[0-5]|governanca 202[0-5].*diagnostico/)) {
    return { code:'historico-governanca',title:'Diagnósticos anteriores de Governança',hint:'Relatórios, devolutivas e resultados por ciclo',tags:['historico','governanca'],confidence:91 }
  }
  if (test(/diagnostico assistido.*gestao|relatorio gestao 202[0-5]|gestao 202[0-5].*diagnostico/)) {
    return { code:'historico-gestao',title:'Diagnósticos anteriores de Gestão',hint:'Relatórios, devolutivas e resultados por ciclo',tags:['historico','gestao'],confidence:91 }
  }
  if (test(/5w2h|plano de acao|plano acao|acompanhamento de acao|projeto de melhoria|kanban|pdca/)) {
    return { code:'planos-acao',title:'Planos de ação e acompanhamento',hint:'Planos anteriores, responsáveis, prazos e execução',tags:['plano-acao','execucao'],confidence:88 }
  }
  if (test(/entrevista|transcricao|gravacao|depoimento|roteiro de entrevista/)) {
    return { code:'entrevistas',title:'Entrevistas e verificações',hint:'Atas, gravações, transcrições e complementos',tags:['entrevista'],confidence:86 }
  }
  if (test(/estatuto|regimento|assembleia|conselho|governanca|quadro social|cooperado|filiad|politica de relacionamento|comite|auditoria/)) {
    return { code:'governanca',title:'Governança e quadro social',hint:'Estatuto, regimentos, atas, políticas e registros',tags:['governanca'],confidence:82 }
  }
  if (test(/planejamento estrateg|estrategia|processo|cliente|sociedade|pessoa|indicador|conhecimento|resultado|procedimento|sipoc|pesquisa|meta/)) {
    return { code:'gestao',title:'Gestão e resultados',hint:'Estratégia, processos, indicadores e controles',tags:['gestao'],confidence:78 }
  }
  return { code:'complementar',title:'Outras evidências',hint:'Documentos não previstos no checklist inicial',tags:['descoberta'],confidence:55 }
}

const folderEvidenceQuestionSuggestions = (
  groupCode:string,
  relativePath:string,
  extractedText:string,
  questions:Question[],
) => {
  const evidenceText=normalizeSearchText(relativePath+' '+extractedText.slice(0,12000))
  const groupTerms:Record<string,string[]> = {
    financeiro:['resultado','resultados','financeir','econom','indicador','desempenho','liquidez','solvencia','sobras','orcamento','margem'],
    governanca:['governanca','cooperado','assembleia','conselho','fiscal','diretoria','comite','auditoria','quadro social'],
    gestao:['lideranca','estrategia','planos','clientes','sociedade','informacoes','conhecimento','pessoas','processos','resultados'],
    'planos-acao':['plano de acao','acao','melhoria','acompanhamento','responsavel','prazo'],
    entrevistas:['entrevista','evidencia','pratica','execucao'],
    autoavaliacao:['autoavaliacao','resposta','governanca','gestao'],
    'historico-governanca':['governanca','resultado'],
    'historico-gestao':['gestao','resultado'],
  }
  const evidenceTokens=Array.from(new Set(
    evidenceText.split(/\s+/).filter((token) => token.length >= 5).slice(0,500),
  ))
  const ranked=questions.map((question) => {
    const questionText=normalizeSearchText([
      question.code,
      question.axis_name ?? '',
      question.criterion_name ?? '',
      question.question_text,
      question.guidance ?? '',
    ].join(' '))
    let score=0
    for (const term of groupTerms[groupCode] ?? []) {
      const normalizedTerm=normalizeSearchText(term)
      if (questionText.includes(normalizedTerm)) score+=5
      if (evidenceText.includes(normalizedTerm)) score+=2
    }
    const overlap=evidenceTokens.filter((token) => questionText.includes(token)).slice(0,8).length
    score+=overlap
    if (groupCode === 'financeiro' && /resultado|indicador|desempenho|financeir|econom/.test(questionText)) score+=10
    if (groupCode === 'historico-governanca' && question.code.startsWith('GOV-')) score+=4
    if (groupCode === 'historico-gestao' && question.code.startsWith('GES-')) score+=4
    if (groupCode === 'autoavaliacao') score+=2
    return { question,score }
  }).filter((item) => item.score >= (groupCode === 'financeiro' ? 10 : 7))
    .sort((a,b) => b.score-a.score || a.question.display_order-b.question.display_order)

  const limit=groupCode === 'autoavaliacao' ? 12 : 8
  return ranked.slice(0,limit).map((item) => item.question)
}

const classifyFolderEvidenceCandidate = async (file:File, questions:Question[]):Promise<FolderEvidenceCandidate> => {
  const relativePath=file.webkitRelativePath || file.name
  const inferred=inferEvidenceFileMetadata(file)
  const extractedPreview=await extractFolderEvidenceText(file)
  const group=folderEvidenceGroup(relativePath,extractedPreview)
  const suggested=folderEvidenceQuestionSuggestions(group.code,relativePath,extractedPreview,questions)
  const triageSummary=suggested.length > 0
    ? `Triagem automática: ${group.title}. Relevância sugerida para ${suggested.length} questão(ões) (${suggested.map((item)=>item.code).join(', ')}). Validar aderência e suficiência antes de concluir o diagnóstico.`
    : `Triagem automática: ${group.title}. Nenhuma questão foi associada automaticamente com confiança suficiente; manter para revisão humana.`
  return {
    id:crypto.randomUUID(),
    file,
    relativePath,
    selected:true,
    status:'ready',
    errorMessage:null,
    groupCode:group.code,
    groupTitle:group.title,
    groupHint:group.hint,
    evidenceType:inferred.evidenceType,
    referenceDate:inferred.referenceDate,
    confidence:group.confidence,
    discoveryTags:group.tags,
    suggestedQuestionIds:suggested.map((item)=>item.id),
    suggestedQuestionCodes:suggested.map((item)=>item.code),
    triageSummary,
    extractedPreview:extractedPreview.slice(0,500),
  }
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

const EXPECTATION_DIMENSION_LABELS: Record<string,string> = {
  existence:'Existência', institutionalization:'Institucionalização', execution:'Execução', recurrence:'Recorrência',
  coverage:'Abrangência', control_results:'Controle e resultados', learning_improvement:'Aprendizado e melhoria',
}
const EXPECTATION_NECESSITY_LABELS: Record<string,string> = { required:'Obrigatória', recommended:'Recomendada', alternative:'Alternativa possível' }
const ANSWER_LEVEL_RANK: Record<string,number> = { A:1, B:2, C:3, D:4 }

const FINDING_TYPES: Record<string,string> = {
  strength:'Força', gap:'Lacuna', opportunity:'Oportunidade', risk:'Risco', observation:'Observação',
}

const PRACTICE_STATE_LABELS: Record<string,string> = {
  not_assessed:'Não avaliada',
  exists:'Estruturada / existe',
  applied:'Aplicada',
  recurrent:'Recorrente',
  broad:'Abrangente',
  controlled:'Controlada',
  result_oriented:'Orientada a resultados',
  learning_improvement:'Aprendizado e melhoria',
}
const PRACTICE_STATE_ORDER = ['not_assessed','exists','applied','recurrent','broad','controlled','result_oriented','learning_improvement'] as const

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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showInterviewCreate, setShowInterviewCreate] = useState(false)
  const [showFindingCreate, setShowFindingCreate] = useState(false)
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null)
  const [validationFindingId, setValidationFindingId] = useState<string | null>(null)
  const [validationReason, setValidationReason] = useState('')
  const [showTacticalCreate, setShowTacticalCreate] = useState(false)
  const [activePhaseCode, setActivePhaseCode] = useState('OVERVIEW')
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [actionPlanAllocations, setActionPlanAllocations] = useState<ActionPlanAllocation[]>([])
  const [managedInterviewEvent, setManagedInterviewEvent] = useState<ManagedInterviewEvent | null>(null)
  const [realizationInterviewId, setRealizationInterviewId] = useState<string | null>(null)
  const [realizationForm, setRealizationForm] = useState({ actualStart:'', actualEnd:'', notes:'', changeReason:'Registro da realização da entrevista da Jornada DA.' })
  const [interviewQuestionRecords, setInterviewQuestionRecords] = useState<InterviewQuestionRecord[]>([])
  const [activeInterviewSessionId, setActiveInterviewSessionId] = useState<string | null>(null)
  const [activeInterviewQuestionId, setActiveInterviewQuestionId] = useState<string | null>(null)
  const [activeInterviewBlock, setActiveInterviewBlock] = useState<'GOVERNANCA'|'GESTAO'|''>('')
  const [activeInterviewAxis, setActiveInterviewAxis] = useState('')
  const [showInterviewCapture, setShowInterviewCapture] = useState(false)
  const [interviewQuestionDraft, setInterviewQuestionDraft] = useState<InterviewQuestionDraft>({ observedPractice:'', interviewNotes:'', evidenceCited:'', evidenceRequested:'', gapSummary:'', outputType:'', nextAction:'', executionDate:'' })
  const [interviewSessionNotes, setInterviewSessionNotes] = useState('')
  const [showEvidenceCreate, setShowEvidenceCreate] = useState(false)
  const [showFolderEvidenceScan, setShowFolderEvidenceScan] = useState(false)
  const [folderEvidenceCandidates, setFolderEvidenceCandidates] = useState<FolderEvidenceCandidate[]>([])
  const [folderScanLabel, setFolderScanLabel] = useState('')
  const [folderScanProgress, setFolderScanProgress] = useState({ current:0,total:0,label:'' })
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [evidenceForm, setEvidenceForm] = useState({
    title:'',
    description:'',
    evidenceType:'document',
    sourceType:'internal',
    confidentialityLevel:'internal',
    referenceDate:'',
    interviewId:'',
    externalUrl:'',
    externalKey:'',
    checklistGroupCode:'',
    changeReason:'Evidência identificada durante a Jornada de Diagnóstico Assistido.',
  })
  const [evidenceAssets, setEvidenceAssets] = useState<EvidenceAsset[]>([])
  const [evidenceVersionTexts, setEvidenceVersionTexts] = useState<EvidenceVersionText[]>([])
  const [appliedContractAssetId, setAppliedContractAssetId] = useState<string | null>(null)
  const [evidenceCorrelations, setEvidenceCorrelations] = useState<EvidenceCorrelation[]>([])
  const [evidenceQuestionIntelligence, setEvidenceQuestionIntelligence] = useState<EvidenceQuestionIntelligence[]>([])
  const [intelligenceReviewId, setIntelligenceReviewId] = useState<string | null>(null)
  const [intelligenceReviewNote, setIntelligenceReviewNote] = useState('')
  const [intelligenceEditId, setIntelligenceEditId] = useState<string | null>(null)
  const [intelligenceForm, setIntelligenceForm] = useState({
    evidenceCoverageStatus:'under_analysis',
    practiceState:'not_assessed',
    diagnosticHypothesis:'',
    interviewQuestionSuggestion:'',
    gapDescription:'',
    improvementSuggestion:'',
    confidenceScore:'65',
    reviewNote:'Análise técnica assistida da evidência frente aos requisitos da questão.',
  })
  const [selfAssessmentSnapshots, setSelfAssessmentSnapshots] = useState<SelfAssessmentSnapshot[]>([])
  const [selfAssessmentMetrics, setSelfAssessmentMetrics] = useState<SelfAssessmentMetric[]>([])
  const [questionAlternatives, setQuestionAlternatives] = useState<QuestionAlternative[]>([])
  const [questionEvidenceExpectations, setQuestionEvidenceExpectations] = useState<QuestionEvidenceExpectation[]>([])
  const [interviewQuestionPrompts, setInterviewQuestionPrompts] = useState<InterviewQuestionPrompt[]>([])
  const [selfAssessmentAnswers, setSelfAssessmentAnswers] = useState<SelfAssessmentAnswer[]>([])
  const [catalogs, setCatalogs] = useState<CatalogVersion[]>([])
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Response[]>([])
  const [assessmentDrafts, setAssessmentDrafts] = useState<Record<string,AssessmentDraft>>({})
  const [assessmentConsolidationMode, setAssessmentConsolidationMode] = useState(false)
  const [consolidationBlock, setConsolidationBlock] = useState<'ALL'|'GOVERNANCA'|'GESTAO'>('ALL')
  const [consolidationAxis, setConsolidationAxis] = useState('')
  const [consolidationStatus, setConsolidationStatus] = useState<'all'|'pending'|'draft'|'validated'>('pending')
  const [consolidationQuestionId, setConsolidationQuestionId] = useState<string | null>(null)
  const [consolidationInterviewId, setConsolidationInterviewId] = useState('')
  const [findings, setFindings] = useState<Finding[]>([])
  const [linkedInitiatives, setLinkedInitiatives] = useState<LinkedInitiative[]>([])
  const [journeyInitiative, setJourneyInitiative] = useState<JourneyInitiative | null>(null)
  const [actionFollowup, setActionFollowup] = useState<ActionFollowup[]>([])
  const [journeyEap, setJourneyEap] = useState<JourneyExecutionAction[]>([])
  const [journeyArtifacts, setJourneyArtifacts] = useState<JourneyArtifact[]>([])
  const [artifactDetail, setArtifactDetail] = useState<{
    artifact: JourneyArtifact & { artifact_type_name?: string; category?: string; requires_validation?: boolean }
    versions: Array<Record<string,unknown>>
    validations: Array<Record<string,unknown>>
    evidence_links: Array<Record<string,unknown>>
    audit: Array<Record<string,unknown>>
  } | null>(null)
  const [artifactStatusReason, setArtifactStatusReason] = useState('')
  const [artifactDraftContent, setArtifactDraftContent] = useState('')
  const [artifactVersionSummary, setArtifactVersionSummary] = useState('')
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

  const interviewQuestionFlow = useMemo(() => {
    const blockOf = (question:Question) => question.code.startsWith('GOV-') ? 'GOVERNANCA' : question.code.startsWith('GES-') ? 'GESTAO' : 'OUTRO'
    const rows = questions.map((question,index) => {
      const response = responses.find((item) => item.question_id === question.id)
      const fieldRecords = interviewQuestionRecords.filter((item) => item.question_id === question.id)
      return {
        question,
        index:index + 1,
        block:blockOf(question),
        traversed:Boolean(response?.evaluated_at) || fieldRecords.some((item) => item.status === 'completed'),
        validated:response?.response_status === 'validated',
      }
    })
    const governance = rows.filter((row) => row.block === 'GOVERNANCA')
    const management = rows.filter((row) => row.block === 'GESTAO')
    const current = rows.find((row) => !row.traversed) ?? null
    return {
      rows,
      governance,
      management,
      current,
      traversed:rows.filter((row) => row.traversed).length,
      governanceTraversed:governance.filter((row) => row.traversed).length,
      managementTraversed:management.filter((row) => row.traversed).length,
    }
  }, [questions,responses,interviewQuestionRecords])

  const activeInterviewSession = useMemo(
    () => interviews.find((item) => item.id === activeInterviewSessionId) ?? null,
    [interviews,activeInterviewSessionId],
  )

  const activeInterviewSessionRows = useMemo(() => {
    if (!activeInterviewSessionId) return []
    return interviewQuestionFlow.rows.map((row) => ({
      ...row,
      record:interviewQuestionRecords.find((item) => item.interview_id === activeInterviewSessionId && item.question_id === row.question.id) ?? null,
    }))
  }, [activeInterviewSessionId,interviewQuestionFlow.rows,interviewQuestionRecords])

  const activeInterviewAxisOptions = useMemo(() => {
    if (!activeInterviewBlock) return []
    const values = activeInterviewSessionRows
      .filter((row) => row.block === activeInterviewBlock)
      .map((row) => row.question.axis_name?.trim() || row.question.criterion_name?.trim() || 'Sem eixo')
    return Array.from(new Set(values))
  }, [activeInterviewBlock,activeInterviewSessionRows])

  const visibleInterviewSessionRows = useMemo(() => {
    if (!activeInterviewBlock) return []
    return activeInterviewSessionRows.filter((row) => {
      if (row.block !== activeInterviewBlock) return false
      const axis = row.question.axis_name?.trim() || row.question.criterion_name?.trim() || 'Sem eixo'
      return !activeInterviewAxis || axis === activeInterviewAxis
    })
  }, [activeInterviewBlock,activeInterviewAxis,activeInterviewSessionRows])

  const activeInterviewQuestion = useMemo(
    () => questions.find((item) => item.id === activeInterviewQuestionId) ?? null,
    [questions,activeInterviewQuestionId],
  )

  const activeInterviewQuestionIndex = useMemo(
    () => activeInterviewQuestionId ? visibleInterviewSessionRows.findIndex((item) => item.question.id === activeInterviewQuestionId) : -1,
    [activeInterviewQuestionId,visibleInterviewSessionRows],
  )

  useEffect(() => {
    if (!activeInterviewSessionId || !activeInterviewBlock) {
      setActiveInterviewQuestionId(null)
      return
    }
    if (activeInterviewQuestionId && visibleInterviewSessionRows.some((item) => item.question.id === activeInterviewQuestionId)) return
    const next = visibleInterviewSessionRows.find((item) => !['completed','skipped'].includes(item.record?.status ?? 'pending'))
      ?? visibleInterviewSessionRows[0]
      ?? null
    setActiveInterviewQuestionId(next?.question.id ?? null)
  }, [activeInterviewSessionId,activeInterviewBlock,activeInterviewAxis,activeInterviewQuestionId,visibleInterviewSessionRows])

  useEffect(() => {
    if (!activeInterviewSessionId || !activeInterviewQuestionId) {
      setInterviewQuestionDraft({ observedPractice:'', interviewNotes:'', evidenceCited:'', evidenceRequested:'', gapSummary:'', outputType:'', nextAction:'', executionDate:localDateInputValue() })
      return
    }
    const record = interviewQuestionRecords.find((item) => item.interview_id === activeInterviewSessionId && item.question_id === activeInterviewQuestionId)
    setInterviewQuestionDraft({
      observedPractice:record?.observed_practice ?? '',
      interviewNotes:record?.interview_notes ?? '',
      evidenceCited:record?.evidence_cited ?? '',
      evidenceRequested:record?.evidence_requested ?? '',
      gapSummary:record?.gap_summary ?? '',
      outputType:record?.output_type ?? '',
      nextAction:record?.next_action ?? '',
      executionDate:record?.execution_date ?? localDateInputValue(),
    })
  }, [activeInterviewSessionId,activeInterviewQuestionId,interviewQuestionRecords])

  const findingsByType = useMemo(() => {
    const counts: Record<string, number> = {
      strength:0, gap:0, opportunity:0, risk:0, observation:0,
    }
    findings.forEach((finding) => {
      counts[finding.finding_type] = (counts[finding.finding_type] ?? 0) + 1
    })
    return counts
  }, [findings])

  const organizationalIntelligenceSummary = useMemo(() => {
    const total = evidenceQuestionIntelligence.length
    const underAnalysis = evidenceQuestionIntelligence.filter((item) => ['pending','queued','processing','proposed'].includes(item.analysis_status)).length
    const validated = evidenceQuestionIntelligence.filter((item) => item.analysis_status === 'validated').length
    const rejected = evidenceQuestionIntelligence.filter((item) => item.analysis_status === 'rejected').length
    const converted = evidenceQuestionIntelligence.filter((item) => typeof item.metadata?.finding_id === 'string').length
    const interviewPrompts = evidenceQuestionIntelligence.filter((item) => item.analysis_status !== 'rejected' && Boolean(item.interview_question_suggestion?.trim())).length
    return { total,underAnalysis,validated,rejected,converted,interviewPrompts }
  }, [evidenceQuestionIntelligence])

  const intelligentInterviewAgenda = useMemo(() => {
    const normalizePrompt = (value:string) => value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLocaleLowerCase('pt-BR')
      .replace(/[^a-z0-9]+/g,' ')
      .trim()
    const blockOf = (question:Question | undefined) => question?.code.startsWith('GOV-') ? 'GOVERNANCA' : question?.code.startsWith('GES-') ? 'GESTAO' : 'OUTRO'
    const groups = new Map<string,{
      key:string
      prompt:string
      items:EvidenceQuestionIntelligence[]
      questionIds:Set<string>
      questionCodes:Set<string>
      evidenceIds:Set<string>
      criteria:Set<string>
      block:'GOVERNANCA'|'GESTAO'|'OUTRO'
      maxConfidence:number
      urgency:number
    }>()

    evidenceQuestionIntelligence
      .filter((item) => item.analysis_status === 'proposed' && Boolean(item.interview_question_suggestion?.trim()))
      .forEach((item) => {
        const prompt=item.interview_question_suggestion!.trim()
        const key=normalizePrompt(prompt)
        if (!key) return
        const question=questions.find((row)=>row.id===item.question_id)
        const existing=groups.get(key) ?? {
          key,prompt,items:[],questionIds:new Set<string>(),questionCodes:new Set<string>(),evidenceIds:new Set<string>(),criteria:new Set<string>(),
          block:blockOf(question),maxConfidence:0,urgency:0,
        }
        existing.items.push(item)
        existing.questionIds.add(item.question_id)
        if (question?.code) existing.questionCodes.add(question.code)
        if (question?.criterion_name) existing.criteria.add(question.criterion_name)
        existing.evidenceIds.add(item.evidence_asset_id)
        existing.maxConfidence=Math.max(existing.maxConfidence,Number(item.confidence_score ?? 0))
        existing.urgency+=item.evidence_coverage_status === 'does_not_cover' || item.evidence_coverage_status === 'needs_complement' ? 3
          : item.evidence_coverage_status === 'partially_covers' ? 2 : 1
        groups.set(key,existing)
      })

    const rows=[...groups.values()]
      .map((group) => ({
        ...group,
        firstQuestion:questions
          .filter((question)=>group.questionIds.has(question.id))
          .sort((a,b)=>a.display_order-b.display_order)[0] ?? null,
        affectedQuestions:group.questionIds.size,
        affectedEvidence:group.evidenceIds.size,
        criterionLabels:[...group.criteria].slice(0,3),
        questionCodes:[...group.questionCodes].sort((a,b)=>a.localeCompare(b,'pt-BR',{numeric:true})),
      }))
      .sort((a,b) => {
        const blockOrder={GOVERNANCA:0,GESTAO:1,OUTRO:2}
        if (blockOrder[a.block] !== blockOrder[b.block]) return blockOrder[a.block]-blockOrder[b.block]
        if (b.urgency !== a.urgency) return b.urgency-a.urgency
        if (b.affectedQuestions !== a.affectedQuestions) return b.affectedQuestions-a.affectedQuestions
        return b.maxConfidence-a.maxConfidence
      })

    return {
      rows,
      rawPrompts:evidenceQuestionIntelligence.filter((item)=>item.analysis_status==='proposed' && Boolean(item.interview_question_suggestion?.trim())).length,
      governance:rows.filter((row)=>row.block==='GOVERNANCA'),
      management:rows.filter((row)=>row.block==='GESTAO'),
    }
  }, [evidenceQuestionIntelligence,questions])

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
    const byYear = new Map<number, { diagnosisId:string; label:string; current:boolean }>()

    for (const diagnosis of diagnoses) {
      if (!diagnosis.reference_year) continue
      byYear.set(diagnosis.reference_year,{
        diagnosisId:diagnosis.id,
        label:String(diagnosis.reference_year),
        current:diagnosis.id===selectedId,
      })
    }

    for (const metric of selfAssessmentMetrics) {
      if (!metric.reference_year || metric.comparator_code!=='COOPERATIVA' || !['overall_index','history'].includes(metric.metric_kind)) continue
      if (!Number.isFinite(Number(metric.metric_value)) || Number(metric.metric_value) < 0 || Number(metric.metric_value) > 100) continue
      const current = byYear.get(metric.reference_year) ?? {
        diagnosisId:`metric-history-${metric.reference_year}`,
        label:String(metric.reference_year),
        current:false,
      }
      if (selected?.reference_year===metric.reference_year) current.current=true
      byYear.set(metric.reference_year,current)
    }

    return [...byYear.entries()]
      .sort(([yearA],[yearB])=>yearA-yearB)
      .map(([,item])=>item)
  }, [diagnoses,selectedId,selected?.reference_year,selfAssessmentMetrics])

  const evolutionBenchmarks = useMemo(() => {
    const latest = new Map<string,SelfAssessmentMetric>()
    selfAssessmentMetrics.filter((metric) => metric.metric_kind === 'benchmark'
      && Number.isFinite(Number(metric.metric_value))
      && ['BRASIL','RAMO_BRASIL'].includes(metric.comparator_code.toUpperCase()))
      .sort((a,b) => (a.reference_year ?? 0) - (b.reference_year ?? 0))
      .forEach((metric) => latest.set(metric.block_code + ':' + metric.comparator_code,metric))
    return [...latest.values()]
  },[selfAssessmentMetrics])

  const evolutionBenchmarkColor = (benchmark:SelfAssessmentMetric) => {
    const comparator = benchmark.comparator_code.toUpperCase()
    if (benchmark.block_code === 'GOVERNANCA') return comparator.includes('RAMO') ? '#b7791f' : '#0f766e'
    return comparator.includes('RAMO') ? '#dc2626' : '#7c3aed'
  }

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
        return { ...evolutionChartPoint(index,score),score,year:Number(cycle.label) }
      }),
    })))

  const evolutionEndLabels = evolutionBlockSeries.flatMap((series) => {
    const visible=series.values.filter((point)=>point.score!=null)
    const point=visible.at(-1)
    return point ? [{ ...series,point }] : []
  })

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


  const questionBlockCode = (question:Question) =>
    question.code.startsWith('GOV-') ? 'GOVERNANCA' : question.code.startsWith('GES-') ? 'GESTAO' : 'OUTRO'

  const assessmentCloseout = useMemo(() => {
    const evaluated = responses.filter((item) => Boolean(item.evaluated_at)).length
    const validated = responses.filter((item) => item.response_status === 'validated' && Boolean(item.validated_at)).length
    const governanceQuestions = questions.filter((item) => questionBlockCode(item) === 'GOVERNANCA')
    const managementQuestions = questions.filter((item) => questionBlockCode(item) === 'GESTAO')
    const governanceEvaluated = governanceQuestions.filter((question) => responses.some((item) => item.question_id === question.id && Boolean(item.evaluated_at))).length
    const managementEvaluated = managementQuestions.filter((question) => responses.some((item) => item.question_id === question.id && Boolean(item.evaluated_at))).length
    const completedInterviews = interviews.filter((item) => ['completed','validated'].includes(item.status)).length
    return {
      total:questions.length,
      evaluated,
      validated,
      pending:Math.max(0,questions.length-evaluated),
      governanceTotal:governanceQuestions.length,
      governanceEvaluated,
      managementTotal:managementQuestions.length,
      managementEvaluated,
      completedInterviews,
    }
  },[questions,responses,interviews])

  const consolidationAxisOptions = useMemo(() => {
    const rows=questions.filter((question)=>consolidationBlock==='ALL' || questionBlockCode(question)===consolidationBlock)
    return Array.from(new Set(rows.map((question)=>question.axis_name?.trim() || question.criterion_name?.trim() || 'Sem eixo')))
  },[questions,consolidationBlock])

  const consolidationQuestions = useMemo(() => {
    return questions.filter((question) => {
      if (consolidationBlock!=='ALL' && questionBlockCode(question)!==consolidationBlock) return false
      const axis=question.axis_name?.trim() || question.criterion_name?.trim() || 'Sem eixo'
      if (consolidationAxis && axis!==consolidationAxis) return false
      const response=responses.find((item)=>item.question_id===question.id)
      if (consolidationStatus==='pending') return !response?.evaluated_at
      if (consolidationStatus==='draft') return Boolean(response?.evaluated_at) && response?.response_status!=='validated'
      if (consolidationStatus==='validated') return response?.response_status==='validated'
      return true
    }).sort((a,b)=>a.display_order-b.display_order)
  },[questions,responses,consolidationBlock,consolidationAxis,consolidationStatus])

  const currentConsolidationQuestion = useMemo(() => {
    if (consolidationQuestionId) {
      const selectedQuestion=consolidationQuestions.find((item)=>item.id===consolidationQuestionId)
      if (selectedQuestion) return selectedQuestion
    }
    return consolidationQuestions[0] ?? null
  },[consolidationQuestions,consolidationQuestionId])

  const suggestedInterviewForQuestion = (question:Question | null) => {
    if (!question) return null
    const existingResponse=responses.find((item)=>item.question_id===question.id)
    const existingInterviewId=typeof existingResponse?.metadata?.last_interview_id==='string'
      ? existingResponse.metadata.last_interview_id
      : null
    if (existingInterviewId) {
      const existing=interviews.find((item)=>item.id===existingInterviewId)
      if (existing) return existing
    }
    const normalizedInterviews=[...interviews].sort((a,b)=>(a.scheduled_start ?? '').localeCompare(b.scheduled_start ?? ''))
    if (question.code.startsWith('GOV-')) {
      return normalizedInterviews.find((item)=>/governan/i.test(item.title+' '+item.code))
        ?? normalizedInterviews[0]
        ?? null
    }
    const number=Number(question.code.match(/Q(\d+)/i)?.[1] ?? 0)
    const target=/gest/i
    const management=normalizedInterviews.filter((item)=>target.test(item.title+' '+item.code))
    if (number>=31) return management.find((item)=>/iii|3\b/i.test(item.title+' '+item.code)) ?? management[2] ?? normalizedInterviews.at(-1) ?? null
    if (number>=16) return management.find((item)=>/ii|2\b/i.test(item.title+' '+item.code)) ?? management[1] ?? management[0] ?? null
    return management.find((item)=>/\bi\b|1\b/i.test(item.title+' '+item.code)) ?? management[0] ?? normalizedInterviews[1] ?? null
  }


  useEffect(() => {
    if (!assessmentConsolidationMode) return
    const current=currentConsolidationQuestion
    if (!current) {
      setConsolidationQuestionId(null)
      setConsolidationInterviewId('')
      return
    }
    if (consolidationQuestionId !== current.id) setConsolidationQuestionId(current.id)
    const response=responses.find((item)=>item.question_id===current.id)
    const existingInterviewId=typeof response?.metadata?.last_interview_id==='string' ? response.metadata.last_interview_id : ''
    const suggested=suggestedInterviewForQuestion(current)
    setConsolidationInterviewId(existingInterviewId || suggested?.id || '')
  },[assessmentConsolidationMode,currentConsolidationQuestion?.id,consolidationQuestionId,responses,interviews])

  const phaseReadiness = useMemo(() => {
    const recognizedContract = evidenceAssets.some((asset) => {
      const version = evidenceVersionTexts.find((item) => item.evidence_asset_id === asset.id)
      return Boolean(version?.extracted_text && parseContractIntakeProposal(asset,version.extracted_text,props.organizationName))
    })
    const completedInterviews = interviews.filter((item) => ['completed','validated'].includes(item.status)).length
    const actionableFindings = findings.filter((item) => item.finding_type !== 'strength' && item.status !== 'dismissed')
    const recommendations = actionableFindings.filter((item) => Boolean(item.recommendation?.trim()))
    const validatedRecommendations = recommendations.filter((item) => ['accepted','in_action','resolved'].includes(item.status))
    const approvedFindings = findings.filter((item) => ['accepted','in_action','resolved'].includes(item.status))
    const allocatedFindingIds = new Set(actionPlanAllocations.map((item) => item.finding_id))
    const linkedFindingIds = new Set(linkedInitiatives.map((item) => item.sourceFindingId))
    const returnValidation = journeyArtifacts.find((item) => item.artifact_code === 'MF10-A02')
    const items = {
      'DA-00':[
        { label:'Catálogo metodológico definido', ok:Boolean(selected?.catalog_version_id), critical:true },
        { label:'Período contratado configurado', ok:Boolean(selected?.started_on && selected?.planned_end_on), critical:true },
        { label:'Líder SPARKOOP definido', ok:Boolean(selected?.lead_user_id), critical:true },
        { label:'Linha de base contratual ratificada', ok:!recognizedContract || selected?.metadata?.contractual_baseline_status === 'validated', critical:true },
        { label:'Agenda contratual materializada', ok:!recognizedContract || interviews.length > 0, critical:false },
        { label:'Autoavaliação integrada', ok:selfAssessmentSnapshots.length > 0, critical:false },
        { label:'Fontes/evidências de entrada correlacionadas', ok:metrics.evidence > 0, critical:false },
      ],
      'DA-01':[
        { label:'Questões do instrumento preparadas', ok:interviewQuestionFlow.rows.length > 0, critical:true },
        { label:'Governança percorrida integralmente', ok:interviewQuestionFlow.governance.length > 0 && interviewQuestionFlow.governanceTraversed === interviewQuestionFlow.governance.length, critical:true },
        { label:'Gestão percorrida integralmente', ok:interviewQuestionFlow.management.length > 0 && interviewQuestionFlow.managementTraversed === interviewQuestionFlow.management.length, critical:true },
        { label:'Avaliações registradas ('+assessmentCloseout.evaluated+'/'+assessmentCloseout.total+')', ok:assessmentCloseout.total > 0 && assessmentCloseout.evaluated === assessmentCloseout.total, critical:true },
        { label:'Avaliações validadas ('+assessmentCloseout.validated+'/'+assessmentCloseout.total+')', ok:assessmentCloseout.total > 0 && assessmentCloseout.validated === assessmentCloseout.total, critical:true },
        { label:'Ao menos uma entrevista realizada', ok:completedInterviews > 0, critical:true },
        { label:'Hipóteses propostas revisadas', ok:evidenceQuestionIntelligence.every((item) => item.analysis_status !== 'proposed'), critical:true },
        { label:'Fila de inteligência sem processamento pendente', ok:evidenceQuestionIntelligence.every((item) => !['queued','processing'].includes(item.analysis_status)), critical:false },
        { label:'Achados rastreáveis registrados', ok:findings.length > 0, critical:false },
      ],
      'DA-02':[
        { label:'Achados acionáveis com recomendação', ok:actionableFindings.length === recommendations.length, critical:true },
        { label:'Recomendações deliberadas/aceitas', ok:recommendations.length > 0 && recommendations.length === validatedRecommendations.length, critical:true },
        { label:'Priorização 80×20 iniciada', ok:actionPlanAllocations.some((item) => item.cycle_number === 1), critical:false },
      ],
      'DA-03':[
        { label:'Recomendações aprovadas distribuídas nos ciclos', ok:approvedFindings.length > 0 && approvedFindings.every((item) => allocatedFindingIds.has(item.id)), critical:true },
        { label:'Ações priorizadas convertidas em iniciativas', ok:approvedFindings.length > 0 && approvedFindings.every((item) => linkedFindingIds.has(item.id)), critical:true },
        { label:'Registro da devolutiva validado', ok:Boolean(returnValidation && ['validated','validated_with_reservations'].includes(returnValidation.status)), critical:true },
        { label:'Governança de follow-up ativada', ok:actionFollowup.length > 0, critical:false },
      ],
    }
    const byPhase = Object.fromEntries(Object.entries(items).map(([code,rows]) => [
      code,
      {
        items:rows,
        ready:rows.filter((item) => item.critical).every((item) => item.ok),
        completed:rows.filter((item) => item.ok).length,
        total:rows.length,
      },
    ])) as Record<string,{items:Array<{label:string;ok:boolean;critical:boolean}>;ready:boolean;completed:number;total:number}>
    return byPhase
  }, [actionFollowup.length, actionPlanAllocations, assessmentCloseout, evidenceAssets, evidenceQuestionIntelligence, evidenceVersionTexts, findings, interviews, interviewQuestionFlow, journeyArtifacts, linkedInitiatives, metrics.evidence, props.organizationName, selected?.catalog_version_id, selected?.lead_user_id, selected?.metadata, selected?.planned_end_on, selected?.started_on, selfAssessmentSnapshots.length])

  const selfAssessmentRadar = useMemo(() => {
    const metricsFor = (block: 'GOVERNANCA' | 'GESTAO') => selfAssessmentMetrics
      .filter((item) => item.block_code === block && item.metric_kind === 'criterion' && item.comparator_code === 'COOPERATIVA')
      .sort((a,b) => {
        const orderA = Number(a.metadata?.display_order ?? Number.MAX_SAFE_INTEGER)
        const orderB = Number(b.metadata?.display_order ?? Number.MAX_SAFE_INTEGER)
        return orderA === orderB ? a.metric_code.localeCompare(b.metric_code,'pt-BR') : orderA - orderB
      })
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
      const radius = 78 * (value / 100)
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
      setShowFolderEvidenceScan(false)
      setShowFindingCreate(false)
      setEditingFindingId(null)
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
      .select('id,code,name,description,diagnosis_type,catalog_version_id,reference_year,status,current_phase_code,current_megaphase_code,progress,started_on,planned_end_on,lead_user_id,execution_initiative_id,metadata,created_at,created_by' as never)
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
        'get_organization_module_users' as never,
        {
          target_organization_id:props.organizationId,
          target_module_code:'SK-DA',
        } as never,
      )
      if (usersError) {
        setOrganizationUsers([])
        return
      }
      const unique = new Map<string, OrganizationUser>()
      for (const row of (data ?? []) as unknown as OrganizationUser[]) {
        if (!row.user_active) continue
        if (row.membership_status !== 'active') continue
        if (row.module_code !== 'SK-DA') continue
        if (row.module_role_status !== 'active') continue
        const existing = unique.get(row.user_id)
        if (!existing || (!existing.user_display_name && row.user_display_name)) unique.set(row.user_id, row)
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
          .select('id,code,axis_name,criterion_name,question_text,guidance,expected_evidence,display_order' as never)
          .eq('catalog_version_id', selected.catalog_version_id)
          .order('display_order', { ascending:true }),
        supabase
          .from('skda_responses' as never)
          .select('id,question_id,classification,response_status,answer_text,rationale,confidence_level,maturity_level,score,declared_alternative_id,evidenced_alternative_id,validated_alternative_id,evaluated_at,validated_at,metadata' as never)
          .eq('diagnosis_id', selected.id),
      ])
      const loadedQuestions = (questionsResult.data ?? []) as unknown as Question[]
      loadedQuestions.sort((a,b) => {
        const blockRank = (item:Question) => item.code.startsWith('GOV-') ? 0 : item.code.startsWith('GES-') ? 1 : 2
        const rankDiff = blockRank(a) - blockRank(b)
        return rankDiff !== 0 ? rankDiff : a.display_order - b.display_order
      })
      setQuestions(loadedQuestions)
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
      const aaAnswer = selfAssessmentAnswers.find((item) => item.question_id === question.id)
      next[question.id] = {
        classification:response?.classification ?? (aaAnswer ? 'reported' : 'not_evaluated'),
        answerText:response?.answer_text ?? aaAnswer?.declared_text ?? '',
        rationale:response?.rationale ?? '',
        confidenceLevel:response?.confidence_level ?? 'not_assessed',
        alternativeId:response?.validated_alternative_id ?? response?.evidenced_alternative_id ?? aaAnswer?.declared_alternative_id ?? '',
      }
    })
    setAssessmentDrafts(next)
  }, [questions, responses, selfAssessmentAnswers])

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
          .select('id,evidence_asset_id,usage_type,validation_status,metadata' as never)
          .eq('diagnosis_id', selectedId),
        supabase
          .from('skda_evidence_question_intelligence' as never)
          .select('id,evidence_asset_id,question_id,document_intake_status,evidence_coverage_status,practice_state,relevance_score,adequacy_score,sufficiency_score,reliability_score,actuality_score,coverage_score,confidence_score,gap_description,complement_needed,improvement_suggestion,interview_question_suggestion,self_assessment_guidance,diagnostic_hypothesis,analysis_status,source_excerpt,source_locator,metadata' as never)
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
      if (questions.length === 0) {
        setQuestionAlternatives([])
        setSelfAssessmentAnswers([])
        return
      }
      const questionIds = questions.map((question) => question.id)
      const snapshotIds = selfAssessmentSnapshots.map((snapshot) => snapshot.id)
      const [alternativesResult, answersResult] = await Promise.all([
        supabase
          .from('skda_question_alternatives' as never)
          .select('id,question_id,code,alternative_text,progression_order,score_value' as never)
          .in('question_id', questionIds)
          .order('progression_order', { ascending:true }),
        snapshotIds.length > 0
          ? supabase
              .from('skda_self_assessment_answers' as never)
              .select('id,snapshot_id,question_id,declared_alternative_id,declared_code,declared_text,rationale,metadata' as never)
              .in('snapshot_id', snapshotIds)
          : Promise.resolve({ data:[], error:null }),
      ])
      setQuestionAlternatives((alternativesResult.data ?? []) as unknown as QuestionAlternative[])
      setSelfAssessmentAnswers((answersResult.data ?? []) as unknown as SelfAssessmentAnswer[])
    }
    void run()
  }, [questions, selfAssessmentSnapshots])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) { setQuestionEvidenceExpectations([]); return }
      const { data, error: expectationsError } = await supabase.rpc('list_skda_question_evidence_expectations' as never, {
        target_organization_id:props.organizationId,
        target_diagnosis_id:selectedId,
      } as never)
      if (expectationsError) {
        setQuestionEvidenceExpectations([])
        return
      }
      setQuestionEvidenceExpectations((data ?? []) as unknown as QuestionEvidenceExpectation[])
    }
    void run()
  }, [selectedId, props.organizationId])

  useEffect(() => {
    const run = async () => {
      if (!selectedId) { setInterviewQuestionPrompts([]); return }
      const { data, error: promptError } = await supabase.rpc('list_skda_interview_question_prompts' as never, {
        target_organization_id:props.organizationId,
        target_diagnosis_id:selectedId,
      } as never)
      if (promptError) {
        setInterviewQuestionPrompts([])
        return
      }
      setInterviewQuestionPrompts((data ?? []) as unknown as InterviewQuestionPrompt[])
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
      if (!selectedId) { setInterviewQuestionRecords([]); return }
      const { data } = await supabase
        .from('skda_interview_question_records' as never)
        .select('id,interview_id,question_id,sequence_order,status,observed_practice,interview_notes,evidence_cited,evidence_requested,gap_summary,output_type,next_action,execution_date,started_at,completed_at,metadata' as never)
        .eq('diagnosis_id', selectedId)
        .order('sequence_order', { ascending:true })
      setInterviewQuestionRecords((data ?? []) as unknown as InterviewQuestionRecord[])
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
      const { data } = await supabase
        .from('skda_action_followup_longitudinal' as never)
        .select('diagnosis_id,reference_year,finding_id,finding_title,cycle_number,initiative_id,initiative_name,initiative_status,initiative_progress,followup_state,execution_completed' as never)
        .eq('organization_id', props.organizationId)
        .order('reference_year', { ascending:true, nullsFirst:false })
      setActionFollowup((data ?? []) as unknown as ActionFollowup[])
    }
    void run()
  }, [props.organizationId, selectedId, responses, findings, actionPlanAllocations, linkedInitiatives])

  useEffect(() => {
    const run = async () => {
      if (!selected?.execution_initiative_id) {
        setJourneyInitiative(null)
        setJourneyEap([])
        setJourneyArtifacts([])
        return
      }
      const [initiativeResult, actionsResult, artifactsResult] = await Promise.all([
        supabase
          .from('sparks_initiatives' as never)
          .select('id,code,name,description,initiative_class,status,progress,start_date,target_end_date,baseline_start_date,baseline_target_end_date,priority,criticality,source_module_code' as never)
          .eq('organization_id', props.organizationId)
          .eq('id', selected.execution_initiative_id)
          .maybeSingle(),
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
      setJourneyInitiative((initiativeResult.data ?? null) as unknown as JourneyInitiative | null)
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
        supabase.from('skda_evidence_correlations' as never).select('evidence_asset_id' as never).eq('diagnosis_id',selectedId),
        supabase.from('skda_findings' as never).select('id' as never,{count:'exact',head:true}).eq('diagnosis_id',selectedId),
      ])
      const distinctEvidence = new Set(((result[2].data ?? []) as unknown as Array<{evidence_asset_id:string}>).map((item) => item.evidence_asset_id)).size
      setMetrics({
        responses:result[0].count ?? 0, interviews:result[1].count ?? 0,
        evidence:distinctEvidence, findings:result[3].count ?? 0,
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
    if (openingForm.leadUserId && !organizationUsers.some((user) => user.user_id === openingForm.leadUserId)) {
      setError('Selecione como Líder SPARKOOP um usuário ativo associado à Organização.')
      return
    }
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
      diagnostic_sequence:['GOVERNANCA','GESTAO'],
      contract_period_constraint:openingForm.startedOn && openingForm.plannedEndOn
        ? { started_on:openingForm.startedOn, planned_end_on:openingForm.plannedEndOn }
        : null,
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

  const advanceJourneyPhase = async (phaseCode:string) => {
    if (!selected || !canManage) return
    const currentFormalPhase=normalizeJourneyPhaseCode(selected.current_phase_code)
    if (currentFormalPhase !== phaseCode) {
      setError(`A fase formal atual é ${currentFormalPhase}. Regularize as fases na sequência antes de avançar ${phaseCode}.`)
      return
    }
    const readiness = phaseReadiness[phaseCode]
    if (!readiness?.ready) {
      setError('Ainda existem requisitos críticos pendentes para concluir esta fase.')
      return
    }
    const flow = ['DA-00','DA-01','DA-02','DA-03']
    const index = flow.indexOf(phaseCode)
    if (index < 0) return
    const completing = phaseCode === 'DA-03'
    const nextPhase = completing ? 'DA-03' : flow[index + 1]
    const nextMegaphase = completing ? 'MF10' : nextPhase === 'DA-01' ? 'MF4' : nextPhase === 'DA-02' ? 'MF8' : nextPhase === 'DA-03' ? 'MF9' : 'MF0'
    const nextProgress = completing ? 100 : [25,50,75][index] ?? Number(selected.progress)
    const nextStatus = completing ? 'completed' : nextPhase === 'DA-01' ? 'interviews' : 'validation'
    const nextMetadata = {
      ...(selected.metadata ?? {}),
      phase_history:[
        ...(Array.isArray(selected.metadata?.phase_history) ? selected.metadata.phase_history : []),
        {
          phase_code:phaseCode,
          completed_at:new Date().toISOString(),
          readiness:readiness.items.map((item) => ({ label:item.label,ok:item.ok,critical:item.critical })),
        },
      ],
    }
    setSaving(true)
    setError('')
    const { error: phaseError } = await supabase
      .from('skda_diagnoses' as never)
      .update({
        current_phase_code:nextPhase,
        current_megaphase_code:nextMegaphase,
        progress:nextProgress,
        status:nextStatus,
        completed_at:completing ? new Date().toISOString() : null,
        metadata:nextMetadata,
      } as never)
      .eq('id',selected.id)
      .eq('organization_id',props.organizationId)
    setSaving(false)
    if (phaseError) {
      setError(phaseError.message)
      return
    }
    await loadDiagnoses()
    setActivePhaseCode(completing ? 'OVERVIEW' : nextPhase)
  }

  const transitionJourneyStage = async (stage:JourneyExecutionAction, parent:JourneyExecutionAction | undefined, targetStatus:'in_progress'|'completed') => {
    if (!canManage) return
    setSaving(true)
    setError('')
    try {
      if (targetStatus === 'in_progress' && parent?.status === 'planned') {
        const { error: parentStartError } = await supabase.rpc(
          'transition_sparks_initiative_action_lifecycle' as never,
          {
            target_action_id:parent.id,
            target_status:'in_progress',
            change_reason:`Início da MegaFase ${parent.code} pela execução de sua primeira etapa na Jornada DA.`,
          } as never,
        )
        if (parentStartError) throw parentStartError
      }
      const { error: stageError } = await supabase.rpc(
        'transition_sparks_initiative_action_lifecycle' as never,
        {
          target_action_id:stage.id,
          target_status:targetStatus,
          change_reason:targetStatus === 'completed'
            ? `Conclusão da etapa ${stage.code} da Jornada DA após execução das atividades previstas.`
            : `Início da etapa ${stage.code} da Jornada DA pelo responsável autorizado.`,
        } as never,
      )
      if (stageError) throw stageError
      const nextEap = journeyEap.map((item) => {
        if (item.id === stage.id) return { ...item,status:targetStatus,progress:targetStatus === 'completed' ? 100 : item.progress }
        if (item.id === parent?.id && targetStatus === 'in_progress' && item.status === 'planned') return { ...item,status:'in_progress' }
        return item
      })
      if (targetStatus === 'completed' && parent) {
        const siblings = nextEap.filter((item) => item.parent_action_id === parent.id)
        if (siblings.length > 0 && siblings.every((item) => item.status === 'completed') && parent.status !== 'completed') {
          const { error: parentCompleteError } = await supabase.rpc(
            'transition_sparks_initiative_action_lifecycle' as never,
            {
              target_action_id:parent.id,
              target_status:'completed',
              change_reason:`Conclusão da MegaFase ${parent.code} após todas as suas etapas serem concluídas na Jornada DA.`,
            } as never,
          )
          if (parentCompleteError) throw parentCompleteError
          setJourneyEap(nextEap.map((item) => item.id === parent.id ? { ...item,status:'completed',progress:100 } : item))
          return
        }
      }
      setJourneyEap(nextEap)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível atualizar a execução da etapa.')
    } finally {
      setSaving(false)
    }
  }


  const buildAssistedArtifactDraft = (artifact:JourneyArtifact) => {
    if (!selected) return ''
    const metadata=selected.metadata ?? {}
    const lead=organizationUsers.find((user)=>user.user_id===selected.lead_user_id)
    const scope=typeof metadata.scope_statement === 'string' && metadata.scope_statement.trim()
      ? metadata.scope_statement.trim()
      : selected.description || 'Conduzir a Jornada de Diagnóstico Assistido do ciclo de referência.'
    const methodology=typeof metadata.methodology_notes === 'string' && metadata.methodology_notes.trim()
      ? metadata.methodology_notes.trim()
      : 'Aplicar o Diagnóstico Assistido com base no referencial vigente, evidências, entrevistas, validação humana e rastreabilidade das decisões.'
    const contractedHours=typeof metadata.contracted_hours === 'number' || typeof metadata.contracted_hours === 'string'
      ? String(metadata.contracted_hours)
      : 'não informada'
    const formatDate=(value:string|null|undefined) => value ? new Date(value+'T12:00:00').toLocaleDateString('pt-BR') : 'não informada'
    const initiativeLabel=journeyInitiative
      ? `${journeyInitiative.code} — ${journeyInitiative.name}`
      : selected.execution_initiative_id
        ? `Iniciativa transversal vinculada (${selected.execution_initiative_id})`
        : 'Iniciativa transversal ainda não vinculada'
    const macroActions=journeyEap.filter((item)=>!item.parent_action_id && item.code===artifact.macrophase_code)
    const macroAction=macroActions[0]
    const common=[
      `# ${artifact.title}`,
      '',
      '> Rascunho assistido pelo SPARKs DA a partir das informações já registradas na Jornada. Revisar e adequar antes de criar a versão governada.',
      '',
      '## Identificação',
      `- Organização: ${props.organizationName} (${props.organizationCode})`,
      `- Jornada: ${selected.code} — ${selected.name}`,
      `- Ciclo de referência: ${selected.reference_year ?? 'não informado'}`,
      `- MegaFase: ${artifact.macrophase_code ?? 'não informada'}`,
      `- Artefato: ${artifact.artifact_code}`,
      `- Iniciativa de execução: ${initiativeLabel}`,
      `- Líder SPARKOOP: ${lead?.user_display_name || lead?.user_email || 'não definido'}`,
      `- Período vigente: ${formatDate(selected.started_on)} a ${formatDate(selected.planned_end_on)}`,
      `- Carga contratada registrada: ${contractedHours}h`,
      '',
      '## Finalidade do artefato',
      artifact.purpose || 'Entregável metodológico governado da Jornada de Diagnóstico Assistido.',
      '',
      '## Escopo da Jornada',
      scope,
      '',
      '## Premissas metodológicas',
      methodology,
    ]

    if (artifact.artifact_code === 'MF0-A01') {
      return [
        ...common,
        '',
        '## Termo de Abertura da Jornada',
        '',
        '### 1. Autorização e enquadramento',
        `A Jornada ${selected.code} da ${props.organizationName} está constituída no SPARKs DA e vinculada à iniciativa transversal ${initiativeLabel}. A fonte autorizadora e a linha de base contratual devem permanecer rastreáveis às evidências e registros de abertura já associados à Jornada.`,
        '',
        '### 2. Objetivo',
        scope,
        '',
        '### 3. Entregas esperadas',
        '- Preparação e abertura governada da Jornada;',
        '- consolidação do intake, histórico, Autoavaliação e evidências;',
        '- entrevistas orientadas às lacunas de Governança e Gestão;',
        '- avaliação de suficiência das evidências, PDCL e maturidade;',
        '- consolidação de achados, forças, riscos, oportunidades e lacunas;',
        '- priorização 80/20 e Plano de Ação por ciclos;',
        '- devolutiva executiva, decisões e próximos passos rastreáveis.',
        '',
        '### 4. Governança e papéis',
        `- Líder da Jornada: ${lead?.user_display_name || lead?.user_email || 'a definir'}.`,
        '- Organização: disponibilizar interlocutores, documentos, evidências e validações necessárias.',
        '- SPARKOOP: conduzir o método, organizar evidências, registrar hipóteses/achados e preservar a rastreabilidade.',
        '- Validações relevantes: dependem de decisão humana explícita; geração automática de conteúdo não equivale a aprovação.',
        '',
        '### 5. Estrutura de execução',
        `A execução é representada pela iniciativa ${initiativeLabel}, do tipo Projeto, com EAP baseada nas MegaFases MF0 a MF10.`,
        `MegaFase corrente: ${selected.current_megaphase_code || 'MF0'}.`,
        macroAction ? `Situação da MegaFase de abertura: ${macroAction.status}; plano vigente ${formatDate(macroAction.planned_start_date)} a ${formatDate(macroAction.planned_due_date)}.` : 'MegaFase de abertura ainda sem ação operacional carregada.',
        '',
        '### 6. Período e carga',
        `- Início: ${formatDate(selected.started_on)}.`,
        `- Término planejado: ${formatDate(selected.planned_end_on)}.`,
        `- Carga contratada registrada: ${contractedHours}h.`,
        '',
        '### 7. Critérios de condução',
        '- O DA é processo de desenvolvimento organizacional e aprendizagem, não auditoria.',
        '- Autoavaliação é declaração inicial e não substitui validação por evidências.',
        '- Documento não comprova, isoladamente, execução, recorrência, resultado ou melhoria.',
        '- Hipóteses devem permanecer separadas de achados formalizados.',
        '- Impacto potencial em pontuação é estimativa condicionada às evidências e nunca garantia.',
        '',
        '### 8. Riscos e premissas iniciais',
        '- disponibilidade dos participantes e das evidências;',
        '- qualidade, vigência e suficiência das fontes apresentadas;',
        '- necessidade de aprofundamentos adicionais quando houver contradições ou lacunas;',
        '- execução posterior das ações priorizadas como condição para evolução sustentável.',
        '',
        '### 9. Aprovação',
        'Este Termo permanece em preparação até validação humana explícita pelos responsáveis definidos na governança da Jornada.',
      ].join('\n')
    }

    return [
      ...common,
      '',
      '## Situação atual relacionada',
      `- Evidências ativas no Core vinculadas à Jornada: ${evidenceAssets.length}.`,
      `- Entrevistas registradas: ${interviews.length}.`,
      `- Achados formalizados: ${findings.length}.`,
      `- Questões do catálogo: ${questions.length}.`,
      macroAction ? `- Ação da MegaFase: ${macroAction.code} — ${macroAction.name}; situação ${macroAction.status}; avanço ${Math.round(Number(macroAction.progress || 0))}%.` : '- Ação da MegaFase: ainda não identificada.',
      '',
      '## Conteúdo proposto',
      'Consolidar neste artefato as informações já registradas no SPARKs DA que atendem à sua finalidade, preservando fonte, situação de validação, pendências e decisões humanas.',
      '',
      '## Pontos para revisão humana',
      '- confirmar aderência do conteúdo às evidências efetivamente disponíveis;',
      '- completar decisões, responsáveis, prazos ou ressalvas ainda não registrados;',
      '- validar antes de avançar o estado de governança do entregável.',
    ].join('\n')
  }

  const openJourneyArtifact = async (artifact:JourneyArtifact) => {
    setSaving(true)
    setError('')
    const { data, error: detailError } = await supabase.rpc(
      'get_methodology_artifact_detail' as never,
      { target_artifact_id:artifact.id } as never,
    )
    setSaving(false)
    if (detailError) {
      setError(detailError.message)
      return
    }
    const detail = data as unknown as {
      artifact: JourneyArtifact & { artifact_type_name?: string; category?: string; requires_validation?: boolean }
      versions?: Array<Record<string,unknown>>
      validations?: Array<Record<string,unknown>>
      evidence_links?: Array<Record<string,unknown>>
      audit?: Array<Record<string,unknown>>
    }
    const versions = detail.versions ?? []
    setArtifactDetail({
      artifact:detail.artifact,
      versions,
      validations:detail.validations ?? [],
      evidence_links:detail.evidence_links ?? [],
      audit:detail.audit ?? [],
    })
    const latest = versions[0]
    const latestContent = latest && typeof latest.content_json === 'object' && latest.content_json
      ? (latest.content_json as Record<string,unknown>).content
      : ''
    const existingContent=typeof latestContent === 'string' ? latestContent.trim() : ''
    setArtifactDraftContent(existingContent || buildAssistedArtifactDraft(detail.artifact))
    setArtifactVersionSummary(existingContent ? '' : `Versão inicial assistida de ${detail.artifact.title}, estruturada a partir dos registros vigentes da Jornada.`)
    setArtifactStatusReason(existingContent ? '' : `Conteúdo inicial preparado automaticamente a partir dos dados governados da Jornada para revisão e validação humana.`)
  }

  const createJourneyArtifactVersion = async () => {
    if (!artifactDetail) return
    if (artifactDraftContent.trim().length < 10 || artifactVersionSummary.trim().length < 10) {
      setError('Informe o conteúdo do entregável e um resumo da versão com pelo menos 10 caracteres.')
      return
    }
    setSaving(true)
    setError('')
    const { error: versionError } = await supabase.rpc(
      'create_methodology_artifact_text_version' as never,
      {
        target_artifact_id:artifactDetail.artifact.id,
        target_content_text:artifactDraftContent.trim(),
        target_change_summary:artifactVersionSummary.trim(),
      } as never,
    )
    setSaving(false)
    if (versionError) {
      setError(versionError.message)
      return
    }
    setJourneyArtifacts((current) => current.map((item) => item.id === artifactDetail.artifact.id
      ? { ...item,current_version_number:(item.current_version_number || 0) + 1,status:item.status === 'planned' ? 'in_preparation' : item.status }
      : item))
    await openJourneyArtifact({
      ...artifactDetail.artifact,
      current_version_number:(artifactDetail.artifact.current_version_number || 0) + 1,
      status:artifactDetail.artifact.status === 'planned' ? 'in_preparation' : artifactDetail.artifact.status,
    })
  }

  const updateJourneyArtifactStatus = async (targetStatus:string) => {
    if (!artifactDetail || artifactStatusReason.trim().length < 10) {
      setError('Informe uma justificativa com pelo menos 10 caracteres para alterar a situação do entregável.')
      return
    }
    if (['in_review','submitted','validated','validated_with_reservations'].includes(targetStatus) && artifactDetail.versions.length === 0) {
      setError('Crie ao menos uma versão governada do entregável antes de encaminhá-lo para revisão, submissão ou validação.')
      return
    }
    const allowedTransitions:Record<string,string[]> = {
      planned:['in_preparation'],
      in_preparation:['in_review'],
      in_review:['in_preparation','submitted'],
      submitted:['in_review','validated','validated_with_reservations'],
      validated_with_reservations:['in_preparation','validated'],
      validated:['in_preparation'],
    }
    if (!(allowedTransitions[artifactDetail.artifact.status] ?? []).includes(targetStatus)) {
      setError('A mudança solicitada não pertence ao fluxo governado do entregável.')
      return
    }
    setSaving(true)
    setError('')
    const { error: statusError } = await supabase.rpc(
      'update_methodology_artifact_status' as never,
      {
        target_artifact_id:artifactDetail.artifact.id,
        target_status:targetStatus,
        target_reason:artifactStatusReason.trim(),
      } as never,
    )
    setSaving(false)
    if (statusError) {
      setError(statusError.message)
      return
    }
    setJourneyArtifacts((current) => current.map((item) => item.id === artifactDetail.artifact.id ? { ...item,status:targetStatus } : item))
    await openJourneyArtifact({ ...artifactDetail.artifact,status:targetStatus })
  }

  const applyContractIntakeProposal = () => {
    if (!contractIntakeProposal) return
    const displayNameKey = normalizeSearchText(props.userDisplayName || '')
    const displayNameCandidates = organizationUsers.filter((user) => {
      const candidate = normalizeSearchText(user.user_display_name || '')
      return displayNameKey && (candidate === displayNameKey || candidate.startsWith(displayNameKey + ' '))
    })
    const associatedLead = organizationUsers.find((user) => user.user_id === selected?.lead_user_id)
      ?? organizationUsers.find((user) => user.user_id === props.userId)
      ?? organizationUsers.find((user) => normalizeSearchText(user.user_email) === normalizeSearchText(props.userEmail))
      ?? (displayNameCandidates.length === 1 ? displayNameCandidates[0] : null)
    const year = contractIntakeProposal.startedOn
      ? contractIntakeProposal.startedOn.slice(0,4)
      : openingForm.referenceYear
    setOpeningForm((current) => ({
      ...current,
      referenceYear:year,
      startedOn:contractIntakeProposal.startedOn,
      plannedEndOn:contractIntakeProposal.plannedEndOn,
      leadUserId:associatedLead?.user_id ?? '',
      scopeStatement:current.scopeStatement.trim() || `Realizar a Jornada de Diagnóstico Assistido da ${props.organizationName} no ciclo ${year}, integrando Autoavaliação, histórico, evidências e entrevistas de Governança e Gestão para consolidar achados, prioridades 80×20, Plano de Ação e devolutiva.`,
      methodologyNotes:current.methodologyNotes.trim() || `Conduzir o DA como processo de desenvolvimento organizacional, não auditoria; utilizar a Autoavaliação como baseline declarado; preservar a linha histórica; aprofundar Governança antes de Gestão; confrontar declarações com evidências; distinguir hipótese de achado; avaliar implantação, recorrência, abrangência, controle, resultados e aprendizado; registrar confiança e lacunas; tratar impacto de pontuação somente como potencial estimado. Fonte contratual: ${contractIntakeProposal.sourceTitle}, ${contractIntakeProposal.contractedHours}h, de ${new Date(contractIntakeProposal.startedOn+'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(contractIntakeProposal.plannedEndOn+'T00:00:00').toLocaleDateString('pt-BR')}.`,
    }))
    setAppliedContractAssetId(contractIntakeProposal.assetId)
  }

  const materializeContractSchedule = async () => {
    if (!selected || !canEditInterviews || !contractIntakeProposal || contractIntakeProposal.meetings.length === 0) return
    setSaving(true)
    setError('')
    try {
      const existingCodes = new Set(interviews.map((item) => item.code.toUpperCase()))
      const synchronousMeetings = contractIntakeProposal.meetings.filter((meeting) => /teams|meet|online|remot/i.test(normalizeSearchText(meeting.location ?? '')))
      const interviewMeetings = synchronousMeetings.length > 0
        ? synchronousMeetings
        : contractIntakeProposal.meetings.length >= 4
          ? contractIntakeProposal.meetings.slice(2,-1)
          : contractIntakeProposal.meetings
      for (let index = 0; index < interviewMeetings.length; index += 1) {
        const meeting = interviewMeetings[index]
        const code = 'ENT-' + String(index + 1).padStart(3,'0')
        if (existingCodes.has(code)) continue
        const start = new Date(`${meeting.date}T${meeting.start}:00`)
        const end = new Date(start.getTime() + meeting.durationHours * 60 * 60 * 1000)
        const location = (meeting.location ?? '').trim()
        const normalizedLocation = location.toLocaleLowerCase('pt-BR')
        const channel = normalizedLocation.includes('teams')
          ? 'teams'
          : normalizedLocation.includes('meet')
            ? 'meet'
            : location
              ? 'presential'
              : 'other'
        const governanceBoundary = Math.max(1,Math.ceil(interviewMeetings.length * .375))
        const title = index === 0
          ? 'Abertura das entrevistas e início de Governança'
          : index < governanceBoundary
            ? 'Continuidade das entrevistas de Governança'
            : index === governanceBoundary
              ? 'Transição de Governança para Gestão'
              : 'Continuidade das entrevistas de Gestão'
        const { error: interviewError } = await supabase.rpc(
          'create_skda_interview_with_event' as never,
          {
            target_diagnosis_id:selected.id,
            target_code:code,
            target_title:title,
            target_channel:channel,
            target_scheduled_start:start.toISOString(),
            target_scheduled_end:end.toISOString(),
            target_meeting_reference:location || null,
            change_reason:'Materialização da agenda contratual ratificada para execução contínua da Jornada DA.',
          } as never,
        )
        if (interviewError) throw interviewError
      }
      const nextMetadata = {
        ...(selected.metadata ?? {}),
        contracted_hours:contractIntakeProposal.contractedHours,
        contractual_source_evidence_asset_id:contractIntakeProposal.assetId,
        contractual_source_title:contractIntakeProposal.sourceTitle,
        contractual_schedule_proposal:contractIntakeProposal.meetings,
        contractual_intake_status:'schedule_materialized_pending_execution',
        contractual_schedule_materialized_at:new Date().toISOString(),
      }
      const { error: metadataError } = await supabase
        .from('skda_diagnoses' as never)
        .update({ metadata:nextMetadata } as never)
        .eq('id',selected.id)
        .eq('organization_id',props.organizationId)
      if (metadataError) throw metadataError
      const { data } = await supabase
        .from('skda_interviews' as never)
        .select('id,code,title,interviewee_name,interviewee_role,status,channel,scheduled_start,scheduled_end,actual_start,actual_end,event_id' as never)
        .eq('diagnosis_id', selected.id)
        .order('scheduled_start', { ascending:true, nullsFirst:false })
      setInterviews((data ?? []) as unknown as Interview[])
      setMetrics((current) => ({ ...current, interviews:(data ?? []).length }))
      await loadDiagnoses()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível materializar a agenda contratual.')
    } finally {
      setSaving(false)
    }
  }

  const ratifyContractBaseline = async () => {
    if (!selected || !canManage || !contractIntakeProposal) return
    if (!openingForm.startedOn || !openingForm.plannedEndOn || !openingForm.leadUserId) {
      setError('Defina início, conclusão prevista e Líder SPARKOOP antes de ratificar a linha de base contratual.')
      return
    }
    if (!organizationUsers.some((user) => user.user_id === openingForm.leadUserId)) {
      setError('O Líder SPARKOOP precisa ser um usuário ativo associado à Organização.')
      return
    }
    if (openingForm.plannedEndOn < openingForm.startedOn) {
      setError('A conclusão prevista não pode ser anterior ao início da Jornada.')
      return
    }
    setSaving(true)
    setError('')
    const { data:authData } = await supabase.auth.getUser()
    const nextMetadata = {
      ...(selected.metadata ?? {}),
      scope_statement:openingForm.scopeStatement.trim() || null,
      methodology_notes:openingForm.methodologyNotes.trim() || null,
      diagnostic_sequence:['GOVERNANCA','GESTAO'],
      contracted_hours:contractIntakeProposal.contractedHours,
      contractual_source_evidence_asset_id:contractIntakeProposal.assetId,
      contractual_source_title:contractIntakeProposal.sourceTitle,
      contractual_schedule_proposal:contractIntakeProposal.meetings,
      contractual_intake_status:'baseline_validated',
      contractual_baseline_status:'validated',
      contractual_baseline_validated_at:new Date().toISOString(),
      contractual_baseline_validated_by:authData.user?.id ?? null,
      contract_period_constraint:{ started_on:openingForm.startedOn,planned_end_on:openingForm.plannedEndOn },
    }
    const { error: baselineError } = await supabase
      .from('skda_diagnoses' as never)
      .update({
        reference_year:openingForm.referenceYear ? Number(openingForm.referenceYear) : null,
        started_on:openingForm.startedOn,
        planned_end_on:openingForm.plannedEndOn,
        lead_user_id:openingForm.leadUserId,
        diagnosis_type:openingForm.diagnosisType,
        metadata:nextMetadata,
      } as never)
      .eq('id',selected.id)
      .eq('organization_id',props.organizationId)
    setSaving(false)
    if (baselineError) {
      setError(baselineError.message)
      return
    }
    await loadDiagnoses()
  }

  const prepareFindingFromQuestion = (question:Question) => {
    setEditingFindingId(null)
    const response = responses.find((item) => item.question_id === question.id)
    const draft = assessmentDrafts[question.id]
    const classification = response?.classification ?? draft?.classification ?? 'not_evaluated'
    const findingType = classification === 'confirmed'
      ? 'strength'
      : classification === 'gap'
        ? 'gap'
        : classification === 'reported'
          ? 'observation'
          : 'opportunity'
    const description = response?.rationale?.trim()
      || response?.answer_text?.trim()
      || draft?.rationale?.trim()
      || draft?.answerText?.trim()
      || ''
    setFindingForm({
      findingType,
      title:`${question.code} · ${question.criterion_name || 'Achado do diagnóstico'}`,
      description,
      priority:findingType === 'gap' ? 'high' : 'medium',
      recommendation:'',
      questionId:question.id,
      interviewId:typeof response?.metadata?.last_interview_id === 'string' ? response.metadata.last_interview_id : '',
      ownerUserId:'',
      dueDate:'',
    })
    setShowFindingCreate(true)
  }

  const updateAssessmentDraft = (questionId: string, patch: Partial<AssessmentDraft>) => {
    setAssessmentDrafts((current) => {
      const base = current[questionId] ?? {
        classification:'not_evaluated',
        answerText:'',
        rationale:'',
        confidenceLevel:'not_assessed',
        alternativeId:'',
      }
      return {
        ...current,
        [questionId]: { ...base, ...patch },
      }
    })
  }

  const saveAssessment = async (
    question: Question,
    options?: { validateAfter?:boolean; sourceInterviewId?:string; moveNext?:boolean },
  ): Promise<boolean> => {
    if (!selected || !canEditAssessment) return false
    const draft = assessmentDrafts[question.id]
    if (!draft) return false
    if (options?.validateAfter && !canValidateAssessment) {
      setError('Seu perfil pode registrar a avaliação, mas não validá-la.')
      return false
    }
    if (options?.validateAfter && !draft.alternativeId) {
      setError('Selecione a alternativa do DA antes de salvar e validar.')
      return false
    }
    if (options?.validateAfter && draft.classification === 'not_evaluated') {
      setError('Classifique a constatação antes de salvar e validar.')
      return false
    }
    if (options?.validateAfter && draft.confidenceLevel === 'not_assessed') {
      setError('Informe o nível de confiança antes de salvar e validar.')
      return false
    }

    setSaving(true)
    setError('')
    const previousResponse = responses.find((item) => item.question_id === question.id)
    const hadResponse = Boolean(previousResponse)
    const sourceInterview = options?.sourceInterviewId
      ? interviews.find((item)=>item.id===options.sourceInterviewId) ?? null
      : interviews.find((item) => item.status === 'in_progress') ?? suggestedInterviewForQuestion(question)
    const previousMetadata = previousResponse?.metadata ?? {}
    const previousTrace = Array.isArray(previousMetadata.interview_trace)
      ? previousMetadata.interview_trace.filter((item) => item && typeof item === 'object')
      : []
    const interviewTrace = sourceInterview
      ? [
          ...previousTrace.filter((item) => (item as Record<string,unknown>).interview_id !== sourceInterview.id),
          {
            interview_id:sourceInterview.id,
            interview_code:sourceInterview.code,
            event_id:sourceInterview.event_id,
            scheduled_start:sourceInterview.scheduled_start,
            actual_start:sourceInterview.actual_start,
            actual_end:sourceInterview.actual_end,
            captured_at:new Date().toISOString(),
            source:assessmentConsolidationMode ? 'post_interview_consolidation' : 'assessment',
          },
        ]
      : previousTrace
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id ?? null
    const validateAfter=Boolean(options?.validateAfter)
    const now=new Date().toISOString()
    const { data, error: saveError } = await supabase
      .from('skda_responses' as never)
      .upsert({
        organization_id:props.organizationId,
        diagnosis_id:selected.id,
        question_id:question.id,
        classification:draft.classification,
        answer_text:draft.answerText.trim() || null,
        rationale:draft.rationale.trim() || null,
        score:null,
        evidenced_alternative_id:draft.alternativeId || null,
        validated_alternative_id:validateAfter ? (draft.alternativeId || null) : null,
        confidence_level:draft.confidenceLevel,
        response_status:validateAfter ? 'validated' : 'draft',
        metadata:{
          ...previousMetadata,
          interview_trace:interviewTrace,
          last_interview_id:sourceInterview?.id ?? previousMetadata.last_interview_id ?? null,
          last_interview_code:sourceInterview?.code ?? previousMetadata.last_interview_code ?? null,
          last_interview_event_id:sourceInterview?.event_id ?? previousMetadata.last_interview_event_id ?? null,
          consolidation_mode:assessmentConsolidationMode || previousMetadata.consolidation_mode === true,
          consolidated_at:assessmentConsolidationMode ? now : previousMetadata.consolidated_at ?? null,
        },
        evaluated_at:now,
        evaluated_by:userId,
        validated_at:validateAfter ? now : null,
        validated_by:validateAfter ? userId : null,
      } as never, { onConflict:'diagnosis_id,question_id' })
      .select('id,question_id,classification,response_status,answer_text,rationale,confidence_level,maturity_level,score,declared_alternative_id,evidenced_alternative_id,validated_alternative_id,evaluated_at,validated_at,metadata' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return false }
    const saved = data as unknown as Response
    const nextResponses = [...responses.filter((item) => item.question_id !== question.id), saved]
    setResponses(nextResponses)
    setMetrics((current) => ({ ...current, responses:hadResponse ? current.responses : current.responses + 1 }))

    if (assessmentConsolidationMode && options?.moveNext !== false) {
      const ordered=questions
        .filter((item)=>consolidationBlock==='ALL' || questionBlockCode(item)===consolidationBlock)
        .filter((item)=>!consolidationAxis || (item.axis_name?.trim() || item.criterion_name?.trim() || 'Sem eixo')===consolidationAxis)
        .sort((a,b)=>a.display_order-b.display_order)
      const currentIndex=ordered.findIndex((item)=>item.id===question.id)
      const next=ordered.slice(Math.max(0,currentIndex+1)).find((item)=>{
        const response=nextResponses.find((row)=>row.question_id===item.id)
        return consolidationStatus==='validated' ? response?.response_status==='validated'
          : consolidationStatus==='draft' ? Boolean(response?.evaluated_at) && response?.response_status!=='validated'
          : consolidationStatus==='all' ? true
          : !response?.evaluated_at
      })
      if (next) setConsolidationQuestionId(next.id)
    } else if (activePhaseCode === 'DA-01') {
      const ordered = [...questions].sort((a,b) => a.display_order - b.display_order)
      const currentIndex = ordered.findIndex((item) => item.id === question.id)
      const nextQuestion = ordered.slice(currentIndex + 1).find((item) => !nextResponses.some((response) => response.question_id === item.id && Boolean(response.evaluated_at)))
      if (nextQuestion) {
        window.setTimeout(() => document.getElementById('skda-question-'+nextQuestion.id)?.scrollIntoView({ behavior:'smooth',block:'start' }),80)
      }
    }
    return true
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
        validated_alternative_id:response.evidenced_alternative_id,
        validated_at:new Date().toISOString(),
        validated_by:userId,
      } as never)
      .eq('id', response.id)
      .eq('diagnosis_id', selected.id)
      .eq('organization_id', props.organizationId)
      .select('id,question_id,classification,response_status,answer_text,rationale,confidence_level,maturity_level,score,declared_alternative_id,evidenced_alternative_id,validated_alternative_id,evaluated_at,validated_at,metadata' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return }
    const saved = data as unknown as Response
    setResponses((current) => [...current.filter((item) => item.question_id !== question.id), saved])
  }



  const materializeAndRatifyContractInterviews = async () => {
    if (!selected || !canEditInterviews || contractInterviewMeetings.length === 0) return
    if (!window.confirm(`Materializar e ratificar ${contractInterviewMeetings.length} encontro(s) realizados a partir da agenda contratual? Os horários poderão ser ajustados posteriormente.`)) return

    setSaving(true)
    setError('')
    try {
      const titles = [
        'Entrevistas — Governança',
        'Entrevistas — Gestão I',
        'Entrevistas — Gestão II',
        'Entrevistas — Gestão III',
      ]
      const working = new Map(interviews.map((item) => [item.code.toUpperCase(), item]))

      for (let index = 0; index < contractInterviewMeetings.length; index += 1) {
        const meeting = contractInterviewMeetings[index]
        const code = 'ENT-' + String(index + 1).padStart(3,'0')
        const start = new Date(`${meeting.date}T${meeting.start || '09:00'}:00`)
        const end = new Date(start.getTime() + meeting.durationHours * 60 * 60 * 1000)
        const location = (meeting.location ?? '').trim()
        const normalized = normalizeSearchText(location)
        const channel = normalized.includes('teams') ? 'teams'
          : normalized.includes('meet') ? 'meet'
          : location ? 'presential' : 'other'

        let interviewId = working.get(code)?.id ?? null
        if (!interviewId) {
          const { data:createData,error:createError } = await supabase.rpc(
            'create_skda_interview_with_event' as never,
            {
              target_diagnosis_id:selected.id,
              target_code:code,
              target_title:titles[index] ?? `Entrevistas — Encontro ${index + 1}`,
              target_channel:channel,
              target_scheduled_start:start.toISOString(),
              target_scheduled_end:end.toISOString(),
              target_meeting_reference:location || null,
              change_reason:'Materialização retrospectiva dos encontros realizados conforme agenda contratual da Jornada DA.',
            } as never,
          )
          if (createError || !createData) throw new Error(createError?.message ?? `Não foi possível criar ${code}.`)
          interviewId=(createData as unknown as { interview_id?:string }).interview_id ?? null
        }

        if (!interviewId) throw new Error(`Entrevista ${code} criada sem identificador.`)
        const existing=working.get(code)
        if (!existing || !['completed','validated'].includes(existing.status)) {
          const { error:realizationError } = await supabase.rpc(
            'record_skda_interview_realization' as never,
            {
              target_interview_id:interviewId,
              target_actual_start:start.toISOString(),
              target_actual_end:end.toISOString(),
              target_notes:'Realização ratificada após a conclusão das entrevistas, com base na agenda contratual e no relato do responsável técnico.',
              change_reason:'Regularização pós-entrevista: encontro realizado conforme agenda contratual da Jornada DA.',
            } as never,
          )
          if (realizationError) throw new Error(`Não foi possível ratificar ${code}: ${realizationError.message}`)
        }
      }

      const { data,error:reloadError } = await supabase
        .from('skda_interviews' as never)
        .select('id,code,title,interviewee_name,interviewee_role,status,channel,scheduled_start,scheduled_end,actual_start,actual_end,event_id' as never)
        .eq('diagnosis_id',selected.id)
        .order('scheduled_start',{ascending:true,nullsFirst:false})
      if (reloadError) throw reloadError

      const reloaded=(data ?? []) as unknown as Interview[]
      setInterviews(reloaded)
      setMetrics((current)=>({...current,interviews:reloaded.length}))
      await supabase
        .from('skda_diagnoses' as never)
        .update({ metadata:{
          ...(selected.metadata ?? {}),
          contractual_intake_status:'interviews_materialized_and_ratified',
          interviews_ratified_at:new Date().toISOString(),
          interviews_ratified_count:reloaded.filter((item)=>['completed','validated'].includes(item.status)).length,
        }} as never)
        .eq('id',selected.id)
        .eq('organization_id',props.organizationId)
      await loadDiagnoses()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível materializar e ratificar as entrevistas.')
    } finally {
      setSaving(false)
    }
  }

  const ratifyScheduledInterviewsAsCompleted = async () => {
    if (!canEditInterviews) return
    const pending=interviews.filter((item)=>!['completed','validated'].includes(item.status) && item.scheduled_start && item.scheduled_end)
    if (pending.length===0) {
      setError('Não há entrevistas planejadas pendentes com início e término suficientes para ratificação.')
      return
    }
    if (!window.confirm(`Ratificar ${pending.length} entrevista(s) como realizadas usando os horários já registrados na Agenda?`)) return
    setSaving(true)
    setError('')
    for (const interview of pending) {
      const { error }=await supabase.rpc(
        'record_skda_interview_realization' as never,
        {
          target_interview_id:interview.id,
          target_actual_start:new Date(interview.scheduled_start!).toISOString(),
          target_actual_end:new Date(interview.scheduled_end!).toISOString(),
          target_notes:'Realização ratificada após a conclusão das entrevistas, com base na agenda contratual já registrada e no relato do responsável técnico.',
          change_reason:'Regularização pós-entrevista: encontro realizado conforme agenda registrada da Jornada DA.',
        } as never,
      )
      if (error) {
        setSaving(false)
        setError(`Não foi possível ratificar ${interview.code}: ${error.message}`)
        return
      }
    }
    const { data } = await supabase
      .from('skda_interviews' as never)
      .select('id,code,title,interviewee_name,interviewee_role,status,channel,scheduled_start,scheduled_end,actual_start,actual_end,event_id' as never)
      .eq('diagnosis_id', selected?.id ?? '')
      .order('scheduled_start', { ascending:true, nullsFirst:false })
    setInterviews((data ?? []) as unknown as Interview[])
    setSaving(false)
  }

  const validateAllReadyAssessments = async () => {
    if (!selected || !canValidateAssessment) return
    const candidates=responses.filter((response) => {
      const draft=assessmentDrafts[response.question_id]
      return response.evaluated_at
        && response.response_status!=='validated'
        && Boolean(draft?.alternativeId)
        && draft?.classification!=='not_evaluated'
        && draft?.confidenceLevel!=='not_assessed'
    })
    if (candidates.length===0) {
      setError('Não há avaliações registradas aptas para validação em lote.')
      return
    }
    if (!window.confirm(`Validar ${candidates.length} avaliação(ões) já registradas e completas? Essa ação registra sua validação humana em cada questão.`)) return
    setSaving(true)
    setError('')
    const { data: authData }=await supabase.auth.getUser()
    const userId=authData.user?.id ?? null
    const now=new Date().toISOString()
    const updated:Response[]=[]
    for (const response of candidates) {
      const draft=assessmentDrafts[response.question_id]
      if (!draft) continue
      const { data,error }=await supabase
        .from('skda_responses' as never)
        .update({
          classification:draft.classification,
          answer_text:draft.answerText.trim() || null,
          rationale:draft.rationale.trim() || null,
          evidenced_alternative_id:draft.alternativeId || null,
          validated_alternative_id:draft.alternativeId || null,
          confidence_level:draft.confidenceLevel,
          response_status:'validated',
          validated_at:now,
          validated_by:userId,
          metadata:{
            ...(response.metadata ?? {}),
            bulk_validation:true,
            bulk_validated_at:now,
          },
        } as never)
        .eq('id',response.id)
        .eq('diagnosis_id',selected.id)
        .eq('organization_id',props.organizationId)
        .select('id,question_id,classification,response_status,answer_text,rationale,confidence_level,maturity_level,score,declared_alternative_id,evidenced_alternative_id,validated_alternative_id,evaluated_at,validated_at,metadata' as never)
        .single()
      if (error || !data) {
        setSaving(false)
        setError(error?.message ?? 'Falha durante a validação em lote.')
        return
      }
      updated.push(data as unknown as Response)
    }
    setResponses((current) => {
      const ids=new Set(updated.map((item)=>item.id))
      return [...current.filter((item)=>!ids.has(item.id)),...updated]
    })
    setSaving(false)
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
        metadata:{
          checklist_group_code:'complementar',
          checklist_group_title:'Outras evidências',
          source:'core_existing_asset',
        },
      } as never)
      .select('id,evidence_asset_id,usage_type,validation_status,metadata' as never)
      .single()

    if (saveError) { setSaving(false); setError(saveError.message); return }

    const { error: transversalLinkError } = await supabase.rpc(
      'link_sparks_evidence_module_context' as never,
      {
        target_organization_id:props.organizationId,
        target_evidence_asset_id:asset.id,
        target_module_code:'SK-DA',
        target_type:'diagnosis',
        target_id:selected.id,
        target_usage_purpose:'Inteligência organizacional e preparação do Diagnóstico Assistido.',
        target_relevance_level:'important',
        change_reason:'Evidência transversal associada à Jornada de Diagnóstico Assistido.',
      } as never,
    )
    if (transversalLinkError) { setSaving(false); setError(transversalLinkError.message); return }

    const { error: queueError } = await supabase.rpc(
      'queue_skda_evidence_question_intelligence' as never,
      {
        target_organization_id:props.organizationId,
        target_diagnosis_id:selected.id,
        target_evidence_asset_id:asset.id,
      } as never,
    )
    if (!queueError) {
      const { data:intelligenceData } = await supabase
        .from('skda_evidence_question_intelligence' as never)
        .select('id,evidence_asset_id,question_id,document_intake_status,evidence_coverage_status,practice_state,relevance_score,adequacy_score,sufficiency_score,reliability_score,actuality_score,coverage_score,confidence_score,gap_description,complement_needed,improvement_suggestion,interview_question_suggestion,self_assessment_guidance,diagnostic_hypothesis,analysis_status,source_excerpt,source_locator,metadata' as never)
        .eq('diagnosis_id',selected.id)
        .eq('evidence_asset_id',asset.id)
      const rows=(intelligenceData ?? []) as unknown as EvidenceQuestionIntelligence[]
      setEvidenceQuestionIntelligence((current)=>[...current.filter((item)=>item.evidence_asset_id!==asset.id),...rows])
    }

    setSaving(false)
    const created = data as unknown as EvidenceCorrelation
    setEvidenceCorrelations((current) => [...current, created])
    setMetrics((current) => ({ ...current, evidence:current.evidence + 1 }))
    if (queueError) setError(`Evidência vinculada, mas a inteligência por questão não pôde ser enfileirada: ${queueError.message}`)
  }

  const createAndLinkEvidence = async () => {
    if (!selected || !canRegisterEvidence) return
    if (!evidenceForm.title.trim() && !evidenceFile) {
      setError('Informe o título ou selecione o arquivo da evidência.')
      return
    }
    if (evidenceForm.sourceType === 'external' && !evidenceFile && (!evidenceForm.externalUrl.trim() || !evidenceForm.externalKey.trim())) {
      setError('Para uma referência externa sem upload, informe a URL e a chave externa estável do documento.')
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
      const isExternalReference = evidenceForm.sourceType === 'external' && !evidenceFile
      const registration = isExternalReference
        ? await supabase.rpc(
            'register_external_sparks_evidence_asset' as never,
            {
              target_organization_id:props.organizationId,
              evidence_title:evidenceForm.title.trim() || 'Evidência externa',
              evidence_description:evidenceForm.description.trim() || null,
              target_evidence_type:evidenceForm.evidenceType,
              target_origin_module_code:null,
              target_reference_date:evidenceForm.referenceDate || null,
              target_external_origin:'Referência externa',
              target_external_key:evidenceForm.externalKey.trim(),
              target_source_locator:{
                provider:'external',
                web_url:evidenceForm.externalUrl.trim(),
              },
              target_file_name:null,
              target_mime_type:null,
              target_file_size_bytes:null,
              target_content_hash:null,
              target_extracted_text:null,
              change_reason:evidenceForm.changeReason.trim(),
            } as never,
          )
        : await supabase.rpc(
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

      if (registration.error || !registration.data) {
        setSaving(false)
        setError(registration.error?.message ?? 'Não foi possível registrar a evidência no Core.')
        return
      }
      assetId = registration.data as unknown as string
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
          checklist_group_code:evidenceForm.checklistGroupCode || 'complementar',
          checklist_group_title:DA_EVIDENCE_CHECKLIST.find((item)=>item.code===(evidenceForm.checklistGroupCode || 'complementar'))?.title || 'Outras evidências',
        },
      } as never, { onConflict:'diagnosis_id,evidence_asset_id,target_type,target_id' })
      .select('id,evidence_asset_id,usage_type,validation_status,metadata' as never)
      .single()

    if (correlationError || !correlationData) {
      setSaving(false)
      setError(correlationError?.message ?? 'A evidência foi registrada no Core, mas a correlação com o DA não foi concluída.')
      return
    }

    const { error: transversalLinkError } = await supabase.rpc(
      'link_sparks_evidence_module_context' as never,
      {
        target_organization_id:props.organizationId,
        target_evidence_asset_id:assetId,
        target_module_code:'SK-DA',
        target_type:targetInterview ? 'interview' : 'diagnosis',
        target_id:targetInterview?.id ?? selected.id,
        target_usage_purpose:targetInterview
          ? 'Evidência surgida ou confirmada em entrevista do Diagnóstico Assistido.'
          : 'Inteligência organizacional e preparação do Diagnóstico Assistido.',
        target_relevance_level:'important',
        change_reason:targetInterview
          ? `Evidência transversal associada à entrevista ${targetInterview.code} da Jornada DA.`
          : 'Evidência transversal associada à Jornada de Diagnóstico Assistido.',
      } as never,
    )
    if (transversalLinkError) {
      setSaving(false)
      setError(`A evidência foi registrada no Core e correlacionada ao DA, mas o vínculo transversal do módulo falhou: ${transversalLinkError.message}`)
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
        .select('id,evidence_asset_id,question_id,document_intake_status,evidence_coverage_status,practice_state,relevance_score,adequacy_score,sufficiency_score,reliability_score,actuality_score,coverage_score,confidence_score,gap_description,complement_needed,improvement_suggestion,interview_question_suggestion,self_assessment_guidance,diagnostic_hypothesis,analysis_status,source_excerpt,source_locator,metadata' as never)
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
      externalUrl:'',
      externalKey:'',
      checklistGroupCode:'',
      changeReason:'Evidência identificada durante a Jornada de Diagnóstico Assistido.',
    })
    setShowEvidenceCreate(false)
  }


  const prepareFolderEvidenceScan = async (files:FileList | null) => {
    if (!files || files.length === 0) return
    const incoming=Array.from(files)
    const supported=incoming.filter((file) => {
      const extension=file.name.split('.').pop()?.toLowerCase() ?? ''
      return FOLDER_EVIDENCE_EXTENSIONS.has(extension) && file.size > 0 && file.size <= 50 * 1024 * 1024
    })
    if (supported.length === 0) {
      setError('A pasta não contém arquivos suportados de até 50 MB.')
      return
    }
    if (supported.length > 300) {
      setError('A varredura atual aceita até 300 arquivos por lote. Selecione uma subpasta para manter a revisão controlável.')
      return
    }

    const firstRelative=supported[0]?.webkitRelativePath || supported[0]?.name || ''
    const label=firstRelative.includes('/') ? firstRelative.split('/')[0] : 'Pasta selecionada'
    setFolderScanLabel(label)
    setFolderEvidenceCandidates([])
    setFolderScanProgress({ current:0,total:supported.length,label:'Lendo estrutura e conteúdo...' })
    setError('')

    const prepared:FolderEvidenceCandidate[]=[]
    for (let index=0; index<supported.length; index+=1) {
      const file=supported[index]
      setFolderScanProgress({ current:index+1,total:supported.length,label:file.webkitRelativePath || file.name })
      prepared.push(await classifyFolderEvidenceCandidate(file,questions))
    }
    setFolderEvidenceCandidates(prepared)
    setFolderScanProgress({ current:supported.length,total:supported.length,label:'Triagem concluída. Revise as sugestões antes de importar.' })
  }

  const changeFolderCandidateGroup = (candidateId:string, groupCode:string) => {
    const group=DA_EVIDENCE_CHECKLIST.find((item) => item.code === groupCode)
    if (!group) return
    setFolderEvidenceCandidates((current) => current.map((candidate) => {
      if (candidate.id !== candidateId) return candidate
      const suggested=folderEvidenceQuestionSuggestions(groupCode,candidate.relativePath,candidate.extractedPreview,questions)
      return {
        ...candidate,
        groupCode,
        groupTitle:group.title,
        groupHint:group.hint,
        discoveryTags:[groupCode],
        confidence:groupCode === 'complementar' ? 55 : 80,
        suggestedQuestionIds:suggested.map((item)=>item.id),
        suggestedQuestionCodes:suggested.map((item)=>item.code),
        triageSummary:suggested.length > 0
          ? `Classificação revisada para ${group.title}; associação sugerida a ${suggested.map((item)=>item.code).join(', ')}. Validar aderência e suficiência.`
          : `Classificação revisada para ${group.title}; manter para revisão humana sem associação automática a questões.`,
      }
    }))
  }

  const ingestFolderEvidenceCandidate = async (candidate:FolderEvidenceCandidate, scanId:string) => {
    if (!selected) throw new Error('Jornada não selecionada.')
    const contentHash=await sha256Hex(candidate.file)
    const { data:duplicateData, error:duplicateError }=await supabase
      .from('sparks_evidence_assets' as never)
      .select('id' as never)
      .eq('organization_id',props.organizationId)
      .eq('content_hash',contentHash)
      .is('archived_at',null)
      .maybeSingle()

    if (duplicateError) throw duplicateError
    let assetId=(duplicateData as unknown as { id?:string } | null)?.id ?? null
    let storagePath:string | null=null

    if (!assetId) {
      const safeRelative=(candidate.relativePath || candidate.file.name)
        .split('/')
        .filter(Boolean)
        .map(storageSafeFileName)
        .join('/')
      storagePath=`${props.organizationId}/${selected.id}/folder-scans/${scanId}/${safeRelative}`
      const { error:uploadError }=await supabase.storage
        .from('sparks-evidence')
        .upload(storagePath,candidate.file,{
          cacheControl:'3600',
          contentType:candidate.file.type || 'application/octet-stream',
          upsert:false,
        })
      if (uploadError) throw new Error(`Falha no upload de ${candidate.relativePath}: ${uploadError.message}`)

      const inferred=inferEvidenceFileMetadata(candidate.file)
      const registration=await supabase.rpc(
        'register_sparks_evidence_asset_for_module' as never,
        {
          target_organization_id:props.organizationId,
          target_module_code:'SK-DA',
          evidence_title:inferred.title || candidate.file.name,
          evidence_description:candidate.triageSummary,
          target_evidence_type:candidate.evidenceType,
          target_source_type:'internal',
          target_reference_date:candidate.referenceDate || null,
          target_validity_date:null,
          target_confidentiality_level:'internal',
          target_content_hash:contentHash,
          target_file_name:candidate.file.name,
          target_mime_type:candidate.file.type || null,
          target_file_size_bytes:candidate.file.size,
          target_storage_bucket:'sparks-evidence',
          target_storage_path:storagePath,
          change_reason:'Evidência importada por varredura inteligente de pasta na Jornada de Diagnóstico Assistido.',
        } as never,
      )
      if (registration.error || !registration.data) {
        throw new Error(registration.error?.message ?? 'Não foi possível registrar a evidência descoberta no Core.')
      }
      assetId=registration.data as unknown as string
    }

    const discovery=await supabase.rpc(
      'register_skda_folder_evidence_discovery' as never,
      {
        target_organization_id:props.organizationId,
        target_diagnosis_id:selected.id,
        target_evidence_asset_id:assetId,
        target_question_ids:candidate.suggestedQuestionIds,
        target_group_code:candidate.groupCode,
        target_group_title:candidate.groupTitle,
        target_relative_path:candidate.relativePath,
        target_scan_id:scanId,
        target_discovery_tags:candidate.discoveryTags,
        target_relevance_confidence:candidate.confidence,
        target_triage_summary:candidate.triageSummary,
        change_reason:'Triagem e associações sugeridas pela varredura inteligente de pasta do Diagnóstico Assistido.',
      } as never,
    )
    if (discovery.error) throw new Error(discovery.error.message)

    const [{ data:assetData,error:assetError },{ data:correlationData,error:correlationError },{ data:intelligenceData,error:intelligenceError }]=await Promise.all([
      supabase.from('sparks_evidence_assets' as never)
        .select('id,title,evidence_type,validation_status,reliability_level,reference_date,current_version_id' as never)
        .eq('id',assetId as never)
        .eq('organization_id',props.organizationId)
        .single(),
      supabase.from('skda_evidence_correlations' as never)
        .select('id,evidence_asset_id,usage_type,validation_status,metadata' as never)
        .eq('diagnosis_id',selected.id)
        .eq('evidence_asset_id',assetId as never)
        .eq('target_type','diagnosis')
        .eq('target_id',selected.id)
        .single(),
      supabase.from('skda_evidence_question_intelligence' as never)
        .select('id,evidence_asset_id,question_id,document_intake_status,evidence_coverage_status,practice_state,relevance_score,adequacy_score,sufficiency_score,reliability_score,actuality_score,coverage_score,confidence_score,gap_description,complement_needed,improvement_suggestion,interview_question_suggestion,self_assessment_guidance,diagnostic_hypothesis,analysis_status,source_excerpt,source_locator,metadata' as never)
        .eq('diagnosis_id',selected.id)
        .eq('evidence_asset_id',assetId as never),
    ])

    if (assetError || !assetData) throw new Error(assetError?.message ?? 'Evidência registrada, mas não foi possível recarregar o ativo.')
    if (correlationError || !correlationData) throw new Error(correlationError?.message ?? 'Evidência registrada, mas a triagem não foi recuperada.')
    if (intelligenceError) throw new Error(intelligenceError.message)

    const asset=assetData as unknown as EvidenceAsset
    const correlation=correlationData as unknown as EvidenceCorrelation
    const intelligence=(intelligenceData ?? []) as unknown as EvidenceQuestionIntelligence[]
    const wasKnown=evidenceAssets.some((item) => item.id === asset.id)

    setEvidenceAssets((current) => [asset,...current.filter((item)=>item.id!==asset.id)])
    setEvidenceCorrelations((current) => [...current.filter((item)=>item.id!==correlation.id && item.evidence_asset_id!==asset.id),correlation])
    setEvidenceQuestionIntelligence((current) => [...current.filter((item)=>item.evidence_asset_id!==asset.id),...intelligence])
    if (!wasKnown) setMetrics((current) => ({ ...current,evidence:current.evidence+1 }))
  }

  const importFolderEvidenceCandidates = async () => {
    if (!selected || !canRegisterEvidence) return
    const selectedCandidates=folderEvidenceCandidates.filter((candidate) => candidate.selected && candidate.status !== 'imported')
    if (selectedCandidates.length === 0) {
      setError('Selecione ao menos um arquivo da pasta para importar.')
      return
    }

    const scanId=`${new Date().toISOString().replace(/[:.]/g,'-')}-${crypto.randomUUID().slice(0,8)}`
    setSaving(true)
    setError('')
    setFolderScanProgress({ current:0,total:selectedCandidates.length,label:'Iniciando importação...' })

    let failures=0
    for (let index=0; index<selectedCandidates.length; index+=1) {
      const candidate=selectedCandidates[index]
      setFolderEvidenceCandidates((current) => current.map((item) => item.id===candidate.id ? { ...item,status:'importing',errorMessage:null } : item))
      setFolderScanProgress({ current:index+1,total:selectedCandidates.length,label:candidate.relativePath })
      try {
        await ingestFolderEvidenceCandidate(candidate,scanId)
        setFolderEvidenceCandidates((current) => current.map((item) => item.id===candidate.id ? { ...item,status:'imported',errorMessage:null } : item))
      } catch (error) {
        failures+=1
        const message=error instanceof Error ? error.message : String(error)
        setFolderEvidenceCandidates((current) => current.map((item) => item.id===candidate.id ? { ...item,status:'error',errorMessage:message } : item))
      }
    }

    setSaving(false)
    setFolderScanProgress({
      current:selectedCandidates.length,
      total:selectedCandidates.length,
      label:failures === 0
        ? 'Importação concluída. As associações sugeridas aguardam validação humana.'
        : `Importação concluída com ${failures} arquivo(s) que exigem revisão.`,
    })
    if (failures > 0) setError(`${failures} arquivo(s) não puderam ser importados. Revise os itens marcados com erro.`)
  }

  const openIntelligenceEditor = (item:EvidenceQuestionIntelligence) => {
    setIntelligenceEditId(item.id)
    setIntelligenceForm({
      evidenceCoverageStatus:item.evidence_coverage_status || 'under_analysis',
      practiceState:item.practice_state || 'not_assessed',
      diagnosticHypothesis:item.diagnostic_hypothesis ?? '',
      interviewQuestionSuggestion:item.interview_question_suggestion ?? '',
      gapDescription:item.gap_description ?? '',
      improvementSuggestion:item.improvement_suggestion ?? '',
      confidenceScore:item.confidence_score != null ? String(item.confidence_score) : '65',
      reviewNote:'Análise técnica assistida da evidência frente aos requisitos da questão.',
    })
    setError('')
  }

  const saveIntelligenceProposal = async () => {
    if (!intelligenceEditId) return
    const item=evidenceQuestionIntelligence.find((row)=>row.id===intelligenceEditId)
    if (!item) return
    if (intelligenceForm.diagnosticHypothesis.trim().length < 10) {
      setError('Registre uma hipótese diagnóstica com pelo menos 10 caracteres.')
      return
    }
    if (intelligenceForm.reviewNote.trim().length < 10) {
      setError('Registre a justificativa da análise com pelo menos 10 caracteres.')
      return
    }
    const confidence=Number(intelligenceForm.confidenceScore)
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) {
      setError('A confiança deve estar entre 0 e 100.')
      return
    }
    setSaving(true)
    setError('')
    const { error: proposalError } = await supabase.rpc(
      'review_skda_evidence_intelligence' as never,
      {
        target_intelligence_id:item.id,
        target_analysis_status:'proposed',
        target_evidence_coverage_status:intelligenceForm.evidenceCoverageStatus,
        target_practice_state:intelligenceForm.practiceState,
        target_diagnostic_hypothesis:intelligenceForm.diagnosticHypothesis.trim(),
        target_interview_question_suggestion:intelligenceForm.interviewQuestionSuggestion.trim() || null,
        target_gap_description:intelligenceForm.gapDescription.trim() || null,
        target_improvement_suggestion:intelligenceForm.improvementSuggestion.trim() || null,
        target_confidence_score:confidence,
        target_review_note:intelligenceForm.reviewNote.trim(),
      } as never,
    )
    setSaving(false)
    if (proposalError) {
      setError(proposalError.message)
      return
    }
    setEvidenceQuestionIntelligence((current)=>current.map((row)=>row.id===item.id ? {
      ...row,
      analysis_status:'proposed',
      evidence_coverage_status:intelligenceForm.evidenceCoverageStatus,
      practice_state:intelligenceForm.practiceState,
      diagnostic_hypothesis:intelligenceForm.diagnosticHypothesis.trim(),
      interview_question_suggestion:intelligenceForm.interviewQuestionSuggestion.trim() || null,
      gap_description:intelligenceForm.gapDescription.trim() || null,
      improvement_suggestion:intelligenceForm.improvementSuggestion.trim() || null,
      confidence_score:confidence,
    } : row))
    setIntelligenceEditId(null)
  }

  const reviewIntelligence = async (item:EvidenceQuestionIntelligence, targetStatus:'validated'|'rejected') => {
    if (intelligenceReviewNote.trim().length < 10) {
      setError('Registre uma justificativa com pelo menos 10 caracteres para validar ou refutar a hipótese.')
      return
    }
    setSaving(true)
    setError('')
    const { error: reviewError } = await supabase.rpc(
      'review_skda_evidence_intelligence' as never,
      {
        target_intelligence_id:item.id,
        target_analysis_status:targetStatus,
        target_evidence_coverage_status:item.evidence_coverage_status,
        target_practice_state:item.practice_state,
        target_diagnostic_hypothesis:item.diagnostic_hypothesis,
        target_interview_question_suggestion:item.interview_question_suggestion,
        target_gap_description:item.gap_description,
        target_improvement_suggestion:item.improvement_suggestion,
        target_confidence_score:item.confidence_score,
        target_review_note:intelligenceReviewNote.trim(),
      } as never,
    )
    setSaving(false)
    if (reviewError) {
      setError(reviewError.message)
      return
    }
    setEvidenceQuestionIntelligence((current) => current.map((row) => row.id === item.id ? { ...row,analysis_status:targetStatus } : row))
    setIntelligenceReviewId(null)
    setIntelligenceReviewNote('')
  }

  const convertIntelligenceToFinding = async (item:EvidenceQuestionIntelligence) => {
    if (item.analysis_status !== 'validated' || typeof item.metadata?.finding_id === 'string') return
    const question = questions.find((row) => row.id === item.question_id)
    const findingType = item.evidence_coverage_status === 'covers' && ['applied','recurrent','broad','controlled','result_oriented','learning_improvement'].includes(item.practice_state)
      ? 'strength'
      : item.evidence_coverage_status === 'does_not_cover' || item.evidence_coverage_status === 'needs_complement'
        ? 'gap'
        : item.practice_state === 'exists'
          ? 'opportunity'
          : 'observation'
    const title = `${question?.code ?? 'DA'} · ${question?.criterion_name || 'Inteligência organizacional'}`
    const description = item.diagnostic_hypothesis?.trim()
      || item.gap_description?.trim()
      || 'Inteligência validada a partir de evidência da Organização.'
    const priority = findingType === 'gap' ? 'high' : 'medium'
    const practiceIndex=PRACTICE_STATE_ORDER.indexOf(item.practice_state as typeof PRACTICE_STATE_ORDER[number])
    const nextPracticeState=practiceIndex >= 0 && practiceIndex < PRACTICE_STATE_ORDER.length - 1 ? PRACTICE_STATE_ORDER[practiceIndex + 1] : null
    const explicitImprovement=item.improvement_suggestion?.trim()
    const generatedPracticeRecommendation=nextPracticeState
      ? `Evoluir a prática de “${PRACTICE_STATE_LABELS[item.practice_state] ?? item.practice_state}” para “${PRACTICE_STATE_LABELS[nextPracticeState]}”, definindo responsáveis, evidências de execução, medição e critérios de efetividade.`
      : 'Preservar a prática, monitorar seus resultados e avaliar sua replicabilidade de forma governada.'
    const recommendation=explicitImprovement && !explicitImprovement.startsWith('Usar a entrevista para distinguir')
      ? explicitImprovement
      : generatedPracticeRecommendation
    setSaving(true)
    setError('')
    const { data, error: convertError } = await supabase.rpc(
      'convert_skda_intelligence_to_finding' as never,
      {
        target_intelligence_id:item.id,
        target_finding_type:findingType,
        target_title:title,
        target_description:description,
        target_priority:priority,
        target_recommendation:recommendation,
        target_owner_user_id:null,
        target_due_date:null,
      } as never,
    )
    setSaving(false)
    if (convertError || !data) {
      setError(convertError?.message ?? 'Não foi possível converter a inteligência em achado.')
      return
    }
    const findingId = data as unknown as string
    const { data:findingData } = await supabase
      .from('skda_findings' as never)
      .select('id,finding_type,title,description,priority,status,recommendation,question_id,interview_id,owner_user_id,due_date' as never)
      .eq('id',findingId)
      .single()
    if (findingData) {
      const finding = findingData as unknown as Finding
      setFindings((current) => [finding,...current.filter((row) => row.id !== finding.id)])
      setMetrics((current) => ({ ...current,findings:current.findings + (current.findings > 0 && findings.some((row) => row.id === finding.id) ? 0 : 1) }))
    }
    setEvidenceQuestionIntelligence((current) => current.map((row) => row.id === item.id ? { ...row,metadata:{ ...row.metadata,finding_id:findingId } } : row))
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

  const openFindingEditor = (finding?:Finding) => {
    if (!finding) {
      setEditingFindingId(null)
      setFindingForm({ findingType:'gap', title:'', description:'', priority:'medium', recommendation:'', questionId:'', interviewId:'', ownerUserId:'', dueDate:'' })
      setShowFindingCreate(true)
      return
    }
    setEditingFindingId(finding.id)
    setFindingForm({
      findingType:finding.finding_type,
      title:finding.title,
      description:finding.description,
      priority:finding.priority,
      recommendation:finding.recommendation ?? '',
      questionId:finding.question_id ?? '',
      interviewId:finding.interview_id ?? '',
      ownerUserId:finding.owner_user_id ?? '',
      dueDate:finding.due_date ?? '',
    })
    setShowFindingCreate(true)
  }

  const createFinding = async () => {
    if (!selected || !findingForm.title.trim() || !findingForm.description.trim()) {
      setError('Informe título e descrição do achado.')
      return
    }

    setSaving(true)
    setError('')
    const payload = {
      question_id:findingForm.questionId || null,
      interview_id:findingForm.interviewId || null,
      owner_user_id:findingForm.ownerUserId || null,
      due_date:findingForm.dueDate || null,
      finding_type:findingForm.findingType,
      title:findingForm.title.trim(),
      description:findingForm.description.trim(),
      priority:findingForm.priority,
      recommendation:findingForm.recommendation.trim() || null,
    }
    const request = editingFindingId
      ? supabase
          .from('skda_findings' as never)
          .update(payload as never)
          .eq('id',editingFindingId)
          .eq('diagnosis_id',selected.id)
      : supabase
          .from('skda_findings' as never)
          .insert({
            organization_id:props.organizationId,
            diagnosis_id:selected.id,
            ...payload,
            status:'open',
          } as never)
    const { data, error: saveError } = await request
      .select('id,finding_type,title,description,priority,status,recommendation,question_id,interview_id,owner_user_id,due_date' as never)
      .single()

    setSaving(false)
    if (saveError) { setError(saveError.message); return }

    const savedFinding = data as unknown as Finding
    if (editingFindingId) {
      setFindings((current) => current.map((item) => item.id === editingFindingId ? savedFinding : item))
    } else {
      setFindings((current) => [savedFinding, ...current])
      setMetrics((current) => ({ ...current, findings:current.findings + 1 }))
    }
    setEditingFindingId(null)
    setFindingForm({ findingType:'gap', title:'', description:'', priority:'medium', recommendation:'', questionId:'', interviewId:'', ownerUserId:'', dueDate:'' })
    setShowFindingCreate(false)
  }

  const reloadInterviewQuestionRecords = async () => {
    if (!selectedId) {
      setInterviewQuestionRecords([])
      return
    }
    const { data } = await supabase
      .from('skda_interview_question_records' as never)
      .select('id,interview_id,question_id,sequence_order,status,observed_practice,interview_notes,evidence_cited,evidence_requested,gap_summary,output_type,next_action,execution_date,started_at,completed_at,metadata' as never)
      .eq('diagnosis_id', selectedId)
      .order('sequence_order', { ascending:true })
    setInterviewQuestionRecords((data ?? []) as unknown as InterviewQuestionRecord[])
  }

  const startInterviewSession = async (interview:Interview) => {
    if (!canEditInterviews) return
    setSaving(true)
    setError('')
    const { data, error: startError } = await supabase.rpc(
      'start_skda_interview_session' as never,
      {
        target_interview_id:interview.id,
        change_reason:'Início da sessão de entrevista e materialização do roteiro de campo do Diagnóstico Assistido.',
      } as never,
    )
    setSaving(false)
    if (startError) {
      setError(startError.message)
      return
    }
    const started = data as unknown as Interview
    setInterviews((current) => current.map((item) => item.id === interview.id ? { ...item, ...started } : item))
    await reloadInterviewQuestionRecords()
    setActiveInterviewSessionId(interview.id)
    setActiveInterviewBlock('')
    setActiveInterviewAxis('')
    setActiveInterviewQuestionId(null)
    setShowInterviewCapture(false)
  }

  const openInterviewSession = (interview:Interview) => {
    setActiveInterviewSessionId(interview.id)
    setInterviewSessionNotes('')
    setShowInterviewCapture(false)
    const touched = interviewQuestionRecords
      .filter((item) => item.interview_id === interview.id && item.execution_date)
      .sort((a,b) => (b.execution_date ?? '').localeCompare(a.execution_date ?? '') || (b.started_at ?? '').localeCompare(a.started_at ?? ''))[0]
    const touchedQuestion = questions.find((item) => item.id === touched?.question_id)
    const block = touchedQuestion?.code.startsWith('GOV-') ? 'GOVERNANCA' : touchedQuestion?.code.startsWith('GES-') ? 'GESTAO' : ''
    setActiveInterviewBlock(block)
    setActiveInterviewAxis(touchedQuestion?.axis_name?.trim() ?? '')
    setActiveInterviewQuestionId(touchedQuestion?.id ?? null)
  }

  const saveInterviewQuestionRecord = async (status:'in_progress'|'completed'|'skipped', moveNext = true): Promise<boolean> => {
    if (!activeInterviewSessionId || !activeInterviewQuestionId || !canEditInterviews) return false
    if (status === 'completed' && !interviewQuestionDraft.outputType) {
      setError('Classifique a saída desta questão antes de concluí-la.')
      return false
    }
    setSaving(true)
    setError('')
    const { data, error: recordError } = await supabase.rpc(
      'save_skda_interview_question_record' as never,
      {
        target_interview_id:activeInterviewSessionId,
        target_question_id:activeInterviewQuestionId,
        target_status:status,
        target_observed_practice:interviewQuestionDraft.observedPractice.trim() || null,
        target_interview_notes:interviewQuestionDraft.interviewNotes.trim() || null,
        target_evidence_cited:interviewQuestionDraft.evidenceCited.trim() || null,
        target_evidence_requested:interviewQuestionDraft.evidenceRequested.trim() || null,
        target_gap_summary:interviewQuestionDraft.gapSummary.trim() || null,
        target_output_type:interviewQuestionDraft.outputType || null,
        target_next_action:interviewQuestionDraft.nextAction.trim() || null,
        target_execution_date:interviewQuestionDraft.executionDate || localDateInputValue(),
        change_reason:status === 'completed'
          ? 'Conclusão do registro de campo desta questão na entrevista do Diagnóstico Assistido.'
          : status === 'skipped'
            ? 'Questão não concluída nesta entrevista; registro preservado para continuidade da Jornada.'
            : 'Atualização do registro de campo da questão durante a entrevista do Diagnóstico Assistido.',
      } as never,
    )
    setSaving(false)
    if (recordError || !data) {
      setError(recordError?.message ?? 'Não foi possível salvar o registro da questão.')
      return false
    }
    const saved = data as unknown as InterviewQuestionRecord
    setInterviewQuestionRecords((current) => [
      ...current.filter((item) => !(item.interview_id === saved.interview_id && item.question_id === saved.question_id)),
      saved,
    ])
    if (moveNext && ['completed','skipped'].includes(status)) {
      const currentIndex = visibleInterviewSessionRows.findIndex((row) => row.question.id === activeInterviewQuestionId)
      const next = visibleInterviewSessionRows.slice(Math.max(currentIndex + 1,0)).find((row) => !['completed','skipped'].includes(row.record?.status ?? 'pending'))
      if (next) {
        setActiveInterviewQuestionId(next.question.id)
        setShowInterviewCapture(false)
      }
    }
    return true
  }

  const interviewDraftHasContent = () => Boolean(
    interviewQuestionDraft.observedPractice.trim()
    || interviewQuestionDraft.interviewNotes.trim()
    || interviewQuestionDraft.evidenceCited.trim()
    || interviewQuestionDraft.evidenceRequested.trim()
    || interviewQuestionDraft.gapSummary.trim()
    || interviewQuestionDraft.outputType
    || interviewQuestionDraft.nextAction.trim()
  )

  const preserveInterviewDraftBeforeNavigation = async () => {
    if (!interviewDraftHasContent()) return true
    return saveInterviewQuestionRecord('in_progress',false)
  }

  const navigateInterviewQuestion = async (questionId:string | null) => {
    if (!questionId) return
    const preserved = await preserveInterviewDraftBeforeNavigation()
    if (!preserved) return
    setActiveInterviewQuestionId(questionId)
    setShowInterviewCapture(false)
  }

  const changeInterviewScope = async (block:'GOVERNANCA'|'GESTAO', axis = '') => {
    const preserved = await preserveInterviewDraftBeforeNavigation()
    if (!preserved) return
    setActiveInterviewBlock(block)
    setActiveInterviewAxis(axis)
    setActiveInterviewQuestionId(null)
    setShowInterviewCapture(false)
  }

  const resetInterviewBlockChoice = async () => {
    const preserved = await preserveInterviewDraftBeforeNavigation()
    if (!preserved) return
    setActiveInterviewBlock('')
    setActiveInterviewAxis('')
    setActiveInterviewQuestionId(null)
    setShowInterviewCapture(false)
  }

  const closeInterviewPanel = async () => {
    const preserved = await preserveInterviewDraftBeforeNavigation()
    if (!preserved) return
    setActiveInterviewSessionId(null)
    setActiveInterviewBlock('')
    setActiveInterviewAxis('')
    setActiveInterviewQuestionId(null)
    setShowInterviewCapture(false)
  }

  const finishInterviewSession = async () => {
    if (!activeInterviewSessionId || !canEditInterviews) return
    const preserved = await preserveInterviewDraftBeforeNavigation()
    if (!preserved) return
    setSaving(true)
    setError('')
    const { data, error: finishError } = await supabase.rpc(
      'finish_skda_interview_session' as never,
      {
        target_interview_id:activeInterviewSessionId,
        target_notes:interviewSessionNotes.trim() || null,
        change_reason:'Encerramento da sessão de entrevista com preservação dos registros por questão e pendências para continuidade.',
      } as never,
    )
    setSaving(false)
    if (finishError || !data) {
      setError(finishError?.message ?? 'Não foi possível encerrar a entrevista.')
      return
    }
    const finished = data as unknown as Interview
    setInterviews((current) => current.map((item) => item.id === finished.id ? { ...item, ...finished } : item))
    setActiveInterviewSessionId(null)
    setActiveInterviewBlock('')
    setActiveInterviewAxis('')
    setActiveInterviewQuestionId(null)
    setShowInterviewCapture(false)
    setInterviewSessionNotes('')
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
  useEffect(() => {
    if (!selected || !contractIntakeProposal) return
    const baselineValidated = selected.metadata?.contractual_baseline_status === 'validated'
    const displayNameKey = normalizeSearchText(props.userDisplayName || '')
    const displayNameCandidates = organizationUsers.filter((user) => {
      if (!displayNameKey) return false
      const candidate = normalizeSearchText(user.user_display_name || '')
      return candidate === displayNameKey || candidate.startsWith(displayNameKey + ' ')
    })
    const associatedLead = organizationUsers.find((user) => user.user_id === selected.lead_user_id)
      ?? organizationUsers.find((user) => user.user_id === props.userId)
      ?? organizationUsers.find((user) => normalizeSearchText(user.user_email) === normalizeSearchText(props.userEmail))
      ?? (displayNameCandidates.length === 1 ? displayNameCandidates[0] : null)
    const year = contractIntakeProposal.startedOn ? contractIntakeProposal.startedOn.slice(0,4) : String(selected.reference_year ?? '')
    const scopeSuggestion = [
      `Realizar a Jornada de Diagnóstico Assistido da ${props.organizationName} no ciclo ${year || 'vigente'}, com base no PDGC/Avaliacoop e na fonte contratual ${contractIntakeProposal.sourceTitle}.`,
      'Integrar Autoavaliação, histórico dos ciclos, evidências organizacionais e entrevistas de Governança e Gestão, consolidando achados rastreáveis, prioridades 80×20, Plano de Ação e devolutiva.',
      contractIntakeProposal.scopeLabel ? `Escopo contratual identificado: ${contractIntakeProposal.scopeLabel}.` : '',
    ].filter(Boolean).join(' ')
    const methodologySuggestion = [
      'Conduzir o Diagnóstico Assistido como processo de desenvolvimento organizacional, e não como auditoria.',
      'Utilizar a Autoavaliação vigente como baseline declarado e os ciclos anteriores como linha histórica.',
      'Executar o aprofundamento na sequência Governança → Gestão, questão a questão, confrontando declarações com evidências e preservando hipóteses, validações e refutações.',
      'Avaliar existência, implantação, recorrência, abrangência, controle, resultados e aprendizado das práticas, registrando confiança e lacunas.',
      'Tratar impacto de pontuação apenas como potencial estimado e condicionado às evidências; nunca como garantia.',
      `Agenda contratual identificada: ${contractIntakeProposal.contractedHours}h entre ${new Date(contractIntakeProposal.startedOn+'T00:00:00').toLocaleDateString('pt-BR')} e ${new Date(contractIntakeProposal.plannedEndOn+'T00:00:00').toLocaleDateString('pt-BR')}.`,
    ].join(' ')

    setOpeningForm((current) => ({
      ...current,
      referenceYear:current.referenceYear || year,
      leadUserId:associatedLead?.user_id ?? '',
      startedOn:baselineValidated ? (current.startedOn || contractIntakeProposal.startedOn) : contractIntakeProposal.startedOn,
      plannedEndOn:baselineValidated ? (current.plannedEndOn || contractIntakeProposal.plannedEndOn) : contractIntakeProposal.plannedEndOn,
      scopeStatement:current.scopeStatement.trim() || scopeSuggestion,
      methodologyNotes:current.methodologyNotes.trim() || methodologySuggestion,
    }))
    setAppliedContractAssetId((current) => current ?? contractIntakeProposal.assetId)
  }, [
    selected?.id,
    selected?.lead_user_id,
    selected?.metadata?.contractual_baseline_status,
    contractIntakeProposal?.assetId,
    contractIntakeProposal?.startedOn,
    contractIntakeProposal?.plannedEndOn,
    contractIntakeProposal?.contractedHours,
    organizationUsers,
    props.userId,
    props.userEmail,
    props.userDisplayName,
    props.organizationName,
  ])
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
  const contractualSchedule = useMemo(() => {
    const raw = selected?.metadata?.contractual_baseline_schedule ?? selected?.metadata?.contractual_schedule_proposal
    if (!Array.isArray(raw)) return [] as ContractMeetingProposal[]
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row=item as Record<string,unknown>
        const duration=Number(row.durationHours ?? row.duration_hours ?? 0)
        return {
          date:String(row.date ?? ''),
          start:String(row.start ?? ''),
          durationHours:Number.isFinite(duration) ? duration : 0,
          location:row.location == null ? null : String(row.location),
        } satisfies ContractMeetingProposal
      })
      .filter((item):item is ContractMeetingProposal => Boolean(item && item.date && item.durationHours > 0))
  },[selected?.metadata?.contractual_baseline_schedule,selected?.metadata?.contractual_schedule_proposal])
  const contractedHours = contractIntakeProposal?.contractedHours ?? [
    selected?.metadata?.contracted_hours,
    selected?.metadata?.workload_hours,
    selected?.metadata?.total_contracted_hours,
    contractualSchedule.reduce((total,item)=>total+item.durationHours,0),
  ]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0) ?? null
  const effectiveContractMeetings = contractIntakeProposal?.meetings?.length
    ? contractIntakeProposal.meetings
    : contractualSchedule
  const contractInterviewMeetings = effectiveContractMeetings.filter((meeting) => {
    const location = normalizeSearchText(meeting.location ?? '')
    return !location.includes('off-line')
      && !location.includes('offline')
      && !location.includes('off line')
      && !location.includes('atividade interna')
      && !location.includes('preparacao')
      && !location.includes('consolidacao')
  })
  const contractOrganizationHours = contractInterviewMeetings.length > 0
    ? contractInterviewMeetings.reduce((total, meeting) => total + meeting.durationHours, 0)
    : Number.isFinite(Number(selected?.metadata?.contractual_organization_hours))
      ? Number(selected?.metadata?.contractual_organization_hours)
      : null
  const contractTechnicalHours = contractedHours != null && contractOrganizationHours != null
    ? Math.max(0, contractedHours - contractOrganizationHours)
    : Number.isFinite(Number(selected?.metadata?.contractual_technical_hours))
      ? Number(selected?.metadata?.contractual_technical_hours)
      : null
  const contractualSourceReference = String(
    selected?.metadata?.contractual_source_reference
      ?? selected?.metadata?.contractual_source_title
      ?? (selected?.metadata?.contractual_baseline_reconciliation_reason as string | undefined)?.match(/OI\s+\d+\/\d{4}/i)?.[0]
      ?? ''
  ).trim()
  const technicalResponsible = organizationUsers.find((user)=>user.user_id===selected?.lead_user_id)
  const workloadPlanningRatio = workloadReference && contractedHours
    ? contractedHours / workloadReference.totalHours
    : null
  const workloadPlanningModel = workloadPlanningRatio != null && workloadPlanningRatio < .85
    ? 'Modelo intensivo orientado por evidências'
    : workloadPlanningRatio != null && workloadPlanningRatio > 1.15
      ? 'Modelo ampliado de aprofundamento'
      : 'Modelo integrado de diagnóstico assistido'
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
      checklistGroupCode:'autoavaliacao',
      changeReason:'Autoavaliação importada como declaração da Organização e baseline da Jornada DA.',
    }))
    setShowEvidenceCreate(true)
  }

  const secondary = selected ? (
    <div className="skda-detail">
      {isOverview && <>
      <div className="skda-executive-grid">
        <article className="skda-executive-card skda-journey-progress-card">
          <div className="skda-executive-card-head skda-journey-progress-head">
            <div><h3>Evolução da Jornada {selected.reference_year ?? ''}</h3></div>
            <div className="skda-journey-progress-actions">
              {diagnoses.length > 1 && <label className="skda-cycle-selector"><span>Ciclo</span><select value={selectedId ?? ''} onChange={(event)=>setSelectedId(event.target.value)}>{diagnoses.map((item)=><option key={item.id} value={item.id}>{formatDiagnosisBusinessTitle(item)}</option>)}</select></label>}
              <strong>{Number(selected.progress).toFixed(0)}%</strong>
            </div>
          </div>
          <div className="skda-progress-track" aria-label="Progresso do diagnóstico">
            <span style={{ width: `${Math.max(0, Math.min(100, Number(selected.progress) || 0))}%` }} />
          </div>
          <div className="skda-phase-strip" aria-label="Etapas da Jornada DA">
            {PHASES.map((phase) => (
              <span key={phase.code} className={phase.code === normalizeJourneyPhaseCode(selected.current_phase_code) ? 'active' : ''}>
                {phase.title}
              </span>
            ))}
          </div>
        </article>
        {[
          { key:'governance', title:'Governança', series:governanceRadar, reference:selfAssessmentReference.GOVERNANCA },
          { key:'management', title:'Gestão', series:managementRadar, reference:selfAssessmentReference.GESTAO },
        ].map(({ key,title,series,reference }) => <article key={key} className="skda-executive-card skda-radar-card">
          <div className="skda-executive-card-head skda-radar-card-head">
            <div><span>Maturidade</span><h3>{title} · AA × DA</h3></div>
            <div className="skda-radar-index-pair" aria-label="Índices atuais de Autoavaliação e Diagnóstico Assistido">
              <strong className="aa">{reference.current && reference.current.reference_year === selected?.reference_year ? `${Number(reference.current.metric_value).toFixed(2)}%` : selfAssessmentSnapshots.some((snapshot) => snapshot.metadata?.block === (key === 'governance' ? 'GOVERNANCA' : 'GESTAO')) ? 'AA importada parcialmente' : 'AA a integrar'}</strong>
              <strong className="da" aria-hidden="true"></strong>
            </div>
          </div>
          {series.baseline.length === 0 ? (
            <p className="skda-radar-empty">{selfAssessmentSnapshots.some((snapshot) => snapshot.metadata?.block === (key === 'governance' ? 'GOVERNANCA' : 'GESTAO')) ? 'Radar por critério: aguardando a integração das pontuações oficiais do relatório.' : 'Autoavaliação ainda não integrada.'}</p>
          ) : <div className="skda-radar-wrap">
            <div className="skda-radar-visual">
              <svg viewBox="0 0 200 200" role="img" aria-label={`Comparação entre Autoavaliação e Diagnóstico Assistido · ${title}`}>
                <circle cx="100" cy="100" r="78" className="skda-radar-grid" />
                <circle cx="100" cy="100" r="52" className="skda-radar-grid" />
                <circle cx="100" cy="100" r="26" className="skda-radar-grid" />
                <polygon points={series.aaPoints} className="skda-radar-value-aa" />
                {series.daAvailable && <polygon points={series.daPoints} className="skda-radar-value-da" />}
              </svg>
              <div className="skda-radar-legend"><span><i className="aa" />Autoavaliação</span><span><i className="da" />Diagnóstico Assistido</span></div>
            </div>
            <div className="skda-radar-detail">
              <div className="skda-radar-table-head"><span>Critério</span><span>AA</span><span>DA</span></div>
              <div className="skda-radar-table-body">
                {series.baseline.map((item, index) => <div key={item.axis} className="skda-radar-table-row">
                  <span>{item.axis}</span>
                  <b>{item.score.toFixed(0)}%</b>
                  <b>{series.diagnosis[index]?.score == null ? '—' : series.diagnosis[index]?.score + '%'}</b>
                </div>)}
              </div>
            </div>
          </div>}
          {(reference.current || reference.history.length > 0 || reference.benchmarks.length > 0) && <div className="skda-aa-reference">
            <div>
              <small>Ciclo anterior</small>
              <strong>{reference.history.length > 0 ? Number(reference.history.at(-1)?.metric_value ?? 0).toFixed(2)+'%' : 'Não informado na fonte'}</strong>
            </div>
            <div>
              <small>Índice atual</small>
              <strong>{reference.current && reference.current.reference_year === selected?.reference_year ? Number(reference.current.metric_value).toFixed(2)+'%' : 'Índice do ciclo não integrado'}</strong>
            </div>

          </div>}
        </article>)}
      </div>
      <div className="skda-metrics skda-metrics-after-radars">
        <MetricCard label="Questões avaliadas" value={metrics.responses} helper={String(assessmentCoverage) + '% da cobertura'} />
        <MetricCard label="Entrevistas" value={metrics.interviews} helper="registradas na jornada" />
        <MetricCard label="Evidências correlacionadas" value={metrics.evidence} helper="ativos do Core vinculados" />
        <MetricCard label="Achados" value={metrics.findings} helper="forças, lacunas, riscos e oportunidades" />
      </div>
      <article className="skda-executive-card skda-findings-summary-card">
        <div className="skda-executive-card-head">
          <div><span>Inteligência organizacional</span><h3>Hipóteses → achados formalizados</h3></div>
          <strong>{metrics.findings}</strong>
        </div>
        <div className="skda-findings-summary-body">
          <div className="skda-intelligence-summary-grid">
            <div><span>Hipóteses em análise</span><b>{organizationalIntelligenceSummary.underAnalysis}</b></div>
            <div><span>Validadas</span><b>{organizationalIntelligenceSummary.validated}</b></div>
            <div><span>Refutadas</span><b>{organizationalIntelligenceSummary.rejected}</b></div>
            <div><span>Convertidas em achados</span><b>{organizationalIntelligenceSummary.converted}</b></div>
            <div><span>Perguntas para entrevistas</span><b>{organizationalIntelligenceSummary.interviewPrompts}</b></div>
          </div>
          <div className="skda-formal-findings-panel">
            <div className="skda-findings-subhead"><span>Achados formais do DA</span><strong>{metrics.findings}</strong></div>
            <div className="skda-finding-bars">
              {Object.entries(FINDING_TYPES).map(([type,label]) => {
                const value = findingsByType[type] ?? 0
                const width = metrics.findings > 0 ? Math.round((value / metrics.findings) * 100) : 0
                return <div key={type}><span>{label}</span><div><i style={{ width: `${width}%` }} /></div><b>{value}</b></div>
              })}
            </div>
          </div>
        </div>
      </article>
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
      </>}

      {isOverview && <section className="skda-evolution-overview">
        <div className="skda-phase-workspace-head">
          <div>
            <span className="skda-eyebrow">Evolução da Maturidade</span>
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
                {[100,80,60,40,20,0].map((tick) => <span key={tick} style={{position:'absolute',top:`${92 - tick * .78}%`,right:0,transform:'translateY(-50%)'}}>{tick}%</span>)}
              </div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Evolução da Autoavaliação e do Diagnóstico Assistido por ciclo">
                {[100,80,60,40,20,0].map((tick) => <line key={tick} x1="5" x2="95" y1={92 - tick * .78} y2={92 - tick * .78} className="skda-evolution-gridline" />)}
                {evolutionBenchmarks.map((benchmark) => {
                  const y = evolutionChartPoint(0,Number(benchmark.metric_value)).y
                  return y == null ? null : <line key={benchmark.id} x1="5" x2="95" y1={y} y2={y} stroke={evolutionBenchmarkColor(benchmark)} strokeOpacity=".42" strokeWidth=".22" strokeDasharray="2.5 3.5" strokeLinecap="round" />
                })}
                {evolutionBlockSeries.map((series) => {
                  const color = series.block === 'GOVERNANCA' ? (series.kind === 'AA' ? '#2563eb' : '#047857') : (series.kind === 'AA' ? '#9333ea' : '#d97706')
                  const visible = series.values.filter((point) => point.score != null)
                  const points = visible.map((point) => `${point.x},${point.y}`).join(' ')
                  const isAA = series.kind === 'AA'
                  return <g key={`${series.block}-${series.kind}`}>
                    {visible.length > 1 && <polyline points={points} fill="none" stroke={color} strokeOpacity={isAA ? .82 : .58} strokeWidth={isAA ? ".62" : ".38"} strokeDasharray={isAA ? undefined : "2.5 2.2"} vectorEffect="non-scaling-stroke" />}
                    {visible.map((point) => <g key={`${point.x}-${point.y}`}>
                      {isAA
                        ? <circle cx={point.x} cy={point.y!} r=".9" fill="#fff" stroke={color} strokeWidth=".55" vectorEffect="non-scaling-stroke" />
                        : <circle cx={point.x} cy={point.y!} r="1.3" fill={color} stroke="#fff" strokeWidth=".45" vectorEffect="non-scaling-stroke" />}
                      <title>{`${series.block === 'GOVERNANCA' ? 'Governança' : 'Gestão'} · ${series.kind} · ${point.year}: ${point.score?.toFixed(2)}%`}</title>
                    </g>)}
                  </g>
                })}

              </svg>
              <div className="skda-evolution-value-labels">
                {evolutionEndLabels.filter((series) => series.kind === 'AA').map((series) => {
                  const color = series.block === 'GOVERNANCA' ? '#2563eb' : '#9333ea'
                  const offset = series.block === 'GOVERNANCA' ? -10 : 10
                  return <span
                    key={`${series.block}-${series.kind}-end`}
                    className="skda-evolution-end-label"
                    style={{left:`${Math.min(97,series.point.x+1.6)}%`,top:`calc(${series.point.y}% + ${offset}px)`,color}}
                    title={`${series.block === 'GOVERNANCA' ? 'Governança' : 'Gestão'} · AA · ${series.point.year}`}
                  ><b>{series.point.score!.toFixed(2)}%</b></span>
                })}
              </div>
              <div className="skda-evolution-labels">
                {evolutionChartSeries.map((item,index) => <div key={item.diagnosisId} className={item.current ? 'is-current' : ''} style={{position:'absolute',left:`${evolutionChartPoint(index,null).x}%`,transform:'translateX(-50%)'}}>
                  <strong>{item.label}</strong>
                </div>)}
              </div>
            </div>
            <div className="skda-evolution-legend">
              <div className="skda-evolution-legend-group">
                <strong>Organização</strong>
                <span><i className="skda-legend-line aa-governance" />Governança · AA</span>
                <span><i className="skda-legend-dot da-governance" />Governança · DA</span>
                <span><i className="skda-legend-line aa-management" />Gestão · AA</span>
                <span><i className="skda-legend-dot da-management" />Gestão · DA</span>
              </div>
              <div className="skda-evolution-legend-group skda-evolution-benchmarks">
                <strong>Referências</strong>
                {evolutionBenchmarks.map((benchmark) => {
                  const isBranch=benchmark.comparator_code.toUpperCase().includes('RAMO')
                  return <span key={benchmark.id} title={benchmark.source_reference ?? undefined}>
                    <i className="skda-legend-reference" style={{borderTopColor:evolutionBenchmarkColor(benchmark)}} />
                    {benchmark.block_code === 'GOVERNANCA' ? 'Gov.' : 'Gest.'} · {isBranch ? 'Ramo Brasil' : 'Brasil'}
                    <b>{Number(benchmark.metric_value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%</b>
                  </span>
                })}
                {evolutionBenchmarks.length === 0 && <span>BMKs do ramo e nacional: aguardando fontes oficiais e ano de referência</span>}
              </div>
            </div>
            <div className="skda-artifact-grid" hidden>
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
                    <span title={action?.baseline_start_date || action?.baseline_due_date ? formatRange(action?.baseline_start_date,action?.baseline_due_date) : 'Aguardando confirmação do cronograma da OS autorizadora.'}><small>LB0 contratual</small><b>{selected.metadata?.contractual_baseline_status === 'validated' || action?.metadata?.baseline_validation_status === 'validated' ? 'Validada' : 'A validar'}</b></span>
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
                      {inheritedArtifacts.map((artifact) => <span key={artifact.id} title="Entregável herdado da MegaFase anterior."><button type="button" onClick={() => void openJourneyArtifact(artifact)}>{artifact.title}</button></span>)}
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
                          {canManage && stage.status === 'planned' && <span><button type="button" className="skda-primary" disabled={saving} onClick={() => void transitionJourneyStage(stage,action,'in_progress')}>Iniciar etapa</button></span>}
                          {canManage && stage.status === 'in_progress' && <span><button type="button" className="skda-primary" disabled={saving} onClick={() => void transitionJourneyStage(stage,action,'completed')}>Concluir etapa</button></span>}
                        </div>
                      </article>
                    })}
                  </section>
                  <section className="skda-artifact-list">
                    <div className="skda-megaphase-subhead"><span>KIT governado da MegaFase</span><strong>{artifacts.length} entregável(is) estruturado(s)</strong></div>
                    <p>Os entregáveis abaixo integram o ciclo governado da Jornada: planejamento, preparação, validação, aprovação, institucionalização, execução, evidência e avaliação. Nenhum artefato é considerado aprovado sem validação humana explícita.</p>
                    {artifacts.length === 0 ? <p>Entregáveis metodológicos ainda não estruturados.</p> : <div className="skda-artifact-grid">{artifacts.map((artifact) => <article key={artifact.id}>
                      <div><small>{artifact.artifact_code}</small><strong>{artifact.title}</strong><span>{artifact.purpose || 'Entregável metodológico da Jornada.'}</span><span><button type="button" onClick={() => void openJourneyArtifact(artifact)}>Abrir governança do entregável</button></span></div>
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
        ) : <>
          <div className="skda-followup-grid">
            <div><span>Concluídas</span><strong>{actionFollowupSummary.completed}</strong></div>
            <div><span>Em andamento</span><strong>{actionFollowupSummary.inProgress}</strong></div>
            <div><span>Vencidas</span><strong>{actionFollowupSummary.overdue}</strong></div>
            <div><span>Não iniciadas</span><strong>{actionFollowupSummary.notStarted}</strong></div>
            <div><span>Bloqueadas</span><strong>{actionFollowupSummary.blocked}</strong></div>
            <div><span>Aguardando conversão</span><strong>{actionFollowupSummary.awaitingConversion}</strong></div>
          </div>
          <div className="skda-followup-list">
            {actionFollowup.slice(0,8).map((item) => <article key={item.finding_id+'-'+String(item.initiative_id)}>
              <div><small>Ciclo {item.cycle_number ?? '—'} · {item.followup_state === 'completed' ? 'Concluída' : item.followup_state === 'in_progress' ? 'Em andamento' : item.followup_state === 'overdue' ? 'Vencida' : item.followup_state === 'blocked' ? 'Bloqueada' : item.followup_state === 'awaiting_conversion' ? 'Aguardando iniciativa' : 'Não iniciada'}</small><strong>{item.finding_title}</strong><span>{item.initiative_name || 'Ação ainda sem iniciativa transversal vinculada'}</span></div>
              <div className="skda-followup-progress"><b>{Math.round(Number(item.initiative_progress ?? 0))}%</b><span><i style={{width:`${Math.max(0,Math.min(100,Number(item.initiative_progress ?? 0)))}%`}} /></span></div>
            </article>)}
          </div>
          <div className="skda-followup-actions"><button type="button" onClick={() => setActivePhaseCode('DA-03')}>Abrir Plano de Ação e follow-up</button></div>
        </>}
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
            {activePhase.code === 'DA-01' && <><span>Entrevistas e diagnóstico</span><strong>{metrics.interviews} entrevista(s) · {interviewQuestionFlow.traversed}/{interviewQuestionFlow.rows.length} questão(ões) percorrida(s) · {metrics.findings} achado(s)</strong></>}
            {activePhase.code === 'DA-02' && <><span>Recomendações e priorização</span><strong>{findings.filter((finding) => Boolean(finding.recommendation)).length} recomendação(ões)</strong></>}
            {activePhase.code === 'DA-03' && <><span>Plano de Ação e devolutiva</span><strong>Ciclos 1 · 2 · 3</strong></>}
          </div>
          {phaseReadiness[activePhase.code] && <div className="skda-phase-readiness">
            <div className="skda-phase-readiness-head">
              <div><span>Gate de avanço</span><strong>{phaseReadiness[activePhase.code].ready ? 'Fase apta para conclusão' : 'Pendências antes de avançar'}</strong></div>
              <b>{phaseReadiness[activePhase.code].completed}/{phaseReadiness[activePhase.code].total}</b>
            </div>
            <div className="skda-phase-readiness-items">
              {phaseReadiness[activePhase.code].items.map((item) => <span key={item.label} className={item.ok ? 'is-ok' : item.critical ? 'is-critical' : 'is-pending'}><i>{item.ok ? '✓' : item.critical ? '!' : '·'}</i>{item.label}{!item.critical && <small>recomendado</small>}</span>)}
            </div>
            {canManage && <div className="skda-phase-readiness-actions">
              <button type="button" className="skda-primary" disabled={saving || !phaseReadiness[activePhase.code].ready || selected.status === 'completed' || normalizeJourneyPhaseCode(selected.current_phase_code) !== activePhase.code} onClick={() => void advanceJourneyPhase(activePhase.code)}>
                {normalizeJourneyPhaseCode(selected.current_phase_code) !== activePhase.code ? 'Fase disponível para consulta' : activePhase.code === 'DA-03' ? 'Concluir Jornada' : 'Concluir fase e avançar'}
              </button>
            </div>}
          </div>}
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
                <article><small>Status</small><strong>{selected.metadata?.contractual_baseline_status === 'validated' ? 'Linha de base ratificada' : appliedContractAssetId === contractIntakeProposal.assetId ? 'Aplicada ao rascunho' : 'Aguardando análise'}</strong></article>
              </div>
              <div className="skda-contract-meeting-list">
                {contractIntakeProposal.meetings.map((meeting, index) => <article key={meeting.date+'-'+meeting.start+'-'+index}>
                  <div><small>Bloco {index+1}</small><strong>{new Date(meeting.date+'T00:00:00').toLocaleDateString('pt-BR')} · {meeting.start}</strong><span>{meeting.location || 'Local a confirmar'}</span></div>
                  <b>{meeting.durationHours}h</b>
                </article>)}
              </div>
              <div className="skda-evidence-loop-note"><strong>Regra de aprovação</strong><span>Esses dados foram extraídos do documento contratual e constituem uma proposta de linha de base. A Organização pode aprovar ou adequar datas, horários e distribuição antes da consolidação do cronograma.</span></div>
              {canManage && <div className="skda-opening-actions">
                <button type="button" onClick={applyContractIntakeProposal}>Aplicar sugestão à abertura</button>
                {canEditInterviews && <button type="button" disabled={saving || contractIntakeProposal.meetings.length === 0} onClick={() => void materializeContractSchedule()}>
                  {interviews.some((item) => /^ENT-\d{3}$/.test(item.code)) ? 'Sincronizar blocos com a Agenda' : 'Criar blocos na Agenda'}
                </button>}
                <button type="button" className="skda-primary" disabled={saving || selected.metadata?.contractual_baseline_status === 'validated'} onClick={() => void ratifyContractBaseline()}>
                  {selected.metadata?.contractual_baseline_status === 'validated' ? 'Linha de base ratificada' : 'Ratificar linha de base contratual'}
                </button>
              </div>}
            </div>}
            <div className="skda-opening-grid">
              <label className="skda-inline-field"><span>Ano de referência</span><input type="number" min="2000" max="2100" value={openingForm.referenceYear} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,referenceYear:e.target.value}))}/></label>
              <label className="skda-inline-field"><span>Tipo de diagnóstico</span><select value={openingForm.diagnosisType} disabled={!canManage || saving || catalogLocked} onChange={(e)=>setOpeningForm(v=>({...v,diagnosisType:e.target.value}))}>{Object.entries(TYPES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
              <label className="skda-inline-field"><span>Início da jornada</span><input type="date" value={openingForm.startedOn} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,startedOn:e.target.value}))}/></label>
              <label className="skda-inline-field"><span>Conclusão prevista</span><input type="date" value={openingForm.plannedEndOn} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,plannedEndOn:e.target.value}))}/></label>
              <label className="skda-inline-field skda-opening-wide"><span>Líder SPARKOOP da jornada</span><select value={openingForm.leadUserId} disabled={!canManage || saving} onChange={(e)=>setOpeningForm(v=>({...v,leadUserId:e.target.value}))}><option value="">Selecione um usuário associado...</option>{organizationUsers.map((user)=><option key={user.user_id} value={user.user_id}>{user.user_display_name || user.user_email} ({user.user_email})</option>)}</select><small>Lista restrita a usuários ativos associados à {props.organizationName} e com papel ativo no módulo SK-DA. Cargo e papel modular não substituem a identidade do usuário.</small></label>
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
                  <h4>Modelo de execução da Jornada DA</h4>
                  <small>O SPARKs planeja a Jornada a partir da OI/OS vigente e da complexidade real do diagnóstico. Referenciais metodológicos permanecem como inteligência interna de planejamento e não alteram a carga contratada apresentada à Organização.</small>
                </div>
                <span>{contractedHours ? contractedHours+'h contratadas' : 'Carga contratual a confirmar'}</span>
              </div>

              {contractedHours ? <>
                <div className="skda-contract-workload-source">
                  <div>
                    <small>Fonte contratual da carga</small>
                    <strong>{contractualSourceReference || 'Fonte contratual validada da Jornada'}</strong>
                    <span>Período ratificado: {selected?.started_on ? new Date(selected.started_on+'T12:00:00').toLocaleDateString('pt-BR') : '—'} a {selected?.planned_end_on ? new Date(selected.planned_end_on+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                  </div>
                  <div>
                    <small>Responsável técnico</small>
                    <strong>{technicalResponsible?.user_display_name || technicalResponsible?.user_email || 'Responsável técnico registrado na Jornada'}</strong>
                    <span>{technicalResponsible?.job_title || 'Liderança técnica do Diagnóstico Assistido'}</span>
                  </div>
                </div>
                <div className="skda-workload-grid">
                  <article className="is-organization">
                    <div><small>Carga total contratada</small><strong>{workloadPlanningModel}</strong><span>Todo o rito do DA é organizado dentro da carga e do período contratados, com prioridade para evidências, entrevistas, validação, devolutiva e Plano de Ação.</span></div>
                    <b>{contractedHours}h</b>
                  </article>
                  <article className="is-organization">
                    <div><small>Com a Organização</small><strong>Entrevistas e validações assistidas</strong><span>{contractOrganizationHours != null ? `${contractOrganizationHours}h de interação síncrona previstas na agenda contratual, destinadas às entrevistas, validações, esclarecimentos e alinhamentos com a Organização.` : 'Horas de interação serão distribuídas conforme a agenda ratificada da Jornada.'}</span></div>
                    <b>{contractOrganizationHours != null ? contractOrganizationHours+'h' : 'Carga síncrona não identificada'}</b>
                  </article>
                  <article className="is-internal is-full">
                    <div><small>Trabalho técnico / off-line</small><strong>Preparação, inteligência de evidências, análise e consolidação</strong><span>Leitura, organização e correlação documental; varredura e qualificação de evidências; atualização da Matriz de Evidências Esperadas por Questão; análise das Autoavaliações e do histórico; construção e revisão de hipóteses; preparação e refinamento dos roteiros de entrevista; registro e tratamento das evidências citadas; validação cruzada das informações; análise de suficiência, PDCL e maturidade; consolidação de achados, forças, lacunas, riscos e oportunidades; preparação da priorização 80/20; estruturação do Plano de Ação; preparação da devolutiva; registro de decisões, artefatos e rastreabilidade da Jornada.</span></div>
                    <b>{contractTechnicalHours != null ? contractTechnicalHours+'h' : 'Carga técnica derivada da agenda'}</b>
                  </article>
                </div>
                <div className="skda-evidence-loop-note">
                  <strong>Melhor modelo para esta contratação</strong>
                  <span>{workloadPlanningModel === 'Modelo intensivo orientado por evidências'
                    ? 'Antecipar ao máximo a análise documental e a correlação com as questões do PDGC, chegar às entrevistas com hipóteses e perguntas já priorizadas, consolidar achados durante a própria execução e reservar o trabalho off-line para validação cruzada, devolutiva e Plano de Ação. O objetivo é aumentar profundidade por hora contratada, sem expor ou transferir para a Organização diferenças entre referências internas de planejamento.'
                    : workloadPlanningModel === 'Modelo ampliado de aprofundamento'
                      ? 'Usar a capacidade contratada para aprofundar evidências, entrevistas temáticas, validações adicionais, devolutiva e acompanhamento inicial do Plano de Ação, mantendo a mesma cadeia metodológica e a rastreabilidade das decisões.'
                      : 'Distribuir a carga contratada entre preparação documental, entrevistas de Governança e Gestão, validação das evidências, consolidação do diagnóstico, devolutiva e Plano de Ação, ajustando a intensidade de cada bloco conforme os achados da própria Jornada.'}</span>
                </div>
              </> : <div className="skda-evidence-loop-note"><strong>Carga contratual ainda não identificada</strong><span>O SPARKs deve recuperar a OI/OS ou outra fonte contratual antes de propor o dimensionamento operacional da Jornada. Nenhuma referência metodológica deve substituir silenciosamente a contratação.</span></div>}
            </div>
            <div className="skda-intake-evidence">
              <div className="skda-phase-workspace-head">
                <div>
                  <h4>Evidências de entrada e Autoavaliações</h4>
                  <small>A Fase 0 inventaria o que foi recebido antes de qualquer conclusão do diagnóstico. Autoavaliações são preservadas como declaração histórica da organização, não como validação automática.</small>
                </div>
                <span>{selfAssessmentSnapshots.length} registro(s) oficial(is) do ciclo</span>
              </div>
              <div className="skda-evidence-loop-note"><strong>Regra de evidência</strong><span>As Autoavaliações oficiais do ciclo são preservadas como fonte do Sistema OCB e como declaração formal da Organização. O DA mantém separadas a declaração, as evidências que a sustentam e a validação diagnóstica.</span></div>
              {selfAssessmentSnapshots.length === 0 ? <p className="skda-phase-empty">Nenhuma Autoavaliação oficial foi importada para este ciclo. A preparação pode continuar com inventário documental, entrevistas iniciais e outras fontes disponíveis.</p> : <div className="skda-intake-snapshots">
                {selfAssessmentSnapshots.map((snapshot) => {
                  const block = typeof snapshot.metadata?.block === 'string' ? snapshot.metadata.block : 'AUTOAVALIAÇÃO'
                  const normalizationStatus = typeof snapshot.metadata?.normalization_status === 'string' ? snapshot.metadata.normalization_status : 'preserved'
                  return <article key={snapshot.id}>
                    <div>
                      <small>{block === 'GOVERNANCA' ? 'Governança Cooperativa' : block === 'GESTAO' ? 'Gestão' : 'Autoavaliação'}</small>
                      <strong>{snapshot.source_label || 'Autoavaliação oficial do ciclo'}</strong>
                      <span>{snapshot.source_date ? 'Documento oficial do Sistema OCB · emissão '+new Date(snapshot.source_date+'T00:00:00').toLocaleDateString('pt-BR') : 'Documento oficial do Sistema OCB · ciclo '+(selected.reference_year ?? 'vigente')}</span>
                    </div>
                    <div className="skda-intake-status">
                      <b>Fonte oficial preservada</b>
                      <span>{normalizationStatus === 'staging' ? 'Estruturação em andamento' : 'Integrada ao diagnóstico'}</span>
                    </div>
                  </article>
                })}
              </div>}
            </div>
            {canManage && <div className="skda-opening-actions"><button type="button" className="skda-primary" disabled={saving} onClick={()=>void saveOpeningConfiguration()}>{saving?'Salvando...':'Salvar abertura da jornada'}</button></div>}
          </div>}
          {activePhase.code === 'DA-00' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head">
              <div><h4>Gestão das Evidências</h4><small>O Core organiza a fonte, sua integridade, confiabilidade, aderência às questões do catálogo e o que ainda precisa ser confirmado para transformar documento em evidência de prática e resultado.</small></div>
              <div className="skda-phase-workspace-actions">
                <span>{evidenceAssets.length} ativo(s)</span>
                {canRegisterEvidence && <button type="button" onClick={() => { setFolderEvidenceCandidates([]); setFolderScanLabel(''); setFolderScanProgress({current:0,total:0,label:''}); setShowFolderEvidenceScan(true) }}>Varrer pasta de evidências</button>}
                {canRegisterEvidence && <button type="button" className="skda-primary" onClick={() => { setEvidenceFile(null); setShowEvidenceCreate(true) }}>Adicionar e analisar evidência</button>}
              </div>
            </div>
            <div className="skda-evidence-checklist">
              <h4>Checklist documental da Jornada</h4>
              <p>Importe documentos históricos, materiais solicitados e outras evidências. A classificação é orientativa e não impede novos registros.</p>
              <div className="skda-evidence-checklist-grid">
                {DA_EVIDENCE_CHECKLIST.map((item) => {
                  const groupedAssets = evidenceAssets.filter((asset) => {
                    const correlation = evidenceCorrelations.find((row) => row.evidence_asset_id === asset.id)
                    const storedGroup = typeof correlation?.metadata?.checklist_group_code === 'string'
                      ? correlation.metadata.checklist_group_code
                      : ''
                    return item.code === 'complementar'
                      ? !storedGroup || storedGroup === 'complementar'
                      : storedGroup === item.code
                  })
                  return <article key={item.code} className="skda-evidence-checklist-group">
                    <div className="skda-evidence-checklist-group-head">
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.hint}</small>
                      </div>
                      <span>{groupedAssets.length}</span>
                    </div>
                    {groupedAssets.length > 0 && <div className="skda-evidence-checklist-assets">
                      {groupedAssets.map((asset) => {
                        const correlation = evidenceCorrelations.find((row) => row.evidence_asset_id === asset.id)
                        const intelligenceRows = evidenceQuestionIntelligence.filter((row) => row.evidence_asset_id === asset.id)
                        const pendingCount = intelligenceRows.filter((row) => ['pending','queued','processing'].includes(row.analysis_status)).length
                        return <div key={asset.id} className="skda-evidence-checklist-asset">
                          <div>
                            <small>{EVIDENCE_TYPES[asset.evidence_type] ?? asset.evidence_type}</small>
                            <b>{asset.title}</b>
                            <span>{correlation ? 'Integrada ao DA' : 'Disponível no Core'} · Confiabilidade: {RELIABILITY[asset.reliability_level] ?? asset.reliability_level}{intelligenceRows.length > 0 ? ` · ${intelligenceRows.length} questão(ões) correlacionada(s)` : ''}{pendingCount > 0 ? ` · ${pendingCount} em análise` : ''}</span>
                          </div>
                          {!correlation && canLinkEvidence && <button type="button" disabled={saving} onClick={() => void linkEvidence(asset)}>Vincular e analisar</button>}
                        </div>
                      })}
                    </div>}
                    {groupedAssets.length === 0 && <small className="skda-evidence-checklist-empty">Nenhum documento associado a este grupo.</small>}
                    {canRegisterEvidence && <button type="button" onClick={() => {
                      setEvidenceFile(null)
                      setEvidenceForm((current) => ({
                        ...current,
                        title:'',
                        description:item.title + ' — ' + item.hint,
                        checklistGroupCode:item.code,
                        changeReason:'Importação documental orientada pelo checklist da Jornada SK-DA.',
                      }))
                      setShowEvidenceCreate(true)
                    }}>Importar evidência</button>}
                  </article>
                })}
              </div>
            </div>
            {evidenceAssets.length === 0 && <p className="skda-phase-empty">Nenhuma evidência transversal disponível para esta organização.</p>}
          </div>}
          {activePhase.code === 'DA-01' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head">
              <div><h4>Entrevistas do diagnóstico</h4><small>Entrevistas são eventos da Agenda da Organização. Participantes planejados e presença efetiva são geridos pelo mesmo motor transversal do PE.</small></div>
              {canEditInterviews && <button type="button" className="skda-primary" onClick={() => setShowInterviewCreate(true)}>Nova entrevista</button>}
            </div>
            <div className="skda-interview-flow">
              <div className="skda-interview-flow-head">
                <div>
                  <span>Roteiro contínuo da Jornada</span>
                  <strong>Governança → Gestão, questão a questão</strong>
                  <small>No primeiro encontro realiza-se a abertura e inicia-se Governança. Cada encontro seguinte retoma automaticamente da primeira questão ainda não percorrida, até concluir Governança e então avançar para Gestão.</small>
                </div>
                <b>{interviewQuestionFlow.traversed}/{interviewQuestionFlow.rows.length}</b>
              </div>
              <div className="skda-interview-flow-blocks">
                <div className={interviewQuestionFlow.current?.block === 'GOVERNANCA' ? 'active' : ''}><span>Governança</span><strong>{interviewQuestionFlow.governanceTraversed}/{interviewQuestionFlow.governance.length}</strong></div>
                <div className={interviewQuestionFlow.current?.block === 'GESTAO' ? 'active' : ''}><span>Gestão</span><strong>{interviewQuestionFlow.managementTraversed}/{interviewQuestionFlow.management.length}</strong></div>
              </div>
              {intelligentInterviewAgenda.rows.length > 0 && <div className="skda-intelligent-agenda">
                <div className="skda-intelligent-agenda-head">
                  <div>
                    <span>Agenda inteligente da entrevista</span>
                    <strong>{intelligentInterviewAgenda.rows.length} pergunta(s) executiva(s) consolidam {intelligentInterviewAgenda.rawPrompts} hipótese(s)</strong>
                    <small>As perguntas repetidas foram agrupadas sem eliminar nenhum vínculo com as questões oficiais ou evidências de origem.</small>
                  </div>
                  <div><b>{intelligentInterviewAgenda.governance.length}</b><span>Governança</span><b>{intelligentInterviewAgenda.management.length}</b><span>Gestão</span></div>
                </div>
                <div className="skda-intelligent-agenda-list">
                  {intelligentInterviewAgenda.rows.slice(0,8).map((row,index) => <article key={row.key}>
                    <div className="skda-intelligent-agenda-rank">{index+1}</div>
                    <div>
                      <small>{row.block === 'GOVERNANCA' ? 'Governança' : row.block === 'GESTAO' ? 'Gestão' : 'Transversal'} · {row.affectedQuestions} questão(ões) · {row.affectedEvidence} evidência(s)</small>
                      <strong>{row.prompt}</strong>
                      <span>{row.questionCodes.slice(0,8).join(' · ')}{row.questionCodes.length > 8 ? ' +' + (row.questionCodes.length-8) : ''}</span>
                      {row.criterionLabels.length > 0 && <span>{row.criterionLabels.join(' · ')}</span>}
                    </div>
                    {row.firstQuestion && <button type="button" onClick={() => document.getElementById('skda-question-'+row.firstQuestion?.id)?.scrollIntoView({ behavior:'smooth', block:'start' })}>Abrir questões</button>}
                  </article>)}
                </div>
                {intelligentInterviewAgenda.rows.length > 8 && <small className="skda-intelligent-agenda-more">+ {intelligentInterviewAgenda.rows.length-8} pergunta(s) consolidada(s) adicional(is), preservadas na sequência metodológica.</small>}
              </div>}
              {interviewQuestionFlow.current ? <div className="skda-interview-current-question">
                <div>
                  <small>Próxima questão · {interviewQuestionFlow.current.block === 'GOVERNANCA' ? 'Governança' : interviewQuestionFlow.current.block === 'GESTAO' ? 'Gestão' : 'Outras'}</small>
                  <strong>{interviewQuestionFlow.current.question.code} · {interviewQuestionFlow.current.question.question_text}</strong>
                  {interviewQuestionFlow.current.question.criterion_name && <span>{interviewQuestionFlow.current.question.criterion_name}</span>}
                  {intelligentInterviewAgenda.rows.filter((row)=>row.questionIds.has(interviewQuestionFlow.current?.question.id ?? '')).slice(0,3).map((row) => <span key={row.key} className="skda-interview-intelligence-prompt"><b>Inteligência:</b> {row.prompt}</span>)}
                </div>
                <button type="button" className="skda-primary" onClick={() => document.getElementById('skda-question-'+interviewQuestionFlow.current?.question.id)?.scrollIntoView({ behavior:'smooth', block:'start' })}>Retomar nesta questão</button>
              </div> : <div className="skda-interview-current-question is-complete"><div><small>Roteiro concluído</small><strong>Todas as questões da Jornada foram percorridas no DA.</strong><span>A validação final pode prosseguir sem perder a rastreabilidade das entrevistas.</span></div></div>}
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
                  {canEditInterviews && interview.status === 'planned' && <button type="button" className="skda-primary" disabled={saving} onClick={() => void startInterviewSession(interview)}>Iniciar entrevista</button>}
                  {canEditInterviews && interview.status === 'in_progress' && <button type="button" className="skda-primary" onClick={() => openInterviewSession(interview)}>Abrir sessão</button>}
                  {canEditInterviews && interview.status === 'completed' && <button type="button" onClick={() => openInterviewSession(interview)}>Revisar registros</button>}
                  {canEditInterviews && <button type="button" onClick={() => {
                    setRealizationInterviewId(interview.id)
                    setRealizationForm((current) => ({
                      ...current,
                      actualStart:interview.actual_start ? new Date(interview.actual_start).toISOString().slice(0,16) : '',
                      actualEnd:interview.actual_end ? new Date(interview.actual_end).toISOString().slice(0,16) : '',
                    }))
                  }}>Ajustar realização</button>}
                  {canRegisterEvidence && <button type="button" onClick={() => { setEvidenceForm((current) => ({ ...current, interviewId:interview.id, checklistGroupCode:'entrevistas' })); setShowEvidenceCreate(true) }}>Registrar evidência</button>}
                </div>
              </article>)}
            </div>}
          </div>}
          {activePhase.code === 'DA-01' && activeInterviewSession && !activeInterviewBlock && <div className="skda-phase-workspace skda-interview-start-choice">
            <div className="skda-interview-cockpit-head">
              <div>
                <span>Modo entrevista · {activeInterviewSession.code}</span>
                <h4>Por qual bloco iniciaremos?</h4>
                <small>O cronograma é uma proposição. As questões serão registradas na data em que forem efetivamente trabalhadas e poderão ser retomadas em qualquer encontro.</small>
              </div>
              <button type="button" onClick={() => void closeInterviewPanel()}>Fechar painel</button>
            </div>
            <div className="skda-interview-block-choice">
              <button type="button" onClick={() => { setActiveInterviewBlock('GOVERNANCA'); setActiveInterviewAxis(''); setShowInterviewCapture(false) }}>
                <b>Governança</b><span>{interviewQuestionFlow.governanceTraversed}/{interviewQuestionFlow.governance.length} percorridas na Jornada</span>
              </button>
              <button type="button" onClick={() => { setActiveInterviewBlock('GESTAO'); setActiveInterviewAxis(''); setShowInterviewCapture(false) }}>
                <b>Gestão</b><span>{interviewQuestionFlow.managementTraversed}/{interviewQuestionFlow.management.length} percorridas na Jornada</span>
              </button>
            </div>
          </div>}
          {activePhase.code === 'DA-01' && activeInterviewSession && activeInterviewBlock && activeInterviewQuestion && (() => {
            const aaAnswer = selfAssessmentAnswers.find((item) => item.question_id === activeInterviewQuestion.id)
            const alternatives = questionAlternatives.filter((item) => item.question_id === activeInterviewQuestion.id)
            const currentAnswerLevel = (aaAnswer?.declared_code ?? '').toUpperCase()
            const expectations = questionEvidenceExpectations.filter((item) => item.question_id === activeInterviewQuestion.id)
            const supportExpectations = expectations.filter((item) => currentAnswerLevel && item.answer_level === currentAnswerLevel && ['support_declared_answer','both'].includes(item.purpose))
            const answerRank = ANSWER_LEVEL_RANK[currentAnswerLevel] ?? 0
            const evolutionExpectations = answerRank < 4
              ? expectations.filter((item) => (ANSWER_LEVEL_RANK[item.answer_level] ?? 0) > answerRank && ['evolution_to_d','both'].includes(item.purpose))
              : []
            const intelligenceRows = evidenceQuestionIntelligence.filter((item) => item.question_id === activeInterviewQuestion.id && item.analysis_status !== 'rejected')
            const governedPrompts = interviewQuestionPrompts.filter((item) => item.question_id === activeInterviewQuestion.id)
            const prompts = intelligentInterviewAgenda.rows.filter((row) => row.questionIds.has(activeInterviewQuestion.id))
            const currentRow = activeInterviewSessionRows.find((row) => row.question.id === activeInterviewQuestion.id)
            const completedCount = activeInterviewSessionRows.filter((row) => ['completed','skipped'].includes(row.record?.status ?? 'pending')).length
            return <div className="skda-phase-workspace skda-interview-cockpit">
              <div className="skda-interview-cockpit-head">
                <div>
                  <span>Modo entrevista · {activeInterviewSession.code}</span>
                  <h4>{activeInterviewSession.title}</h4>
                  <small>{completedCount}/{activeInterviewSessionRows.length} questão(ões) registradas neste encontro · Jornada geral {interviewQuestionFlow.traversed}/{interviewQuestionFlow.rows.length}</small>
                </div>
                <div className="skda-interview-cockpit-head-actions">
                  {activeInterviewSession.status === 'in_progress' && <button type="button" disabled={saving} onClick={() => void finishInterviewSession()}>Encerrar encontro</button>}
                  <button type="button" onClick={() => void closeInterviewPanel()}>Fechar painel</button>
                </div>
              </div>
              <div className="skda-interview-question-nav skda-interview-question-nav-flexible">
                <button type="button" onClick={() => void resetInterviewBlockChoice()}>Trocar bloco</button>
                <label>
                  <span>Bloco</span>
                  <select value={activeInterviewBlock} onChange={(event) => void changeInterviewScope(event.target.value as 'GOVERNANCA'|'GESTAO','')}>
                    <option value="GOVERNANCA">Governança</option>
                    <option value="GESTAO">Gestão</option>
                  </select>
                </label>
                <label>
                  <span>Eixo</span>
                  <select value={activeInterviewAxis} onChange={(event) => void changeInterviewScope(activeInterviewBlock as 'GOVERNANCA'|'GESTAO',event.target.value)}>
                    <option value="">Todos os eixos</option>
                    {activeInterviewAxisOptions.map((axis) => <option key={axis} value={axis}>{axis}</option>)}
                  </select>
                </label>
                <button type="button" disabled={activeInterviewQuestionIndex <= 0} onClick={() => void navigateInterviewQuestion(visibleInterviewSessionRows[activeInterviewQuestionIndex-1]?.question.id ?? null)}>← Anterior</button>
                <label className="skda-interview-question-picker">
                  <span>Questão em campo</span>
                  <select value={activeInterviewQuestion.id} onChange={(event) => void navigateInterviewQuestion(event.target.value)}>
                    {visibleInterviewSessionRows.map((row) => <option key={row.question.id} value={row.question.id}>
                      {row.question.code} · {row.question.axis_name || row.question.criterion_name || 'Sem eixo'} · {row.record?.status === 'completed' ? 'concluída' : row.record?.status === 'skipped' ? 'continuidade' : row.record?.status === 'in_progress' ? 'em registro' : 'a percorrer'}
                    </option>)}
                  </select>
                </label>
                <button type="button" disabled={activeInterviewQuestionIndex < 0 || activeInterviewQuestionIndex >= visibleInterviewSessionRows.length-1} onClick={() => void navigateInterviewQuestion(visibleInterviewSessionRows[activeInterviewQuestionIndex+1]?.question.id ?? null)}>Próxima →</button>
              </div>
              <div className="skda-interview-cockpit-grid skda-interview-slide-layout">
                <section className="skda-interview-context-panel skda-interview-slide-left">
                  <div className="skda-interview-question-official">
                    <small>{activeInterviewQuestion.code}{activeInterviewQuestion.axis_name ? ' · '+activeInterviewQuestion.axis_name : ''}</small>
                    <strong>{activeInterviewQuestion.question_text}</strong>
                    {activeInterviewQuestion.criterion_name && <span>{activeInterviewQuestion.criterion_name}</span>}
                  </div>
                  {alternatives.length > 0 && <div className="skda-interview-alternatives">
                    {alternatives.map((alternative) => <div key={alternative.id} className={alternative.code === currentAnswerLevel ? 'is-declared' : ''}><b>{alternative.code}</b><span>{alternative.alternative_text}</span></div>)}
                  </div>}
                  <div className="skda-interview-context-card skda-interview-aa-card">
                    <strong>Autoavaliação declarada</strong>
                    <span>{aaAnswer ? `${aaAnswer.declared_code ?? '-'} · ${aaAnswer.declared_text ?? 'Sem texto descritivo importado.'}` : 'Resposta da Autoavaliação não localizada.'}</span>
                    {aaAnswer?.rationale && <small>{aaAnswer.rationale}</small>}
                  </div>
                  <div className="skda-interview-context-card">
                    <strong>Evidências já localizadas / inteligência disponível</strong>
                    {intelligenceRows.length === 0
                      ? <small>Nenhuma inteligência documental validável foi associada a esta questão.</small>
                      : intelligenceRows.slice(0,8).map((item) => {
                        const asset = evidenceAssets.find((row) => row.id === item.evidence_asset_id)
                        return <span key={item.id}><b>{asset?.title || 'Evidência vinculada'}:</b> {item.diagnostic_hypothesis || item.gap_description || item.complement_needed || 'Vínculo existente; aprofundar suficiência durante a entrevista.'}</span>
                      })}
                  </div>
                </section>
                <section className="skda-interview-guidance-panel skda-interview-slide-right">
                  <div className="skda-interview-context-card is-prompts skda-interview-central-question">
                    <strong>Condução da entrevista</strong>
                    {governedPrompts.filter((item) => item.prompt_type === 'central').map((item) => <span key={item.prompt_id}><b>Pergunta central:</b> {item.prompt_text}</span>)}
                    {governedPrompts.filter((item) => item.prompt_type === 'deepening').slice(0,6).map((item) => <span key={item.prompt_id}><b>Aprofundamento:</b> {item.prompt_text}</span>)}
                    {prompts.length > 0 && prompts.slice(0,5).map((row) => <span key={row.key}><b>Inteligência dinâmica:</b> {row.prompt}</span>)}
                    {governedPrompts.length === 0 && prompts.length === 0 && <small>Investigue apenas as dimensões ainda não comprovadas, solicitando casos recentes, registros, resultados e decisões decorrentes.</small>}
                  </div>
                  <div className="skda-interview-context-card">
                    <strong>Evidências para sustentar a resposta {currentAnswerLevel || 'declarada'}</strong>
                    {supportExpectations.length > 0
                      ? supportExpectations.map((item) => <span key={item.expectation_id}><b>{EXPECTATION_DIMENSION_LABELS[item.evidence_dimension] ?? item.evidence_dimension}:</b> {item.title}</span>)
                      : (activeInterviewQuestion.expected_evidence?.length ?? 0) > 0
                        ? <><small>Fallback do catálogo legado; ainda não substitui a curadoria A-D governada.</small>{activeInterviewQuestion.expected_evidence?.slice(0,8).map((item,index)=><span key={'legacy-'+index}>{typeof item === 'string' ? item : JSON.stringify(item)}</span>)}</>
                        : <small>Curadoria governada ainda não disponível para este nível.</small>}
                  </div>
                  {currentAnswerLevel !== 'D' && <div className="skda-interview-context-card is-evolution">
                    <strong>Para avançar até D</strong>
                    {evolutionExpectations.length === 0 ? <small>Curadoria adicional ainda não disponível.</small> : evolutionExpectations.slice(0,8).map((item) => <span key={item.expectation_id}><b>{item.answer_level} · {EXPECTATION_DIMENSION_LABELS[item.evidence_dimension] ?? item.evidence_dimension}:</b> {item.title}</span>)}
                  </div>}
                  {governedPrompts.filter((item) => ['evidence_request','systemic_connection'].includes(item.prompt_type)).length > 0 && <div className="skda-interview-context-card">
                    <strong>Evidências a solicitar e conexões</strong>
                    {governedPrompts.filter((item) => ['evidence_request','systemic_connection'].includes(item.prompt_type)).slice(0,8).map((item) => <span key={item.prompt_id}><b>{item.prompt_type === 'evidence_request' ? 'Solicitar' : 'Conexão'}:</b> {item.prompt_text}</span>)}
                  </div>}
                </section>
              </div>
              <div className="skda-interview-record-drawer">
                <button type="button" className="skda-interview-record-toggle" onClick={() => setShowInterviewCapture((current) => !current)}>
                  <span>Registro da entrevista</span>
                  <b>{currentRow?.record?.status === 'completed' ? 'Concluída' : currentRow?.record?.status === 'skipped' ? 'Continuidade' : currentRow?.record?.status === 'in_progress' ? 'Rascunho salvo' : 'Ainda não registrado'} · {showInterviewCapture ? 'Recolher' : 'Abrir'}</b>
                </button>
                {showInterviewCapture && <section className="skda-interview-capture-panel">
                  <div className="skda-interview-capture-state">
                    <div><span>Registro da questão</span><b>{currentRow?.record?.status === 'completed' ? 'Concluída' : currentRow?.record?.status === 'skipped' ? 'Pendente para continuidade' : currentRow?.record?.status === 'in_progress' ? 'Em registro' : 'Não iniciada'}</b></div>
                    {currentRow?.record?.completed_at && <small>Último fechamento: {new Date(currentRow.record.completed_at).toLocaleString('pt-BR')}</small>}
                  </div>
                  <div className="skda-interview-record-meta">
                    <label><span>Data efetiva da execução *</span><input type="date" value={interviewQuestionDraft.executionDate} onChange={(e)=>setInterviewQuestionDraft((current)=>({...current,executionDate:e.target.value}))}/><small>Independente da data planejada do encontro; pode ser corrigida posteriormente.</small></label>
                    <div><span>Encontro</span><b>{activeInterviewSession.code}</b><small>{activeInterviewSession.scheduled_start ? `Planejado para ${new Date(activeInterviewSession.scheduled_start).toLocaleDateString('pt-BR')}` : 'Sem data planejada'}</small></div>
                  </div>
                  <label><span>Prática observada / relato verificável</span><textarea rows={4} value={interviewQuestionDraft.observedPractice} onChange={(e)=>setInterviewQuestionDraft((current)=>({...current,observedPractice:e.target.value}))} placeholder="Registre o que a organização efetivamente faz, quem faz, frequência, abrangência e exemplo recente."/></label>
                  <label><span>Notas da conversa</span><textarea rows={4} value={interviewQuestionDraft.interviewNotes} onChange={(e)=>setInterviewQuestionDraft((current)=>({...current,interviewNotes:e.target.value}))} placeholder="Falas relevantes, contexto, responsáveis, datas, exceções e decisões."/></label>
                  <label><span>Evidências citadas ou mostradas</span><textarea rows={3} value={interviewQuestionDraft.evidenceCited} onChange={(e)=>setInterviewQuestionDraft((current)=>({...current,evidenceCited:e.target.value}))} placeholder="Documento, sistema, indicador, ata, registro, exemplo ou resultado mostrado durante a conversa."/></label>
                  <label><span>Evidências a disponibilizar</span><textarea rows={3} value={interviewQuestionDraft.evidenceRequested} onChange={(e)=>setInterviewQuestionDraft((current)=>({...current,evidenceRequested:e.target.value}))} placeholder="O que ficou pendente, quem deverá disponibilizar e para qual finalidade."/></label>
                  <label><span>Lacuna / contradição ainda aberta</span><textarea rows={3} value={interviewQuestionDraft.gapSummary} onChange={(e)=>setInterviewQuestionDraft((current)=>({...current,gapSummary:e.target.value}))} placeholder="Ex.: resposta D, mas ainda sem evidência de execução recorrente ou resultado."/></label>
                  <label><span>Saída desta questão *</span><select value={interviewQuestionDraft.outputType} onChange={(e)=>setInterviewQuestionDraft((current)=>({...current,outputType:e.target.value}))}><option value="">Selecione para concluir</option>{Object.entries(INTERVIEW_OUTPUT_TYPES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                  <label><span>Próximo passo</span><textarea rows={2} value={interviewQuestionDraft.nextAction} onChange={(e)=>setInterviewQuestionDraft((current)=>({...current,nextAction:e.target.value}))} placeholder="Validação, documento a receber, aprofundamento ou encaminhamento."/></label>
                  <div className="skda-interview-field-actions">
                    <button type="button" disabled={saving} onClick={() => void saveInterviewQuestionRecord('in_progress',false)}>Salvar rascunho</button>
                    <button type="button" disabled={saving} onClick={() => void saveInterviewQuestionRecord('skipped',true)}>Deixar para continuidade</button>
                    <button type="button" className="skda-primary" disabled={saving} onClick={() => void saveInterviewQuestionRecord('completed',true)}>Concluir e avançar</button>
                  </div>
                  <div className="skda-interview-field-actions secondary">
                    {canRegisterEvidence && <button type="button" onClick={() => { setEvidenceForm((current) => ({ ...current, interviewId:activeInterviewSession.id, checklistGroupCode:'entrevistas', description:`Evidência relacionada à questão ${activeInterviewQuestion.code} identificada durante ${activeInterviewSession.code}.` })); setShowEvidenceCreate(true) }}>Registrar evidência no Core</button>}
                    {canEditFindings && <button type="button" onClick={() => prepareFindingFromQuestion(activeInterviewQuestion)}>Preparar achado</button>}
                  </div>
                </section>}
              </div>
              {activeInterviewSession.status === 'in_progress' && <div className="skda-interview-session-close">
                <label><span>Notas gerais do encontro</span><textarea rows={2} value={interviewSessionNotes} onChange={(e)=>setInterviewSessionNotes(e.target.value)} placeholder="Síntese do encontro, participantes-chave, decisões e pendências transversais."/></label>
                <button type="button" disabled={saving} onClick={() => void finishInterviewSession()}>Encerrar encontro e preservar continuidade</button>
              </div>}
            </div>
          })()}
          {activePhase.code === 'DA-01' && <div className="skda-phase-workspace skda-closeout-workspace">
            <div className="skda-phase-workspace-head">
              <div>
                <h4>Fechamento pós-entrevistas</h4>
                <small>Consolide o que foi apurado nos encontros, registre a alternativa final do DA e valide questão a questão sem precisar reencenar as entrevistas no módulo.</small>
              </div>
              <div className="skda-closeout-head-actions">
                <button type="button" className={assessmentConsolidationMode ? 'skda-primary' : ''} onClick={() => { setAssessmentConsolidationMode((current)=>!current); setConsolidationStatus('pending'); setConsolidationQuestionId(null) }}>
                  {assessmentConsolidationMode ? 'Ocultar consolidação rápida' : 'Consolidar pós-entrevistas'}
                </button>
              </div>
            </div>
            {normalizeJourneyPhaseCode(selected.current_phase_code) === 'DA-00' && <div className="skda-closeout-phase-sync"><div><strong>Abertura ainda é a fase formal da Jornada</strong><span>As entrevistas já ocorreram, mas o fluxo governado ainda não registrou a conclusão da preparação. Regularize a abertura antes de concluir a fase diagnóstica.</span></div>{canManage && <button type="button" className="skda-primary" disabled={saving || !phaseReadiness['DA-00']?.ready} onClick={()=>void advanceJourneyPhase('DA-00')}>{phaseReadiness['DA-00']?.ready ? 'Concluir abertura e avançar para entrevistas' : 'Abertura ainda possui pendências críticas'}</button>}</div>}
            <div className="skda-closeout-scorecard">
              <article><span>Questões do instrumento</span><strong>{assessmentCloseout.total}</strong><small>24 Governança + 46 Gestão</small></article>
              <article><span>Avaliadas no DA</span><strong>{assessmentCloseout.evaluated}/{assessmentCloseout.total}</strong><small>{assessmentCloseout.pending} pendente(s)</small></article>
              <article><span>Validadas</span><strong>{assessmentCloseout.validated}/{assessmentCloseout.total}</strong><small>validação humana final</small></article>
              <article><span>Governança</span><strong>{assessmentCloseout.governanceEvaluated}/{assessmentCloseout.governanceTotal}</strong><small>questões avaliadas</small></article>
              <article><span>Gestão</span><strong>{assessmentCloseout.managementEvaluated}/{assessmentCloseout.managementTotal}</strong><small>questões avaliadas</small></article>
              <article><span>Entrevistas realizadas</span><strong>{assessmentCloseout.completedInterviews}/{Math.max(interviews.length,contractInterviewMeetings.length)}</strong><small>encontros ratificados</small></article>
            </div>
            <div className="skda-closeout-actions">
              {canEditInterviews && interviews.length === 0 && contractInterviewMeetings.length > 0 && <button type="button" className="skda-primary" disabled={saving} onClick={() => void materializeAndRatifyContractInterviews()}>Materializar e ratificar {contractInterviewMeetings.length} entrevistas realizadas</button>}
              {canEditInterviews && interviews.length > 0 && assessmentCloseout.completedInterviews < interviews.length && <button type="button" disabled={saving} onClick={() => void ratifyScheduledInterviewsAsCompleted()}>Ratificar entrevistas realizadas pela agenda</button>}
              {canValidateAssessment && assessmentCloseout.evaluated > assessmentCloseout.validated && <button type="button" disabled={saving} onClick={() => void validateAllReadyAssessments()}>Validar avaliações completas já registradas</button>}
              <button type="button" onClick={() => setAssessmentConsolidationMode(false)}>Abrir avaliação detalhada</button>
            </div>
            {assessmentConsolidationMode && <div className="skda-closeout-console">
              <div className="skda-closeout-filters">
                <label><span>Bloco</span><select value={consolidationBlock} onChange={(e)=>{setConsolidationBlock(e.target.value as 'ALL'|'GOVERNANCA'|'GESTAO');setConsolidationAxis('');setConsolidationQuestionId(null)}}>
                  <option value="ALL">Governança + Gestão</option>
                  <option value="GOVERNANCA">Governança</option>
                  <option value="GESTAO">Gestão</option>
                </select></label>
                <label><span>Eixo / critério</span><select value={consolidationAxis} onChange={(e)=>{setConsolidationAxis(e.target.value);setConsolidationQuestionId(null)}}>
                  <option value="">Todos</option>
                  {consolidationAxisOptions.map((axis)=><option key={axis} value={axis}>{axis}</option>)}
                </select></label>
                <label><span>Situação</span><select value={consolidationStatus} onChange={(e)=>{setConsolidationStatus(e.target.value as 'all'|'pending'|'draft'|'validated');setConsolidationQuestionId(null)}}>
                  <option value="pending">Pendentes de avaliação</option>
                  <option value="draft">Avaliadas, aguardando validação</option>
                  <option value="validated">Validadas</option>
                  <option value="all">Todas</option>
                </select></label>
                <label className="skda-closeout-question-picker"><span>Questão</span><select value={currentConsolidationQuestion?.id ?? ''} onChange={(e)=>setConsolidationQuestionId(e.target.value)}>
                  {consolidationQuestions.map((question)=><option key={question.id} value={question.id}>{question.code} · {question.axis_name || question.criterion_name || 'Sem eixo'}</option>)}
                </select></label>
              </div>
              {currentConsolidationQuestion ? (() => {
                const question=currentConsolidationQuestion
                const response=responses.find((item)=>item.question_id===question.id)
                const draft=assessmentDrafts[question.id] ?? { classification:'not_evaluated',answerText:'',rationale:'',confidenceLevel:'not_assessed',alternativeId:'' }
                const aaAnswer=selfAssessmentAnswers.find((item)=>item.question_id===question.id)
                const alternatives=questionAlternatives.filter((item)=>item.question_id===question.id)
                const selectedAlternative=alternatives.find((item)=>item.id===draft.alternativeId)
                const intelligence=evidenceQuestionIntelligence.filter((item)=>item.question_id===question.id)
                const fieldRecords=interviewQuestionRecords.filter((item)=>item.question_id===question.id && ['in_progress','completed','skipped'].includes(item.status))
                const expectations=questionEvidenceExpectations.filter((item)=>item.question_id===question.id)
                const sourceInterview=interviews.find((item)=>item.id===consolidationInterviewId) ?? suggestedInterviewForQuestion(question)
                const currentIndex=consolidationQuestions.findIndex((item)=>item.id===question.id)
                return <div className="skda-closeout-question">
                  <div className="skda-closeout-nav">
                    <button type="button" disabled={currentIndex<=0} onClick={()=>setConsolidationQuestionId(consolidationQuestions[currentIndex-1]?.id ?? null)}>← Anterior</button>
                    <span>{currentIndex+1} de {consolidationQuestions.length} no filtro atual</span>
                    <button type="button" disabled={currentIndex<0 || currentIndex>=consolidationQuestions.length-1} onClick={()=>setConsolidationQuestionId(consolidationQuestions[currentIndex+1]?.id ?? null)}>Próxima →</button>
                  </div>
                  <div className="skda-closeout-question-grid">
                    <section className="skda-closeout-reference">
                      <div className="skda-question-copy">
                        <small>{question.code}{question.axis_name ? ' · '+question.axis_name : ''}</small>
                        <strong>{question.question_text}</strong>
                        {question.criterion_name && <span>{question.criterion_name}</span>}
                      </div>
                      <div className="skda-closeout-aa">
                        <div><span>Autoavaliação declarada</span><b>{aaAnswer?.declared_code ?? '—'}</b></div>
                        <p>{aaAnswer?.declared_text ?? 'Resposta declarada não localizada.'}</p>
                        {aaAnswer?.rationale && <small>{aaAnswer.rationale}</small>}
                      </div>
                      <div className="skda-closeout-alternatives">
                        {alternatives.map((alternative)=><button type="button" key={alternative.id} className={draft.alternativeId===alternative.id?'active':''} disabled={!canEditAssessment || saving} onClick={()=>updateAssessmentDraft(question.id,{alternativeId:alternative.id})}>
                          <b>{alternative.code}</b><span>{alternative.alternative_text}</span>
                        </button>)}
                      </div>
                      <div className="skda-closeout-source">
                        <label><span>Entrevista / encontro de origem</span><select value={consolidationInterviewId || sourceInterview?.id || ''} onChange={(e)=>setConsolidationInterviewId(e.target.value)}>
                          <option value="">Sem encontro específico</option>
                          {interviews.map((interview)=><option key={interview.id} value={interview.id}>{interview.code} · {interview.title} · {interview.scheduled_start ? new Date(interview.scheduled_start).toLocaleDateString('pt-BR') : 'sem data'}</option>)}
                        </select></label>
                        {sourceInterview && <small>Planejado: {sourceInterview.scheduled_start ? new Date(sourceInterview.scheduled_start).toLocaleString('pt-BR') : '—'} · Realizado: {sourceInterview.actual_start ? new Date(sourceInterview.actual_start).toLocaleString('pt-BR') : 'a ratificar'}</small>}
                      </div>
                      <div className="skda-closeout-context">
                        <strong>Contexto já disponível</strong>
                        <span>{intelligence.length} correlação(ões) de inteligência · {expectations.length} expectativa(s) de evidência · {fieldRecords.length} registro(s) de campo</span>
                        {fieldRecords.slice(-3).map((record)=><p key={record.id}>{record.observed_practice || record.interview_notes || record.evidence_cited || record.gap_summary || 'Registro de entrevista sem síntese textual.'}</p>)}
                        {intelligence.filter((item)=>item.diagnostic_hypothesis || item.gap_description).slice(0,4).map((item)=><p key={item.id}>{item.diagnostic_hypothesis || item.gap_description}</p>)}
                      </div>
                    </section>
                    <section className="skda-closeout-entry">
                      <div className="skda-closeout-entry-head">
                        <div><span>Resultado consolidado do DA</span><b>{selectedAlternative?.code ?? 'Alternativa ainda não definida'}</b></div>
                        <small>{response?.response_status==='validated' ? 'Validada' : response?.evaluated_at ? 'Avaliada · aguardando validação' : 'Pendente de avaliação'}</small>
                      </div>
                      <label><span>Constatação / resposta consolidada</span><textarea rows={6} value={draft.answerText} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{answerText:e.target.value})} placeholder="Registre a conclusão objetiva após entrevistas e evidências: prática existente, execução, abrangência, resultado e limitações."/></label>
                      <div className="skda-closeout-entry-row">
                        <label><span>Classificação</span><select value={draft.classification} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{classification:e.target.value})}>{Object.entries(CLASSIFICATION).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                        <label><span>Confiança</span><select value={draft.confidenceLevel} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{confidenceLevel:e.target.value})}>{Object.entries(CONFIDENCE_LEVELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                      </div>
                      <label><span>Fundamentação / por que esta alternativa</span><textarea rows={5} value={draft.rationale} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{rationale:e.target.value})} placeholder="Fundamente com o que foi relatado, evidências apresentadas, lacunas e limites de suficiência."/></label>
                      <div className="skda-closeout-entry-actions">
                        {canEditAssessment && <button type="button" disabled={saving} onClick={()=>void saveAssessment(question,{sourceInterviewId:consolidationInterviewId || sourceInterview?.id,moveNext:true})}>Salvar rascunho e próxima</button>}
                        {canEditAssessment && canValidateAssessment && <button type="button" className="skda-primary" disabled={saving} onClick={()=>void saveAssessment(question,{validateAfter:true,sourceInterviewId:consolidationInterviewId || sourceInterview?.id,moveNext:true})}>Salvar, validar e próxima</button>}
                        {canEditFindings && (response?.evaluated_at || draft.classification!=='not_evaluated') && <button type="button" onClick={()=>prepareFindingFromQuestion(question)}>Preparar achado</button>}
                      </div>
                      {response?.validated_at && <small className="skda-closeout-validation">Última validação: {new Date(response.validated_at).toLocaleString('pt-BR')}</small>}
                    </section>
                  </div>
                </div>
              })() : <div className="skda-closeout-empty">
                <strong>Nenhuma questão nesta situação.</strong>
                <span>Altere o filtro de situação para continuar a consolidação ou revisar questões já validadas.</span>
              </div>}
            </div>}
          </div>}
          {activePhase.code === 'DA-01' && !assessmentConsolidationMode && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><div><h4>Avaliação por questão</h4><small>Parta da Autoavaliação importada, ratifique ou revise a alternativa do instrumento, complemente a constatação e registre confiança e fundamentação.</small></div><span>{selectedCatalog ? selectedCatalog.name : 'Catálogo não definido'}</span></div>
            <div className="skda-assessment-method-note"><strong>Escala do instrumento</strong><span>No PDGC, a avaliação da questão usa as alternativas oficiais A–D. O DA não converte artificialmente A–D em nota de 0 a 100; percentuais permanecem restritos aos índices e resultados oficiais fornecidos pelo próprio instrumento.</span></div>
            {!selected.catalog_version_id ? <p className="skda-phase-empty">Defina o catálogo na fase DA-00 antes de iniciar a avaliação.</p> : questions.length === 0 ? <p className="skda-phase-empty">O catálogo selecionado ainda não possui questões disponíveis.</p> : <div className="skda-question-list skda-assessment-list">
              {questions.map((question) => {
                const response = responses.find((item) => item.question_id === question.id)
                const intelligenceRows = evidenceQuestionIntelligence.filter((item) => item.question_id === question.id)
                const reviewedRows = intelligenceRows.filter((item) => ['proposed','validated','rejected'].includes(item.analysis_status))
                const queuedRows = intelligenceRows.filter((item) => item.analysis_status === 'queued' || item.analysis_status === 'processing' || item.analysis_status === 'pending')
                const draft = assessmentDrafts[question.id] ?? { classification:'not_evaluated', answerText:'', rationale:'', confidenceLevel:'not_assessed', alternativeId:'' }
                const alternatives = questionAlternatives.filter((item) => item.question_id === question.id)
                const aaAnswer = selfAssessmentAnswers.find((item) => item.question_id === question.id)
                const selectedAlternative = alternatives.find((item) => item.id === draft.alternativeId)
                const currentAnswerLevel = (selectedAlternative?.code ?? aaAnswer?.declared_code ?? '').toUpperCase()
                const expectationRows = questionEvidenceExpectations.filter((item) => item.question_id === question.id)
                const declaredExpectations = expectationRows.filter((item) => currentAnswerLevel && item.answer_level === currentAnswerLevel && ['support_declared_answer','both'].includes(item.purpose))
                const currentAnswerRank = ANSWER_LEVEL_RANK[currentAnswerLevel] ?? 0
                const evolutionExpectations = currentAnswerRank < 4
                  ? expectationRows.filter((item) => (ANSWER_LEVEL_RANK[item.answer_level] ?? 0) > currentAnswerRank && ['evolution_to_d','both'].includes(item.purpose))
                  : []
                return <article id={'skda-question-'+question.id} key={question.id} className="skda-assessment-card">
                  <div className="skda-question-copy"><small>{question.code}{question.axis_name ? ' · '+question.axis_name : ''}</small><strong>{question.question_text}</strong>{question.criterion_name && <span>{question.criterion_name}</span>}</div>
                  {aaAnswer && <div className="skda-aa-guidance"><strong>Autoavaliação importada · {aaAnswer.declared_code ?? 'sem alternativa'}</strong><span>{aaAnswer.declared_text ?? 'Resposta declarada importada sem texto descritivo.'}</span></div>}
                  {assistedSelfAssessmentActive && question.guidance && <div className="skda-aa-guidance"><strong>Orientação metodológica da questão</strong><span>{question.guidance}</span></div>}
                  <div className="skda-expected-evidence-panel">
                    <div className="skda-expected-evidence-head"><strong>Matriz de evidências esperadas</strong><span>{expectationRows.length > 0 ? 'Curadoria aplicável ao ramo/atividade' : 'Curadoria ainda não cadastrada para esta questão'}</span></div>
                    {expectationRows.length > 0 && <>
                      <section>
                        <div className="skda-expected-evidence-section-head"><b>{currentAnswerLevel ? `Para sustentar a resposta ${currentAnswerLevel}` : 'Para sustentar a resposta declarada'}</b><span>{declaredExpectations.length}</span></div>
                        {declaredExpectations.length === 0 ? <small>Nenhuma evidência governada foi vinculada a este nível de resposta.</small> : <div className="skda-expected-evidence-list">{declaredExpectations.map((item)=><article key={item.expectation_id}><div><strong>{item.title}</strong>{item.description && <span>{item.description}</span>}<small>{EXPECTATION_DIMENSION_LABELS[item.evidence_dimension] ?? item.evidence_dimension} · {EXPECTATION_NECESSITY_LABELS[item.necessity] ?? item.necessity}{item.branch_code ? ` · Ramo ${item.branch_code}` : ''}{item.activity_scope ? ` · Atividade ${item.activity_scope}` : ''}</small></div><b>{item.answer_level}</b></article>)}</div>}
                      </section>
                      {currentAnswerLevel !== 'D' && <section className="is-evolution">
                        <div className="skda-expected-evidence-section-head"><b>Para avançar até D</b><span>{evolutionExpectations.length}</span></div>
                        {evolutionExpectations.length === 0 ? <small>Ainda não há evidências adicionais curadas para o caminho até D.</small> : <div className="skda-expected-evidence-list">{evolutionExpectations.map((item)=><article key={item.expectation_id}><div><strong>{item.title}</strong>{item.description && <span>{item.description}</span>}<small>{EXPECTATION_DIMENSION_LABELS[item.evidence_dimension] ?? item.evidence_dimension} · {EXPECTATION_NECESSITY_LABELS[item.necessity] ?? item.necessity}{item.branch_code ? ` · Ramo ${item.branch_code}` : ''}{item.activity_scope ? ` · Atividade ${item.activity_scope}` : ''}</small></div><b>{item.answer_level}</b></article>)}</div>}
                      </section>}
                    </>}
                  </div>
                  <div className="skda-assessment-status"><span>Estado</span><b>{RESPONSE_STATUS[response?.response_status ?? 'draft'] ?? response?.response_status}</b>{typeof response?.metadata?.last_interview_code === 'string' && <small>Encontro: {response.metadata.last_interview_code}</small>}{response?.validated_at && <small>Validada em {new Date(response.validated_at).toLocaleString('pt-BR')}</small>}</div>
                  {intelligenceRows.length > 0 && <div className="skda-question-intelligence">
                    <div className="skda-question-intelligence-head">
                      <strong>Inteligência de evidências</strong>
                      <span>{intelligenceRows.length} evidência(s) · {queuedRows.length} em análise · {reviewedRows.filter((item)=>item.analysis_status==='proposed').length} proposta(s) · {reviewedRows.filter((item)=>item.analysis_status==='validated').length} validada(s) · {reviewedRows.filter((item)=>item.analysis_status==='rejected').length} refutada(s)</span>
                    </div>
                    {queuedRows.length > 0 && canEditAssessment && <div className="skda-intelligence-queue">
                      {queuedRows.map((item) => {
                        const asset=evidenceAssets.find((row)=>row.id===item.evidence_asset_id)
                        return <span key={item.id}><b>{asset?.title || 'Evidência vinculada'}</b><button type="button" disabled={saving} onClick={()=>openIntelligenceEditor(item)}>Analisar</button></span>
                      })}
                    </div>}
                    {reviewedRows.length === 0 ? <p>As evidências vinculadas ainda não possuem hipótese proposta para esta questão.</p> : reviewedRows.map((item) => <article key={item.id}>
                      <div className="skda-question-intelligence-state">
                        <b>{item.evidence_coverage_status === 'covers' ? 'Contempla' : item.evidence_coverage_status === 'partially_covers' ? 'Contempla parcialmente' : item.evidence_coverage_status === 'does_not_cover' ? 'Não contempla' : item.evidence_coverage_status === 'needs_complement' ? 'Necessita complemento' : 'Em análise'}</b>
                        {item.confidence_score != null && <span>Confiança {Number(item.confidence_score).toFixed(0)}%</span>}
                      </div>
                      <p><strong>Estado da prática:</strong> {PRACTICE_STATE_LABELS[item.practice_state] ?? item.practice_state}{(() => {
                        const index=PRACTICE_STATE_ORDER.indexOf(item.practice_state as typeof PRACTICE_STATE_ORDER[number])
                        const next=index >= 0 && index < PRACTICE_STATE_ORDER.length - 1 ? PRACTICE_STATE_ORDER[index + 1] : null
                        return next ? <> · <strong>Próximo nível:</strong> {PRACTICE_STATE_LABELS[next]}</> : null
                      })()}</p>
                      {item.diagnostic_hypothesis && <p><strong>Hipótese:</strong> {item.diagnostic_hypothesis}</p>}
                      {item.gap_description && <p><strong>Lacuna:</strong> {item.gap_description}</p>}
                      {item.complement_needed && <p><strong>Complemento necessário:</strong> {item.complement_needed}</p>}
                      {item.improvement_suggestion && <p><strong>Melhoria sugerida:</strong> {item.improvement_suggestion}</p>}
                      {assistedSelfAssessmentActive && item.self_assessment_guidance && <p><strong>Orientação para AA:</strong> {item.self_assessment_guidance}</p>}
                      {item.interview_question_suggestion && <p><strong>Pergunta sugerida para entrevista:</strong> {item.interview_question_suggestion}</p>}
                      <div className="skda-intelligence-actions">
                        {item.analysis_status === 'proposed' && canEditAssessment && <button type="button" disabled={saving} onClick={()=>openIntelligenceEditor(item)}>Editar análise</button>}
                        {item.analysis_status === 'proposed' && canValidateAssessment && <>
                          {intelligenceReviewId === item.id ? <div className="skda-intelligence-review">
                            <textarea rows={2} value={intelligenceReviewNote} onChange={(e)=>setIntelligenceReviewNote(e.target.value)} placeholder="Justifique a validação ou refutação desta hipótese." />
                            <div><button type="button" disabled={saving} onClick={() => void reviewIntelligence(item,'validated')}>Validar hipótese</button><button type="button" disabled={saving} onClick={() => void reviewIntelligence(item,'rejected')}>Refutar</button><button type="button" onClick={() => {setIntelligenceReviewId(null);setIntelligenceReviewNote('')}}>Cancelar</button></div>
                          </div> : <button type="button" onClick={() => {setIntelligenceReviewId(item.id);setIntelligenceReviewNote('Validação técnica da hipótese a partir das evidências disponíveis e do contexto da questão.')}}>Revisar hipótese</button>}
                        </>}
                        {item.analysis_status === 'validated' && typeof item.metadata?.finding_id !== 'string' && canEditFindings && <button type="button" className="skda-primary" disabled={saving} onClick={() => void convertIntelligenceToFinding(item)}>Converter em achado</button>}
                        {typeof item.metadata?.finding_id === 'string' && <span>Incorporada ao achado</span>}
                        {item.analysis_status === 'rejected' && <span>Hipótese refutada</span>}
                      </div>
                    </article>)}
                  </div>}
                  <div className="skda-assessment-fields">
                    <label className="wide"><span>Constatação / resposta</span><textarea rows={3} value={draft.answerText} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{answerText:e.target.value})}/></label>
                    <label><span>Classificação</span><select value={draft.classification} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{classification:e.target.value})}>{Object.entries(CLASSIFICATION).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label><span>Alternativa do DA</span><select value={draft.alternativeId} disabled={!canEditAssessment || saving || alternatives.length === 0} onChange={(e)=>updateAssessmentDraft(question.id,{alternativeId:e.target.value})}><option value="">Não definida</option>{alternatives.map((alternative)=><option key={alternative.id} value={alternative.id}>{alternative.code} — {alternative.alternative_text}</option>)}</select></label>
                    <label><span>Confiança</span><select value={draft.confidenceLevel} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{confidenceLevel:e.target.value})}>{Object.entries(CONFIDENCE_LEVELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="wide"><span>Fundamentação</span><textarea rows={2} value={draft.rationale} disabled={!canEditAssessment || saving} onChange={(e)=>updateAssessmentDraft(question.id,{rationale:e.target.value})}/></label>
                  </div>
                  <div className="skda-assessment-actions">
                    {canEditAssessment && <button type="button" className="skda-primary" disabled={saving} onClick={()=>void saveAssessment(question)}>{saving?'Salvando...':response?.response_status === 'validated' ? 'Salvar e reabrir avaliação' : 'Salvar avaliação'}</button>}
                    {canValidateAssessment && response && response.response_status !== 'validated' && <button type="button" className="skda-secondary-action" disabled={saving} onClick={()=>void validateAssessment(question)}>Validar avaliação</button>}
                    {canEditFindings && (response?.evaluated_at || draft.classification !== 'not_evaluated') && <button type="button" disabled={saving} onClick={() => prepareFindingFromQuestion(question)}>Registrar achado desta questão</button>}
                  </div>
                </article>
              })}
            </div>}
          </div>}
          {activePhase.code === 'DA-01' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Achados do diagnóstico</h4>{canEditFindings && <button type="button" className="skda-primary" onClick={() => openFindingEditor()}>Novo achado</button>}</div>
            {findings.length === 0 ? <p className="skda-phase-empty">Nenhum achado registrado.</p> : <div className="skda-finding-list">
              {findings.map((finding) => {
                const owner = organizationUsers.find((user) => user.user_id === finding.owner_user_id)
                return <article key={finding.id}>
                  <div><small>{FINDING_TYPES[finding.finding_type] ?? finding.finding_type} · Prioridade {PRIORITIES[finding.priority] ?? finding.priority}</small><strong>{finding.title}</strong><span>{finding.description}</span></div>
                  <div><b>{finding.status === 'open' ? 'Aberto' : finding.status}</b>{finding.question_id && <span>Origem: questão</span>}{finding.interview_id && <span>Origem: entrevista</span>}{owner && <span>Responsável: {owner.user_display_name || owner.user_email}</span>}{finding.due_date && <span>Prazo: {new Date(finding.due_date+'T00:00:00').toLocaleDateString('pt-BR')}</span>}{canEditFindings && finding.status === 'open' && <button type="button" onClick={() => openFindingEditor(finding)}>Editar / completar</button>}</div>
                </article>
              })}
            </div>}
          </div>}
          {activePhase.code === 'DA-02' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head"><h4>Recomendações para devolutiva</h4><span>{findings.filter((finding) => Boolean(finding.recommendation)).length} recomendação(ões)</span></div>
            {findings.filter((finding) => finding.finding_type !== 'strength' && finding.status !== 'dismissed' && !finding.recommendation?.trim()).length > 0 && <div className="skda-action-plan-unallocated">
              <div className="skda-phase-workspace-head"><h4>Recomendações a completar</h4><span>Necessárias para concluir a fase</span></div>
              <div className="skda-finding-list">
                {findings.filter((finding) => finding.finding_type !== 'strength' && finding.status !== 'dismissed' && !finding.recommendation?.trim()).map((finding) => <article key={'missing-rec-'+finding.id}>
                  <div><small>{FINDING_TYPES[finding.finding_type] ?? finding.finding_type} · {PRIORITIES[finding.priority] ?? finding.priority}</small><strong>{finding.title}</strong><span>{finding.description}</span></div>
                  <div className="skda-finding-actions"><b>Recomendação pendente</b>{canEditFindings && <button type="button" className="skda-primary" onClick={() => openFindingEditor(finding)}>Completar recomendação</button>}</div>
                </article>)}
              </div>
            </div>}
            {findings.filter((finding) => Boolean(finding.recommendation)).length === 0 ? <p className="skda-phase-empty">Nenhuma recomendação registrada nos achados.</p> : <div className="skda-finding-list">
              {findings.filter((finding) => Boolean(finding.recommendation)).map((finding) => <article key={finding.id}>
                <div><small>{FINDING_TYPES[finding.finding_type] ?? finding.finding_type} · {PRIORITIES[finding.priority] ?? finding.priority}</small><strong>{finding.title}</strong><span>{finding.recommendation}</span></div>
                <div className="skda-finding-actions">
                  <b>{finding.status === 'accepted' ? 'Aceita' : finding.status === 'in_action' ? 'Em ação' : 'Recomendação'}</b>
                  <span>Origem rastreável no achado</span>
                  {canEditFindings && finding.status === 'open' && <button type="button" onClick={() => openFindingEditor(finding)}>Editar recomendação</button>}
                  {finding.status === 'open' && canValidateFindings && <button type="button" onClick={() => openValidation(finding)}>Aceitar recomendação</button>}
                  {(finding.status === 'accepted' || finding.status === 'in_action') && <div className="skda-cycle-actions skda-priority-cycle-actions"><span>Priorizar em:</span>{[1,2,3].map((cycle) => {
                    const allocation = actionPlanAllocations.find((item) => item.finding_id === finding.id)
                    return <button type="button" key={cycle} className={allocation?.cycle_number === cycle ? 'active' : ''} disabled={saving} onClick={() => void assignActionCycle(finding.id,cycle)}>Ciclo {cycle}</button>
                  })}</div>}
                  {finding.status === 'accepted' && canCreateTactical && <button type="button" className="skda-primary" onClick={() => openTacticalConversion(finding)}>Converter em iniciativa</button>}
                </div>
              </article>)}
            </div>}
          </div>}
          {activePhase.code === 'DA-03' && <div className="skda-phase-workspace">
            <div className="skda-phase-workspace-head">
              <div>
                <h4>Plano de Ação</h4>
                <small>O Plano de Ação distingue a iniciativa-base que executa a própria Jornada das iniciativas derivadas de recomendações aprovadas nos Ciclos 1–3. A execução integral pertence à Gestão Tática/Operacional transversal.</small>
              </div>
              <span>{actionPlanAllocations.length} ação(ões) priorizada(s)</span>
            </div>
            {journeyInitiative && <section className="skda-journey-project-card">
              <div className="skda-journey-project-main">
                <small>Iniciativa-base da Jornada</small>
                <strong>{journeyInitiative.code} — {journeyInitiative.name}</strong>
                <span>{journeyInitiative.description || 'Projeto transversal que materializa a execução da Jornada de Diagnóstico Assistido.'}</span>
                <div className="skda-journey-project-meta">
                  <span>Classe: {INITIATIVE_CLASSES[journeyInitiative.initiative_class] ?? journeyInitiative.initiative_class}</span>
                  <span>Situação: {journeyInitiative.status === 'planned' ? 'Planejada' : journeyInitiative.status === 'in_progress' ? 'Em andamento' : journeyInitiative.status === 'completed' ? 'Concluída' : journeyInitiative.status}</span>
                  <span>Período: {journeyInitiative.start_date ? new Date(journeyInitiative.start_date+'T12:00:00').toLocaleDateString('pt-BR') : '—'} a {journeyInitiative.target_end_date ? new Date(journeyInitiative.target_end_date+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                  <span>EAP: {journeyEap.filter((item)=>!item.parent_action_id).length} MegaFases</span>
                </div>
              </div>
              <div className="skda-journey-project-progress">
                <b>{Math.round(Number(journeyInitiative.progress || 0))}%</b>
                <span><i style={{width:`${Math.max(0,Math.min(100,Number(journeyInitiative.progress || 0)))}%`}} /></span>
                <small>Execução da própria Jornada · não pertence aos Ciclos 1–3</small>
              </div>
            </section>}
            {findings.filter((finding) => finding.status === 'accepted' || finding.status === 'in_action').length === 0 ? <p className="skda-phase-empty">Nenhuma recomendação aprovada está disponível para os Ciclos 1–3 do Plano de Ação.</p> : <>
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
              <div className="skda-return-governance">
                <div className="skda-phase-workspace-head">
                  <div><h4>Devolutiva e encerramento</h4><small>A Jornada só é concluída quando a devolutiva e suas decisões estão formalmente registradas e validadas.</small></div>
                  <span>{journeyArtifacts.filter((item) => item.macrophase_code === 'MF10' && ['validated','validated_with_reservations'].includes(item.status)).length}/3 validado(s)</span>
                </div>
                <div className="skda-artifact-grid">
                  {journeyArtifacts.filter((item) => item.macrophase_code === 'MF10').map((artifact) => <article key={artifact.id}>
                    <div><small>{artifact.artifact_code}</small><strong>{artifact.title}</strong><span>{artifact.purpose || 'Entregável de devolutiva e continuidade.'}</span><span><button type="button" onClick={() => void openJourneyArtifact(artifact)}>Abrir governança</button></span></div>
                    <div className="skda-artifact-state"><b>{ARTIFACT_STATUS[artifact.status] ?? artifact.status}</b><span>v{artifact.current_version_number || 0}</span></div>
                  </article>)}
                </div>
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
      onActivate:() => {
        if (!selected) return
        if (PHASES.some((phase) => phase.code === activePhaseCode) && activePhaseCode !== 'DA-03') return
        const currentJourneyPhase = normalizeJourneyPhaseCode(selected.current_phase_code)
        setActivePhaseCode(currentJourneyPhase === 'DA-03' ? 'DA-02' : currentJourneyPhase)
      },
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
        <div className="skda-user-menu">
          <button
            type="button"
            className="skda-shell-user skda-shell-user-button"
            onClick={() => setUserMenuOpen((current) => !current)}
            aria-label="Abrir menu do usuário"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            <div className="skda-shell-avatar" aria-hidden="true">
              {props.userAvatarUrl ? <img src={props.userAvatarUrl} alt="" /> : props.userDisplayName.slice(0,2).toUpperCase()}
            </div>
            <div>
              <strong>{props.userDisplayName}</strong>
              <span>{props.userRoleName}</span>
            </div>
            <span className="skda-user-menu-chevron" aria-hidden="true">▾</span>
          </button>
          {userMenuOpen && <>
            <button type="button" className="skda-user-menu-backdrop" aria-label="Fechar menu do usuário" onClick={() => setUserMenuOpen(false)} />
            <div className="skda-user-menu-popover" role="menu" aria-label="Conta e administração">
              <div className="skda-user-menu-identity"><strong>{props.userDisplayName}</strong><span>{props.userEmail}</span></div>
              <div className="skda-user-menu-section-label">CONTA</div>
              <button type="button" role="menuitem" disabled={!props.onOpenUserProfile} onClick={() => { setUserMenuOpen(false); props.onOpenUserProfile?.() }}>Meu perfil</button>
              <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); props.onToggleTheme() }}>{props.platformTheme === 'dark' ? 'Aparência: usar modo claro' : 'Aparência: usar modo escuro'}</button>
              {(props.isOrganizationAdmin || props.isPlatformSuperAdmin) && (props.onOpenOrganizationAdmin || props.onOpenOrganizationUsers) && <>
                <div className="skda-user-menu-section-label">ORGANIZAÇÃO</div>
                {props.onOpenOrganizationUsers && <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); props.onOpenOrganizationUsers?.() }}>Usuários e acessos</button>}
                {props.onOpenOrganizationAdmin && <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); props.onOpenOrganizationAdmin?.() }}>Administração da Organização</button>}
              </>}
              {props.isPlatformSuperAdmin && props.onOpenPlatformAdmin && <>
                <div className="skda-user-menu-section-label">PLATAFORMA</div>
                <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); props.onOpenPlatformAdmin?.() }}>Administração da Plataforma</button>
              </>}
              <div className="skda-user-menu-section-label">DIAGNÓSTICO ASSISTIDO · SK-DA</div>
              {(props.isOrganizationAdmin || props.isPlatformSuperAdmin) && props.onOpenOrganizationUsers && <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); props.onOpenOrganizationUsers?.() }}>Administração do SK-DA</button>}
              <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); setActivePhaseCode('OVERVIEW') }}>Visão Geral do SK-DA</button>
              <button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); setActivePhaseCode('AGENDA') }}>Agenda do SK-DA</button>
              {props.onLogout && <button type="button" role="menuitem" className="skda-user-menu-logout" onClick={() => { setUserMenuOpen(false); void props.onLogout?.() }}>Sair</button>}
            </div>
          </>}
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
            {!selected && isOverview && <section className="skda-diagnosis-switcher">{primary}</section>}
            {secondary}
          </div>
        }
      />
    </ApplicationShell>
    {intelligenceEditId && (() => {
      const item=evidenceQuestionIntelligence.find((row)=>row.id===intelligenceEditId)
      const question=item ? questions.find((row)=>row.id===item.question_id) : null
      const asset=item ? evidenceAssets.find((row)=>row.id===item.evidence_asset_id) : null
      if (!item) return null
      return <div className="skda-modal-backdrop">
        <section className="skda-modal skda-modal-wide" role="dialog" aria-modal="true">
          <div className="skda-modal-head"><div><p className="skda-eyebrow">Inteligência organizacional</p><h2>Analisar evidência × questão</h2></div><button type="button" onClick={()=>setIntelligenceEditId(null)}>×</button></div>
          <div className="skda-intelligence-editor-context"><span><b>Questão:</b> {question?.code ?? '—'} · {question?.question_text ?? 'Questão não localizada'}</span><span><b>Evidência:</b> {asset?.title ?? 'Ativo do Core'}</span></div>
          <div className="skda-form-grid">
            <label><span>Cobertura da evidência</span><select value={intelligenceForm.evidenceCoverageStatus} onChange={(e)=>setIntelligenceForm((v)=>({...v,evidenceCoverageStatus:e.target.value}))}><option value="under_analysis">Em análise</option><option value="covers">Contempla</option><option value="partially_covers">Contempla parcialmente</option><option value="does_not_cover">Não contempla</option><option value="needs_complement">Necessita complemento</option><option value="not_applicable">Não aplicável</option></select></label>
            <label><span>Estado da prática</span><select value={intelligenceForm.practiceState} onChange={(e)=>setIntelligenceForm((v)=>({...v,practiceState:e.target.value}))}><option value="not_assessed">Não avaliada</option><option value="exists">Existe / estruturada</option><option value="applied">Aplicada</option><option value="recurrent">Recorrente</option><option value="broad">Abrangente</option><option value="controlled">Controlada</option><option value="result_oriented">Orientada a resultados</option><option value="learning_improvement">Aprendizado e melhoria</option></select></label>
            <label><span>Confiança (0–100)</span><input type="number" min="0" max="100" value={intelligenceForm.confidenceScore} onChange={(e)=>setIntelligenceForm((v)=>({...v,confidenceScore:e.target.value}))}/></label>
            <label className="wide"><span>Hipótese diagnóstica *</span><textarea rows={4} value={intelligenceForm.diagnosticHypothesis} onChange={(e)=>setIntelligenceForm((v)=>({...v,diagnosticHypothesis:e.target.value}))} placeholder="O que esta evidência sugere, sem confundir existência de artefato com implantação ou efetividade."/></label>
            <label className="wide"><span>Lacuna / ponto a confirmar</span><textarea rows={3} value={intelligenceForm.gapDescription} onChange={(e)=>setIntelligenceForm((v)=>({...v,gapDescription:e.target.value}))}/></label>
            <label className="wide"><span>Pergunta sugerida para entrevista</span><textarea rows={3} value={intelligenceForm.interviewQuestionSuggestion} onChange={(e)=>setIntelligenceForm((v)=>({...v,interviewQuestionSuggestion:e.target.value}))} placeholder="Pergunta que confirme, aprofunde ou refute a hipótese."/></label>
            <label className="wide"><span>Melhoria sugerida</span><textarea rows={3} value={intelligenceForm.improvementSuggestion} onChange={(e)=>setIntelligenceForm((v)=>({...v,improvementSuggestion:e.target.value}))}/></label>
            <label className="wide"><span>Justificativa da análise *</span><textarea rows={3} value={intelligenceForm.reviewNote} onChange={(e)=>setIntelligenceForm((v)=>({...v,reviewNote:e.target.value}))}/></label>
          </div>
          <div className="skda-evidence-loop-note"><strong>Regra metodológica</strong><span>Esta etapa cria ou revisa uma hipótese. Ela ainda não é um achado formal. A hipótese precisa ser validada ou refutada e somente uma inteligência validada pode ser convertida em achado.</span></div>
          {error && <div className="skda-alert">{error}</div>}
          <div className="skda-modal-actions"><button type="button" onClick={()=>setIntelligenceEditId(null)}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={()=>void saveIntelligenceProposal()}>{saving?'Salvando...':'Salvar hipótese proposta'}</button></div>
        </section>
      </div>
    })()}
    {artifactDetail && <div className="skda-modal-backdrop">
      <section className="skda-modal skda-modal-wide" role="dialog" aria-modal="true">
        <div className="skda-modal-head"><div><p className="skda-eyebrow">{artifactDetail.artifact.macrophase_code || 'Jornada DA'} · {artifactDetail.artifact.artifact_code}</p><h2>{artifactDetail.artifact.title}</h2></div><button type="button" onClick={() => setArtifactDetail(null)}>×</button></div>
        <p>{artifactDetail.artifact.purpose || 'Entregável metodológico governado da Jornada DA.'}</p>
        <div className="skda-artifact-detail-grid">
          <article><small>Situação</small><strong>{ARTIFACT_STATUS[artifactDetail.artifact.status] ?? artifactDetail.artifact.status}</strong></article>
          <article><small>Versão atual</small><strong>v{artifactDetail.artifact.current_version_number || 0}</strong></article>
          <article><small>Versões registradas</small><strong>{artifactDetail.versions.length}</strong></article>
          <article><small>Validações</small><strong>{artifactDetail.validations.length}</strong></article>
          <article><small>Evidências vinculadas</small><strong>{artifactDetail.evidence_links.length}</strong></article>
          <article><small>Registros de auditoria</small><strong>{artifactDetail.audit.length}</strong></article>
        </div>
        <div className="skda-artifact-governance-note"><strong>Ciclo de governança</strong><span>Planejado → Em preparação → Em validação → Submetido → Validado. A validação humana é obrigatória; produção de documento não equivale a aprovação nem institucionalização.</span></div>
        {canManage && <div className="skda-artifact-version-editor">
          <label><span>Conteúdo governado do entregável</span><textarea rows={12} value={artifactDraftContent} onChange={(e)=>setArtifactDraftContent(e.target.value)} placeholder="Estruture aqui o conteúdo-base do entregável em texto/Markdown. Cada gravação cria uma nova versão; não sobrescreve o histórico."/></label>
          <label><span>Resumo / justificativa da nova versão *</span><input value={artifactVersionSummary} onChange={(e)=>setArtifactVersionSummary(e.target.value)} placeholder="Ex.: Consolidação após entrevistas de Governança e evidências complementares."/></label>
          <div className="skda-artifact-status-actions"><button type="button" className="skda-primary" disabled={saving} onClick={() => void createJourneyArtifactVersion()}>{saving ? 'Gravando...' : 'Criar nova versão'}</button></div>
        </div>}
        {canManage && <div className="skda-artifact-status-editor">
          <label><span>Justificativa da mudança *</span><textarea rows={3} value={artifactStatusReason} onChange={(e)=>setArtifactStatusReason(e.target.value)} placeholder="Registre o motivo, decisão ou evidência que sustenta a mudança de situação."/></label>
          <div className="skda-artifact-status-actions">
            {[
              ['in_preparation','Iniciar preparação'],
              ['in_review','Enviar para validação'],
              ['submitted','Registrar submissão'],
              ['validated','Validar'],
              ['validated_with_reservations','Validar com ressalvas'],
            ].filter(([status]) => status !== artifactDetail.artifact.status).map(([status,label]) => <button type="button" key={status} disabled={saving} onClick={() => void updateJourneyArtifactStatus(status)}>{label}</button>)}
          </div>
        </div>}
        {artifactDetail.audit.length > 0 && <div className="skda-artifact-audit"><strong>Últimos registros</strong>{artifactDetail.audit.slice(0,5).map((row,index) => <span key={String(row.id ?? index)}>{String(row.action_description ?? row.action_code ?? 'Alteração registrada')}</span>)}</div>}
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions"><button type="button" onClick={() => setArtifactDetail(null)}>Fechar</button></div>
      </section>
    </div>}
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
        <div className="skda-modal-head"><div><p className="skda-eyebrow">Entrevistas e diagnóstico</p><h2>{editingFindingId ? 'Editar achado' : 'Registrar achado'}</h2></div><button type="button" onClick={() => {setShowFindingCreate(false);setEditingFindingId(null)}}>×</button></div>
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
        <div className="skda-modal-actions"><button type="button" onClick={() => {setShowFindingCreate(false);setEditingFindingId(null)}}>Cancelar</button><button type="button" className="skda-primary" disabled={saving} onClick={() => void createFinding()}>{saving?'Salvando...':editingFindingId ? 'Salvar alterações' : 'Registrar achado'}</button></div>
      </section>
    </div>}
    {showFolderEvidenceScan && selected && <div className="skda-modal-backdrop">
      <section className="skda-modal skda-modal-wide skda-folder-scan-modal" role="dialog" aria-modal="true">
        <div className="skda-modal-head">
          <div><p className="skda-eyebrow">Entrada inteligente de evidências</p><h2>Varrer pasta de evidências</h2></div>
          <button type="button" disabled={saving} onClick={() => setShowFolderEvidenceScan(false)}>×</button>
        </div>
        <p>Selecione uma pasta da organização. O SK-DA percorre subpastas, elimina duplicidades por hash, classifica os documentos por domínio e sugere as questões mais aderentes. As associações entram como <strong>sugestões pendentes de validação humana</strong>, nunca como conclusão diagnóstica.</p>
        <div className="skda-folder-scan-picker">
          <label>
            <span>Pasta a analisar</span>
            <input
              type="file"
              multiple
              {...({ webkitdirectory:'', directory:'' } as any)}
              disabled={saving}
              onChange={(event) => void prepareFolderEvidenceScan(event.target.files)}
            />
            <small>PDF, Word, Excel, PowerPoint, CSV, texto, imagens, áudio e vídeo · até 50 MB por arquivo · até 300 arquivos por lote.</small>
          </label>
          {folderScanLabel && <div><span>Pasta selecionada</span><b>{folderScanLabel}</b></div>}
        </div>
        {folderScanProgress.total > 0 && <div className="skda-folder-scan-progress">
          <div><strong>{folderScanProgress.current}/{folderScanProgress.total}</strong><span>{folderScanProgress.label}</span></div>
          <span><i style={{width:`${Math.max(0,Math.min(100,(folderScanProgress.current/folderScanProgress.total)*100))}%`}} /></span>
        </div>}
        {folderEvidenceCandidates.length > 0 && (() => {
          const selectedCount=folderEvidenceCandidates.filter((item)=>item.selected).length
          const financeCount=folderEvidenceCandidates.filter((item)=>item.selected && item.groupCode==='financeiro').length
          const suggestedLinks=folderEvidenceCandidates.filter((item)=>item.selected).reduce((total,item)=>total+item.suggestedQuestionIds.length,0)
          const importedCount=folderEvidenceCandidates.filter((item)=>item.status==='imported').length
          return <>
            <div className="skda-folder-scan-summary">
              <article><span>Arquivos reconhecidos</span><strong>{folderEvidenceCandidates.length}</strong></article>
              <article><span>Selecionados</span><strong>{selectedCount}</strong></article>
              <article className={financeCount>0?'is-discovered':''}><span>Saúde econômico-financeira</span><strong>{financeCount}</strong></article>
              <article><span>Associações sugeridas</span><strong>{suggestedLinks}</strong></article>
              <article><span>Já importados</span><strong>{importedCount}</strong></article>
            </div>
            <div className="skda-folder-scan-note">
              <strong>Descoberta orientada por conteúdo</strong>
              <span>TXT/CSV/JSON, XLSX, DOCX e PPTX têm conteúdo lido localmente para a triagem. PDF, imagens, áudio e vídeo usam inicialmente nome/caminho e seguem para análise posterior. Saúde econômico-financeira é tratada explicitamente como fonte potencial do eixo Resultados.</span>
            </div>
            <div className="skda-folder-scan-list">
              {folderEvidenceCandidates.map((candidate) => <article key={candidate.id} className={`skda-folder-scan-item ${candidate.status==='error'?'has-error':candidate.status==='imported'?'is-imported':''}`}>
                <label className="skda-folder-scan-select">
                  <input
                    type="checkbox"
                    checked={candidate.selected}
                    disabled={saving || candidate.status==='imported'}
                    onChange={(event)=>setFolderEvidenceCandidates((current)=>current.map((item)=>item.id===candidate.id?{...item,selected:event.target.checked}:item))}
                  />
                  <div>
                    <strong>{candidate.file.name}</strong>
                    <small>{candidate.relativePath}</small>
                  </div>
                </label>
                <label>
                  <span>Categoria sugerida</span>
                  <select value={candidate.groupCode} disabled={saving || candidate.status==='imported'} onChange={(event)=>changeFolderCandidateGroup(candidate.id,event.target.value)}>
                    {DA_EVIDENCE_CHECKLIST.map((group)=><option key={group.code} value={group.code}>{group.title}</option>)}
                  </select>
                </label>
                <div className="skda-folder-scan-relevance">
                  <span>Confiança da triagem <b>{candidate.confidence}%</b></span>
                  <small>{candidate.suggestedQuestionCodes.length>0 ? `Questões sugeridas: ${candidate.suggestedQuestionCodes.join(', ')}` : 'Sem associação automática a questão; revisão humana necessária.'}</small>
                  {candidate.extractedPreview && <small className="skda-folder-scan-preview">{candidate.extractedPreview.slice(0,220)}{candidate.extractedPreview.length>220?'…':''}</small>}
                  {candidate.status==='importing' && <b>Importando...</b>}
                  {candidate.status==='imported' && <b>Importada e encaminhada para validação</b>}
                  {candidate.errorMessage && <b>{candidate.errorMessage}</b>}
                </div>
              </article>)}
            </div>
          </>
        })()}
        {error && <div className="skda-alert">{error}</div>}
        <div className="skda-modal-actions">
          <button type="button" disabled={saving} onClick={() => setShowFolderEvidenceScan(false)}>Fechar</button>
          <button type="button" className="skda-primary" disabled={saving || folderEvidenceCandidates.filter((item)=>item.selected && item.status!=='imported').length===0} onClick={() => void importFolderEvidenceCandidates()}>
            {saving ? 'Importando e associando...' : 'Importar selecionadas e analisar'}
          </button>
        </div>
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
          {evidenceForm.sourceType === 'external' && !evidenceFile && <>
            <label className="wide"><span>URL da fonte externa *</span><input value={evidenceForm.externalUrl} onChange={(e)=>setEvidenceForm(v=>({...v,externalUrl:e.target.value}))} placeholder="Link do SharePoint, Drive, portal ou repositório autorizado"/></label>
            <label className="wide"><span>Chave externa estável *</span><input value={evidenceForm.externalKey} onChange={(e)=>setEvidenceForm(v=>({...v,externalKey:e.target.value}))} placeholder="Ex.: sharepoint:<item-id>, drive:<file-id> ou outra chave persistente"/></label>
          </>}
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
