import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync(
  new URL('../src/components/application-shell/TransversalWorkspace.tsx', import.meta.url),
  'utf8',
)
const workspaceCss = readFileSync(
  new URL('../src/components/application-shell/TransversalWorkspace.css', import.meta.url),
  'utf8',
)
const adaptiveCss = readFileSync(
  new URL('../src/components/design-system/adaptive-geometry.css', import.meta.url),
  'utf8',
)

test('split workspace distinguishes layouts with and without action column', () => {
  assert.ok(
    component.includes(
      "secondary && actions ? 'sparks-transversal-workspace--with-actions' : ''",
    ),
  )
  assert.ok(
    workspaceCss.includes(
      'grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);',
    ),
  )
  assert.ok(
    workspaceCss.includes(
      'grid-template-columns: minmax(0, 1fr) 4.25rem minmax(0, 1fr);',
    ),
  )
  assert.ok(
    workspaceCss.includes(
      '.sparks-transversal-workspace--split.sparks-transversal-workspace--with-actions .sparks-transversal-workspace__body',
    ),
  )
})

test('adaptive geometry preserves two panes when no actions exist', () => {
  assert.ok(
    adaptiveCss.includes(
      '.sparks-transversal-workspace--split.sparks-transversal-workspace--with-actions .sparks-transversal-workspace__body',
    ),
  )
  assert.ok(
    adaptiveCss.includes(
      'clamp(3.75rem, 5vw, 4.5rem)',
    ),
  )
  assert.ok(
    adaptiveCss.includes(
      'grid-template-rows:\r\n      minmax(0, 1fr)\r\n      minmax(0, 1fr) !important;',
    ) ||
      adaptiveCss.includes(
        'grid-template-rows:\n      minmax(0, 1fr)\n      minmax(0, 1fr) !important;',
      ),
  )
})
