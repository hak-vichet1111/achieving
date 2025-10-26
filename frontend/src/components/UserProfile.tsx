import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Settings as SettingsIcon } from 'lucide-react'

type UserProfileProps = {
  name?: string
  email?: string
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || 'U'
}

export default function UserProfile({ name = 'User', email = 'you@example.com' }: UserProfileProps) {
  const initials = initialsFromName(name)
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="p-4 border-t border-border/50 bg-card/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyEmail}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Copy email"
            title={copied ? 'Copied!' : 'Copy email'}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Open settings"
            title="Open settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}