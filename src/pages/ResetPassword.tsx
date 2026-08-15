import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-tertiary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary">Smirk Living</h1>
          <p className="text-disabled mt-1">Set a new password</p>
        </div>

        <div className="bg-[#242424] border border-border rounded-xl p-6">
          {done ? (
            <p className="text-success text-center text-sm">Password updated. Redirecting…</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block text-sm text-disabled mb-2" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-tertiary border border-border rounded-lg px-3 py-2.5 text-secondary focus:outline-none focus:border-primary"
              />
              <label className="block text-sm text-disabled mb-2 mt-3" htmlFor="confirm">
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-tertiary border border-border rounded-lg px-3 py-2.5 text-secondary focus:outline-none focus:border-primary"
              />
              {error && <p className="text-danger text-sm mt-3">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-primary hover:bg-primary-hover disabled:bg-disabled text-secondary font-semibold py-2.5 rounded-lg transition-colors"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
