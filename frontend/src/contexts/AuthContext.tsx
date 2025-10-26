import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
  // This will be incremented whenever the user changes to trigger data refetch
  authVersion: number
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [authVersion, setAuthVersion] = useState(0)

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
      } catch (error) {
        console.warn('Failed to parse stored user data', error)
        // Clear invalid data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  }, [])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
    // Increment version to trigger data refetch in other contexts
    setAuthVersion(prev => prev + 1)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
    // Increment version to trigger cleanup in other contexts
    setAuthVersion(prev => prev + 1)
  }

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('auth_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    // Don't increment authVersion for user updates, only for login/logout
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
    authVersion,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}