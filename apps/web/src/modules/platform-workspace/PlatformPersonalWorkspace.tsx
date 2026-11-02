import { useEffect, useMemo, useState } from 'react'

import { supabase } from '../../lib/supabase'
import { cooperativeBranchCardLabel } from '../../lib/cooperativeBranchDisplay'
import './PlatformPersonalWorkspace.css'

type WorkspaceModule = {
  code: string
  name: string
  shortName: string
  description: string | null
  roleName: string
}

type WorkspaceOrganization = {
  id: string
  code: string
  name: string
}

type AgendaItem = {
  agenda_item_key: string
  organization_id: string
  source_module_code: string | null
  source_entity_type: string
  source_entity_id: string
  item_kind: string
  title: string
  description: string | null
  starts_at: string | null
  ends_at: string | null
  due_at: string | null
  status: string | null
  priority: string | null
  route: string | null
}

type PendingItem = {
  item_type?: string | null
  title?: string | null
  description?: string | null
  due_at?: string | null
  priority?: string | null
  route?: string | null
}

type PlatformPersonalWorkspaceProps = {
  organizationId: string
  organizationName: string
  organizationCode: string
  cooperativeBranch: string | null
  modules: WorkspaceModule[]
  organizations: WorkspaceOrganization[]
  userDisplayName: string
  onSwitchOrganization: (organizationId: string) => void
  onOpenModule: (moduleCode: string) => void
  onReturnToOrganizations: () => void
}

type AttentionItem = {
  id: string
  moduleCode: string
  title: string
  description: string
  when: string | null
  urgency: 'critical' | 'attention' | 'normal'
  route: string | null
}

