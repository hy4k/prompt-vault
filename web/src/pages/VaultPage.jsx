import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePromptActions } from '../hooks/usePromptActions'
import { FREE_PROMPT_LIMIT, isPro } from '../lib/plans'
import PromptCard from '../components/PromptCard'
import PromptModal from '../components/PromptModal'
import PaywallModal from '../components/PaywallModal'
import EmptyState from '../components/EmptyState'
import Reveal from '../hooks/Reveal'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'public', label: 'Public' },
  { key: 'private', label: 'Private' },
]

export default function VaultPage() {
  const { user, profile } = useAuth()
  const { pushToast } = useToast()
  const { copyPrompt } = usePromptActions()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState({ open: false, initial: null })
  const [paywall, setPaywall] = useState({ open: false, reason: '' })

  const fetchPrompts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    if (error) pushToast(error.message, 'error')
    else setPrompts(data || [])
    setLoading(false)
  }, [user, pushToast])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const handleDelete = async (prompt) => {
    if (!window.confirm(`Delete "${prompt.title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('prompts').delete().eq('id', prompt.id)
    if (error) {
      pushToast(error.message, 'error')
      return
    }
    pushToast('Prompt deleted')
    fetchPrompts()
  }

  const visible = prompts.filter((p) =>
    filter === 'all' ? true : filter === 'public' ? p.is_public : !p.is_public
  )

  const pro = isPro(profile)
  const atLimit = !pro && prompts.length >= FREE_PROMPT_LIMIT

  const handleNewPrompt = () => {
    if (atLimit) {
      setPaywall({
        open: true,
        reason: `Your free vault is full (${FREE_PROMPT_LIMIT} prompts)`,
      })
      return
    }
    setModal({ open: true, initial: null })
  }

  return (
    <div className="pt-10 sm:pt-14">
      <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-caps">Private collection</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              My <span className="gradient-text font-serif italic tracking-normal">Vault</span>
            </h1>
            <p className="mt-3 text-sm text-slate-400">
              <span className="font-mono text-gold">{prompts.length}</span> prompt
              {prompts.length === 1 ? '' : 's'} saved ·{' '}
              <span className="font-mono text-gold">{prompts.filter((p) => p.is_public).length}</span> public
            </p>
            {!pro && (
              <div className="mt-4 max-w-xs">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <span>Free plan</span>
                  <span className="font-mono text-gold">
                    {prompts.length}/{FREE_PROMPT_LIMIT}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft transition-all duration-500"
                    style={{ width: `${Math.min(100, (prompts.length / FREE_PROMPT_LIMIT) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <button className="btn-gold !px-5 !py-3" onClick={handleNewPrompt}>
            <Plus size={17} /> New prompt
          </button>
        </div>

        <div className="mb-7 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`chip ${
                filter === f.key
                  ? 'border-gold/60 bg-gold/15 font-semibold text-gold'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {loading ? (
        <div className="flex justify-center py-24 text-gold">
          <Loader2 className="animate-spin" size={30} />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'Your vault is empty' : `No ${filter} prompts`}
          hint="Save your first prompt — a reusable system prompt, a Midjourney formula, a sales email framework. Anything you want one tap away."
          action={
            <button className="btn-gold mt-2 !text-xs" onClick={handleNewPrompt}>
              <Plus size={14} /> Create a prompt
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {visible.map((prompt, i) => (
            <Reveal key={prompt.id} delay={(i % 4) * 60}>
              <PromptCard
                prompt={prompt}
                showAuthor={false}
                isOwner
                onCopy={(p) => copyPrompt(p, setPrompts)}
                onEdit={(p) => setModal({ open: true, initial: p })}
                onDelete={handleDelete}
              />
            </Reveal>
          ))}
        </div>
      )}

      <PromptModal
        open={modal.open}
        initial={modal.initial}
        userId={user?.id}
        onClose={() => setModal({ open: false, initial: null })}
        onSaved={() => {
          pushToast(modal.initial ? 'Prompt updated' : 'Prompt saved to your vault')
          fetchPrompts()
        }}
      />

      <PaywallModal
        open={paywall.open}
        reason={paywall.reason}
        onClose={() => setPaywall({ open: false, reason: '' })}
      />
    </div>
  )
}
