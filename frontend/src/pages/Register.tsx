import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Registration failed')
      }
      // Auto-login after registration
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok) {
        throw new Error(loginData?.error || 'Login failed')
      }
      localStorage.setItem('auth_token', loginData.token)
      localStorage.setItem('auth_user', JSON.stringify(loginData.user))
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-sm text-muted-foreground mb-6">Register to start tracking your goals and spending.</p>
        {error && <div className="bg-destructive/10 text-destructive px-3 py-2 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <input
              type="text"
              className="mt-1 w-full border border-border rounded-md px-3 py-2 bg-background"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <div className="mt-4 text-sm text-muted-foreground">
          <span>Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline">Login</Link>
        </div>
      </div>
    </div>
  )
}

export default Register