const MODULE_ACCENTS: Record<string, string> = {
  'SK-PE': 'Estratégia',
  'SK-DA': 'Diagnóstico',
  'SK-DOC': 'Documentos',
  'SK-PN': 'Negócios',
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function formatShortDate(value: string | null) {
  if (!value) return 'Sem data'
  const date = new Date(value)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function urgencyFor(value: string | null): AttentionItem['urgency'] {
  if (!value) return 'normal'
  const now = new Date()
  const due = new Date(value)
  if (due.getTime() < now.getTime()) return 'critical'
  if (due.getTime() - now.getTime() <= 1000 * 60 * 60 * 48) return 'attention'
  return 'normal'
}

export function PlatformPersonalWorkspace({
  organizationId,
  organizationName,
  organizationCode,
  cooperativeBranch,
  modules,
  organizations,
  userDisplayName,
  onSwitchOrganization,
  onOpenModule,
  onReturnToOrganizations,
}: PlatformPersonalWorkspaceProps) {
  const [agenda, setAgenda] = useState<AgendaItem[]>([])
  const [skpePending, setSkpePending] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadWorkspace() {
      setLoading(true)
      setMessage('')

      const today = startOfDay(new Date())
      const from = new Date(today)
      from.setDate(from.getDate() - 7)
      const to = new Date(today)
      to.setDate(to.getDate() + 35)

      const agendaPromise = supabase.rpc('get_my_sparks_agenda', {
        target_organization_id: organizationId,
        target_module_code: null,
        target_date_from: isoDate(from),
        target_date_to: isoDate(to),
        target_item_kind: null,
        target_status: null,
        target_include_hidden: false,
      })

      const hasSkpe = modules.some((module) => module.code === 'SK-PE')
      const pendingPromise = hasSkpe
        ? supabase.rpc('get_my_skpe_pending_items', {
            target_organization_id: organizationId,
            target_project_id: null,
            target_formulation_id: null,
          })
        : Promise.resolve({ data: [], error: null })

      const [agendaResult, pendingResult] = await Promise.all([
        agendaPromise,
        pendingPromise,
      ])

      if (!active) return

      if (agendaResult.error) {
        setMessage('A Agenda SPARKs não pôde ser carregada neste momento.')
        setAgenda([])
      } else {
        setAgenda((agendaResult.data ?? []) as AgendaItem[])
      }

      if (pendingResult.error) {
        setSkpePending([])
      } else {
        setSkpePending((pendingResult.data ?? []) as PendingItem[])
      }

      setLoading(false)
    }

    void loadWorkspace()
    return () => {
      active = false
    }
  }, [organizationId, modules])

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const fromAgenda = agenda
      .filter((item) => {
        const when = item.due_at ?? item.starts_at
        if (!when) return false
        return new Date(when).getTime() <= Date.now() + 1000 * 60 * 60 * 24 * 7
      })
      .map((item) => ({
        id: item.agenda_item_key,
        moduleCode: item.source_module_code ?? 'SPARKs',
        title: item.title,
        description: item.description ?? item.item_kind,
        when: item.due_at ?? item.starts_at,
        urgency: urgencyFor(item.due_at ?? item.starts_at),
        route: item.route,
      }))

    const fromPending = skpePending.slice(0, 12).map((item, index) => ({
      id: 'skpe-pending-' + index,
      moduleCode: 'SK-PE',
      title: item.title ?? 'Pendência do Planejamento Estratégico',
      description: item.description ?? item.item_type ?? 'Requer atenção',
      when: item.due_at ?? null,
      urgency: urgencyFor(item.due_at ?? null),
      route: item.route ?? null,
    }))

    const map = new Map<string, AttentionItem>()
    ;[...fromAgenda, ...fromPending].forEach((item) => {
      const key = item.moduleCode + '|' + item.title + '|' + (item.when ?? '')
      if (!map.has(key)) map.set(key, item)
    })

    return [...map.values()]
      .sort((first, second) => {
        const rank = { critical: 0, attention: 1, normal: 2 }
        const urgency = rank[first.urgency] - rank[second.urgency]
        if (urgency !== 0) return urgency
        return (first.when ?? '9999').localeCompare(second.when ?? '9999')
      })
      .slice(0, 10)
  }, [agenda, skpePending])

  const modulePulse = useMemo(() => {
    return modules.map((module) => {
      const moduleAgenda = agenda.filter(
        (item) => item.source_module_code === module.code,
      )
      const attention = attentionItems.filter(
        (item) => item.moduleCode === module.code,
      )
      const critical = attention.filter(
        (item) => item.urgency === 'critical',
      ).length
      const upcoming = moduleAgenda.filter((item) => {
        const when = item.starts_at ?? item.due_at
        return when && new Date(when).getTime() >= Date.now()
      }).length

      return {
        ...module,
        attention: attention.length,
        critical,
        upcoming,
      }
    })
  }, [modules, agenda, attentionItems])

  const nextAgendaItems = useMemo(
    () =>
      agenda
        .filter((item) => {
          const when = item.starts_at ?? item.due_at
          return when && new Date(when).getTime() >= Date.now()
        })
        .sort((first, second) =>
          (first.starts_at ?? first.due_at ?? '').localeCompare(
            second.starts_at ?? second.due_at ?? '',
          ),
        )
        .slice(0, 8),
    [agenda],
  )

  const days = useMemo(() => {
    const result: Array<{ date: Date; count: number }> = []
    const today = startOfDay(new Date())
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(today)
      date.setDate(today.getDate() + index)
      const next = new Date(date)
      next.setDate(date.getDate() + 1)
      const count = agenda.filter((item) => {
        const when = item.starts_at ?? item.due_at
        if (!when) return false
        const timestamp = new Date(when).getTime()
        return timestamp >= date.getTime() && timestamp < next.getTime()
      }).length
      result.push({ date, count })
    }
    return result
  }, [agenda])

  const criticalCount = attentionItems.filter(
    (item) => item.urgency === 'critical',
  ).length
  const attentionCount = attentionItems.filter(
    (item) => item.urgency === 'attention',
  ).length

  return (
    <section className="sparks-personal-workspace">
      <header className="sparks-personal-workspace__hero">
        <div className="sparks-personal-workspace__hero-copy">
          <span>Meu Espaço de Trabalho · SPARKs</span>
          <h1>Bom trabalho, {userDisplayName.split(' ')[0] || 'usuário'}.</h1>
          <p>
            Uma visão única do que pede sua atenção agora, sem separar sua rotina
            por módulo.
          </p>
          <div className="sparks-personal-workspace__context">
            <strong>{organizationName}</strong>
            <span>{organizationCode}</span>
            <span>{cooperativeBranchCardLabel(cooperativeBranch)}</span>
          </div>
        </div>

        <div className="sparks-personal-workspace__hero-actions">
          <label>
            <span>Organização em contexto</span>
            <select
              value={organizationId}
              onChange={(event) => onSwitchOrganization(event.target.value)}
            >
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onReturnToOrganizations}>
            Ver organizações
          </button>
        </div>
      </header>

      {message ? (
        <p className="sparks-personal-workspace__message" role="status">
          {message}
        </p>
      ) : null}

      <div className="sparks-personal-workspace__today-grid">
        <article className="sparks-personal-workspace__focus">
          <header>
            <div>
              <span>Hoje</span>
              <h2>Sua atenção em uma leitura</h2>
            </div>
            <div
              className="sparks-personal-workspace__attention-ring"
              style={{
                ['--critical' as string]: String(
                  Math.min(100, criticalCount * 18),
                ),
                ['--attention' as string]: String(
                  Math.min(100, attentionCount * 12),
                ),
              }}
              aria-label={criticalCount + ' itens críticos'}
            >
              <strong>{attentionItems.length}</strong>
              <small>ações</small>
            </div>
          </header>

          {loading ? (
            <div className="sparks-personal-workspace__empty">
              Organizando suas prioridades...
            </div>
          ) : attentionItems.length === 0 ? (
            <div className="sparks-personal-workspace__empty">
              Nenhuma ação crítica encontrada para os próximos dias.
            </div>
          ) : (
            <div className="sparks-personal-workspace__attention-list">
              {attentionItems.map((item) => (
                <article
                  key={item.id}
                  className={'is-' + item.urgency}
                >
                  <div className="sparks-personal-workspace__attention-module">
                    {item.moduleCode}
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <time>{formatShortDate(item.when)}</time>
                </article>
              ))}
            </div>
          )}
        </article>

        <aside className="sparks-personal-workspace__agenda">
          <header>
            <span>Agenda SPARKs</span>
            <h2>Próximos compromissos</h2>
          </header>

          <div className="sparks-personal-workspace__week">
            {days.map(({ date, count }) => (
              <div key={date.toISOString()} className={count > 0 ? 'has-items' : ''}>
                <span>
                  {new Intl.DateTimeFormat('pt-BR', {
                    weekday: 'short',
                  }).format(date)}
                </span>
                <strong>{date.getDate()}</strong>
                <small>{count > 0 ? count : '·'}</small>
              </div>
            ))}
          </div>

          <div className="sparks-personal-workspace__agenda-list">
            {nextAgendaItems.length === 0 ? (
              <p>Nenhum compromisso agendado no período.</p>
            ) : (
              nextAgendaItems.map((item) => (
                <article key={item.agenda_item_key}>
                  <span>{item.source_module_code ?? 'SPARKs'}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{formatShortDate(item.starts_at ?? item.due_at)}</small>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>

      <section className="sparks-personal-workspace__pulse">
        <header>
          <div>
            <span>Visão transversal</span>
            <h2>Pulso dos módulos</h2>
            <p>
              Prioridade, agenda e acessos reunidos sem retirar a autonomia de
              cada módulo.
            </p>
          </div>
        </header>

        <div className="sparks-personal-workspace__pulse-grid">
          {modulePulse.map((module) => (
            <button
              key={module.code}
              type="button"
              onClick={() => onOpenModule(module.code)}
              className={module.critical > 0 ? 'has-critical' : ''}
            >
              <div className="sparks-personal-workspace__module-heading">
                <span>{module.shortName || module.code}</span>
                <small>{MODULE_ACCENTS[module.code] ?? 'Módulo SPARKs'}</small>
              </div>
              <strong>{module.name}</strong>
              <p>{module.description ?? 'Capacidade habilitada nesta organização.'}</p>
              <div className="sparks-personal-workspace__module-metrics">
                <div>
                  <strong>{module.attention}</strong>
                  <span>atenções</span>
                </div>
                <div>
                  <strong>{module.upcoming}</strong>
                  <span>agenda</span>
                </div>
                <div>
                  <strong>{module.roleName}</strong>
                  <span>seu perfil</span>
                </div>
              </div>
              <div className="sparks-personal-workspace__module-bar">
                <i
                  style={{
                    width:
                      Math.min(
                        100,
                        module.attention * 16 + module.upcoming * 8,
                      ) + '%',
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="sparks-personal-workspace__footer-note">
        <div>
          <strong>Uma experiência, vários módulos.</strong>
          <p>
            O Meu Espaço de Trabalho pertence ao SPARKs. Cada módulo contribui
            com seus compromissos, alertas e indicadores sem duplicar sua fonte
            oficial.
          </p>
        </div>
      </section>
    </section>
  )
}
