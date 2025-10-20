export type GoalStatus = 'not_started' | 'in_progress' | 'completed'

export interface Goal {
  id: string
  title: string
  description?: string
  category?: string
  saveFrequency?: string
  duration?: number
  startDate?: string
  endDate?: string
  targetDate?: string // ISO date string
  status: GoalStatus
  createdAt: string // ISO date string
  targetAmount?: number
  currentAmount?: number
}