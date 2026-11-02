import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const supabaseClient = readFileSync(
  new URL('../src/lib/supabase.ts', import.meta.url),
  'utf8',
)
const nginx = readFileSync(
  new URL(
    '../../../deploy/hostinger/skpe-saas-homol/runtime/nginx.conf',
    import.meta.url,
  ),
  'utf8',
)
const publicCompose = readFileSync(
  new URL(
    '../../../deploy/hostinger/skpe-saas-homol/docker-compose.yml',
    import.meta.url,
  ),
  'utf8',
)
const previewCompose = readFileSync(
  new URL(
    '../../../deploy/hostinger/skpe-saas-homol/docker-compose.preview.yml',
    import.meta.url,
  ),
  'utf8',
)
const deployScript = readFileSync(
  new URL(
    '../../../deploy/hostinger/skpe-saas-homol/deploy-remote.sh',
    import.meta.url,
  ),
  'utf8',
)
const dockerfile = readFileSync(
  new URL(
    '../../../deploy/hostinger/skpe-saas-homol/Dockerfile',
    import.meta.url,
  ),
  'utf8',
)
const deployWorkflow = readFileSync(
  new URL(
    '../../../.github/workflows/deploy-skpe-saas-homol.yml',
    import.meta.url,
  ),
  'utf8',
)

test('HOMOL keeps Supabase Cloud services while routing only business REST to Hostinger', () => {
  assert.match(supabaseClient, /resolveSparksBackendConfig/)
  assert.match(supabaseClient, /backend\.target !== 'hostinger-compatible'/)
  assert.match(supabaseClient, /const businessRestPrefix =/)
  assert.match(
    supabaseClient,
    /window\.location\.origin}\/rest\/v1/,
  )
  assert.match(supabaseClient, /global:[\s\S]*?fetch: routedFetch/)
  assert.match(
    supabaseClient,
    /createClient\([\s\S]*?backend\.apiUrl,[\s\S]*?backend\.publishableKey/,
  )
})

test('HOMOL deployment explicitly selects the Hostinger-compatible REST route', () => {
  assert.match(deployWorkflow, /VITE_SPARKS_BACKEND_TARGET/)
  assert.match(deployWorkflow, /hostinger-compatible/)
  assert.match(dockerfile, /ARG VITE_SPARKS_BACKEND_TARGET/)
  assert.match(dockerfile, /ENV VITE_SPARKS_BACKEND_TARGET/)
  assert.match(previewCompose, /VITE_SPARKS_BACKEND_TARGET/)
})
test('HOMOL nginx proxies only REST data traffic to the Hostinger gateway', () => {
  assert.match(nginx, /location \/rest\/v1\//)
  assert.match(
    nginx,
    /proxy_pass http:\/\/sparks-homol-gateway:8080\/rest\/v1\//,
  )
  assert.doesNotMatch(nginx, /location \/auth\/v1\//)
  assert.doesNotMatch(nginx, /location \/storage\/v1\//)
})

test('public and preview containers join the canonical backend network', () => {
  for (const compose of [publicCompose, previewCompose]) {
    assert.match(compose, /sparks-homol-backend-net/)
    assert.match(
      compose,
      /sparks-homol-backend-net:[\s\S]*?external: true/,
    )
  }
})

test('deployment refuses a release when the REST gateway route is broken', () => {
  assert.match(
    deployScript,
    /docker network inspect sparks-homol-backend-net/,
  )
  assert.match(
    deployScript,
    /PREVIEW_REST_STATUS[\s\S]*?expected 401/,
  )
  assert.match(
    deployScript,
    /https:\/\/\$\{SPARKS_PUBLIC_HOST}\/rest\/v1\//,
  )
  assert.match(
    deployScript,
    /--header "apikey: \$\{VITE_SUPABASE_PUBLISHABLE_KEY\}"/,
  )
  assert.match(
    deployScript,
    /publishable_status[\s\S]*?= "200"/,
  )
  assert.match(
    deployScript,
    /anonymous_status[\s\S]*?= "401"/,
  )
  assert.match(
    deployScript,
    /cutover_release\(\)[\s\S]*?remove_preview_container[\s\S]*?docker compose -f docker-compose\.yml up/,
  )
})
