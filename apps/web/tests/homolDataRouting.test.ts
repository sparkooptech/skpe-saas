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

test('HOMOL keeps Supabase Cloud services while routing business REST to Hostinger', () => {
  assert.match(supabaseClient, /const cloudRestPrefix =/)
  assert.match(
    supabaseClient,
    /window\.location\.origin}\/rest\/v1/,
  )
  assert.match(supabaseClient, /global:[\s\S]*?fetch: routedFetch/)
  assert.match(
    supabaseClient,
    /createClient\([\s\S]*?supabaseUrl,[\s\S]*?supabasePublishableKey/,
  )
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
    /cutover_release\(\)[\s\S]*?remove_preview_container[\s\S]*?docker compose -f docker-compose\.yml up/,
  )
})
