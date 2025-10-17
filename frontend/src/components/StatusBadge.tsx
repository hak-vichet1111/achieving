import React from 'react'
import type { GoalStatus } from '../types/goal'

const statusLabel: Record<GoalStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const statusClass: Record<GoalStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-secondary text-secondary-foreground',
  completed: 'bg-accent text-accent-foreground',
}

export default function StatusBadge({ status }: { status: GoalStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${statusClass[status]}`}>
      {statusLabel[status]}
    </span>
  )
}