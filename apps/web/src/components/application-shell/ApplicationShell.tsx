import { useEffect, useState, type ReactNode } from 'react'

import './ApplicationShell.css'

export type ApplicationShellContextItem = {
  label: string
  value: string
}

export type ApplicationShellNavigationItem = {
  id: string
  label: string
  icon?: ReactNode
  active?: boolean
  disabled?: boolean
  onActivate?: () => void
  children?: ApplicationShellNavigationItem[]
}

type ApplicationShellProps = {
  brand: ReactNode
  contextItems: ApplicationShellContextItem[]
  userArea: ReactNode
  pageTitle?: ReactNode
  headerActions?: ReactNode
  sidebarFooter?: ReactNode
  navigationItems: ApplicationShellNavigationItem[]
  navigationLabel?: string
  children: ReactNode
  footer?: ReactNode
  collapsed?: boolean
  mobileOpen?: boolean
  onToggleCollapsed?: () => void
  onCloseMobile?: () => void
}

export function ApplicationShell({
  brand,
  contextItems,
  userArea,
  pageTitle,
  headerActions,
  sidebarFooter,
  navigationItems,
  navigationLabel = 'Navega\u00e7\u00e3o principal',
  children,
  footer,
  collapsed = false,
  mobileOpen = false,
  onToggleCollapsed,
  onCloseMobile,
}: ApplicationShellProps) {
  const activeGroupKey = navigationItems
    .filter((item) => item.children?.length && item.active)
    .map((item) => item.id)
    .join('|')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navigationItems.filter((item) => item.children?.length && item.active).map((item) => [item.id, true])),
  )

  useEffect(() => {
    if (!activeGroupKey) return
    setExpandedGroups((current) => current[activeGroupKey] === undefined
      ? { ...current, [activeGroupKey]:true }
      : current)
  }, [activeGroupKey])

  return (
    <div
      className={[
        'application-shell',
        collapsed ? 'application-shell-collapsed' : '',
        mobileOpen ? 'application-shell-mobile-open' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <aside
        className="application-shell-sidebar"
        aria-label={navigationLabel}
      >
        <div className="application-shell-sidebar-brand">{brand}</div>

        <div
          className="application-shell-context"
          aria-label="Contexto atual"
        >
          {contextItems.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="application-shell-context-item"
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <nav className="application-shell-navigation">
          {navigationItems.map((item) => item.children?.length ? (
            <details
              key={item.id}
              className="application-shell-navigation-group"
              open={collapsed || Boolean(expandedGroups[item.id])}
            >
              <summary
                className={[
                  'application-shell-navigation-item',
                  'application-shell-navigation-group-toggle',
                  item.active ? 'active' : '',
                ].filter(Boolean).join(' ')}
                title={collapsed ? item.label : undefined}
                onClick={(event) => {
                  if (item.disabled) {
                    event.preventDefault()
                    return
                  }
                  setExpandedGroups((current) => ({ ...current, [item.id]: !current[item.id] }))
                  item.onActivate?.()
                  onCloseMobile?.()
                }}
                aria-disabled={item.disabled || undefined}
              >
                {item.icon && <span className="application-shell-navigation-icon" aria-hidden="true">{item.icon}</span>}
                <span className="application-shell-navigation-label">{item.label}</span>
                {!collapsed && <span className="application-shell-navigation-group-chevron" aria-hidden="true">⌄</span>}
              </summary>
              <div className="application-shell-navigation-submenu">
                {item.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    className={[
                      'application-shell-navigation-subitem',
                      child.active ? 'active' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => {
                      child.onActivate?.()
                      onCloseMobile?.()
                    }}
                    disabled={child.disabled}
                    aria-current={child.active ? 'page' : undefined}
                    title={collapsed ? child.label : undefined}
                  >
                    {child.icon && <span className="application-shell-navigation-icon" aria-hidden="true">{child.icon}</span>}
                    <span className="application-shell-navigation-label">{child.label}</span>
                  </button>
                ))}
              </div>
            </details>
          ) : (
            <button
              key={item.id}
              type="button"
              className={[
                'application-shell-navigation-item',
                item.active ? 'active' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => {
                item.onActivate?.()
                onCloseMobile?.()
              }}
              disabled={item.disabled}
              aria-current={item.active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              {item.icon && <span className="application-shell-navigation-icon" aria-hidden="true">{item.icon}</span>}
              <span className="application-shell-navigation-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {sidebarFooter && (
          <div className="application-shell-sidebar-footer">
            {sidebarFooter}
          </div>
        )}
      </aside>

      <header className="application-shell-header">
        {onToggleCollapsed && (
          <button
            type="button"
            className="application-shell-collapse-button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menu principal' : 'Recolher menu principal'}
            title={collapsed ? 'Expandir menu principal' : 'Recolher menu principal'}
          >
            {collapsed ? '\u2192' : '\u2190'}
          </button>
        )}

        <div className="application-shell-page-title">
          {pageTitle ?? 'Vis\u00e3o Geral'}
        </div>

        <div className="application-shell-header-actions">
          {headerActions}
          <div className="application-shell-user">{userArea}</div>
        </div>
      </header>

      {mobileOpen && (
        <button
          type="button"
          className="application-shell-mobile-backdrop"
          onClick={onCloseMobile}
          aria-label="Fechar menu"
        />
      )}

      <main className="application-shell-content">{children}</main>

      <footer className="application-shell-footer">
        {footer ?? (
          <>
            <span>Plataforma SPARKs</span>
            <span>
              &copy; {new Date().getFullYear()} SPARKOOP &mdash; Todos os direitos reservados.
            </span>
          </>
        )}
      </footer>
    </div>
  )
}
