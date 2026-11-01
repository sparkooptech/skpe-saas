import { useEffect, useState } from 'react'

import { supabase } from '../../../../lib/supabase'
import {
  StrategicFormulationStatusTabs,
  type StrategicFormulationTab,
} from './StrategicFormulationStatusTabs'
import { StrategicInitiativePlanSection } from './StrategicInitiativePlanSection'
import { StrategicIdentitySection } from './StrategicIdentitySection'
import { StrategicPositioningSection } from './StrategicPositioningSection'
import { StrategicExecutiveOverview } from './StrategicExecutiveOverview'
import { StrategicOkrDecompositionSection } from './StrategicOkrDecompositionSection'
import { StrategicOkrWorkspace } from './StrategicOkrWorkspace'
import { StrategicIndicatorWorkspace } from './StrategicIndicatorWorkspace'
import { StrategicExecutionGovernanceWorkspace } from './StrategicExecutionGovernanceWorkspace'
import { MyMeetingsPanel } from '../../workspace/MyMeetingsPanel'
import { StrategicBscMap } from './StrategicBscMap'
import { phase2SuggestionGovernanceNotice } from '../../contracts/strategic-suggestion-governance.ts'

import './StrategicFormulationSection.css'

type FormulationTab = StrategicFormulationTab

type Props = {
  organizationId: string
  projectId: string
  canAdjustStrategicMap: boolean
  strategicMapStageUnlocked: boolean
  initialTab?: FormulationTab
  currentStageCode?: string | null
}

