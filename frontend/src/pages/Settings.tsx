import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Settings: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout: authLogout, updateUser } = useAuth()
  const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? ''

  const [localUser, setLocalUser] = useState<{ name?: string; email?: string } | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    if (user) {
      setLocalUser({ name: user.name, email: user.email })
      setNameInput(user.name || '')
    }
  }, [user])

  const logout = () => {
    authLogout()
    navigate('/login')
  }

  const saveName = async () => {
    setStatusMsg(null); setStatusType(null); setSavingName(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const tok = localStorage.getItem('auth_token')
      if (tok) headers['Authorization'] = `Bearer ${tok}`
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: nameInput.trim() })
      })
      const text = await res.text(); let data: any = null; try { data = text ? JSON.parse(text) : null } catch {}
      if (!res.ok) {
        const msg = (data && data.error) ? data.error : `Failed (${res.status})`
        throw new Error(msg)
      }
      const updatedUser = { ...user!, name: nameInput.trim() }
      updateUser(updatedUser)
      setLocalUser(updatedUser)
      setStatusMsg('Profile updated'); setStatusType('success')
    } catch (e: any) {
      setStatusMsg(e.message || 'Failed to update profile'); setStatusType('error')
    } finally {
      setSavingName(false)
    }
  }

  const savePassword = async () => {
    setStatusMsg(null); setStatusType(null); setSavingPwd(true)
    try {
      if (!currentPwd || !newPwd) { throw new Error('Enter both current and new password') }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const tok = localStorage.getItem('auth_token')
      if (tok) headers['Authorization'] = `Bearer ${tok}`
      const res = await fetch(`${API_BASE}/api/auth/password`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ current: currentPwd, new: newPwd })
      })
      const text = await res.text(); let data: any = null; try { data = text ? JSON.parse(text) : null } catch {}
      if (!res.ok) {
        const msg = (data && data.error) ? data.error : `Failed (${res.status})`
        throw new Error(msg)
      }
      setStatusMsg('Password changed'); setStatusType('success')
      setCurrentPwd(''); setNewPwd('')
    } catch (e: any) {
      setStatusMsg(e.message || 'Failed to change password'); setStatusType('error')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and security.</p>
      </header>

      {statusMsg && (
        <div className={`mb-6 text-sm px-3 py-2 rounded ${statusType === 'success' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
          {statusMsg}
        </div>
      )}

      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              value={localUser?.email || ''}
              disabled
              className="mt-1 w-full bg-muted border border-border rounded-md px-3 py-2 text-muted-foreground"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={saveName}
            disabled={savingName}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            {savingName ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Security</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Current password</label>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">New password</label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={savePassword}
            disabled={savingPwd}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            {savingPwd ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Session</h2>
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 bg-muted px-4 py-2 rounded-md hover:bg-muted/70"
        >
          Logout
        </button>
      </section>
    </div>
  )
}

export default Settings