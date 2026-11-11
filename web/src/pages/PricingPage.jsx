import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Clock, Crown, Loader2, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { apiUrl } from '../lib/api'
import { isPro, PRICES, FREE_FEATURES, PRO_ROADMAP, PRO_SHIPPED } from '../lib/plans'
import Reveal from '../hooks/Reveal'

function ShippedList({ items }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
          <Check size={15} className="mt-0.5 shrink-0 text-gold" />
          {f}
        </li>
      ))}
    </ul>
  )
}

function RoadmapList({ items }) {
  return (
    <div>
      <p className="label-caps mb-2.5">On the roadmap — included when they ship</p>
      <ul className="flex flex-col gap-2">
        {items.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-500">
            <Clock size={14} className="mt-0.5 shrink-0 text-slate-600" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PricingPage() {
  const { user, profile, session } = useAuth()
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
    setBusy(true)
    try {
      const res = await fetch(apiUrl('/api/stripe/checkout'), {
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
      const res = await fetch(apiUrl('/api/stripe/portal'), {
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

  const yearlyMonthly = (PRICES.yearly / 12).toFixed(2)

  return (
    <div className="pt-12 sm:pt-20">
      <Reveal>
        <div className="text-center">
          <p className="label-caps">Pricing</p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Free to explore.{' '}
            <span className="gradient-text font-serif italic tracking-normal">Pro for less than a coffee.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            The community feed stays free forever. Pro is priced so students and indie
            creators can actually afford it.
          </p>
        </div>
      </Reveal>

      {justUpgraded && (
        <div className="toast-in mx-auto mt-8 max-w-md rounded-xl border border-gold/30 bg-panel/90 px-5 py-4 text-center text-sm text-gold-soft shadow-2xl">
          Payment received — your Pro access activates within a few seconds. Welcome aboard.
        </div>
      )}

      {/* billing toggle */}
      <div className="mt-10 flex justify-center">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {[
            { key: 'monthly', label: 'Monthly' },
            { key: 'yearly', label: 'Yearly', badge: 'Save 50%' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setInterval(opt.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                interval === opt.key ? 'bg-gold text-obsidian' : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
              {opt.badge && <span className="ml-1.5 text-[10px] font-bold">{opt.badge}</span>}
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
            <ul className="flex flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <Check size={15} className="mt-0.5 shrink-0 text-slate-500" />
                  {f}
                </li>
              ))}
            </ul>
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
              <p className="mt-1 text-sm text-slate-500">For people who live in AI tools.</p>
            </div>

            {/* Price — total charge is unambiguous */}
            <div>
              {interval === 'yearly' ? (
                <>
                  <p className="font-display text-4xl font-semibold text-white">
                    ${PRICES.yearly}
                    <span className="text-base font-normal text-slate-500"> /year</span>
                  </p>
                  <p className="mt-1.5 text-sm text-slate-400">
                    Charged <span className="font-semibold text-gold-soft">once a year at ${PRICES.yearly}</span>{' '}
                    — works out to ${yearlyMonthly}/mo, a 50% saving.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-4xl font-semibold text-white">
                    ${PRICES.monthly}
                    <span className="text-base font-normal text-slate-500"> /month</span>
                  </p>
                  <p className="mt-1.5 text-sm text-slate-400">
                    Billed monthly at ${PRICES.monthly}. Switch to yearly and save 50%.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <p className="label-caps mb-2.5">Included today</p>
                <ShippedList items={PRO_SHIPPED} />
              </div>
              <RoadmapList items={PRO_ROADMAP} />
            </div>

            <div className="mt-auto">
              {pro ? (
                <button onClick={manageBilling} className="btn-ghost w-full" disabled={busy}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
                  Manage billing
                </button>
              ) : (
                <button onClick={checkout} className="btn-gold w-full !py-3" disabled={busy}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
                  {user ? `Upgrade — $${interval === 'yearly' ? PRICES.yearly + '/yr' : PRICES.monthly + '/mo'}` : 'Sign in to upgrade'}
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      <p className="mt-10 text-center text-xs text-slate-600">
        Prices in USD · Secure payments by Stripe · Cancel anytime, keep access until your paid period ends
      </p>
    </div>
  )
}
