import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { Goal, GoalStatus } from '../types/goal'
import { useAuth } from './AuthContext'

interface GoalsState {
  goals: Goal[]
}

type AddGoalPayload = {
  title: string
  targetDate?: string
  targetAmount?: number
  currentAmount?: number
  description?: string
  category?: string
  saveFrequency?: string
  duration?: number
  startDate?: string
  endDate?: string
}

type UpdateGoalPatch = {
  title?: string
  description?: string
  category?: string
  saveFrequency?: string
  duration?: number
  startDate?: string
  endDate?: string
  targetDate?: string
  targetAmount?: number
  currentAmount?: number
}

type GoalsAction =
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: GoalStatus } }
  | { type: 'REMOVE_GOAL'; payload: { id: string } }
  | { type: 'HYDRATE'; payload: Goal[] }
  | { type: 'UPDATE_AMOUNT'; payload: { id: string; currentAmount: number } }
  | { type: 'UPDATE_GOAL'; payload: Goal }

const initialState: GoalsState = { goals: [] }

function goalsReducer(state: GoalsState, action: GoalsAction): GoalsState {
  switch (action.type) {
    case 'ADD_GOAL': {
      return { goals: [action.payload, ...state.goals] }
    }
    case 'UPDATE_STATUS': {
      return {
        goals: state.goals.map(g => g.id === action.payload.id ? { ...g, status: action.payload.status } : g)
      }
    }
    case 'REMOVE_GOAL': {
      return { goals: state.goals.filter(g => g.id !== action.payload.id) }
    }
    case 'HYDRATE': {
      return { goals: action.payload }
    }
    case 'UPDATE_AMOUNT': {
      return {
        goals: state.goals.map(g => g.id === action.payload.id ? { ...g, currentAmount: action.payload.currentAmount } : g)
      }
    }
    case 'UPDATE_GOAL': {
      return {
        goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g)
      }
    }
    default:
      return state
  }
}

interface GoalsContextType {
  goals: Goal[]
  addGoal: (payload: AddGoalPayload) => Promise<void>
  updateStatus: (id: string, status: GoalStatus) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  updateAmount: (id: string, currentAmount: number) => Promise<void>
  updateGoal: (id: string, patch: UpdateGoalPatch) => Promise<void>
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined)

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8081'
// Add a centralized auth headers helper
const authHeaders = (contentType?: string) => {
  const headers: Record<string, string> = {}
  if (contentType) headers['Content-Type'] = contentType
  const tok = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (tok) headers['Authorization'] = `Bearer ${tok}`
  return headers
}

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const { authVersion, isAuthenticated } = useAuth()
  const [state, dispatch] = useReducer(goalsReducer, initialState)

  // Centralized refetch for goals
  const reloadGoals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/goals`, { headers: authHeaders() })
      if (!res.ok) return
      const data: Goal[] = await res.json()
      dispatch({ type: 'HYDRATE', payload: data })
    } catch (e) {
      console.warn('Failed to refetch goals', e)
    }
  }

  // Hydrate from backend on mount and when auth changes
  useEffect(() => {
    const load = async () => {
      if (isAuthenticated) {
        try {
          const res = await fetch(`${API_BASE}/api/goals`, { headers: authHeaders() })
          if (!res.ok) throw new Error('Failed to load goals')
          const data: Goal[] = await res.json()
          dispatch({ type: 'HYDRATE', payload: data })
        } catch (e) {
          console.warn('Failed to fetch goals from backend', e)
        }
      } else {
        // Clear goals when user logs out
        dispatch({ type: 'HYDRATE', payload: [] })
      }
    }
    load()
  }, [authVersion, isAuthenticated])

  const value = useMemo<GoalsContextType>(() => ({
    goals: state.goals,
    addGoal: async (payload) => {
      try {
        const res = await fetch(`${API_BASE}/api/goals`, {
          method: 'POST',
          headers: authHeaders('application/json'),
          body: JSON.stringify({
            title: payload.title,
            description: payload.description,
            category: payload.category,
            saveFrequency: payload.saveFrequency,
            duration: payload.duration,
            startDate: payload.startDate,
            endDate: payload.endDate,
            // keep targetDate for compatibility
            targetDate: payload.targetDate ?? payload.endDate,
            targetAmount: payload.targetAmount,
            currentAmount: payload.currentAmount,
          }),
        })
        if (!res.ok) throw new Error('Failed to create goal')
        const created: Goal = await res.json()
        dispatch({ type: 'ADD_GOAL', payload: created })
        reloadGoals()
      } catch (e) {
        console.warn('Failed to create goal', e)
      }
    },
    updateStatus: async (id, status) => {
      try {
        const res = await fetch(`${API_BASE}/api/goals/${id}/status`, {
          method: 'PATCH',
          headers: authHeaders('application/json'),
          body: JSON.stringify({ status }),
        })
        if (!res.ok) throw new Error('Failed to update status')
        dispatch({ type: 'UPDATE_STATUS', payload: { id, status } })
        reloadGoals()
      } catch (e) {
        console.warn('Failed to update goal status', e)
      }
    },
    removeGoal: async (id) => {
      try {
        const res = await fetch(`${API_BASE}/api/goals/${id}`, { method: 'DELETE', headers: authHeaders() })
        if (!res.ok) throw new Error('Failed to delete goal')
        dispatch({ type: 'REMOVE_GOAL', payload: { id } })
        reloadGoals()
      } catch (e) {
        console.warn('Failed to delete goal', e)
      }
    },
    updateAmount: async (id, currentAmount) => {
      try {
        const res = await fetch(`${API_BASE}/api/goals/${id}`, {
          method: 'PUT',
          headers: authHeaders('application/json'),
          body: JSON.stringify({ currentAmount }),
        })
        if (!res.ok) throw new Error('Failed to update amount')
        const updated: Goal = await res.json()
        dispatch({ type: 'UPDATE_AMOUNT', payload: { id, currentAmount: updated.currentAmount ?? currentAmount } })
        reloadGoals()
      } catch (e) {
        console.warn('Failed to update current amount', e)
      }
    },
    updateGoal: async (id, patch) => {
      try {
        const res = await fetch(`${API_BASE}/api/goals/${id}`, {
          method: 'PUT',
          headers: authHeaders('application/json'),
          body: JSON.stringify(patch),
        })
        if (!res.ok) throw new Error('Failed to update goal')
        const updated: Goal = await res.json()
        dispatch({ type: 'UPDATE_GOAL', payload: updated })
        reloadGoals()
      } catch (e) {
        console.warn('Failed to update goal', e)
      }
    },
  }), [state.goals])

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}

export function useGoals() {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error('useGoals must be used inside GoalsProvider')
  return ctx
}