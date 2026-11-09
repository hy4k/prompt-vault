import { lazy, Suspense, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Crown, Loader2, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { isPro, PRO_FEATURES } from '../lib/plans'
import Reveal from '../hooks/Reveal'

const MockBillingPanel = typeof __LOCAL_MOCK_BILLING__ !== 'undefined' && __LOCAL_MOCK_BILLING__ ? lazy(() => import('../components/MockBillingPanel')) : null

const FREE_FEATURES = [
  'Save up to 50 prompts',
  'Share public prompts with the community',
  'Follow creators, like and copy prompts',
  'Category + audience discovery',
]

function FeatureList({ items, muted = false }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((f) => (
        <li key={f} className={`flex items-start gap-2.5 text-sm ${muted ? 'text-slate-400' : 'text-slate-200'}`}>
          <Check size={15} className={`mt-0.5 shrink-0 ${muted ? 'text-slate-500' : 'text-gold'}`} />
          {f}
        </li>
      ))}
    </ul>
  )
}

export default function PricingPage() {
  const { user, profile, session, mockBilling, mockAction } = useAuth()
  const { pushToast } = useToast()
  const [params] = useSearchParams()
  const justUpgraded = params.get('upgraded') === '1'

  const [interval, setInterval] = useState('yearly')
  const [busy, setBusy] = useState(false)

  const pro = isPro(profile)

  const checkout = async () => {
    if (!user || !session) {
      pushToast('Sign in first, then pick a plan', 'error')
      return
    }
    if (mockBilling) {
      mockAction({ type: 'upgrade', interval })
      pushToast('Mock Pro activated — no payment made')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interval }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Checkout failed')
      window.location.href = body.url
    } catch (err) {
      pushToast(err.message, 'error')
      setBusy(false)
    }
  }

  const manageBilling = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Portal failed')
      window.location.href = body.url
    } catch (err) {
      pushToast(err.message, 'error')
      setBusy(false)
    }
  }

  return (
    <div className="pt-12 sm:pt-20">
      <Reveal>
        <div className="text-center">
          <p className="label-caps">Pricing</p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Free to explore.{' '}
            <span className="gradient-text font-serif italic tracking-normal">Pro to dominate.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            The community feed stays free forever. Pro unlocks unlimited storage and the
            power tools that make prompts pay for themselves.
          </p>
        </div>
      </Reveal>

      {justUpgraded && !mockBilling && (
        <div className="toast-in mx-auto mt-8 max-w-md rounded-xl border border-gold/30 bg-panel/90 px-5 py-4 text-center text-sm text-gold-soft shadow-2xl">
          Payment received — your Pro access activates within a few seconds. Welcome aboard.
        </div>
      )}

      {mockBilling && MockBillingPanel && <Suspense fallback={null}><MockBillingPanel /></Suspense>}

      {/* billing toggle */}
      <div className="mt-10 flex justify-center">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {['monthly', 'yearly'].map((key) => (
            <button
              key={key}
              onClick={() => setInterval(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                interval === key ? 'bg-gold text-obsidian' : 'text-slate-400 hover:text-white'
              }`}
            >
              {key}
              {key === 'yearly' && <span className="ml-1.5 text-[10px] font-bold">-50%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* cards */}
      <div className="mx-auto mt-8 grid max-w-3xl gap-6 md:grid-cols-2">
        <Reveal>
          <div className="glass flex h-full flex-col gap-6 p-8">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Starter</h2>
              <p className="mt-1 text-sm text-slate-500">For casual prompt collectors.</p>
            </div>
            <p className="font-display text-4xl font-semibold text-white">
              $0<span className="text-base font-normal text-slate-500"> /forever</span>
            </p>
            <FeatureList items={FREE_FEATURES} muted />
            <div className="mt-auto">
              {user ? (
                <button className="btn-ghost w-full" disabled>
                  {pro ? 'Included in your plan' : 'Your current plan'}
                </button>
              ) : (
                <Link to="/signup" className="btn-ghost w-full">
                  Create free account
                </Link>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="glass-strong relative flex h-full flex-col gap-6 overflow-hidden border-gold/30 p-8 shadow-gold">
            <div className="hairline absolute inset-x-0 top-0 opacity-80" />
            <span className="absolute right-5 top-5 rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-obsidian">
              Most popular
            </span>
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-white">
                <Crown size={18} className="text-gold" /> Pro
              </h2>
              <p className="mt-1 text-sm text-slate-500">For professionals who live in AI tools.</p>
            </div>
            <p className="font-display text-4xl font-semibold text-white">
              {interval === 'yearly' ? '$4.99' : '$9.99'}
              <span className="text-base font-normal text-slate-500">
                {' '}
                /mo{interval === 'yearly' && ', billed yearly'}
              </span>
            </p>
            <FeatureList items={PRO_FEATURES} />
            <div className="mt-auto">
              {pro ? (
                <button onClick={manageBilling} className="btn-ghost w-full" disabled={busy}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
                  {mockBilling ? 'Manage mock billing' : 'Manage billing'}
                </button>
              ) : (
                <button onClick={checkout} className="btn-gold w-full !py-3" disabled={busy}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
                  {user ? (mockBilling ? 'Simulate upgrade to Pro' : 'Upgrade to Pro') : 'Sign in to upgrade'}
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      <p className="mt-10 text-center text-xs text-slate-600">
        {mockBilling ? 'Local simulation only · No card needed · No provider or database changes' : 'Prices in USD · Secure payments by Stripe · Cancel anytime, keep access until period ends'}
      </p>
    </div>
  )
}
