$ErrorActionPreference = 'Stop'
$p = 'C:\DADOS\SPARKs\skpe-saas\apps\web\src\modules\initiatives\analytics\InitiativePerformanceCockpit.css'
$s = [IO.File]::ReadAllText($p)
$marker = '/* SKPE UI regression repair: content-sized dashboard rows and visible exports. */'
$i = $s.IndexOf($marker)
if ($i -lt 0) { throw 'Marker missing; no changes made' }
$css = @'
/* Executive dashboard: consolidated visual layout */
.skpe-performance-export-row { display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;justify-content:flex-start;margin:0 }
.skpe-performance-export-button { min-height:2.35rem }
.skpe-performance-strategic-container { box-sizing:border-box;min-width:0;padding:1.05rem;background:var(--sparks-surface,#fff);border:1px solid var(--sparks-border,#dfe6e2);border-radius:14px;display:flex;flex-direction:column;gap:.8rem }
.skpe-performance-strategic-container>.skpe-performance-panel-heading { margin:0 }
@media(min-width:960px) {
.skpe-performance-dashboard-layout { grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch }
.skpe-performance-dashboard-layout>.skpe-performance-executive-column { display:contents }
.skpe-performance-dashboard-layout>.skpe-performance-results-section,.skpe-performance-dashboard-layout>.skpe-performance-executive-column>.skpe-performance-execution-section { box-sizing:border-box;grid-row:1;align-self:stretch;height:auto;min-height:100%;padding:1.05rem;background:var(--sparks-surface,#fff);border:1px solid var(--sparks-border,#dfe6e2);border-radius:14px;display:flex;flex-direction:column;justify-content:space-between;gap:.75rem }
.skpe-performance-dashboard-layout>.skpe-performance-results-section { grid-column:1 }
.skpe-performance-dashboard-layout>.skpe-performance-executive-column>.skpe-performance-execution-section { grid-column:2 }
.skpe-performance-dashboard-layout>.skpe-performance-executive-column>.skpe-performance-strategic-container { grid-column:1/-1;grid-row:2;align-self:stretch }
.skpe-performance-dashboard-layout .skpe-performance-execution-section .skpe-performance-summary-grid { margin-bottom:0;flex:0 0 auto }
.skpe-performance-dashboard-layout .skpe-performance-execution-section .skpe-performance-portfolio-visual { flex:1 1 auto;display:flex;align-items:center;justify-content:space-between;gap:1rem }
}
@media(max-width:760px) { .skpe-performance-export-row { flex-direction:column;align-items:stretch } .skpe-performance-export-button { width:100% } }
'@
[IO.File]::WriteAllText($p, $s.Substring(0,$i) + $css, [Text.UTF8Encoding]::new($false))
Write-Output 'CSS_CONSOLIDATED=YES'
