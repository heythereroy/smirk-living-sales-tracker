import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { ALLOWED_EMAIL_DOMAIN } from '../lib/supabase'

export default function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus('sending')
    const { error } = await signInWithEmail(email.trim())
    if (error) {
      setError(error)
      setStatus('idle')
      return
    }
    setStatus('sent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tertiary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary">Smirk Living</h1>
          <p className="text-disabled mt-1">Sales Tracker</p>
        </div>

        <div className="bg-[#242424] border border-border rounded-xl p-6">
          {status === 'sent' ? (
            <div className="text-center py-4">
              <p className="text-success font-semibold mb-2">Check your inbox</p>
              <p className="text-sm text-disabled">
                We sent a sign-in link to <span className="text-secondary">{email}</span>. Open it on
                this device to log in.
              </p>
              <button
                className="mt-4 text-sm text-primary hover:text-primary-hover underline"
                onClick={() => setStatus('idle')}
              >
                Use a different email
              </button>
            </div>
          ) : (
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
              {error && <p className="text-danger text-sm mt-2">{error}</p>}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full mt-4 bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold py-2.5 rounded-lg transition-colors"
              >
                {status === 'sending' ? 'Sending link…' : 'Send sign-in link'}
              </button>
              <p className="text-xs text-disabled mt-3 text-center">
                Only @{ALLOWED_EMAIL_DOMAIN} addresses are allowed.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
