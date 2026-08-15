import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../config'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  if (!isAdmin(session?.user.email)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
