import test from 'node:test'
import assert from 'node:assert/strict'
import { transition, isLoopback } from './mockBillingState.js'

test('monthly/yearly upgrades and cancellation lifecycle', () => {
  for (const interval of ['monthly', 'yearly']) {
    const pro = transition(null, { type: 'upgrade', interval }, Date.UTC(2026, 10, 7))
    assert.equal(pro.plan, 'pro')
    assert.equal(pro.interval, interval)
    assert.equal(pro.periodEnd, interval === 'monthly' ? '2026-12-07T00:00:00.000Z' : '2027-11-07T00:00:00.000Z')
    const canceled = transition(pro, { type: 'cancel' })
    assert.equal(canceled.plan, 'pro')
    assert.equal(canceled.cancelAtPeriodEnd, true)
    assert.equal(transition(canceled, { type: 'resume' }).cancelAtPeriodEnd, false)
    assert.equal(transition(canceled, { type: 'expire' }).plan, 'free')
    assert.equal(transition(canceled, { type: 'reset' }), null)
    assert.equal(pro.cancelAtPeriodEnd, false, 'no mutation')
  }
})
test('rejects invalid actions and billing intervals', () => {
  assert.throws(() => transition(null, { type: 'upgrade', interval: 'daily' }))
  assert.throws(() => transition(null, { type: 'unknown' }))
  assert.equal(transition(null, { type: 'cancel' }), null)
})
test('loopback exact allowlist rejects production and lookalike hosts', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]']) assert.equal(isLoopback(host), true)
  for (const host of ['promptvault.app', 'localhost.evil.com', '192.168.1.1', '']) assert.equal(isLoopback(host), false)
})
