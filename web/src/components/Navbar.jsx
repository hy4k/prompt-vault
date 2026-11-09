import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Compass, Crown, Library, LogOut, Menu, Sparkles, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isPro } from '../lib/plans'
import Avatar from './Avatar'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-obsidian/80 backdrop-blur-md">
      <div className="hairline absolute inset-x-0 bottom-0 opacity-60" />
      <nav className="mx-auto flex h-16 w-full max-w-shell items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link to="/" className="group flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-soft text-obsidian shadow-gold transition duration-300 group-hover:rotate-6">
            <Sparkles size={17} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            Prompt<span className="gradient-text">Vault</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1.5 md:flex">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            <Compass size={15} /> Discover
          </NavLink>
          {user && (
            <NavLink to="/vault" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Library size={15} /> My Vault
            </NavLink>
          )}
          <span className="mx-2 h-5 w-px bg-white/10" />
          {user ? (
            <div className="flex items-center gap-3">
              {!isPro(profile) && (
                <Link
                  to="/pricing"
                  className="btn-gold !rounded-full !px-4 !py-1.5 !text-xs"
                  title="Upgrade to Pro"
                >
                  <Crown size={13} /> Go Pro
                </Link>
              )}
              <NavLink to={`/profile/${user.id}`} className="group flex items-center gap-2.5">
                <Avatar url={profile?.avatar_url} name={profile?.username} size={30} />
                <span className="max-w-[8rem] truncate text-sm font-medium text-slate-300 transition group-hover:text-gold">
                  {profile?.username ?? '…'}
                </span>
              </NavLink>
              <button onClick={handleSignOut} className="btn-ghost !rounded-full !px-3 !py-1.5 text-xs" title="Sign out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost !rounded-full !px-4 !py-1.5 text-sm">
                Sign in
              </Link>
              <Link to="/signup" className="btn-gold !rounded-full !px-4 !py-1.5 text-sm">
                Get started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-200 transition hover:border-white/20 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/5 bg-obsidian/95 px-4 py-4 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setOpen(false)}>
              <Compass size={15} /> Discover
            </NavLink>
            {user && (
              <NavLink to="/vault" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setOpen(false)}>
                <Library size={15} /> My Vault
              </NavLink>
            )}
            {user ? (
              <>
                <NavLink to={`/profile/${user.id}`} className="nav-link" onClick={() => setOpen(false)}>
                  <Avatar url={profile?.avatar_url} name={profile?.username} size={20} />
                  Profile
                </NavLink>
                <button onClick={handleSignOut} className="btn-ghost mt-2 justify-start text-sm">
                  <LogOut size={15} /> Sign out
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link to="/login" className="btn-ghost flex-1 text-sm" onClick={() => setOpen(false)}>
                  Sign in
                </Link>
                <Link to="/signup" className="btn-gold flex-1 text-sm" onClick={() => setOpen(false)}>
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
