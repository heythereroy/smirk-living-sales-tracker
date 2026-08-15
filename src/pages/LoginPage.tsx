import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ALLOWED_EMAIL_DOMAIN } from '../lib/supabase'
import LoadingSpinner from '../components/LoadingSpinner'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const { session, loading, signUp, signIn, sendPasswordReset } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // Sign-in/sign-up only update auth state — nothing else navigates away
  // from /login. Without this, a successful login left the user stuck on
  // the form until they manually refreshed (refresh works because
  // ProtectedRoute re-checks the persisted session from scratch).
  if (loading) {
    return <LoadingSpinner />
  }
  if (session) {
    return <Navigate to="/" replace />
  }

  const resetMessages = () => {
    setError(null)
    setInfo(null)
  }

  const switchMode = (next: Mode) => {
    resetMessages()
    setPassword('')
    setConfirmPassword('')
    setMode(next)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    resetMessages()

    const trimmedEmail = email.trim()

    if (mode === 'forgot') {
      setSubmitting(true)
      const { error } = await sendPasswordReset(trimmedEmail)
      setSubmitting(false)
      if (error) {
        setError(error)
        return
      }
      setInfo(`If an account exists for ${trimmedEmail}, a reset link has been sent.`)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    if (mode === 'signup') {
      const { error, needsConfirmation } = await signUp(trimmedEmail, password)
      setSubmitting(false)
      if (error) {
        setError(error)
        return
      }
      if (needsConfirmation) {
        setInfo('Account created. Check your inbox to confirm your email before logging in.')
        setMode('login')
        return
      }
      // If email confirmation is off, signUp already returns a session and
      // AuthContext's listener will pick it up — nothing else to do here.
      return
    }

    const { error } = await signIn(trimmedEmail, password)
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tertiary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary">Smirk Living</h1>
          <p className="text-disabled mt-1">Sales Tracker</p>
        </div>

        <div className="bg-[#242424] border border-border rounded-xl p-6">
          {mode !== 'forgot' && (
            <div className="flex mb-5 rounded-lg bg-tertiary p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'login' ? 'bg-primary text-secondary' : 'text-disabled'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                  mode === 'signup' ? 'bg-primary text-secondary' : 'text-disabled'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-4">
              <h2 className="font-semibold text-lg">Reset password</h2>
              <p className="text-sm text-disabled mt-1">We'll email you a link to set a new password.</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block text-sm text-disabled mb-2" htmlFor="email">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder={`you@${ALLOWED_EMAIL_DOMAIN}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-tertiary border border-border rounded-lg px-3 py-2.5 text-secondary placeholder:text-disabled focus:outline-none focus:border-primary"
            />

            {mode !== 'forgot' && (
              <>
                <label className="block text-sm text-disabled mb-2 mt-3" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-tertiary border border-border rounded-lg px-3 py-2.5 text-secondary placeholder:text-disabled focus:outline-none focus:border-primary"
                />
              </>
            )}

            {mode === 'signup' && (
              <>
                <label className="block text-sm text-disabled mb-2 mt-3" htmlFor="confirm-password">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-tertiary border border-border rounded-lg px-3 py-2.5 text-secondary placeholder:text-disabled focus:outline-none focus:border-primary"
                />
              </>
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-xs text-primary hover:text-primary-hover underline mt-2"
              >
                Forgot password?
              </button>
            )}

            {error && <p className="text-danger text-sm mt-3">{error}</p>}
            {info && <p className="text-success text-sm mt-3">{info}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold py-2.5 rounded-lg transition-colors"
            >
              {submitting
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Create account'
                  : mode === 'forgot'
                    ? 'Send reset link'
                    : 'Log in'}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full text-center text-xs text-disabled underline mt-3"
              >
                Back to log in
              </button>
            )}

            <p className="text-xs text-disabled mt-3 text-center">
              Only @{ALLOWED_EMAIL_DOMAIN} addresses are allowed.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
