import { useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { WorkspaceTabs } from '../../../../components/design-system'
import { SparksSmartGrid } from '../../../../components/design-system/SparksSmartGrid'

import { supabase } from '../../../../lib/supabase'
import { platformRoutes } from '../../app/skpeRoutes'
import { useSkpeWorkspace } from '../../context/SkpeWorkspaceContext'
import type { JourneyTemporalRow } from '../../contracts/journey'
import {
  loadInitiativeKanbanFilteredBoard,
  type InitiativeKanbanFilteredCardModel,
} from '../../../initiatives/kanban/initiativeKanbanFilteredBoardData'
import { JourneySchedulePlanner } from './JourneySchedulePlanner'
import { PersonCapacityManagementDialog } from '../monitoring/PersonCapacityManagementDialog'
import { loadPersonCapacityCandidates, type PersonCapacityCandidate } from '../monitoring/personCapacity'

import './JourneyProjectPlan.css'

type ProjectPlanStage =
  | 'scope'
  | 'team'
  | 'schedule'
  | 'resources'
  | 'review'

type StrategicProjectBinding = {
  initiative_id: string
  binding_type: string
}

type StrategicProjectInitiative = {
  id: string
  code: string
  name: string
  initiative_class: string
  status: string
  progress: number | string
  start_date: string | null
  target_end_date: string | null
  baseline_start_date: string | null
  baseline_target_end_date: string | null
  what_text: string | null
  why_text: string | null
  where_text: string | null
  when_text: string | null
  who_text: string | null
  how_text: string | null
  how_much_text: string | null
}

type OperationalProjectState = {
  binding: StrategicProjectBinding | null
  initiative: StrategicProjectInitiative | null
  actions: InitiativeKanbanFilteredCardModel[]
  loading: boolean
  error: string
}

type ProjectResponsibility = {
  assignment_id: string
  organization_person_id: string
  person_name: string
  responsibility_type: string
  allocation_percentage: number | string | null
  authority_level: string | null
  valid_from: string | null
  valid_until: string | null
  assignment_reason: string | null
}

const responsibilityLabels: Record<string, string> = {
  owner: 'Responsável',
  accountable: 'Responsável final',
  approver: 'Aprovador',
  validator: 'Validador',
  executor: 'Executor',
  reviewer: 'Revisor',
  sponsor: 'Patrocinador',
  facilitator: 'Facilitador',
  consulted: 'Consultado',
  informed: 'Informado',
}

type JourneyProjectPlanProps = {
  organizationId: string
  projectId: string
  rows: JourneyTemporalRow[]
  canManageJourney: boolean
  formatDate: (value: string | null) => string
  onPlanMaterialized: () => void
  projectLeadName?: string | null
  projectLeadEmail?: string | null
  organizationLeadName?: string | null
  organizationLeadEmail?: string | null
  sparkoopLeadName?: string | null
  sparkoopLeadEmail?: string | null
  initialStage?: ProjectPlanStage
}

const stages: Array<{
  id: ProjectPlanStage
  label: string
  description: string
}> = [
  {
    id: 'scope',
    label: 'Escopo',
    description: 'Estrutura metodológica do Projeto Estratégico.',
  },
  {
    id: 'team',
    label: 'Equipe e Responsabilidades',
    description: 'Quem conduz, responde, valida e participa.',
  },
  {
    id: 'schedule',
    label: 'Cronograma',
    description: 'Datas planejadas e prontidão temporal.',
  },
  {
    id: 'resources',
    label: 'Recursos',
    description: 'Capacidade e alocação necessária para executar.',
  },
  {
    id: 'review',
    label: 'Revisão',
    description: 'Histórico de versões e alterações da Linha de Base.',
  },
]

function itemTypeLabel(value: JourneyTemporalRow['item_type']) {
  const labels: Record<JourneyTemporalRow['item_type'], string> = {
    macrophase: 'MEGAFASE',
    phase: 'Fase',
    stage: 'Etapa',
    meta_stage: 'Metaetapa',
    activity: 'Atividade',
    deliverable: 'Entregável',
    gate: 'Gate',
  }

  return labels[value]
}

export function JourneyProjectPlan({
  organizationId,
  projectId,
  rows,
  canManageJourney,
  formatDate,
  onPlanMaterialized,
  projectLeadName = null,
  projectLeadEmail = null,
  organizationLeadName = null,
  organizationLeadEmail = null,
  sparkoopLeadName = null,
  sparkoopLeadEmail = null,
  initialStage = 'scope',
}: JourneyProjectPlanProps) {
  const navigate = useNavigate()
  const workspace = useSkpeWorkspace()
  const [activeStage, setActiveStage] = useState<ProjectPlanStage>(initialStage)
  const [operational, setOperational] = useState<OperationalProjectState>({
    binding: null,
    initiative: null,
    actions: [],
    loading: true,
    error: '',
  })

  const [baselineVersions, setBaselineVersions] = useState<Array<{
    id: string
    version_number: number
    title: string
    schedule_kind: string
    governance_status: string
    is_current_plan: boolean
    notes: string | null
    approved_at: string | null
    created_at: string
  }>>([])
  const [baselineLoadError, setBaselineLoadError] = useState('')
  const [baselineLoading, setBaselineLoading] = useState(true)
  const [teamCandidates, setTeamCandidates] = useState<PersonCapacityCandidate[]>([])
  const [projectResponsibilities, setProjectResponsibilities] = useState<ProjectResponsibility[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [teamSaving, setTeamSaving] = useState(false)
  const [teamMessage, setTeamMessage] = useState('')
  const [canManageTeam, setCanManageTeam] = useState(false)
  const [canManageCapacity, setCanManageCapacity] = useState(false)
  const [canManageProjectExecution, setCanManageProjectExecution] = useState(false)
  const [scopeSaving, setScopeSaving] = useState(false)
  const [scopeMessage, setScopeMessage] = useState('')
  const [scopeForm, setScopeForm] = useState({ what: '', why: '', where: '', when: '', who: '', how: '', howMuch: '' })
  const [showCapacityManager, setShowCapacityManager] = useState(false)
  const [teamForm, setTeamForm] = useState({
    personId: '',
    responsibilityType: 'owner',
    allocation: '100',
    validFrom: '',
    validUntil: '',
    assignmentReason: '',
    reason: '',
  })
  useEffect(() => {
    let mounted = true
    setBaselineLoading(true)
    void supabase.from('skpe_journey_schedule_versions')
      .select('id, version_number, title, schedule_kind, governance_status, is_current_plan, notes, approved_at, created_at')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return
        setBaselineVersions(data ?? [])
        setBaselineLoadError(error?.message ?? '')
        setBaselineLoading(false)
      })
    return () => { mounted = false }
  }, [projectId, activeStage])

  const project = rows[0] ?? null

  async function loadProjectTeam() {
    setTeamLoading(true)
    setTeamMessage('')
    const [candidatesResult, responsibilitiesResult, teamPermission, capacityPermission, executionPermission] = await Promise.all([
      loadPersonCapacityCandidates(organizationId),
      supabase.rpc('get_skpe_responsibility_assignments', {
        target_organization_id: organizationId,
        target_object_type: 'strategic_project',
        target_object_id: projectId,
        include_inactive: false,
      }),
      supabase.rpc('can_manage_skpe_governance', { target_organization_id: organizationId }),
      supabase.rpc('can_manage_sparks_people', { target_organization_id: organizationId }),
      supabase.rpc('can_manage_sparks_initiatives', { target_organization_id: organizationId, target_source_module_code: 'SK-PE' }),
    ])
    setTeamCandidates(candidatesResult)
    setProjectResponsibilities((responsibilitiesResult.data ?? []) as ProjectResponsibility[])
    setCanManageTeam(!teamPermission.error && teamPermission.data === true)
    setCanManageCapacity(!capacityPermission.error && capacityPermission.data === true)
    setCanManageProjectExecution(!executionPermission.error && executionPermission.data === true)
    if (responsibilitiesResult.error) setTeamMessage(responsibilitiesResult.error.message)
    setTeamLoading(false)
  }

  useEffect(() => {
    void loadProjectTeam().catch((error) => {
      setTeamLoading(false)
      setTeamMessage(error instanceof Error ? error.message : 'Não foi possível carregar a equipe do Projeto.')
    })
  }, [organizationId, projectId])

  useEffect(() => { setActiveStage(initialStage) }, [initialStage])

  useEffect(() => {
    const initiative = operational.initiative
    if (!initiative) return
    setScopeForm({
      what: initiative.what_text ?? '',
      why: initiative.why_text ?? '',
      where: initiative.where_text ?? '',
      when: initiative.when_text ?? '',
      who: initiative.who_text ?? '',
      how: initiative.how_text ?? '',
      howMuch: initiative.how_much_text ?? '',
    })
  }, [operational.initiative])

  useEffect(() => {
    let mounted = true

    async function loadOperationalProject() {
      setOperational((current) => ({
        ...current,
        loading: true,
        error: '',
      }))

      const bindingResponse = await supabase
        .from('skpe_project_initiative_bindings')
        .select('initiative_id, binding_type')
        .eq('organization_id', organizationId)
        .eq('skpe_project_id', projectId)
        .eq('binding_type', 'strategic_plan_implementation')
        .limit(2)

      if (!mounted) return

      if (bindingResponse.error) {
        setOperational({
          binding: null,
          initiative: null,
          actions: [],
          loading: false,
          error: `Não foi possível carregar o vínculo Jornada ↔ Projeto: ${bindingResponse.error.message}`,
        })
        return
      }

      const bindings = (bindingResponse.data ?? []) as StrategicProjectBinding[]

      if (bindings.length !== 1) {
        setOperational({
          binding: bindings[0] ?? null,
          initiative: null,
          actions: [],
          loading: false,
          error:
            bindings.length === 0
              ? 'A Jornada ainda não possui Projeto Estratégico vinculado.'
              : 'Há mais de um Projeto Estratégico vinculado à mesma Jornada.',
        })
        return
      }

      const binding = bindings[0]

      const initiativeResponse = await supabase
        .from('sparks_initiatives')
        .select(
          'id, code, name, initiative_class, status, progress, start_date, target_end_date, baseline_start_date, baseline_target_end_date, what_text, why_text, where_text, when_text, who_text, how_text, how_much_text',
        )
        .eq('organization_id', organizationId)
        .eq('id', binding.initiative_id)
        .is('archived_at', null)
        .maybeSingle()

      if (!mounted) return

      if (initiativeResponse.error || !initiativeResponse.data) {
        setOperational({
          binding,
          initiative: null,
          actions: [],
          loading: false,
          error: initiativeResponse.error
            ? `Não foi possível carregar o Projeto Estratégico: ${initiativeResponse.error.message}`
            : 'O vínculo existe, mas a iniciativa correspondente não foi localizada.',
        })
        return
      }

      const initiative =
        initiativeResponse.data as StrategicProjectInitiative

      try {
        const columns =
          await loadInitiativeKanbanFilteredBoard(initiative.id)

        if (!mounted) return

        setOperational({
          binding,
          initiative,
          actions: columns.flatMap((column) => column.cards),
          loading: false,
          error: '',
        })
      } catch (error) {
        if (!mounted) return

        setOperational({
          binding,
          initiative,
          actions: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar as ações do Projeto Estratégico.',
        })
      }
    }

    void loadOperationalProject()

    return () => {
      mounted = false
    }
  }, [organizationId, projectId])

  async function saveProjectScope() {
    if (!operational.initiative) {
      setScopeMessage('O Projeto Estratégico vinculado ainda não foi localizado.')
      return
    }
    setScopeSaving(true)
    setScopeMessage('')
    const { error } = await supabase.rpc('update_sparks_initiative_5w2h', {
      target_initiative_id: operational.initiative.id,
      target_what_text: scopeForm.what || null,
      target_why_text: scopeForm.why || null,
      target_where_text: scopeForm.where || null,
      target_when_text: scopeForm.when || null,
      target_who_text: scopeForm.who || null,
      target_how_text: scopeForm.how || null,
      target_how_much_text: scopeForm.howMuch || null,
      target_start_date: operational.initiative.start_date,
      target_end_date: operational.initiative.target_end_date,
      change_reason: 'Atualização do escopo do Projeto pela Jornada Estratégica',
    })
    if (error) {
      setScopeMessage(error.message)
    } else {
      setScopeMessage('Escopo do Projeto atualizado com sucesso.')
      setOperational((current) => current.initiative ? ({
        ...current,
        initiative: {
          ...current.initiative,
          what_text: scopeForm.what || null,
          why_text: scopeForm.why || null,
          where_text: scopeForm.where || null,
          when_text: scopeForm.when || null,
          who_text: scopeForm.who || null,
          how_text: scopeForm.how || null,
          how_much_text: scopeForm.howMuch || null,
        },
      }) : current)
    }
    setScopeSaving(false)
  }
  async function assignProjectResponsibility() {
    if (!teamForm.personId) {
      setTeamMessage('Selecione uma pessoa para compor a equipe do Projeto.')
      return
    }
    if (teamForm.reason.trim().length < 10) {
      setTeamMessage('Informe uma justificativa para auditoria com pelo menos 10 caracteres.')
      return
    }
    setTeamSaving(true)
    setTeamMessage('')
    const { error } = await supabase.rpc('assign_skpe_responsibility', {
      target_organization_id: organizationId,
      target_object_type: 'strategic_project',
      target_object_id: projectId,
      target_organization_person_id: teamForm.personId,
      target_responsibility_type: teamForm.responsibilityType,
      target_allocation_percentage: teamForm.allocation ? Number(teamForm.allocation) : null,
      target_authority_level: 'operational',
      target_valid_from: teamForm.validFrom || null,
      target_valid_until: teamForm.validUntil || null,
      target_assignment_reason: teamForm.assignmentReason || null,
      change_reason: teamForm.reason.trim(),
    })
    if (error) {
      setTeamMessage(error.message)
    } else {
      setTeamForm({ personId: '', responsibilityType: 'owner', allocation: '100', validFrom: '', validUntil: '', assignmentReason: '', reason: '' })
      setTeamMessage('Pessoa adicionada à equipe do Projeto com sucesso.')
      await loadProjectTeam()
    }
    setTeamSaving(false)
  }

  async function endProjectResponsibility(assignment: ProjectResponsibility) {
    const reason = window.prompt(`Informe a justificativa para encerrar a participação de ${assignment.person_name}.`)
    if (!reason || reason.trim().length < 10) return
    const { error } = await supabase.rpc('end_skpe_responsibility', {
      target_assignment_id: assignment.assignment_id,
      target_end_date: new Date().toISOString().slice(0, 10),
      change_reason: reason.trim(),
    })
    if (error) setTeamMessage(error.message)
    else {
      setTeamMessage('Participação encerrada com sucesso.')
      await loadProjectTeam()
    }
  }
  function openStrategicProject() {
    if (!operational.initiative || !workspace.route.formulationId) return

    navigate({
      pathname: platformRoutes.skpe({
        organizationId,
        projectId,
        formulationId: workspace.route.formulationId,
        section: 'initiatives',
      }),
      search: `?initiativeId=${encodeURIComponent(
        operational.initiative.id,
      )}`,
    })
  }

  const metrics = useMemo(() => {
    const activeRows = rows.filter((row) => row.item_status !== 'cancelled')
    const topLevel = activeRows
      .filter((row) => row.parent_item_id === null)
      .sort(
        (first, second) =>
          first.display_order - second.display_order ||
          first.item_code.localeCompare(second.item_code, 'pt-BR'),
      )

    const responsibleCounts = new Map<string, number>()
    for (const row of activeRows) {
      if (!row.responsible_name) continue
      responsibleCounts.set(
        row.responsible_name,
        (responsibleCounts.get(row.responsible_name) ?? 0) + 1,
      )
    }

    const people = Array.from(responsibleCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort(
        (first, second) =>
          second.count - first.count ||
          first.name.localeCompare(second.name, 'pt-BR'),
      )

    const operationalPeople = Array.from(
      new Set(
        operational.actions.flatMap(
          (action) => action.responsiblePersonNames,
        ),
      ),
    ).sort((first, second) =>
      first.localeCompare(second, 'pt-BR'),
    )

    return {
      activeRows,
      topLevel,
      people,
      mandatoryCount: activeRows.filter((row) => row.is_mandatory).length,
      assignedCount: activeRows.filter((row) => row.responsible_name).length,
      unassignedCount: activeRows.filter((row) => !row.responsible_name).length,
      baselineApproved: activeRows.some((row) => row.has_approved_plan),
      forecastActive: activeRows.some((row) => row.has_active_forecast),
      leafCount: activeRows.filter(
        (row) =>
          !activeRows.some((candidate) => candidate.parent_item_id === row.item_id),
      ).length,
      operationalActionCount: operational.actions.length,
      operationalRootCount: operational.actions.filter(
        (action) => action.isRoot,
      ).length,
      operationalMilestoneCount: operational.actions.filter(
        (action) => action.actionType === 'milestone',
      ).length,
      operationalPeople,
    }
  }, [rows, operational.actions])

  if (!project) return null

  return (
    <section className="skpe-project-plan">
      <header className="skpe-project-plan-hero skpe-project-plan-hero--compact">
        <div>
          <p className="skpe-eyebrow">Projeto Estratégico vinculado à Jornada</p>
          <h2>{project.project_name}</h2>
          {!operational.loading && !operational.initiative && operational.error && (
            <p role="status">{operational.error}</p>
          )}
        </div>
        {operational.initiative && (
          <button
            type="button"
            className="skpe-project-plan-project-link"
            onClick={openStrategicProject}
            disabled={!workspace.route.formulationId}
          >
            Abrir execução do Projeto Estratégico
          </button>
        )}
      </header>

            <WorkspaceTabs
        ariaLabel="Etapas do Plano do Projeto"
        activeId={activeStage}
        onChange={(id) => setActiveStage(id as ProjectPlanStage)}
        tabs={stages.map((stage) => ({
          id: stage.id,
          label: stage.label,
        }))}
      />

      {activeStage === 'scope' && (
        <section className="skpe-project-plan-panel">
          <div className="skpe-project-plan-panel-heading">
            <div>
              <p className="skpe-eyebrow">1 · Escopo</p>
              <h3>Estrutura metodológica e Projeto operacional</h3>
              <p>
                A Jornada permanece como fonte metodológica. A iniciativa
                vinculada materializa a execução do mesmo Projeto Estratégico,
                sem criar uma estrutura operacional concorrente. Planejamento continua nesta Jornada.
              </p>
            </div>
            <div className="skpe-project-plan-kpis">
              <span><strong>{metrics.topLevel.length}</strong> MEGAFASES</span>
              <span><strong>{metrics.activeRows.length}</strong> itens ativos</span>
              <span><strong>{metrics.leafCount}</strong> folhas planejáveis</span>
              <span><strong>{metrics.mandatoryCount}</strong> obrigatórios</span>
              <span><strong>{metrics.operationalActionCount}</strong> materializados</span>
            </div>
          </div>

          <div className="skpe-project-scope-list">
            {metrics.topLevel.map((row) => (
              <article key={row.item_id}>
                <div>
                  <small>{itemTypeLabel(row.item_type)}</small>
                  <strong>{row.item_name}</strong>
                </div>
                <span>{row.is_mandatory ? 'Obrigatória' : 'Condicional'}</span>
              </article>
            ))}
          </div>

          <section className="skpe-project-entry-block" aria-label="Escopo operacional do Projeto">
            <header>
              <div>
                <strong>Registrar escopo operacional do Projeto</strong>
                <span>A estrutura da Jornada permanece protegida. Aqui você registra o conteúdo do Projeto que será executado, sem duplicar a metodologia.</span>
              </div>
            </header>
            <div className="skpe-project-entry-grid">
              <label className="is-wide">
                <span>O que será realizado / entregue</span>
                <textarea value={scopeForm.what} onChange={(event) => setScopeForm((current) => ({ ...current, what: event.target.value }))} disabled={!canManageProjectExecution || scopeSaving} />
              </label>
              <label className="is-wide">
                <span>Por que este Projeto é necessário</span>
                <textarea value={scopeForm.why} onChange={(event) => setScopeForm((current) => ({ ...current, why: event.target.value }))} disabled={!canManageProjectExecution || scopeSaving} />
              </label>
              <label>
                <span>Onde se aplica</span>
                <input value={scopeForm.where} onChange={(event) => setScopeForm((current) => ({ ...current, where: event.target.value }))} disabled={!canManageProjectExecution || scopeSaving} />
              </label>
              <label>
                <span>Quem participa / público envolvido</span>
                <input value={scopeForm.who} onChange={(event) => setScopeForm((current) => ({ ...current, who: event.target.value }))} disabled={!canManageProjectExecution || scopeSaving} />
              </label>
              <label>
                <span>Quando / condições temporais</span>
                <input value={scopeForm.when} onChange={(event) => setScopeForm((current) => ({ ...current, when: event.target.value }))} disabled={!canManageProjectExecution || scopeSaving} />
              </label>
              <label className="is-wide">
                <span>Como será executado</span>
                <textarea value={scopeForm.how} onChange={(event) => setScopeForm((current) => ({ ...current, how: event.target.value }))} disabled={!canManageProjectExecution || scopeSaving} />
              </label>
              <label className="is-wide">
                <span>Recursos / investimento estimado</span>
                <input value={scopeForm.howMuch} onChange={(event) => setScopeForm((current) => ({ ...current, howMuch: event.target.value }))} disabled={!canManageProjectExecution || scopeSaving} />
              </label>
            </div>
            <div className="skpe-project-entry-actions">
              <button type="button" className="is-primary" onClick={() => void saveProjectScope()} disabled={!canManageProjectExecution || scopeSaving || !operational.initiative}>
                {scopeSaving ? 'Salvando...' : 'Salvar escopo do Projeto'}
              </button>
            </div>
            {!canManageProjectExecution ? <p className="skpe-project-entry-note">Seu perfil pode consultar o escopo, mas não possui permissão para alterar a execução do Projeto.</p> : null}
            {scopeMessage ? <p className="skpe-project-entry-note" role="status">{scopeMessage}</p> : null}
          </section>

          <div className="skpe-project-plan-navigation">
            <span />
            <button type="button" onClick={() => setActiveStage('team')}>
              Avançar para equipe e responsabilidades
            </button>
          </div>
        </section>
      )}

      {activeStage === 'team' && (
        <section className="skpe-project-plan-panel">
          <div className="skpe-project-plan-panel-heading">
            <div>
              <p className="skpe-eyebrow">2 · Equipe e Responsabilidades</p>
              <h3>Responsabilização do Projeto Estratégico</h3>
              <p>
                A equipe não é sinônimo de responsabilidade. O projeto pode ter
                participantes, enquanto cada item mantém sua responsabilidade
                formal governada.
              </p>
            </div>
            <div className="skpe-project-plan-kpis">
              <span><strong>{metrics.people.length}</strong> pessoas projetadas</span>
              <span><strong>{metrics.assignedCount}</strong> itens atribuídos</span>
              <span><strong>{metrics.unassignedCount}</strong> a atribuir</span>
            </div>
          </div>

          {metrics.people.length > 0 ? (
            <div className="skpe-project-team-grid">
              {metrics.people.map((person) => (
                <article key={person.name}>
                  <span className="skpe-project-team-avatar" aria-hidden="true">
                    {person.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <strong>{person.name}</strong>
                    <small>
                      {person.count} item(ns) com responsabilidade projetada
                    </small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="skpe-project-plan-callout">
              Ainda não há responsáveis projetados na Jornada.
            </div>
          )}

          <div className="skpe-project-plan-callout">
            <strong>Liderança interna do Projeto Estratégico:</strong>{' '}
            {organizationLeadName ?? projectLeadName ?? 'Pendente de definição'}
            {(organizationLeadEmail ?? projectLeadEmail)
              ? ` · ${organizationLeadEmail ?? projectLeadEmail}`
              : ''}
          </div>

          <div className="skpe-project-plan-callout">
            <strong>SPARKOOP:</strong>{' '}
            {sparkoopLeadName
              ? `${sparkoopLeadName} · facilitação e governança metodológica`
              : organizationLeadName
                ? 'Apoio metodológico conforme governança do projeto.'
                : 'Liderança provisória até a organização designar e empoderar seu líder interno.'}
            {sparkoopLeadEmail ? ` · ${sparkoopLeadEmail}` : ''}
          </div>

          <div className="skpe-project-plan-callout">
            <strong>Responsabilidades formais no Projeto:</strong>{' '}
            {metrics.operationalPeople.length > 0
              ? metrics.operationalPeople.join(', ')
              : 'ainda não materializadas nas ações.'}
          </div>

          <div className="skpe-project-plan-callout">
            A Jornada governa a responsabilidade metodológica; a iniciativa
            governa a responsabilidade operacional. O Plano do Projeto reconcilia
            as duas visões antes da Linha de Base.
          </div>

          <section className="skpe-project-entry-block" aria-label="Cadastro da equipe do Projeto">
            <header>
              <div>
                <strong>Compor equipe e atribuir responsabilidades</strong>
                <span>Registre aqui quem participa do Projeto, a responsabilidade, a alocação e a vigência. O registro utiliza a governança canônica do SK-PE.</span>
              </div>
            </header>

            {teamLoading ? <p>Carregando equipe...</p> : (
              <>
                <div className="skpe-project-entry-grid">
                  <label>
                    <span>Pessoa *</span>
                    <select value={teamForm.personId} onChange={(event) => setTeamForm((current) => ({ ...current, personId: event.target.value }))} disabled={!canManageTeam || teamSaving}>
                      <option value="">Selecione</option>
                      {teamCandidates.map((person) => (
                        <option key={person.organizationPersonId} value={person.organizationPersonId}>{person.displayName}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Responsabilidade</span>
                    <select value={teamForm.responsibilityType} onChange={(event) => setTeamForm((current) => ({ ...current, responsibilityType: event.target.value }))} disabled={!canManageTeam || teamSaving}>
                      {Object.entries(responsibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Alocação (%)</span>
                    <input type="number" min="0" max="100" value={teamForm.allocation} onChange={(event) => setTeamForm((current) => ({ ...current, allocation: event.target.value }))} disabled={!canManageTeam || teamSaving} />
                  </label>
                  <label>
                    <span>Vigência inicial</span>
                    <input type="date" value={teamForm.validFrom} onChange={(event) => setTeamForm((current) => ({ ...current, validFrom: event.target.value }))} disabled={!canManageTeam || teamSaving} />
                  </label>
                  <label>
                    <span>Vigência final</span>
                    <input type="date" value={teamForm.validUntil} onChange={(event) => setTeamForm((current) => ({ ...current, validUntil: event.target.value }))} disabled={!canManageTeam || teamSaving} />
                  </label>
                  <label className="is-wide">
                    <span>Motivo / papel no Projeto</span>
                    <input value={teamForm.assignmentReason} onChange={(event) => setTeamForm((current) => ({ ...current, assignmentReason: event.target.value }))} placeholder="Ex.: coordenação do desdobramento estratégico" disabled={!canManageTeam || teamSaving} />
                  </label>
                  <label className="is-wide">
                    <span>Justificativa para auditoria *</span>
                    <textarea value={teamForm.reason} onChange={(event) => setTeamForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Registre a razão desta atribuição." disabled={!canManageTeam || teamSaving} />
                  </label>
                </div>
                <div className="skpe-project-entry-actions">
                  <button type="button" className="is-primary" onClick={() => void assignProjectResponsibility()} disabled={!canManageTeam || teamSaving || !teamForm.personId}>
                    {teamSaving ? 'Salvando...' : 'Adicionar à equipe'}
                  </button>
                </div>
                {!canManageTeam ? <p className="skpe-project-entry-note">Seu perfil pode consultar a equipe, mas não possui permissão para alterar responsabilidades.</p> : null}
                {teamMessage ? <p className="skpe-project-entry-note" role="status">{teamMessage}</p> : null}
              </>
            )}

            <div className="skpe-project-team-assignments">
              {projectResponsibilities.length === 0 ? (
                <p className="skpe-project-entry-note">Nenhuma responsabilidade formal registrada diretamente para este Projeto.</p>
              ) : projectResponsibilities.map((assignment) => (
                <article key={assignment.assignment_id}>
                  <div>
                    <strong>{assignment.person_name}</strong>
                    <span>{responsibilityLabels[assignment.responsibility_type] ?? assignment.responsibility_type}</span>
                    <small>{assignment.allocation_percentage === null ? 'Alocação não informada' : `${assignment.allocation_percentage}% de alocação`}{assignment.valid_from ? ` · desde ${formatDate(assignment.valid_from)}` : ''}{assignment.valid_until ? ` · até ${formatDate(assignment.valid_until)}` : ''}</small>
                  </div>
                  {canManageTeam ? <button type="button" onClick={() => void endProjectResponsibility(assignment)}>Encerrar</button> : null}
                </article>
              ))}
            </div>
          </section>

          <div className="skpe-project-plan-navigation">
            <button type="button" onClick={() => setActiveStage('scope')}>Voltar ao escopo</button>
            <button type="button" onClick={() => setActiveStage('schedule')}>Avançar para cronograma</button>
          </div>
        </section>
      )}

      {activeStage === 'schedule' && (
        <>
          <section className="skpe-project-plan-context-strip">
            <div>
              <strong>3 · Cronograma</strong>
              <span>
                Informe e revise as datas planejadas. Fases e MEGAFASES são consolidadas automaticamente a partir das atividades e entregas planejadas. Previsão operacional: {metrics.forecastActive ? 'registrada' : 'ainda não registrada'}.
              </span>
            </div>
          </section>

          <JourneySchedulePlanner
            organizationId={organizationId}
            projectId={projectId}
            rows={rows}
            canManageJourney={canManageJourney}
            formatDate={formatDate}
            onPlanMaterialized={onPlanMaterialized}
          />


        </>
      )}

      {activeStage === 'resources' && (
        <section className="skpe-project-plan-panel">
          <div className="skpe-project-plan-panel-heading">
            <div>
              <p className="skpe-eyebrow">4 · Recursos</p>
              <h3>Capacidade necessária para executar o plano</h3>
              <p>
                Recursos humanos devem ser vinculados ao trabalho real do projeto,
                utilizando os contratos canônicos de capacidade e alocação já
                existentes no SPARKs.
              </p>
            </div>
          </div>

          <div className="skpe-project-plan-callout is-guidance">
            <strong>O que fazer aqui:</strong> registre e revise a capacidade disponível das pessoas por período. A Jornada grava no contrato transversal de capacidade do SPARKs, sem criar fonte paralela.
          </div>

          <div className="skpe-project-resource-actions">
            <button type="button" className="is-primary" onClick={() => setShowCapacityManager(true)} disabled={!canManageCapacity}>
              Registrar ou editar capacidade
            </button>
            {operational.initiative ? (
              <button type="button" onClick={openStrategicProject} disabled={!workspace.route.formulationId}>
                Abrir execução vinculada
              </button>
            ) : null}
          </div>
          {!canManageCapacity ? <p className="skpe-project-entry-note">Seu perfil pode consultar recursos, mas não possui permissão para alterar a capacidade das pessoas.</p> : null}

          <div className="skpe-project-resource-grid">
            <article>
              <strong>Equipe formal do Projeto</strong>
              <span>{metrics.operationalPeople.length} pessoa(s)</span>
              <small>
                Fonte: responsabilidades ativas das ações da iniciativa vinculada.
              </small>
            </article>
            <article>
              <strong>Capacidade quantitativa</strong>
              <span>Governada por período</span>
              <small>
                A alocação será integrada sem duplicar a fonte canônica de
                capacidade já utilizada nas Iniciativas e Ações.
              </small>
            </article>
            <article>
              <strong>Regra de fechamento</strong>
              <span>Sem inferência automática</span>
              <small>
                A Linha de Base não inventará disponibilidade de pessoas ou
                quantidade de recursos.
              </small>
            </article>
          </div>


        </section>
      )}

      {showCapacityManager ? (
        <PersonCapacityManagementDialog
          organizationId={organizationId}
          onClose={() => setShowCapacityManager(false)}
          onSaved={() => {
            setShowCapacityManager(false)
            void loadProjectTeam()
          }}
        />
      ) : null}
      {activeStage === 'review' && (
        <section className="skpe-project-plan-panel">
          <div className="skpe-project-plan-panel-heading">
            <div>
              <p className="skpe-eyebrow">5 - Revisão da Linha de Base</p>
              <h3>Histórico e vigência das Linhas de Base</h3>
              <p>Consulte as versões registradas e a referência vigente. Revisões somente são necessárias quando houver alteração formal.</p>
            </div>
          </div>
          {project?.project_status === 'active' && (
            <div className="skpe-project-plan-callout is-guidance" role="status">
              <strong>Linha de Base vigente: aprovada.</strong>{' '}
              A aprovação do Projeto e do cronograma consta do registro histórico da reunião de abertura. A v1 listada abaixo é uma proposta técnica automática e não substitui a Linha de Base vigente.
            </div>
          )}
          {baselineLoading ? <p>Carregando versões...</p> :
            baselineLoadError ? <p role="alert">Falha na consulta: {baselineLoadError}</p> : (
              <SparksSmartGrid
                ariaLabel="Histórico de Linhas de Base"
                rows={baselineVersions.map((version) => ({
                  id: version.id,
                  version: 'v' + version.version_number,
                  title: version.title,
                  kind: version.governance_status === 'draft'
                    ? 'Proposta técnica'
                    : version.schedule_kind === 'baseline'
                      ? 'Inicial'
                      : version.schedule_kind === 'rebaseline'
                        ? 'Revisão'
                        : 'Previsão',
                  status: ({ approved: 'Aprovada', active: 'Ativa', draft: 'Rascunho técnico', pending_approval: 'Aguardando aprovação', superseded: 'Substituída', cancelled: 'Cancelada' } as Record<string, string>)[version.governance_status] ?? version.governance_status,
                  current: version.is_current_plan
                    ? 'Vigente'
                    : version.governance_status === 'draft'
                      ? 'Proposta técnica'
                      : 'Histórica',
                  approved: version.approved_at
                    ? formatDate(version.approved_at)
                    : version.governance_status === 'draft'
                      ? 'Não se aplica — proposta técnica'
                      : 'Data da decisão não informada',
                  notes: version.notes || 'Não informada',
                }))}
                columns={[
                  { id: 'version', label: 'Versão', minWidth: 90 },
                  { id: 'title', label: 'Descrição', minWidth: 180, grow: 2, tooltip: true },
                  { id: 'kind', label: 'Tipo', minWidth: 95 },
                  { id: 'status', label: 'Situação', minWidth: 135 },
                  { id: 'current', label: 'Vigência', minWidth: 100 },
                  { id: 'approved', label: 'Aprovação', minWidth: 125 },
                  { id: 'notes', label: 'Justificativa registrada', minWidth: 220, grow: 2, tooltip: true },
                ]}
                emptyMessage="Nenhuma versão localizada no registro de cronogramas."
                viewportMode="balanced"
              />
            )}
        </section>
      )}
    </section>
  )
}
