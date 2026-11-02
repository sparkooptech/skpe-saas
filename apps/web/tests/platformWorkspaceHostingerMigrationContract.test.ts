import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const deployScript = readFileSync(
  new URL(
    '../../../deploy/hostinger/skpe-saas-homol/deploy-remote.sh',
    import.meta.url,
  ),
  'utf8',
)

test('Hostinger deploy persists TPBS after preview and before cutover', () => {
  assert.match(
    deployScript,
    /apply_platform_workspace_branch_migration()/,
  )
  assert.match(
    deployScript,
    /20261102124000_normalize_cooperative_branch_short_names.sql/,
  )
  assert.match(
    deployScript,
    /DB MIGRATION PASS: TPBS persisted and synchronized/,
  )
  assert.match(
    deployScript,
    /build_preview_release[\s\S]*?apply_platform_workspace_branch_migration[\s\S]*?cutover_release/,
  )
})

test('TPBS persistence gate fails closed when database verification fails', () => {
  assert.match(deployScript, /short_name.*=.*'TPBS'/s)
  assert.match(deployScript, /unsynchronized_count/)
  assert.match(deployScript, /cleanup_failed_release/)
})
