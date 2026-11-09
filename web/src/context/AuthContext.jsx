import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
// Compile-time disabled in every build; runtime restricted to loopback hosts.
const mockAllowed = typeof __LOCAL_MOCK_BILLING__ !== 'undefined' && __LOCAL_MOCK_BILLING__ && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mockRuntime, setMockRuntime] = useState(null)
  const [mockState, setMockState] = useState(null)
  const userId = session?.user?.id
  useEffect(() => {
    if (!mockAllowed) return
    let active = true
    import('../lib/mockBillingState').then((runtime) => { if (active) setMockRuntime(runtime) })
    return () => { active = false }
  }, [])
  // Memory-only and account-scoped: reload/sign-out clears the simulation.
  const currentMock = mockState?.userId === userId ? mockState.value : null
  const mockAction = useCallback((action) => {
    if (!mockAllowed || !mockRuntime || !userId) throw new Error('Local mock billing unavailable')
    setMockState((previous) => ({ userId, value: mockRuntime.transition(previous?.userId === userId ? previous.value : null, action) }))
  }, [mockRuntime, userId])
  useEffect(() => { setMockState(null) }, [userId])

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      loadProfile(data.session?.user?.id).finally(() => mounted && setLoading(false))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      loadProfile(nextSession?.user?.id)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback(async (email, password, username) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user?.id)
  }, [loadProfile, session])

  const value = {
    session,
    user: session?.user ?? null,
    profile: currentMock && profile ? { ...profile, plan: currentMock.plan } : profile,
    mockBilling: mockAllowed && mockRuntime ? { state: currentMock } : null,
    mockAction,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
