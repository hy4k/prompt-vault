import { Link } from 'react-router-dom'
import {
  Check,
  Copy,
  Globe,
  Heart,
  Lock,
  Pencil,
  Tag,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import Avatar from './Avatar'
import { CATEGORY_STYLES, PROMPT_PREVIEW_LIMIT } from '../lib/constants'

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function PromptCard({
  prompt,
  isOwner = false,
  isLiked = false,
  isFollowing = false,
  viewerId = null,
  onCopy,
  onLike,
  onFollow,
  onEdit,
  onDelete,
  showAuthor = true,
}) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const longContent = prompt.content.length > PROMPT_PREVIEW_LIMIT
  const showFollow = showAuthor && !isOwner && viewerId && onFollow

  const handleCopy = async () => {
    const ok = await onCopy(prompt)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <article className="glass card-hover group flex flex-col gap-4 p-5 sm:p-6">
      {/* ---- Author row ---- */}
      {showAuthor && (
        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/profile/${prompt.user_id}`}
            className="flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
          >
            <Avatar url={prompt.avatar_url} name={prompt.username} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white transition group-hover:text-gold">
                {prompt.username}
              </span>
              <span className="block text-[11px] text-slate-500">{timeAgo(prompt.created_at)}</span>
            </span>
          </Link>
          {showFollow && (
            <button
              onClick={() => onFollow(prompt)}
              className={`chip inline-flex shrink-0 items-center gap-1.5 ${
                isFollowing
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-gold/50 hover:text-gold'
              }`}
            >
              {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      )}

      {/* ---- Meta ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`chip ${CATEGORY_STYLES[prompt.category] || CATEGORY_STYLES.Other}`}>
          {prompt.category}
        </span>
        {prompt.audience && prompt.audience !== 'General' && (
          <span className="chip inline-flex items-center gap-1 border-white/10 bg-white/[0.04] text-slate-300">
            <Users size={11} className="text-gold/60" />
            {prompt.audience}
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500">
          {prompt.is_public ? <Globe size={11} /> : <Lock size={11} />}
          {prompt.is_public ? 'Public' : 'Private'}
        </span>
      </div>

      {/* ---- Body ---- */}
      <div className="min-w-0">
        <h3 className="font-display text-lg font-semibold leading-snug text-white sm:text-xl">
          {prompt.title}
        </h3>
        <div
          className={`prompt-sheet mt-3 ${
            expanded ? 'overflow-visible' : 'fade-bottom max-h-36 overflow-hidden'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{prompt.content}</p>
        </div>
        {longContent && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold/80 transition hover:text-gold"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* ---- Tags ---- */}
      {prompt.tags?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag size={12} className="text-slate-600" />
          {prompt.tags.map((tag) => (
            <span key={tag} className="font-mono text-[11px] text-slate-500">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ---- Actions ---- */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/5 pt-4">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <button
            onClick={() => onLike?.(prompt)}
            className={`flex items-center gap-1.5 transition hover:text-gold ${
              isLiked ? 'text-gold' : ''
            }`}
            title={viewerId ? (isLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
          >
            <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="font-mono">{prompt.like_count ?? 0}</span>
          </button>
          <span className="flex items-center gap-1.5" title="Times copied">
            <Copy size={13} />
            <span className="font-mono">{prompt.copy_count ?? 0}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isOwner && (
            <>
              <button
                onClick={() => onEdit?.(prompt)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-gold"
                title="Edit"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => onDelete?.(prompt)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
          <button onClick={handleCopy} className="btn-gold !px-3.5 !py-1.5 !text-xs">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </article>
  )
}
