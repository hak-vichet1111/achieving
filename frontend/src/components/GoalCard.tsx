import React from 'react'
import type { Goal, GoalStatus } from '../types/goal'
import StatusBadge from './StatusBadge'

interface GoalCardProps {
  goal: Goal
  onUpdateStatus?: (status: GoalStatus) => void
  onRemove?: () => void
}

export default function GoalCard({ goal, onUpdateStatus, onRemove }: GoalCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-start justify-between">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
        {goal.targetDate && (
          <p className="text-sm text-muted-foreground">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
        )}
        <StatusBadge status={goal.status} />
      </div>
      <div className="flex items-center gap-2">
        {onUpdateStatus && (
          <select
            aria-label="Update status"
            defaultValue={goal.status}
            onChange={(e) => onUpdateStatus(e.target.value as GoalStatus)}
            className="px-2 py-1 rounded border bg-muted text-foreground"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}
        {onRemove && (
          <button onClick={onRemove} className="px-2 py-1 rounded bg-destructive text-destructive-foreground">Remove</button>
        )}
      </div>
    </div>
  )
}