import type { ComponentProps } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ApplicationShell } from '../../../components/application-shell/ApplicationShell'
import {
  SkpeCockpit,
  type CockpitSection,
  type SkpeOverviewShellPayload,
} from '../SkpeCockpit'
import {
  SkpeWorkspaceProvider,
  type SkpeWorkspaceContextValue,
} from '../context/SkpeWorkspaceContext'
import {
  parsePlatformRoute,
  platformRoutes,
  type SkpeRouteSection,
} from './skpeRoutes'

type SkpeCockpitProps = ComponentProps<typeof SkpeCockpit>

export type SkpeWorkspaceProps = SkpeCockpitProps

const LEGACY_COCKPIT_SECTIONS = new Set<CockpitSection>([
  'overview',
  'journey',
  'initiatives',
  'artifacts',
  'governance',
])

const ROUTED_COCKPIT_SECTIONS: Partial<
  Record<SkpeRouteSection, CockpitSection>
> = {
  overview: 'overview',
  journey: 'journey',
  initiatives: 'initiatives',
  governance: 'governance',
  artifacts: 'artifacts',
}

const COCKPIT_ROUTE_SECTIONS: Partial<
  Record<CockpitSection, SkpeRouteSection>
> = {
  overview: 'overview',
  journey: 'journey',
  initiatives: 'initiatives',
  governance: 'governance',
  artifacts: 'artifacts',
}

function parseLegacyCockpitSection(
  search: string,
): CockpitSection | null {
  const section = new URLSearchParams(search).get('section')
  if (!section) return null

  return LEGACY_COCKPIT_SECTIONS.has(section as CockpitSection)
    ? (section as CockpitSection)
    : null
}

export function SkpeWorkspace(props: SkpeWorkspaceProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const route = parsePlatformRoute(location.pathname)

  const explicitRoute = route.kind === 'skpe' ? route : null
  const legacySection =
    !explicitRoute && props.mode !== 'organization-admin'
      ? parseLegacyCockpitSection(location.search)
      : null

  const contextValue: SkpeWorkspaceContextValue = {
    organization: {
      id: props.organizationId,
      code: props.organizationCode,
      name: props.organizationName,
    },
    access: {
      roleCode: props.userRoleCode,
      roleName: props.userRoleName,
      isOrganizationAdmin: props.isOrganizationAdmin,
      isPlatformSuperAdmin: props.isPlatformSuperAdmin,
    },
    route: {
      projectId: explicitRoute?.projectId ?? null,
      formulationId: explicitRoute?.formulationId ?? null,
      cycleId: null,
      section: explicitRoute?.section ?? null,
    },
    contextMode: explicitRoute ? 'explicit' : 'legacy',
  }

  const handleNavigateSection = (section: CockpitSection) => {
    props.onNavigateSection?.(section)

    if (explicitRoute) {
      const routeSection = COCKPIT_ROUTE_SECTIONS[section]
      if (!routeSection) {
        return
      }

      const pathname = platformRoutes.skpe({
        organizationId: explicitRoute.organizationId,
        projectId: explicitRoute.projectId,
        formulationId: explicitRoute.formulationId,
        section: routeSection,
      })

      if (pathname === location.pathname) {
        return
      }

      navigate({
        pathname,
        search: location.search,
      })
      return
    }

    if (
      props.mode === 'organization-admin' ||
      !LEGACY_COCKPIT_SECTIONS.has(section)
    ) {
      return
    }

    const searchParams = new URLSearchParams(location.search)
    searchParams.set('section', section)

    navigate({
      pathname: location.pathname,
      search: `?${searchParams.toString()}`,
    })
  }

  const renderOverviewShell = (
    payload: SkpeOverviewShellPayload,
  ) => (
    <ApplicationShell
      brand={payload.brand}
      contextItems={payload.contextItems}
      userArea={payload.userArea}
      navigationItems={payload.navigationItems}
      navigationLabel={payload.navigationLabel}
      navigationId={payload.navigationId}
      collapsed={payload.collapsed}
      mobileOpen={payload.mobileOpen}
      onToggleCollapsed={payload.onToggleCollapsed}
      onCloseMobile={payload.onCloseMobile}
    >
      {payload.children}
    </ApplicationShell>
  )

  return (
    <SkpeWorkspaceProvider value={contextValue}>
      <SkpeCockpit
        {...props}
        initialSection={
          (explicitRoute
            ? ROUTED_COCKPIT_SECTIONS[explicitRoute.section]
            : null) ??
          legacySection ??
          props.initialSection
        }
        onNavigateSection={handleNavigateSection}
        renderOverviewShell={renderOverviewShell}
      />
    </SkpeWorkspaceProvider>
  )
}
