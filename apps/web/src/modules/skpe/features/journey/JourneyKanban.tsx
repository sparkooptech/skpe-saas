import { useEffect, useState } from 'react'

import { supabase } from '../../../../lib/supabase'
import { InitiativeKanbanBoard } from '../../../initiatives/kanban/InitiativeKanbanBoard'
import './JourneyKanban.css'

type Props = {
  organizationId: string
  projectId: string
}

type ProjectBinding = {
  initiative_id: string
}

export function JourneyKanban({ organizationId, projectId }: Props) {
  const [initiativeId, setInitiativeId] = useState<string | null>(null)
  const [canManageInitiatives, setCanManageInitiatives] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadProjectKanban() {
      setLoading(true)
      setErrorMessage('')

      const [bindingResponse, permissionResponse] = await Promise.all([
        supabase
          .from('skpe_project_initiative_bindings')
          .select('initiative_id')
          .eq('organization_id', organizationId)
          .eq('skpe_project_id', projectId)
          .eq('binding_type', 'strategic_plan_implementation')
          .limit(2),
        supabase.rpc('can_manage_sparks_initiatives', {
          target_organization_id: organizationId,
          target_source_module_code: 'SK-PE',
        }),
      ])

      if (!active) return

      if (bindingResponse.error) {
        setInitiativeId(null)
        setCanManageInitiatives(false)
        setErrorMessage('Não foi possível localizar o Projeto Estratégico vinculado à Jornada.')
        setLoading(false)
        return
      }

      const bindings = (bindingResponse.data ?? []) as ProjectBinding[]
      if (bindings.length !== 1) {
        setInitiativeId(null)
        setCanManageInitiatives(false)
        setErrorMessage(
          bindings.length === 0
            ? 'Esta Jornada ainda não possui um Projeto Estratégico vinculado para execução em Kanban.'
            : 'Há mais de um Projeto Estratégico vinculado à mesma Jornada. Revise o vínculo antes de operar o Kanban.',
        )
        setLoading(false)
        return
      }

      setInitiativeId(bindings[0].initiative_id)
      setCanManageInitiatives(
        !permissionResponse.error && permissionResponse.data === true,
      )
      setLoading(false)
    }

    void loadProjectKanban()

    return () => {
      active = false
    }
  }, [organizationId, projectId])

  if (loading) {
    return (
      <section className="skpe-journey-kanban" aria-label="Kanban do Projeto Estratégico">
        <p>Carregando Kanban do Projeto Estratégico...</p>
      </section>
    )
  }

  if (!initiativeId) {
    return (
      <section className="skpe-journey-kanban" aria-label="Kanban do Projeto Estratégico">
        <header className="skpe-journey-kanban-heading">
          <h2>Kanban do Projeto Estratégico</h2>
          <p>{errorMessage}</p>
        </header>
      </section>
    )
  }

  return (
    <section className="skpe-journey-kanban skpe-journey-kanban--operational" aria-label="Kanban do Projeto Estratégico">
      <header className="skpe-journey-kanban-heading">
        <div>
          <h2>Kanban do Projeto Estratégico</h2>
          <p>Execute e acompanhe as ações do Projeto sem sair da Jornada. Responsáveis, prazos, capacidade e histórico permanecem vinculados à fonte canônica da iniciativa.</p>
        </div>
        {!canManageInitiatives ? <span>Consulta</span> : null}
      </header>
      <InitiativeKanbanBoard
        initiativeId={initiativeId}
        canManageInitiatives={canManageInitiatives}
      />
    </section>
  )
}