export function StrategicFormulationSection({
  organizationId,
  projectId,
  canAdjustStrategicMap,
  strategicMapStageUnlocked,
  initialTab = 'overview',
  currentStageCode = null,
}: Props) {
  const [formulationId, setFormulationId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<FormulationTab>(initialTab)
  const [errorMessage, setErrorMessage] = useState('')
  const [futureWorkRefresh, setFutureWorkRefresh] = useState(0)
useEffect(() => {
    const requestedTab = sessionStorage.getItem('skpe:formulation:target-tab') as FormulationTab | null
    if (requestedTab && ['overview','pmvv','positioning','architecture','performance','indicators','initiatives','plan'].includes(requestedTab)) {
      setActiveTab(requestedTab)
      sessionStorage.removeItem('skpe:formulation:target-tab')
      sessionStorage.removeItem('skpe:formulation:target-stage')
      return
    }
    setActiveTab(initialTab)
  }, [initialTab, projectId, currentStageCode])

  useEffect(() => {
    let active = true

    async function load() {
      setErrorMessage('')

      const [
        identityResponse,
        valuesResponse,
        themesResponse,
        objectivesResponse,
        okrsResponse,
        keyResultsResponse,
        indicatorsResponse,
      ] = await Promise.all([
        supabase
          .from('skpe_strategic_identity')
          .select('status')
          .eq('organization_id', organizationId)
          .eq('project_id', projectId)
          .maybeSingle(),
        supabase
          .from('skpe_strategic_values')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('project_id', projectId),
        supabase
          .from('skpe_strategic_themes')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('project_id', projectId),
        supabase
          .from('skpe_strategic_objectives')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('project_id', projectId),
        supabase
          .from('skpe_okrs')
          .select('id, code, title, description, status, progress, validation_status')
          .eq('organization_id', organizationId)
          .eq('project_id', projectId)
          .order('display_order'),
        supabase
          .from('skpe_key_results')
          .select('id, code, name, description, target_value, current_value, unit, progress, validation_status')
          .eq('organization_id', organizationId)
          .eq('project_id', projectId)
          .order('code'),
        supabase
          .from('skpe_indicators')
          .select('id, code, name, description, unit, status, baseline_value')
          .eq('organization_id', organizationId)
          .eq('project_id', projectId)
          .order('code'),
      ])

      if (!active) return

      const responses = [
        identityResponse,
        valuesResponse,
        themesResponse,
        objectivesResponse,
        okrsResponse,
        keyResultsResponse,
        indicatorsResponse,
      ]

      const firstError = responses.find((response) => response.error)?.error

      if (firstError) {
        setErrorMessage(
          `Não foi possível consolidar a Formulação Estratégica: ${firstError.message}`,
        )
        return
      }

      const { data: formulationRows, error: formulationError } = await supabase
        .from('skpe_strategic_formulations')
        .select('id,status,version_number')
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)
        .in('status', ['draft', 'in_elaboration', 'pending_validation', 'validated', 'pending_approval', 'approved'])
        .order('version_number', { ascending: false })
        .limit(1)

      if (!active) return

      if (formulationError) {
        setErrorMessage(
          `Não foi possível resolver a versão da Formulação Estratégica: ${formulationError.message}`,
        )
        return
      }

      setFormulationId(formulationRows?.[0]?.id ?? null)
    }

    void load()

    return () => {
      active = false
    }
  }, [organizationId, projectId])

  return (
    <section className="skpe-strategic-formulation">
<StrategicFormulationStatusTabs
        organizationId={organizationId}
        projectId={projectId}
        activeId={activeTab}
        onChange={(id) => {
          setActiveTab(id)
              }}
        currentStageCode={currentStageCode}
      />

      {errorMessage ? (
        <div className="skpe-admin-message skpe-admin-message-error">
          {errorMessage}
        </div>
      ) : null}

      {activeTab === 'overview' ? (
        <StrategicExecutiveOverview
          organizationId={organizationId}
          projectId={projectId}
        />
      ) : null}
      {activeTab === 'pmvv' ? (
        <section className="skpe-formulation-tab-panel">
          <StrategicIdentitySection
            organizationId={organizationId}
            projectId={projectId}
            formulationId={formulationId}
          />
          <article className="skpe-formulation-synthesis">
            <h3>Síntese e considerações</h3>
            <p className="skpe-formulation-human-validation-note">{phase2SuggestionGovernanceNotice}</p>
            <p>
              O PMVV deve orientar escolhas, objetivos e iniciativas. A
              aprovação da identidade não substitui a validação posterior dos
              Objetivos Estratégicos e demais desdobramentos.
            </p>
          </article>
        </section>
      ) : null}

      {activeTab === 'positioning' ? (
        <section className="skpe-formulation-tab-panel">
          <StrategicPositioningSection
            organizationId={organizationId}
            projectId={projectId}
          />
        </section>
      ) : null}

      {activeTab === 'architecture' ? (
        <section className="skpe-formulation-tab-panel">
          <StrategicBscMap
            formulationId={formulationId}
            canAdjustLayout={canAdjustStrategicMap && strategicMapStageUnlocked}
          />
        </section>
      ) : null}
{activeTab === 'performance' ? (
        <section className="skpe-formulation-tab-panel">
          <StrategicOkrWorkspace
            organizationId={organizationId}
            formulationId={formulationId}
            onChanged={() => setFutureWorkRefresh((value) => value + 1)}
          />
          <StrategicOkrDecompositionSection
            key={`okr-readiness-${futureWorkRefresh}`}
            organizationId={organizationId}
            projectId={projectId}
            formulationId={formulationId}
          />
        </section>
      ) : null}
      {activeTab === 'indicators' ? (
        <section className="skpe-formulation-tab-panel">
          <StrategicIndicatorWorkspace
            organizationId={organizationId}
            formulationId={formulationId}
            onChanged={() => setFutureWorkRefresh((value) => value + 1)}
          />
        </section>
      ) : null}
      {activeTab === 'initiatives' ? (
        <section className="skpe-formulation-tab-panel">
          <StrategicInitiativePlanSection
            organizationId={organizationId}
            projectId={projectId}
            formulationId={formulationId}
          />
        </section>
      ) : null}
{activeTab === 'plan' ? (
        <section className="skpe-formulation-tab-panel">
          <StrategicExecutionGovernanceWorkspace
            organizationId={organizationId}
            formulationId={formulationId}
            onChanged={() => setFutureWorkRefresh((value) => value + 1)}
          />
          <MyMeetingsPanel
            organizationId={organizationId}
            projectId={projectId}
          />
        </section>
      ) : null}
    </section>
  )
}
