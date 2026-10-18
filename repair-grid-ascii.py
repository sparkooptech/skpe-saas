from pathlib import Path
p=Path(r'C:\DADOS\SPARKs\skpe-saas\apps\web\src\modules\skpe\features\journey\JourneyProjectPlan.tsx')
s=p.read_text(encoding='utf-8')
start=s.index("      {activeStage === 'review' && (")
end=s.index("        </section>\n      )}",start)+len("        </section>\n      )}")
new=r"""      {activeStage === 'review' && (
        <section className="skpe-project-plan-panel">
          <div className="skpe-project-plan-panel-heading">
            <div>
              <p className="skpe-eyebrow">5 - Revis\u00e3o da Linha de Base</p>
              <h3>Hist\u00f3rico e vig\u00eancia das Linhas de Base</h3>
              <p>Consulte as vers\u00f5es registradas e a refer\u00eancia vigente. Revis\u00f5es somente s\u00e3o necess\u00e1rias quando houver altera\u00e7\u00e3o formal.</p>
            </div>
          </div>
          {baselineLoading ? <p>Carregando vers\u00f5es...</p> :
            baselineLoadError ? <p role="alert">Falha na consulta: {baselineLoadError}</p> : (
              <SparksSmartGrid
                ariaLabel="Hist\u00f3rico de Linhas de Base"
                rows={baselineVersions.map((version) => ({
                  id: version.id,
                  version: 'v' + version.version_number,
                  title: version.title,
                  kind: version.schedule_kind === 'baseline' ? 'Inicial' : version.schedule_kind === 'rebaseline' ? 'Revis\u00e3o' : 'Previs\u00e3o',
                  status: ({ approved: 'Aprovada', active: 'Ativa', draft: 'Rascunho', pending_approval: 'Aguardando aprova\u00e7\u00e3o', superseded: 'Substitu\u00edda', cancelled: 'Cancelada' } as Record<string, string>)[version.governance_status] ?? version.governance_status,
                  current: version.is_current_plan ? 'Vigente' : 'Hist\u00f3rica',
                  approved: version.approved_at ? formatDate(version.approved_at) : 'Sem registro',
                  notes: version.notes || 'N\u00e3o informada',
                }))}
                columns={[
                  { id: 'version', label: 'Vers\u00e3o', minWidth: 90 },
                  { id: 'title', label: 'Descri\u00e7\u00e3o', minWidth: 180, grow: 2, tooltip: true },
                  { id: 'kind', label: 'Tipo', minWidth: 95 },
                  { id: 'status', label: 'Situa\u00e7\u00e3o', minWidth: 135 },
                  { id: 'current', label: 'Vig\u00eancia', minWidth: 100 },
                  { id: 'approved', label: 'Aprova\u00e7\u00e3o', minWidth: 125 },
                  { id: 'notes', label: 'Justificativa registrada', minWidth: 220, grow: 2, tooltip: true },
                ]}
                emptyMessage="Nenhuma vers\u00e3o localizada no registro de cronogramas."
                viewportMode="balanced"
              />
            )}
        </section>
      )}"""
new=new.encode('ascii').decode('unicode_escape')
s=s[:start]+new+s[end:]
p.write_text(s,encoding='utf-8')
print('GRID_AND_UTF8_REPAIRED')
