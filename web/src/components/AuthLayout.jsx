import { Link } from 'react-router-dom'
import { Quote, Sparkles, Terminal } from 'lucide-react'
import Reveal from '../hooks/Reveal'

/**
 * Split-screen auth shell: editorial brand panel on the left (desktop only),
 * form content on the right.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1.1fr_1fr]">
      {/* ---- Brand panel ---- */}
      <div className="relative hidden overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="aurora absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="bg-grid absolute inset-0 opacity-60" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-soft text-obsidian shadow-gold">
            <Sparkles size={18} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-white">
            Prompt<span className="gradient-text">Vault</span>
          </span>
        </Link>

        <div className="relative">
          <Quote size={30} className="mb-6 text-gold/40" />
          <p className="max-w-md font-display text-3xl font-medium leading-snug text-white xl:text-4xl">
            I stopped rewriting the same instructions. Now my best prompts live in one vault —{' '}
            <span className="font-serif italic text-gold-soft">and the community's are one tap away.</span>
          </p>
          <p className="mt-6 text-sm text-slate-500">— every prompt engineer, eventually</p>

          <div className="mt-12 flex flex-wrap gap-2.5">
            {['Code review persona', 'PAS email framework', 'Midjourney product shot'].map((chip) => (
              <span
                key={chip}
                className="chip inline-flex items-center gap-1.5 border-white/10 bg-white/[0.04] text-slate-300"
              >
                <Terminal size={11} className="text-gold/60" />
                {chip}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">
          The community vault for professional AI prompts.
        </p>
      </div>

      {/* ---- Form panel ---- */}
      <div className="flex items-start justify-center px-4 pb-16 pt-10 sm:pt-16 lg:items-center lg:pt-10">
        <Reveal className="w-full max-w-md">
          <div className="glass-strong p-8 sm:p-10">
            <div className="hairline mb-8 opacity-70" />
            {children}
          </div>
        </Reveal>
      </div>
    </div>
  )
}
