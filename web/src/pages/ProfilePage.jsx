import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, Save, UserCheck, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePromptActions } from '../hooks/usePromptActions'
import Avatar from '../components/Avatar'
import PromptCard from '../components/PromptCard'
import EmptyState from '../components/EmptyState'
import Reveal from '../hooks/Reveal'

const TABS = [
  { key: 'prompts', label: 'Prompts' },
  { key: 'followers', label: 'Followers' },
  { key: 'following', label: 'Following' },
]

export default function ProfilePage() {
  const { id } = useParams()
  const { user, refreshProfile } = useAuth()
  const { pushToast } = useToast()
  const { likedIds, followedIds, copyPrompt, toggleLike, toggleFollow, saveToVault } = usePromptActions()

  const [profile, setProfile] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [tab, setTab] = useState('prompts')
  const [followList, setFollowList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '', avatar_url: '' })
  const [saving, setSaving] = useState(false)

  const isOwn = user?.id === id

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', id).single()

    let promptQuery = supabase
      .from('prompt_details')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
    if (user?.id !== id) promptQuery = promptQuery.eq('is_public', true)

    const { data: promptData } = await promptQuery
    setProfile(profileData)
    setPrompts(promptData || [])
    setLoading(false)
  }, [id, user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const fetchFollowList = useCallback(
    async (kind) => {
      const matchColumn = kind === 'followers' ? 'followee_id' : 'follower_id'
      const selectColumn = kind === 'followers' ? 'follower_id' : 'followee_id'
      const { data } = await supabase.from('follows').select(selectColumn).eq(matchColumn, id)
      const ids = (data || []).map((r) => r[selectColumn])
      if (ids.length === 0) {
        setFollowList([])
        return
      }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .in('id', ids)
      setFollowList(profiles || [])
    },
    [id]
  )

  useEffect(() => {
    if (tab !== 'prompts') fetchFollowList(tab)
  }, [tab, fetchFollowList])

  const startEditing = () => {
    setEditForm({ bio: profile?.bio ?? '', avatar_url: profile?.avatar_url ?? '' })
    setEditing(true)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ bio: editForm.bio.trim(), avatar_url: editForm.avatar_url.trim() || null })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      pushToast(error.message, 'error')
      return
    }
    setProfile((p) => ({ ...p, bio: editForm.bio.trim(), avatar_url: editForm.avatar_url.trim() || null }))
    await refreshProfile()
    setEditing(false)
    pushToast('Profile updated')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-28 text-gold">
        <Loader2 className="animate-spin" size={30} />
      </div>
    )
  }

  if (!profile) {
    return (
      <EmptyState
        title="Creator not found"
        hint="This profile may have been removed."
        action={
          <Link to="/" className="btn-ghost mt-2 !text-xs">
            Back to feed
          </Link>
        }
      />
    )
  }

  const following = followedIds.has(profile.id)

  const statTile = (value, label) => (
    <div className="glass flex-1 px-4 py-3.5 text-center sm:text-left">
      <p className="font-display text-xl font-semibold text-gold sm:text-2xl">{Number(value).toLocaleString()}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
    </div>
  )

  return (
    <div className="pt-8 sm:pt-12">
      <Reveal>
        {/* ---- Cover + identity card ---- */}
        <div className="glass overflow-hidden">
          <div className="relative h-24 sm:h-32">
            <div className="absolute inset-0 bg-gradient-to-r from-gold/20 via-gold/[0.06] to-transparent" />
            <div className="bg-grid absolute inset-0 opacity-40" />
          </div>

          <div className="px-6 pb-7 sm:px-8">
            <div className="-mt-10 flex flex-col items-start gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
                <div className="rounded-full ring-4 ring-obsidian">
                  <Avatar url={profile.avatar_url} name={profile.username} size={88} />
                </div>
                <div className="pb-1">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
                    {profile.username}
                  </h1>
                  {profile.bio ? (
                    <p className="mt-1 max-w-lg text-sm leading-relaxed text-slate-400">{profile.bio}</p>
                  ) : (
                    <p className="mt-1 text-sm italic text-slate-600">
                      {isOwn ? 'Add a bio to tell the community who you are.' : 'No bio yet.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 pb-1">
                {isOwn ? (
                  editing ? (
                    <div className="flex gap-2">
                      <button className="btn-ghost !text-xs" onClick={() => setEditing(false)}>
                        Cancel
                      </button>
                      <button className="btn-gold !text-xs" onClick={saveProfile} disabled={saving}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save
                      </button>
                    </div>
                  ) : (
                    <button className="btn-ghost !text-xs" onClick={startEditing}>
                      Edit profile
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => toggleFollow({ user_id: profile.id, username: profile.username }, fetchProfile)}
                    className={following ? 'btn-ghost !text-xs' : 'btn-gold !text-xs'}
                    disabled={!user}
                    title={user ? undefined : 'Sign in to follow'}
                  >
                    {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {statTile(profile.follower_count, 'Followers')}
              {statTile(profile.following_count, 'Following')}
              {statTile(prompts.length, isOwn ? 'Prompts' : 'Public prompts')}
            </div>

            {editing && (
              <div className="mt-6 flex flex-col gap-3 border-t border-white/5 pt-6">
                <div>
                  <label className="label-caps mb-2 block">Avatar URL</label>
                  <input
                    className="input-glass"
                    placeholder="https://…"
                    value={editForm.avatar_url}
                    onChange={(e) => setEditForm((f) => ({ ...f, avatar_url: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-caps mb-2 block">Bio</label>
                  <textarea
                    className="input-glass min-h-[5rem] resize-y"
                    placeholder="AI prompt engineer, copywriter, artist…"
                    maxLength={240}
                    value={editForm.bio}
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* ---- Tabs ---- */}
      <Reveal delay={80}>
        <div className="mt-8 flex gap-1 border-b border-white/5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === t.key
                  ? 'border-gold font-semibold text-gold'
                  : 'border-transparent text-slate-500 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-7">
        {tab === 'prompts' ? (
          prompts.length === 0 ? (
            <EmptyState
              title={isOwn ? 'No prompts yet' : 'No public prompts yet'}
              hint={
                isOwn
                  ? 'Prompts you mark as public will appear here and in the community feed.'
                  : `${profile.username} hasn't shared any prompts yet.`
              }
              action={
                isOwn ? (
                  <Link to="/vault" className="btn-gold mt-2 !text-xs">
                    Go to my vault
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {prompts.map((prompt, i) => (
                <Reveal key={prompt.id} delay={(i % 4) * 60}>
                  <PromptCard
                    prompt={prompt}
                    viewerId={user?.id ?? null}
                    isOwner={isOwn}
                    isLiked={likedIds.has(prompt.id)}
                    isFollowing={following}
                    onCopy={(p) => copyPrompt(p, setPrompts)}
                    onLike={(p) => toggleLike(p, setPrompts)}
                    onSave={saveToVault}
                    onFollow={() =>
                      toggleFollow({ user_id: profile.id, username: profile.username }, fetchProfile)
                    }
                  />
                </Reveal>
              ))}
            </div>
          )
        ) : followList.length === 0 ? (
          <EmptyState
            title={tab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            hint={
              tab === 'followers'
                ? 'Share great prompts in the community feed to grow your audience.'
                : 'Follow creators from the community feed to see their best prompts.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {followList.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 50}>
                <Link
                  to={`/profile/${p.id}`}
                  className="glass card-hover flex items-center gap-4 p-5"
                >
                  <Avatar url={p.avatar_url} name={p.username} size={44} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{p.username}</p>
                    {p.bio && <p className="truncate text-xs text-slate-500">{p.bio}</p>}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
