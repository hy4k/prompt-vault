import { useEffect, useState } from 'react'
import { Globe, Loader2, Lock, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AUDIENCES, CATEGORIES } from '../lib/constants'

const emptyForm = { title: '', content: '', category: 'Coding', audience: 'General', tags: '', is_public: false }

export default function PromptModal({ open, initial, userId, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      setForm(
        initial
          ? {
              title: initial.title,
              content: initial.content,
              category: initial.category,
              audience: initial.audience || 'General',
              tags: (initial.tags || []).join(', '),
              is_public: initial.is_public,
            }
          : emptyForm
      )
    }
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      audience: form.audience,
      tags: form.tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean)
        .slice(0, 8),
      is_public: form.is_public,
    }

    let result
    if (initial?.id) {
      result = await supabase.from('prompts').update(payload).eq('id', initial.id)
    } else {
      result = await supabase.from('prompts').insert({ ...payload, user_id: userId })
    }

    setSaving(false)
    if (result.error) {
      setError(result.error.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="glass-strong max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-b-none !border-white/10 p-0 sm:rounded-b-2xl"
      >
        <div className="hairline opacity-70" />
        <div className="p-6 sm:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="label-caps">{initial?.id ? 'Refine it' : 'Add to your vault'}</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-white">
                {initial?.id ? 'Edit prompt' : 'New prompt'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="label-caps mb-2 block">Title</label>
            <input
              className="input-glass"
              placeholder="e.g. Senior code reviewer persona"
              value={form.title}
              onChange={set('title')}
              maxLength={120}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-caps mb-2 block">Category</label>
              <select className="input-glass" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-obsidian">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-caps mb-2 block">Audience</label>
              <select className="input-glass" value={form.audience} onChange={set('audience')}>
                {AUDIENCES.map((a) => (
                  <option key={a} value={a} className="bg-obsidian">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-caps mb-2 block">
              Tags <span className="normal-case tracking-normal text-slate-600">(comma separated)</span>
            </label>
            <input
              className="input-glass"
              placeholder="react, debugging, review"
              value={form.tags}
              onChange={set('tags')}
            />
          </div>

          <div>
            <label className="label-caps mb-2 block">Prompt</label>
            <textarea
              className="input-glass min-h-[11rem] resize-y font-mono text-[13px] leading-relaxed"
              placeholder="You are an expert …"
              value={form.content}
              onChange={set('content')}
              required
            />
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="flex items-center gap-2.5 text-sm text-slate-200">
              {form.is_public ? (
                <Globe size={16} className="text-gold" />
              ) : (
                <Lock size={16} className="text-slate-400" />
              )}
              <span>
                <span className="block font-medium">{form.is_public ? 'Public' : 'Private'}</span>
                <span className="block text-xs text-slate-500">
                  {form.is_public
                    ? 'Visible in the community feed'
                    : 'Only you can see this prompt'}
                </span>
              </span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-white/10 transition checked:bg-gold"
              checked={form.is_public}
              onChange={set('is_public')}
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-white/5 pt-5">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-gold" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {initial?.id ? 'Save changes' : 'Save prompt'}
            </button>
          </div>
        </div>
        </div>
      </form>
    </div>
  )
}
