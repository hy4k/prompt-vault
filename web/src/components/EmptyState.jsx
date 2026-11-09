import { Inbox } from 'lucide-react'

export default function EmptyState({ title, hint, action }) {
  return (
    <div className="glass flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.07] text-gold">
        <Inbox size={22} />
        <span className="absolute inset-0 rounded-2xl bg-gold/10 blur-xl" />
      </span>
      <div>
        <p className="font-display text-lg font-semibold text-white">{title}</p>
        {hint && <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-400">{hint}</p>}
      </div>
      {action}
    </div>
  )
}
