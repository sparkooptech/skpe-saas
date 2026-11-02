import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import JSZip from 'https://esm.sh/jszip@3.10.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = { action?: 'scan_source'; sourceId?: string }
type IntakeSource = {
  id: string
  organization_id: string
  project_id: string | null
  source_type: 'sharepoint' | 'web_url' | 'network_path' | 'other'
  source_url: string
  source_label: string
  include_subfolders: boolean
}
type DiscoveredFile = {
  externalKey: string
  externalUrl: string
  externalPath: string
  fileName: string
  mimeType: string | null
  size: number | null
  modifiedAt: string | null
  etag: string | null
  driveId?: string
  itemId?: string
  downloadUrl?: string
}
type ChecklistItem = {
  id: string
  parent_item_id: string | null
  code: string
  name: string
  description: string | null
  possible_evidences: unknown
  best_practice_criteria: unknown
}
type RankedRequirement = { id: string; code: string; parentId: string | null; score: number }

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
function normalizeText(value: unknown) {
  return String(value ?? '').toLocaleLowerCase('pt-BR')
}
function wordList(value: unknown) {
  let text = normalizeText(value)
  for (const mark of ['.', ',', ';', ':', '/', '\\', '-', '_', '(', ')', '[', ']', '{', '}', '\n', '\r', '\t']) text = text.replaceAll(mark, ' ')
  return text.split(' ').map((item) => item.trim()).filter((item) => item.length >= 4)
}
function scoreTokenOverlap(documentText: string, requirementText: string) {
  const doc = new Set(wordList(documentText))
  const req = new Set(wordList(requirementText))
  if (doc.size === 0 || req.size === 0) return 0
  let matched = 0
  req.forEach((token) => { if (doc.has(token)) matched += 1 })
  return Math.min(1, matched / Math.max(4, Math.min(req.size, 24)))
}
function toShareId(url: string) {
  let encoded = btoa(url).replaceAll('+', '-').replaceAll('/', '_')
  while (encoded.endsWith('=')) encoded = encoded.slice(0, -1)
  return 'u!' + encoded
}
function stripXml(xml: string) {
  let result = ''
  let inside = false
  for (const char of xml) {
    if (char === '<') inside = true
    else if (char === '>') inside = false
    else if (!inside) result += char
  }
  return result.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('\n', ' ').slice(0, 24000)
}
async function getGraphToken() {
  const tenant = Deno.env.get('MS_GRAPH_TENANT_ID')
  const clientId = Deno.env.get('MS_GRAPH_CLIENT_ID')
  const clientSecret = Deno.env.get('MS_GRAPH_CLIENT_SECRET')
  if (!tenant || !clientId || !clientSecret) throw new Error('Conector Microsoft Graph ainda nao configurado no ambiente.')
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' })
  const response = await fetch('https://login.microsoftonline.com/' + tenant + '/oauth2/v2.0/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) throw new Error('Nao foi possivel autenticar o conector Microsoft Graph.')
  const payload = await response.json() as { access_token?: string }
  if (!payload.access_token) throw new Error('Microsoft Graph nao retornou token de acesso.')
  return payload.access_token
}
async function graphJson(url: string, token: string) {
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } })
  if (!response.ok) throw new Error('Microsoft Graph retornou ' + response.status + ' ao consultar a origem.')
  return await response.json() as Record<string, unknown>
}
async function discoverSharePoint(source: IntakeSource, token: string) {
  const shared = await graphJson('https://graph.microsoft.com/v1.0/shares/' + toShareId(source.source_url) + '/driveItem?$expand=parentReference', token)
  const rootId = String(shared.id ?? '')
  const parent = (shared.parentReference ?? {}) as Record<string, unknown>
  const driveId = String(parent.driveId ?? '')
  if (!rootId || !driveId) throw new Error('A URL nao foi resolvida como pasta ou arquivo do SharePoint.')
  const discovered: DiscoveredFile[] = []
  const queue: Array<{ id: string; path: string }> = [{ id: rootId, path: source.source_label }]
  const isFile = Boolean(shared.file)
  if (isFile) queue.length = 0
  const addItem = (item: Record<string, unknown>, path: string) => {
    const file = item.file as Record<string, unknown> | undefined
    if (!file) return
    const id = String(item.id ?? '')
    const name = String(item.name ?? 'documento')
    const urls = item['@microsoft.graph.downloadUrl']
    discovered.push({
      externalKey: driveId + ':' + id,
      externalUrl: String(item.webUrl ?? source.source_url),
      externalPath: path + '/' + name,
      fileName: name,
      mimeType: typeof file.mimeType === 'string' ? file.mimeType : null,
      size: typeof item.size === 'number' ? item.size : null,
      modifiedAt: typeof item.lastModifiedDateTime === 'string' ? item.lastModifiedDateTime : null,
      etag: typeof item.eTag === 'string' ? item.eTag : null,
      driveId,
      itemId: id,
      downloadUrl: typeof urls === 'string' ? urls : undefined,
    })
  }
  if (isFile) addItem(shared, source.source_label)
  while (queue.length > 0 && discovered.length < 750) {
    const current = queue.shift()!
    let nextUrl: string | null = 'https://graph.microsoft.com/v1.0/drives/' + driveId + '/items/' + current.id + '/children?$top=200'
    while (nextUrl && discovered.length < 750) {
      const page = await graphJson(nextUrl, token)
      const items = Array.isArray(page.value) ? page.value as Record<string, unknown>[] : []
      for (const item of items) {
        const name = String(item.name ?? 'item')
        if (item.folder && source.include_subfolders) queue.push({ id: String(item.id ?? ''), path: current.path + '/' + name })
        else addItem(item, current.path)
        if (discovered.length >= 750) break
      }
      const following = page['@odata.nextLink']
      nextUrl = typeof following === 'string' ? following : null
    }
  }
  return discovered
}
async function extractText(file: DiscoveredFile) {
  if (!file.downloadUrl || (file.size ?? 0) > 8 * 1024 * 1024) return ''
  try {
    const response = await fetch(file.downloadUrl)
    if (!response.ok) return ''
    const buffer = await response.arrayBuffer()
    const name = file.fileName.toLocaleLowerCase('pt-BR')
    if (name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.json') || name.endsWith('.xml') || name.endsWith('.html') || name.endsWith('.md')) {
      return new TextDecoder().decode(buffer).slice(0, 24000)
    }
    if (name.endsWith('.docx') || name.endsWith('.pptx') || name.endsWith('.xlsx')) {
      const zip = await JSZip.loadAsync(buffer)
      const entries = Object.keys(zip.files).filter((entry) => entry.endsWith('.xml')).slice(0, 80)
      let text = ''
      for (const entry of entries) {
        if (text.length >= 24000) break
        text += ' ' + stripXml(await zip.files[entry].async('text'))
      }
      return text.slice(0, 24000)
    }
  } catch {
    return ''
  }
  return ''
}
async function discoverDirectUrl(source: IntakeSource) {
  const url = new URL(source.source_url)
  const fileName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? source.source_label)
  let size: number | null = null
  let mimeType: string | null = null
  let modifiedAt: string | null = null
  try {
    const response = await fetch(source.source_url, { method: 'HEAD' })
    const contentLength = response.headers.get('content-length')
    size = contentLength ? Number(contentLength) : null
    mimeType = response.headers.get('content-type')
    modifiedAt = response.headers.get('last-modified')
  } catch {
    // A origem pode exigir autenticacao ou nao aceitar HEAD; o registro continua rastreavel.
  }
  return [{
    externalKey: 'url:' + source.source_url,
    externalUrl: source.source_url,
    externalPath: source.source_url,
    fileName,
    mimeType,
    size,
    modifiedAt,
    etag: null,
    downloadUrl: source.source_url,
  }] satisfies DiscoveredFile[]
}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return jsonResponse({ error: 'Metodo nao permitido.' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorization = request.headers.get('Authorization')
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return jsonResponse({ error: 'Configuracao do ambiente incompleta.' }, 500)
  if (!authorization) return jsonResponse({ error: 'Sessao nao informada.' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } }, auth: { autoRefreshToken: false, persistSession: false } })
  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: requester, error: requesterError } = await userClient.auth.getUser()
  if (requesterError || !requester.user) return jsonResponse({ error: 'Sessao invalida ou expirada.' }, 401)

  let payload: Payload
  try { payload = await request.json() as Payload } catch { return jsonResponse({ error: 'Conteudo invalido.' }, 400) }
  if (payload.action !== 'scan_source' || !payload.sourceId) return jsonResponse({ error: 'Acao ou origem invalida.' }, 400)
  const { data: sourceData, error: sourceError } = await adminClient.from('sparks_evidence_intake_sources').select('*').eq('id', payload.sourceId).maybeSingle()
  if (sourceError || !sourceData) return jsonResponse({ error: 'Origem documental nao encontrada.' }, 404)
  const source = sourceData as IntakeSource
  const { data: canManage, error: permissionError } = await userClient.rpc('can_manage_sparks_evidence', { target_organization_id: source.organization_id })
  if (permissionError || canManage !== true) return jsonResponse({ error: 'Sem permissao para varrer esta origem.' }, 403)

  await adminClient.from('sparks_evidence_intake_sources').update({ scan_status: 'scanning', updated_at: new Date().toISOString() }).eq('id', source.id)

  try {
    let discovered: DiscoveredFile[] = []
    if (source.source_type === 'sharepoint') discovered = await discoverSharePoint(source, await getGraphToken())
    else if (source.source_type === 'web_url') discovered = await discoverDirectUrl(source)
    else throw new Error('A varredura automatica desta origem ainda requer conector instalado.')

    const { data: template } = await adminClient.from('sparks_checklist_templates').select('id').eq('code', 'SPARKS-PEM00-GERAL').eq('active', true).maybeSingle()
    const { data: checklistRows } = template?.id
      ? await adminClient.from('sparks_checklist_template_items').select('id,parent_item_id,code,name,description,possible_evidences,best_practice_criteria').eq('template_id', template.id).eq('active', true)
      : { data: [] as ChecklistItem[] }
    const items = (checklistRows ?? []) as ChecklistItem[]
    const axes = new Map(items.filter((item) => item.code.startsWith('EIXO-') && item.parent_item_id === null).map((item) => [item.id, item.code]))
    const requirements = items.filter((item) => item.parent_item_id !== null)
    let proposed = 0
    for (const file of discovered) {
      const extracted = await extractText(file)
      const documentText = [file.fileName, file.externalPath, extracted].filter(Boolean).join(' ')
      const ranked: RankedRequirement[] = requirements.map((item) => ({
        id: item.id,
        code: item.code,
        parentId: item.parent_item_id,
        score: scoreTokenOverlap(documentText, [item.name, item.description ?? '', JSON.stringify(item.possible_evidences ?? []), JSON.stringify(item.best_practice_criteria ?? {})].join(' ')),
      })).sort((a, b) => b.score - a.score).slice(0, 3)
      const best = ranked[0]?.score ?? 0
      const relevance = Math.round(best * 10000) / 100
      const compliance = relevance >= 70 ? 2 : relevance >= 45 ? 1 : 0
      const completeness = Math.min(100, Math.round((extracted.length / 12000) * 100))
      const reliability = source.source_type === 'sharepoint' ? 80 : 55
      const modified = file.modifiedAt ? new Date(file.modifiedAt).getTime() : 0
      const ageDays = modified ? (Date.now() - modified) / 86400000 : 9999
      const currentness = ageDays <= 365 ? 90 : ageDays <= 1095 ? 70 : ageDays <= 1825 ? 50 : 30
      const quality = Math.round((reliability + completeness) / 2)
      const overall = Math.round((quality + currentness + relevance) / 3)
      const axisCodes = Array.from(new Set(ranked.map((item) => item.parentId ? axes.get(item.parentId) : null).filter(Boolean)))
      const row = {
        source_id: source.id,
        organization_id: source.organization_id,
        external_key: file.externalKey,
        external_url: file.externalUrl,
        external_path: file.externalPath,
        file_name: file.fileName,
        title: file.fileName,
        mime_type: file.mimeType,
        file_size_bytes: file.size,
        modified_at: file.modifiedAt,
        etag: file.etag,
        extracted_excerpt: extracted.slice(0, 4000),
        analysis_status: 'analyzed',
        candidate_status: relevance >= 20 ? 'proposed' : 'discovered',
        relevance_score: relevance,
        suggested_axis_codes: axisCodes,
        suggested_checklist_item_ids: ranked.filter((item) => item.score > 0).map((item) => item.id),
        suggested_compliance_level: compliance,
        suggested_quality_score: quality,
        suggested_completeness_score: completeness,
        suggested_currentness_score: currentness,
        suggested_reliability_score: reliability,
        suggested_overall_score: overall,
        analysis: {
          ranked_requirements: ranked,
          summary: relevance >= 45 ? 'Documento candidato a evidencia relevante para o Planejamento Estrategico.' : 'Documento descoberto; requer triagem humana para confirmar relevancia.',
          gaps: compliance <= 1 ? 'A existencia do arquivo nao comprova institucionalizacao, execucao, recorrencia ou resultados.' : 'Documento demonstra sinais parciais; validar pratica, recorrencia, controle e resultados.',
          recommendations: 'Validar o documento no contexto do requisito antes de registrar atendimento.',
          human_validation_required: true,
          authority: 'SK-DOC',
        },
        updated_at: new Date().toISOString(),
      }
      const { error: upsertError } = await adminClient.from('sparks_evidence_intake_candidates').upsert(row, { onConflict: 'source_id,external_key' })
      if (upsertError) throw upsertError
      if (row.candidate_status === 'proposed') proposed += 1
    }

    await adminClient.from('sparks_evidence_intake_sources').update({
      scan_status: 'review_ready',
      last_scan_at: new Date().toISOString(),
      last_scan_summary: { discovered: discovered.length, proposed, truncated: discovered.length >= 750 },
      updated_at: new Date().toISOString(),
    }).eq('id', source.id)

    return jsonResponse({ success: true, sourceId: source.id, discovered: discovered.length, proposed, humanValidationRequired: true })
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'Falha na varredura da origem documental.'
    await adminClient.from('sparks_evidence_intake_sources').update({ scan_status: 'error', status: 'error', last_scan_summary: { error: message }, updated_at: new Date().toISOString() }).eq('id', source.id)
    return jsonResponse({ error: message }, 500)
  }
})
