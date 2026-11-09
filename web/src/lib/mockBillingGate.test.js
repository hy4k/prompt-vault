import test from 'node:test'
import assert from 'node:assert/strict'
import config from '../../vite.config.js'

test('mock flag never enables any build, including development-mode builds', () => {
  const previous = process.env.VITE_LOCAL_MOCK_BILLING
  process.env.VITE_LOCAL_MOCK_BILLING = 'true'
  try {
    for (const mode of ['production', 'development', 'staging']) {
      assert.equal(config({ command: 'build', mode }).define.__LOCAL_MOCK_BILLING__, 'false')
    }
    assert.equal(config({ command: 'serve', mode: 'production' }).define.__LOCAL_MOCK_BILLING__, 'false')
    assert.equal(config({ command: 'serve', mode: 'development' }).define.__LOCAL_MOCK_BILLING__, 'true')
    process.env.VITE_LOCAL_MOCK_BILLING = 'false'
    assert.equal(config({ command: 'serve', mode: 'development' }).define.__LOCAL_MOCK_BILLING__, 'false')
  } finally {
    if (previous === undefined) delete process.env.VITE_LOCAL_MOCK_BILLING
    else process.env.VITE_LOCAL_MOCK_BILLING = previous
  }
})
