import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type SpendingEntry = {
  id: string
  amount: number
  category: string
  date: string // ISO date
  note?: string
}

type SpendingContextType = {
  entries: SpendingEntry[]
  addEntry: (entry: Omit<SpendingEntry, 'id'>) => void
  removeEntry: (id: string) => void
  clearAll: () => void
  totalThisMonth: number
  byCategoryThisMonth: Record<string, number>
  recentMonths: { key: string, label: string, total: number }[]
}

const SpendingContext = createContext<SpendingContextType | undefined>(undefined)
const STORAGE_KEY = 'achieving_spending_entries'

export function SpendingProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<SpendingEntry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed: SpendingEntry[] = raw ? JSON.parse(raw) : []
      setEntries(parsed)
    } catch (e) {
      console.warn('Failed to parse spending from storage', e)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    } catch (e) {
      console.warn('Failed to save spending to storage', e)
    }
  }, [entries])

  const addEntry = (entry: Omit<SpendingEntry, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setEntries(prev => [{ id, ...entry }, ...prev])
  }

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id))
  const clearAll = () => setEntries([])

  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0)
  const endOfMonth = new Date(); endOfMonth.setMonth(endOfMonth.getMonth()+1); endOfMonth.setDate(0); endOfMonth.setHours(23,59,59,999)

  const monthEntries = entries.filter(e => {
    const d = new Date(e.date)
    return d >= startOfMonth && d <= endOfMonth
  })

  const totalThisMonth = monthEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  const byCategoryThisMonth = monthEntries.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  // Compute totals for the last 6 months (excluding current month)
  const recentMonths = useMemo(() => {
    const sumsByMonthKey = entries.reduce((acc, e) => {
      const d = new Date(e.date)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      acc[key] = (acc[key] || 0) + (e.amount || 0)
      return acc
    }, {} as Record<string, number>)

    const now = new Date()
    const arr: { key: string, label: string, total: number }[] = []
    for (let i = 1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      const label = `${d.toLocaleString(undefined, { month: 'short' })} ${d.getFullYear()}`
      arr.push({ key, label, total: sumsByMonthKey[key] || 0 })
    }
    return arr
  }, [entries])

  const value = useMemo<SpendingContextType>(() => ({
    entries,
    addEntry,
    removeEntry,
    clearAll,
    totalThisMonth,
    byCategoryThisMonth,
    recentMonths,
  }), [entries, totalThisMonth, byCategoryThisMonth, recentMonths])

  return <SpendingContext.Provider value={value}>{children}</SpendingContext.Provider>
}

export function useSpending() {
  const ctx = useContext(SpendingContext)
  if (!ctx) throw new Error('useSpending must be used inside SpendingProvider')
  return ctx
}