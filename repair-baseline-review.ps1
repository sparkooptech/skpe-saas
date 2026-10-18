$ErrorActionPreference='Stop'
$p='C:\DADOS\SPARKs\skpe-saas\apps\web\src\modules\skpe\features\journey\JourneyProjectPlan.tsx'
$s=[IO.File]::ReadAllText($p)
$start=$s.IndexOf("      {activeStage === 'review' && (")
$end=$s.IndexOf("    </section>",$start)
if($start -lt 0 -or $end -lt 0){throw 'Review section not found'}
$end=$s.IndexOf("      )}",$end)
if($end -lt 0){throw 'Review section end not found'}
$end+=9
$next=$s.IndexOf("      {activeStage === 'review' && (",$end)
if($next -lt 0){throw 'Duplicate review not found'}
$end2=$s.IndexOf("      )}",$next)
if($end2 -lt 0){throw 'Duplicate review end not found'}
$end2+=9
$replacement=@'
      {activeStage === 'review' && (
        <section className="skpe-project-plan-panel">
          <div className="skpe-project-plan-panel-heading">
            <div>
              <p className="skpe-eyebrow">5 · Revisão da Linha de Base</p>
              <h3>Histórico e vigência das Linhas de Base</h3>
              <p>Consulte as versões registradas, seus motivos e a referência vigente. A revisão somente é necessária quando houver mudança formal no planejamento aprovado.</p>
            </div>
          </div>
          {baselineLoading ? <p>Carregando histórico de versões...</p> :
            baselineLoadError ? <p role="alert">Não foi possível consultar as versões: {baselineLoadError}</p> :
            baselineVersions.length === 0 ? <p>Nenhuma versão localizada no registro de cronogramas. A aprovação institucional deve ser reconciliada antes de qualquer nova submissão.</p> : (
              <div className="skpe-project-baseline-history" role="region" aria-label="Histórico de Linhas de Base">
                <table>
                  <thead><tr><th>Versão</th><th>Descrição</th><th>Tipo</th><th>Situação</th><th>Vigência</th><th>Data de aprovação</th><th>Justificativa registrada</th></tr></thead>
                  <tbody>{baselineVersions.map((version) => (
                    <tr key={version.id}>
                      <td>v{version.version_number}</td>
                      <td>{version.title}</td>
                      <td>{version.schedule_kind === 'baseline' ? 'Inicial' : version.schedule_kind === 'rebaseline' ? 'Revisão' : 'Previsão'}</td>
                      <td>{({ approved: 'Aprovada', active: 'Ativa', draft: 'Rascunho', pending_approval: 'Aguardando aprovação', superseded: 'Substituída', cancelled: 'Cancelada' } as Record<string, string>)[version.governance_status] ?? version.governance_status}</td>
                      <td>{version.is_current_plan ? 'Vigente' : 'Histórica'}</td>
                      <td>{formatDate(version.approved_at)}</td>
                      <td>{version.notes || 'Não informada'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
        </section>
      )}
'@
[IO.File]::WriteAllText($p,$s.Substring(0,$start)+$replacement+$s.Substring($end2),[Text.UTF8Encoding]::new($false))
Write-Output 'REVIEW_HISTORY_REPLACED=YES'
