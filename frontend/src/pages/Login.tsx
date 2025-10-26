import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use configured API base, fallback to 8080
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8080'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const text = await res.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {}
      if (!res.ok) {
        const msg = (data && data.error) ? data.error : `Login failed (${res.status})`
        throw new Error(msg)
      }
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-sm text-muted-foreground mb-6">Access your dashboard with your account.</p>
        {error && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              className="mt-1 w-full border border-border rounded-md px-3 py-2 bg-background"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              className="mt-1 w-full border border-border rounded-md px-3 py-2 bg-background"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 text-sm text-muted-foreground">
          <span>New here? </span>
          <Link to="/register" className="text-primary hover:underline">Create an account</Link>
        </div>
      </div>
    </div>
  )
}

export default Login