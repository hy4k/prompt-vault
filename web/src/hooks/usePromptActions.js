import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { copyText } from '../lib/clipboard'

/**
 * Shared prompt actions: copy (with counter bump), like/unlike, follow/unfollow.
 * `updateList` is an optional state setter used for optimistic UI updates of
 * the calling page's prompt list.
 */
export function usePromptActions() {
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [likedIds, setLikedIds] = useState(new Set())
  const [followedIds, setFollowedIds] = useState(new Set())

  useEffect(() => {
    if (!user) {
      setLikedIds(new Set())
      setFollowedIds(new Set())
      return
    }
    let cancelled = false
    Promise.all([
      supabase.from('likes').select('prompt_id').eq('user_id', user.id),
      supabase.from('follows').select('followee_id').eq('follower_id', user.id),
    ]).then(([likesRes, followsRes]) => {
      if (cancelled) return
      if (likesRes.data) setLikedIds(new Set(likesRes.data.map((l) => l.prompt_id)))
      if (followsRes.data) setFollowedIds(new Set(followsRes.data.map((f) => f.followee_id)))
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const requireAuth = useCallback(
    (action) => {
      if (!user) {
        pushToast(`Sign in to ${action}`, 'error')
        return false
      }
      return true
    },
    [user, pushToast]
  )

  const copyPrompt = useCallback(
    async (prompt, updateList) => {
      const ok = await copyText(prompt.content)
      if (!ok) {
        pushToast('Copy failed — select the text manually', 'error')
        return false
      }
      pushToast('Prompt copied to clipboard')
      updateList?.((prev) =>
        prev.map((p) => (p.id === prompt.id ? { ...p, copy_count: (p.copy_count ?? 0) + 1 } : p))
      )
      supabase.rpc('increment_copy_count', { prompt_id: prompt.id })
      return true
    },
    [pushToast]
  )

  const toggleLike = useCallback(
    async (prompt, updateList) => {
      if (!requireAuth('like prompts')) return
      const liked = likedIds.has(prompt.id)
      setLikedIds((prev) => {
        const next = new Set(prev)
        if (liked) next.delete(prompt.id)
        else next.add(prompt.id)
        return next
      })
      updateList?.((prev) =>
        prev.map((p) =>
          p.id === prompt.id ? { ...p, like_count: (p.like_count ?? 0) + (liked ? -1 : 1) } : p
        )
      )
      const query = liked
        ? supabase.from('likes').delete().eq('prompt_id', prompt.id).eq('user_id', user.id)
        : supabase.from('likes').insert({ prompt_id: prompt.id, user_id: user.id })
      const { error } = await query
      if (error) pushToast(error.message, 'error')
    },
    [likedIds, user, pushToast, requireAuth]
  )

  const toggleFollow = useCallback(
    async (author, onChange) => {
      if (!requireAuth('follow creators')) return false
      const following = followedIds.has(author.user_id)
      const query = following
        ? supabase.from('follows').delete().eq('follower_id', user.id).eq('followee_id', author.user_id)
        : supabase.from('follows').insert({ follower_id: user.id, followee_id: author.user_id })
      const { error } = await query
      if (error) {
        pushToast(error.message, 'error')
        return false
      }
      setFollowedIds((prev) => {
        const next = new Set(prev)
        if (following) next.delete(author.user_id)
        else next.add(author.user_id)
        return next
      })
      pushToast(following ? `Unfollowed ${author.username}` : `Following ${author.username}`)
      onChange?.()
      return true
    },
    [followedIds, user, pushToast, requireAuth]
  )

  return { likedIds, followedIds, copyPrompt, toggleLike, toggleFollow }
}
