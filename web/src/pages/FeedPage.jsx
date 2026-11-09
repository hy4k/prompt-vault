import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Flame, Loader2, Search, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePromptActions } from '../hooks/usePromptActions'
import { AUDIENCES } from '../lib/constants'
import PromptCard from '../components/PromptCard'
import CategoryFilter from '../components/CategoryFilter'
import EmptyState from '../components/EmptyState'
import Reveal from '../hooks/Reveal'

const MARQUEE_ITEMS = [
  'System Prompts',
  'Midjourney Formulas',
  'Chain-of-Thought',
  'Email Frameworks',
  'Code Review',
  'Few-Shot Templates',
  'Landing Pages',
  'Persona Design',
]

function Marquee() {
  const row = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="marquee relative my-10 overflow-hidden border-y border-white/5 py-3.5 sm:my-14">
      <div className="marquee-track flex w-max items-center gap-8 pr-8">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
            <span className="font-display text-sm font-medium uppercase tracking-[0.28em] text-slate-500">
              {item}
            </span>
            <Sparkles size={11} className="text-gold/50" />
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-obsidian to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-obsidian to-transparent" />
    </div>
  )
}

export default function FeedPage() {
  const { user } = useAuth()
  const { likedIds, followedIds, copyPrompt, toggleLike, toggleFollow } = usePromptActions()
  const [prompts, setPrompts] = useState([])
  const [category, setCategory] = useState('All')
  const [audience, setAudience] = useState('All audiences')
  const [sort, setSort] = useState('trending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  const fetchFeed = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('prompt_details').select('*').eq('is_public', true).limit(60)

    if (category !== 'All') query = query.eq('category', category)
    if (audience !== 'All audiences') query = query.eq('audience', audience)

    const q = search.trim().replace(/[,%]/g, ' ')
    if (q) {
      query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%,tags.cs.{${q.toLowerCase()}}`)
    }

    query = query.order(sort === 'trending' ? 'like_count' : 'created_at', { ascending: false })

    const { data, error } = await query
    if (!error) setPrompts(data || [])
    setLoading(false)
  }, [category, audience, sort, search])

  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  // Hero stats — live counts from the platform
  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('likes').select('prompt_id', { count: 'exact', head: true }),
      supabase.rpc('platform_copy_total'),
    ]).then(([promptsRes, likesRes, copiesRes]) => {
      if (cancelled) return
      setStats({
        prompts: promptsRes.count ?? 0,
        likes: likesRes.count ?? 0,
        copies: copiesRes.data ?? 0,
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const sortTab = (key, label, Icon) => (
    <button
      onClick={() => setSort(key)}
      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
        sort === key ? 'bg-gold/15 text-gold' : 'text-slate-500 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  )

  const stat = (value, label) => (
    <div>
      <p className="font-display text-2xl font-semibold text-white sm:text-3xl">
        {value === null || value === undefined ? '—' : Number(value).toLocaleString()}
      </p>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
    </div>
  )

  return (
    <div className="pt-10 sm:pt-16">
      {/* ---------------- Hero ---------------- */}
      <Reveal>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="chip inline-flex items-center gap-2 border-gold/30 bg-gold/[0.07] text-gold">
              <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-gold" />
              Live community vault
            </span>
            <span className="label-caps hidden sm:inline">Phase 1 · Open beta</span>
          </div>

          <h1 className="mt-6 max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Every great answer begins with a{' '}
            <span className="gradient-text font-serif italic tracking-normal">better prompt.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Save your secret weapons. Share your crowd-pleasers. Steal the best of the
            community — one tap, zero friction.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={user ? '/vault' : '/signup'} className="btn-gold !px-6 !py-3 !text-base">
              {user ? 'Share a prompt' : 'Start your vault'}
              <ArrowRight size={17} />
            </Link>
            <a href="#feed" className="btn-ghost !px-6 !py-3 !text-base">
              Browse the feed
            </a>
          </div>

          {/* Live stats */}
          <div className="mt-12 flex gap-10 sm:gap-16">
            {stat(stats?.prompts, 'Public prompts')}
            {stat(stats?.likes, 'Likes given')}
            {stat(stats?.copies, 'Copies made')}
          </div>
        </div>
      </Reveal>

      <Marquee />

      {/* ---------------- Controls ---------------- */}
      <div id="feed" className="scroll-mt-24">
        <Reveal>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="label-caps">The feed</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                {sort === 'trending' ? 'What the community loves' : 'Fresh from the vault'}
              </h2>
            </div>
            <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {sortTab('trending', 'Trending', Flame)}
              {sortTab('newest', 'Newest', Clock)}
            </div>
          </div>

          <label className="relative mb-3 block">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input-glass !rounded-2xl !py-3 !pl-11"
              placeholder="Search prompts, content, or tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <p className="label-caps mb-1 mt-2">Skill</p>
          <CategoryFilter value={category} onChange={setCategory} />

          <p className="label-caps mb-1 mt-2">Audience</p>
          <CategoryFilter
            value={audience}
            onChange={setAudience}
            items={['All audiences', ...AUDIENCES]}
            allLabel="All audiences"
          />
        </Reveal>

        {/* ---------------- Feed ---------------- */}
        {loading ? (
          <div className="flex justify-center py-24 text-gold">
            <Loader2 className="animate-spin" size={30} />
          </div>
        ) : prompts.length === 0 ? (
          <EmptyState
            title="No prompts here yet"
            hint={
              search
                ? `Nothing matches "${search}". Try different keywords or clear the search.`
                : category === 'All'
                  ? 'Be the first — create a public prompt in your vault and share it with the community.'
                  : `No public prompts in ${category} yet. Try another category or share one yourself.`
            }
            action={
              user ? (
                <Link to="/vault" className="btn-gold mt-2 !text-xs">
                  Open my vault
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            {prompts.map((prompt, i) => (
              <Reveal key={prompt.id} delay={(i % 4) * 70}>
                <PromptCard
                  prompt={prompt}
                  viewerId={user?.id ?? null}
                  isOwner={user?.id === prompt.user_id}
                  isLiked={likedIds.has(prompt.id)}
                  isFollowing={followedIds.has(prompt.user_id)}
                  onCopy={(p) => copyPrompt(p, setPrompts)}
                  onLike={(p) => toggleLike(p, setPrompts)}
                  onFollow={(p) => toggleFollow(p, fetchFeed)}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
