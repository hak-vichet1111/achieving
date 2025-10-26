import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}

export default RequireAuth