import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { Goal, GoalStatus } from '../types/goal'

interface GoalsState {
  goals: Goal[]
}

type AddGoalPayload = { title: string; targetDate?: string }

type GoalsAction =
  | { type: 'ADD_GOAL'; payload: AddGoalPayload }
  | { type: 'UPDATE_STATUS'; payload: { id: string; status: GoalStatus } }
  | { type: 'REMOVE_GOAL'; payload: { id: string } }
  | { type: 'HYDRATE'; payload: Goal[] }

const initialState: GoalsState = { goals: [] }

function goalsReducer(state: GoalsState, action: GoalsAction): GoalsState {
  switch (action.type) {
    case 'ADD_GOAL': {
      const now = new Date().toISOString()
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        title: action.payload.title,
        targetDate: action.payload.targetDate,
        status: 'not_started',
        createdAt: now,
      }
      return { goals: [newGoal, ...state.goals] }
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
    default:
      return state
  }
}

const STORAGE_KEY = 'achieving_goals'

interface GoalsContextType {
  goals: Goal[]
  addGoal: (payload: AddGoalPayload) => void
  updateStatus: (id: string, status: GoalStatus) => void
  removeGoal: (id: string) => void
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined)

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(goalsReducer, initialState)

  // Hydrate from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed: Goal[] = JSON.parse(raw)
        dispatch({ type: 'HYDRATE', payload: parsed })
      } catch (e) {
        console.warn('Failed to parse stored goals', e)
      }
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.goals))
  }, [state.goals])

  const value = useMemo<GoalsContextType>(() => ({
    goals: state.goals,
    addGoal: (payload) => dispatch({ type: 'ADD_GOAL', payload }),
    updateStatus: (id, status) => dispatch({ type: 'UPDATE_STATUS', payload: { id, status } }),
    removeGoal: (id) => dispatch({ type: 'REMOVE_GOAL', payload: { id } }),
  }), [state.goals])

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>
}

export function useGoals() {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error('useGoals must be used inside GoalsProvider')
  return ctx
}