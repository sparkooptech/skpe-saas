$p='C:\DADOS\SPARKs\skpe-saas\apps\web\src\modules\skpe\features\journey\JourneyProjectPlan.tsx'
$s=[IO.File]::ReadAllText($p)
$map=@{'HistÃ³rico'='Histórico';'RevisÃ£o'='Revisão';'VersÃ£o'='Versão';'DescriÃ§Ã£o'='Descrição';'SituaÃ§Ã£o'='Situação';'VigÃªncia'='Vigência';'aprovaÃ§Ã£o'='aprovação';'AprovaÃ§Ã£o'='Aprovação';'versÃµes'='versões';'referÃªncia'='referência';'revisÃ£o'='revisão';'somente Ã©'='somente é';'necessÃ¡ria'='necessária';'mudanÃ§a'='mudança';'NÃ£o'='Não';'possÃ­vel'='possível';'SubstituÃ­da'='Substituída';'HistÃ³rica'='Histórica';'PrevisÃ£o'='Previsão';'Â·'='·'}
foreach($k in $map.Keys){$s=$s.Replace($k,$map[$k])}
[IO.File]::WriteAllText($p,$s,[Text.UTF8Encoding]::new($false))
Write-Output 'UTF8_REPAIRED'
