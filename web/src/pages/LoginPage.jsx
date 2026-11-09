import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Lock, LogIn, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/vault'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message ?? 'Failed to sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      <p className="label-caps">Welcome back</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-white">Open your vault</h1>
      <p className="mt-2 text-sm text-slate-400">Your prompts missed you.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" className="btn-gold mt-2 w-full !py-3" disabled={busy}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          Sign in
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-400">
        New to PromptVault?{' '}
        <Link to="/signup" className="font-semibold text-gold transition hover:text-gold-soft">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
