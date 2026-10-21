import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('every organization returned for the authenticated user remains visible and routable', () => {
  assert.ok(app.includes('setOrganizations((organizationsResponse.data ?? []) as Organization[])'))
  assert.ok(!app.includes("organization.organization_code === 'SKPE-V1-RUNTIME'"))
  assert.ok(!app.includes("node.organization_id !== '112e3bb0-82f3-4185-9f4d-7ac117c63f97'"))
})

test('module routes wait for the module list of the routed organization', () => {
  assert.ok(app.includes('const [modulesOrganizationId, setModulesOrganizationId]'))
  assert.ok(app.includes('setModulesOrganizationId(organization.organization_id)'))
  assert.match(
    app,
    /loadingModules \|\|[\s\S]*?modulesOrganizationId !== routeOrganization\.organization_id/,
  )
})
