export type GoalStatus = 'not_started' | 'in_progress' | 'completed'

export interface Goal {
  id: string
  title: string
  targetDate?: string // ISO date string
  status: GoalStatus
  createdAt: string // ISO date string
}