import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Crown, Loader2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PRO_FEATURES } from '../lib/plans'

/**
 * Upgrade prompt shown when a free user hits a plan limit (or via upsell).
 * Creates a Stripe Checkout session and redirects to it.
 */
export default function PaywallModal({ open, onClose, reason }) {
  const { session, mockBilling, mockAction } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [interval, setInterval] = useState('yearly')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const upgrade = async () => {
    if (!session) {
      navigate('/login')
      return
    }
    if (mockBilling) {
      mockAction({ type: 'upgrade', interval })
      pushToast('Mock Pro activated — database limits are unchanged')
      onClose()
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong relative w-full max-w-md overflow-hidden rounded-b-none sm:rounded-b-2xl"
      >
        <div className="hairline opacity-70" />
        <div className="p-7">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>

          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            <Crown size={12} /> PromptVault Pro
          </span>

          <h2 className="mt-4 font-display text-2xl font-semibold text-white">
            {reason ?? "You've reached the free limit"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Free accounts save up to 50 prompts. Go Pro for unlimited storage — and the features
            that make prompts actually pay off.
          </p>

          {/* billing toggle */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/30 p-1.5">
            {[
              { key: 'monthly', label: 'Monthly', price: '$9.99', per: '/mo' },
              { key: 'yearly', label: 'Yearly', price: '$59.99', per: '/yr', badge: 'Save 50%' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setInterval(opt.key)}
                className={`relative rounded-lg px-3 py-2.5 text-center transition ${
                  interval === opt.key ? 'bg-gold/15 text-gold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-obsidian">
                    {opt.badge}
                  </span>
                )}
                <span className="block text-xs font-medium">{opt.label}</span>
                <span className="mt-0.5 block font-display text-lg font-semibold">
                  {opt.price}
                  <span className="text-xs font-normal text-slate-500">{opt.per}</span>
                </span>
              </button>
            ))}
          </div>

          <ul className="mt-6 flex flex-col gap-2.5">
            {PRO_FEATURES.slice(0, 5).map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                <Check size={15} className="mt-0.5 shrink-0 text-gold" />
                {f}
              </li>
            ))}
          </ul>

          <button onClick={upgrade} className="btn-gold mt-7 w-full !py-3" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
            {session ? (mockBilling ? 'Simulate upgrade — no payment' : 'Upgrade now') : 'Sign in to upgrade'}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-600">
            {mockBilling ? 'Local mock only · No real payment or database changes' : 'Secure checkout via Stripe · Cancel anytime'}
          </p>
        </div>
      </div>
    </div>
  )
}
