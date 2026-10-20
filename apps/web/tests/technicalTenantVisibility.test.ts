import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('technical E2E organization is excluded from operational organization selection', () => {
  assert.match(app, /organizationsResponse\.data[\s\S]*?organization\.organization_code !== 'SKPE-V1-RUNTIME'/)
  assert.match(app, /visibleOrganizations = useMemo[\s\S]*?organization\.organization_code === 'SKPE-V1-RUNTIME'/)
})

test('technical E2E organization is excluded from operational hierarchy', () => {
  assert.match(app, /hierarchyResponse\.data[\s\S]*?node\.organization_id !== '112e3bb0-82f3-4185-9f4d-7ac117c63f97'/)
})
