import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isAllowedEmail, ALLOWED_EMAIL_DOMAIN } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // getSession() reads the persisted session from localStorage and
    // validates/refreshes it — this must resolve (success or failure)
    // before we decide whether to redirect to /login, otherwise a
    // refresh briefly looks logged-out. The try/catch+finally guarantees
    // `loading` always clears even if the network call itself rejects.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return
        setSession(data.session)
      })
      .catch((err) => {
        console.error('Failed to restore session:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Defense in depth: even though sign-up/sign-in are gated
      // client-side, if a session ever shows up for a non-domain email,
      // kick it out.
      if (newSession && !isAllowedEmail(newSession.user.email)) {
        supabase.auth.signOut()
        setSession(null)
        return
      }
      setSession(newSession)
    })

    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!isAllowedEmail(email)) {
      return { error: `Only @${ALLOWED_EMAIL_DOMAIN} email addresses can sign up.`, needsConfirmation: false }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message, needsConfirmation: false }
    // If email confirmation is required, Supabase returns a user but no session.
    const needsConfirmation = !!data.user && !data.session
    return { error: null, needsConfirmation }
  }

  const signIn = async (email: string, password: string) => {
    if (!isAllowedEmail(email)) {
      return { error: `Only @${ALLOWED_EMAIL_DOMAIN} email addresses can sign in.` }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const sendPasswordReset = async (email: string) => {
    if (!isAllowedEmail(email)) {
      return { error: `Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed.` }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, signUp, signIn, sendPasswordReset, updatePassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
