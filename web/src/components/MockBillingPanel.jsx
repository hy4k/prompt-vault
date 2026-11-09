import { useAuth } from '../context/AuthContext'

export default function MockBillingPanel() {
  const { user, mockBilling, mockAction } = useAuth()
  if (!mockBilling) return null
  const state = mockBilling.state
  return (
    <section aria-label="Local mock billing" className="mx-auto mt-8 max-w-3xl rounded-xl border border-gold/40 bg-panel p-5 text-sm text-slate-300">
      <h2 className="font-semibold text-gold">Local mock billing — no real payments</h2>
      <p className="mt-2">Browser-only plan preview. Supabase permissions and stored plans are unchanged.</p>
      {!user ? <p className="mt-3">Sign in with your normal account to test upgrade and cancellation.</p> : <>
        <p role="status" className="mt-3">Mock status: {state ? state.plan + ' / ' + state.status : 'off (using stored profile)'}{state?.interval ? ' / ' + state.interval : ''}</p>
        {state?.periodEnd && <p>Period ends: {new Date(state.periodEnd).toLocaleString()}</p>}
        {state?.cancelAtPeriodEnd && <p className="text-gold">Cancellation scheduled. Pro stays active until the period ends.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {state?.plan === 'pro' && <>
            <button className="btn-ghost" onClick={() => mockAction({ type: state.cancelAtPeriodEnd ? 'resume' : 'cancel' })}>{state.cancelAtPeriodEnd ? 'Resume mock subscription' : 'Cancel at period end'}</button>
            <button className="btn-ghost" onClick={() => mockAction({ type: 'expire' })}>Simulate period end → Free</button>
          </>}
          <button className="btn-ghost" onClick={() => mockAction({ type: 'expire' })}>Set mock Free</button>
          <button className="btn-ghost" onClick={() => mockAction({ type: 'reset' })}>Reset mock (use stored plan)</button>
        </div>
      </>}
    </section>
  )
}
