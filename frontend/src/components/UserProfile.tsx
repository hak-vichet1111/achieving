import React from 'react'

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
  return (
    <div className="p-4 border-t border-border/50 bg-card/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>
    </div>
  )
}