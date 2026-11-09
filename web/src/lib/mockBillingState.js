// Pure UI simulation. Never writes to a billing provider or database.
export function transition(state, action, now = Date.now()) {
  switch (action.type) {
    case 'upgrade': {
      if (!['monthly', 'yearly'].includes(action.interval)) throw new Error('Invalid interval')
      const end = new Date(now)
      if (action.interval === 'yearly') end.setUTCFullYear(end.getUTCFullYear() + 1)
      else end.setUTCMonth(end.getUTCMonth() + 1)
      return { plan: 'pro', interval: action.interval, status: 'active', cancelAtPeriodEnd: false, periodEnd: end.toISOString() }
    }
    case 'cancel': return state?.plan === 'pro' ? { ...state, cancelAtPeriodEnd: true } : state
    case 'resume': return state?.plan === 'pro' ? { ...state, cancelAtPeriodEnd: false } : state
    case 'expire': return { plan: 'free', status: 'canceled', cancelAtPeriodEnd: false }
    case 'reset': return null
    default: throw new Error('Unknown mock billing action')
  }
}
export function isLoopback(host) {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)
}
