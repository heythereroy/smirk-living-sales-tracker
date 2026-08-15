import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  // `loading` is true until AuthContext's getSession() call resolves.
  // Rendering the spinner (instead of checking `session` immediately)
  // is what prevents a refresh from bouncing straight to /login before
  // the persisted session has had a chance to load from localStorage.
  if (loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
