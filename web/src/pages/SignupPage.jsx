import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Loader2, Lock, Mail, Sparkles, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function SignupPage() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [registered, setRegistered] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    setBusy(true)
    setError('')
    try {
      await signUp(email, password, username.trim())
      setRegistered(true)
    } catch (err) {
      setError(err.message ?? 'Failed to create account')
    } finally {
      setBusy(false)
    }
  }

  if (registered) {
    return (
      <AuthLayout>
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/[0.07] text-gold">
          <Mail size={22} />
        </span>
        <h1 className="text-center font-display text-3xl font-semibold text-white">Check your inbox</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-400">
          We sent a confirmation link to <span className="text-gold-soft">{email}</span>.
          Confirm it, then sign in to start building your vault.
        </p>
        <Link to="/login" className="btn-gold mt-8 w-full !py-3">
          Go to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <p className="label-caps">Join the vault</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-white">Claim your shelf</h1>
      <p className="mt-2 text-sm text-slate-400">Save prompts, follow creators, share your best work.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="relative block">
          <User size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input-glass !pl-11"
            placeholder="Username (public)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={30}
            required
          />
        </label>
        <label className="relative block">
          <Mail size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="email"
            className="input-glass !pl-11"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="relative block">
          <Lock size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="password"
            className="input-glass !pl-11"
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" className="btn-gold mt-2 w-full !py-3" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          Create account
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-gold transition hover:text-gold-soft">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
